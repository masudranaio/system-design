# D2 Diagram Engine and Sticky Layout Shell — Design

## Why this changed

After the visual & readability redesign shipped (colorful Mermaid
diagrams, motion, zoom), the user compared it directly against
ByteByteGo's reference diagrams and judged the gap still too big:
Mermaid's pastel tints, thin borders, and lack of icons-in-nodes read
as flat and generic next to BBG's bold saturated colors, white labels,
and pictographic icons. Separately, screenshots showed large unused
margins on wide viewports either side of the centered content column,
a sidebar that scrolls away with page content instead of staying
pinned, and a request for a real clickable "on this page" navigator
(the existing `SectionTracker` is static — one hardcoded snapshot near
the top of the lesson, never updates, nothing to click).

A throwaway spike (outside the repo, nothing committed) tested
`@terrastruct/d2` — a mature (25k+ GitHub stars, MPL-2.0), actively
maintained diagram-as-code language with a JS/WASM package
(`@terrastruct/d2`) that renders entirely offline in Node or the
browser, no Go binary, no server, no network calls at render time.
Rendered samples across all five diagram categories this course
needs — architecture/network, class, sequence, and SQL-table
(ER) — confirmed:
- Per-shape custom colors via inline `style.fill` / `style.stroke` /
  `style.font-color`, using our exact brand hex values, not locked to
  preset themes.
- Local icon support (a self-hosted SVG embedded as a `data:` URI
  renders correctly inside a colored, labeled node) — no CDN
  dependency.
- Visual output genuinely comparable to ByteByteGo's diagrams: solid
  saturated fills, white labels, clean auto-layout, proper UML class
  boxes, real sequence-diagram lifelines, table shapes with PK/FK
  badges.

This spec amends
[2026-08-27-visual-and-readability-redesign-design.md](2026-08-27-visual-and-readability-redesign-design.md)'s
§3 (Layout) and §5 (Diagram engine) — those sections' Mermaid-theming
and static-tracker approach are superseded by what follows. Everything
else in that spec (color tokens, type scale, `CompareTable`/`KeyStat`/
`Point`, the content-formatting retrofit) is unaffected and stays as-is.

**Decisions locked in during brainstorming (not re-litigated below):**
- D2 **replaces** Mermaid as the diagram engine, rather than a further
  CSS push on top of Mermaid — the spike showed CSS alone can't add
  real icons or match D2's default layout/color quality.
- Piloted on **Ticketmaster's `hld.mdx` and `lld.mdx` only** first.
  `DiagramPanel` must support both engines side by side during the
  pilot — the other 5 lessons keep rendering through Mermaid until the
  pilot is reviewed and rolled out further.
- The static `SectionTracker` is removed entirely (from every lesson,
  not just Ticketmaster) and replaced by an auto-derived, scroll-aware,
  clickable right-rail table of contents.

## 1. Diagram engine: Mermaid → D2 (Ticketmaster pilot)

**New dependency**: `@terrastruct/d2` (WASM-based, zero transitive
deps per its own `npm view` output, MPL-2.0). This is a deliberate,
flagged exception to the "no new dependencies" constraint from the
prior redesign plan — justified by the spike's results and the fact
that it's data/WASM-only, no runtime network calls.

**`DiagramPanel` gains an `engine: "mermaid" | "d2"` prop**, explicit
per usage (no syntax auto-detection — same philosophy as the existing
explicit `type` prop). Existing lessons' `<DiagramPanel type="..." chart="...">`
calls are unchanged (implicitly `engine="mermaid"` by default, so the
5 non-piloted lessons need zero edits). Ticketmaster's diagrams add
`engine="d2"` and their `chart` prop becomes D2 source instead of
Mermaid source.

Internally, `DiagramPanel` branches only at the "turn source text into
an SVG string" step:
- `engine="mermaid"` keeps today's `mermaid.render()` path exactly as
  shipped (role-classifier post-processing, the Mermaid `themeVariables`
  workaround, all of it — untouched).
- `engine="d2"` calls `new D2().compile(source, {layout: "dagre"})`
  then `.render(...)` to get an SVG string.

Everything downstream of "we have an SVG string" — injection into the
container, the pan/zoom hook, the fullscreen dialog, the toolbar — is
**shared and unchanged**, since none of it cares which engine produced
the markup. This is most of Task 5's prior work carried forward as-is.

**Role coloring moves from post-render CSS classification into the
diagram source itself.** D2's per-shape `style.fill`/`style.stroke`/
`style.font-color` means color is now an explicit authoring choice per
node, not a keyword-matched heuristic — more precise, but it does mean
each D2 diagram's source needs the right hex values written in. A
reference table of the six standard role colors (client, network/gateway,
service, cache, datastore, queue) with their light/dark hex pairs goes
into `CONTENT-GUIDE.md` so this stays consistent across lessons and
authors. `lib/diagram-roles.ts` (the Mermaid keyword classifier) is
**not removed** — it stays in use for the 5 lessons still on Mermaid
until/unless they migrate too.

**Icons**: a small local icon set for the recurring role types (client/
mobile, gateway/CDN, load balancer, cache, database, queue, service/
worker, identity/auth, external/3rd-party) sourced from `lucide-react`
(already a dependency — no new asset licensing or sourcing needed),
embedded as `data:` URIs. A new `lib/diagram-icons.ts` maps role name →
data URI, so a D2 diagram references `icon: "${ICONS.database}"`
instead of each lesson re-embedding raw SVG.

**Diagram-type mapping** (all confirmed in the spike):
| Course diagram type | D2 technique |
|---|---|
| architecture | plain D2 shapes + connections, styled per node |
| state | same technique as architecture (D2 has no dedicated state-machine shape; a styled directed graph reads the same way) |
| class | `shape: class` with fields/methods as children |
| sequence | `shape: sequence_diagram` |
| er | `shape: sql_table` per entity, with `constraint: primary_key` / `foreign_key` |

**Motion**: D2's rendered SVG has a different internal structure than
Mermaid's (different class names on edge paths), so the existing
`.diagram-animate .edgePaths path` CSS selector is not guaranteed to
match. Re-verify against real D2 output the same way Task 5 verified
Mermaid's — inspect the actual rendered SVG before finalizing the
selector, don't assume it carries over.

**Panel width**: the existing `.panel-breakout` mechanism (56rem cap on
wide viewports) stays, but D2 diagrams — especially sequence diagrams
with several participants — may render wider than Mermaid's equivalent.
Check Ticketmaster's actual rendered diagrams during implementation and
raise the cap if content is visibly cramped.

## 2. Layout shell

**Sidebar becomes sticky and independently scrollable.** Currently
`Sidebar`'s `<nav>` scrolls away with the page. Change it to pin to the
viewport below the sticky `TopBar` and scroll internally once the
lesson list outgrows the visible height:
`sticky top-[topbar height] max-h-[calc(100vh-topbar height)] overflow-y-auto`.
The exact topbar height must be measured against the real rendered
`TopBar` (not guessed) during implementation.

**A new sticky right-rail table of contents replaces `SectionTracker`
everywhere** (per the "replace it" decision from the prior brainstorm,
now extended to all 6 lessons, not just future ones):
- Auto-derived from each lesson's actual `##` (h2) headings — single
  source of truth, no more hand-maintained section list that can drift
  out of sync with the real content (a real bug class the old static
  tracker had zero protection against).
- Headings need stable `id` attributes to link to. Use a standard
  slugging step in the MDX pipeline (e.g. `rehype-slug`, a tiny,
  widely-used package — or an equivalent small custom step if wiring a
  rehype plugin into `next-mdx-remote-client/rsc`'s options turns out
  cleaner without a new dependency; confirm that library's actual
  plugin-passing API during implementation rather than assuming).
- Scroll-aware: highlights the current section via
  `IntersectionObserver` on the headings, updates as the reader
  scrolls.
- Click-to-jump via anchor links to each heading's `id`.
- Positioned in the freed-up right margin at wide viewports only
  (roughly `>=1280px` — below that there's no room; it simply doesn't
  render there, the reader falls back to scrolling/skimming same as
  today).

**`SectionTracker` is deleted**: the component, its test, its
registration in `mdx-components.tsx`, and the `<SectionTracker ... />`
block removed from all 6 existing lesson `.mdx` files. This is a
mechanical content edit (removing a now-redundant block), not a prose
rewrite — doesn't require the content-authoring process CLAUDE.md
normally gates on, since nothing about the lesson's substance changes.

**Prose column gets a modest width increase** — from `max-w-[68ch]` to
something a little wider (exact value tuned against real rendered
lesson text during implementation, not over-specified here) — but the
primary fix for "too much empty space" is the right-rail actually
occupying that space, not stretching prose to fill it (wider-than-~70ch
text genuinely hurts reading speed, which is why 68ch was chosen
deliberately in the first place).

## 3. Non-goals / explicitly deferred

- Not migrating the other 5 lessons' diagrams to D2 yet — that's a
  follow-up decision after the Ticketmaster pilot is reviewed.
- Not removing Mermaid as a dependency — still needed for those 5
  lessons.
- Not changing CONTENT-GUIDE.md's diagram-*type*-matching rules (match
  diagram type to content) — only the rendering engine and the
  role-color authoring convention for D2 diagrams.
- Not building a mobile/narrow-viewport version of the right-rail — it
  simply doesn't render below the width cutoff, consistent with the
  mobile nav already handling narrow-viewport navigation separately.

## 4. Files touched (implementation-plan input, not final)

- `package.json` — add `@terrastruct/d2`.
- `components/lesson/DiagramPanel.tsx` — add the `engine` prop and the
  D2 rendering branch; existing Mermaid branch untouched.
- `lib/diagram-icons.ts` (new) — role → local icon data-URI map.
- `CONTENT-GUIDE.md` — add the D2 role-color reference table and a
  short "how to write a D2 diagram" authoring note alongside the
  existing Mermaid diagram rules.
- `content/04-case-studies/ticketmaster/hld.mdx`, `lld.mdx` — diagrams
  converted from Mermaid to D2 source; `<SectionTracker>` block removed.
- `content/04-case-studies/{parking-lot,amazon-locker}/{hld,lld}.mdx` —
  `<SectionTracker>` block removed only (diagrams stay Mermaid).
- `components/lesson/SectionTracker.tsx`, `.test.tsx` — deleted.
- `lib/mdx-components.tsx` — remove `SectionTracker` registration, wire
  in the MDX heading-slugging step.
- `components/nav/Sidebar.tsx` — sticky/scroll styling.
- `components/lesson/TableOfContents.tsx` (new) + test — the right-rail
  component.
- Page route files under `app/case-studies/[system]/{hld,lld}/page.tsx`
  (and the equivalent `hld`/`lld`/`interview-prep` slug routes) — render
  the new right-rail alongside `<article>`, adjust prose max-width.

## 5. Verification

Per CLAUDE.md's UI verification rule, both themes, on every touched
route:
- Ticketmaster HLD + LLD: D2 diagrams render with correct brand colors,
  icons visible, zoom/pan/fullscreen still work (shared chrome, but
  confirm live — don't assume).
- The 5 non-piloted lessons: Mermaid diagrams unaffected, unchanged.
- Right-rail: appears only at wide viewports, highlights the correct
  section while scrolling, clicking a link jumps to and highlights that
  section, no layout shift/overflow.
- Sidebar: pinned while scrolling a long page, scrolls internally once
  its own content exceeds viewport height, unaffected below the mobile
  breakpoint (existing `MobileNav` untouched).
- `pnpm build` clean, full test suite green.
