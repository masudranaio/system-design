# Visual & Readability Redesign — Design

## Why this changed

User feedback after seeing the shipped case studies: the site chrome reads
as bare/generic ("1900s website"), color is limited to one teal accent
against near-monochrome panels, diagrams render through Mermaid's flat
`neutral` theme (black lines, white boxes, no color, no interactivity),
and lesson prose is dense — long paragraphs the reader has to fully parse
to extract a handful of facts, when a scan-first pass (bullets, call-outs,
small diagrams) would get the same information across faster.

This spec amends, rather than replaces, the identity established in
[2026-08-26-nextjs-mdx-app-migration-design.md](2026-08-26-nextjs-mdx-app-migration-design.md)'s
"Design system" section and
[CONTENT-GUIDE.md](../../../CONTENT-GUIDE.md)'s "Writing the prose" /
"Diagrams" sections. Those documents remain authoritative for everything
not explicitly changed here.

**Decisions locked in during brainstorming (not re-litigated below):**
- Site chrome gets a **refinement** pass, not a teardown — the teal/mono/
  serif "spec sheet" identity stays; the fix is contrast, color variety,
  and layout, not a new identity.
- Diagram motion is **subtle and always-on** (ambient ammoniated flow
  along connectors), off under `prefers-reduced-motion`.
- Diagram zoom is **inline pan/zoom + a fullscreen expand button**, no
  new dependency.
- The content-format rewrite (bullets over paragraphs, visual call-outs)
  **retrofits all 6 already-built case-study lessons**, not just future
  ones.

## 1. Color

Keep the existing 9 tokens (`--color-ground/surface/ink/ink-muted/brand/
line/state-*`). Add:

- `--color-accent-warn` (trade-offs / caution): `#B8722A` light /
  `#E8A659` dark — warm amber, distinct from `--color-state-held`'s
  orange so the two don't visually collide when both appear near each
  other (trade-off panels vs. seat-state diagrams).
- `--color-accent-info` (interview angle / practice / challenge):
  `#5B4FBF` light / `#9C93E0` dark — violet, reads as "reflective /
  practice" rather than "structural" (teal) or "caution" (amber).
- `--color-ink-muted` (light mode only): darken from `#4B5262` to
  `#3A4051` — the current value under-contrasts against `#F5F7FA` at
  small sizes (sub-labels, captions, muted card text).

Usage — these are **section-type signal colors**, not general-purpose UI
colors:
- Trade-offs sections/panels: `--color-accent-warn` left-accent stripe +
  eyebrow label color.
- Interview Angle and Practice & Self-Check sections: `--color-accent-info`
  left-accent stripe + eyebrow label color.
- Everything else (Problem framing, Requirements, Architecture, Deep
  dives, Worked example) keeps the existing brand teal + neutral line
  treatment — these are the "structural" majority of a lesson and
  shouldn't compete for attention with the two signal colors.
- Sidebar gets a faint distinct surface tone (`color-mix(in srgb,
  var(--color-surface) 92%, var(--color-ground))`-equivalent, computed
  as a new `--color-sidebar-surface` token per theme) so it reads as a
  panel, not page background bleeding through.

## 2. Typography

- Body text: `font-size: 1.09375rem` (17.5px) / `line-height: 1.7`
  (currently unset, inherits browser default ~16px/1.5 — too tight for
  long-form serif prose).
- Formal type scale, applied via `mdx-components.tsx` (the single mapping
  point, not per-file classes):

  | Role | Size / line-height | Weight |
  |---|---|---|
  | h1 (page title) | 2.25rem / 1.2 | 600 |
  | h2 (major section) | 1.5rem / 1.3 | 600 |
  | h3 (subsection) | 1.25rem / 1.35 | 600 |
  | h4 (granular landing point, new — see §4) | 1.0625rem / 1.4 | 600 |
  | body | 1.09375rem / 1.7 | 400 |
  | small / caption | 0.875rem / 1.5 | 400 |
  | eyebrow (uppercase mono label) | 0.75rem / 1.4, tracking 0.06em | 600 |

- `h4` is a genuinely new scale step — §4 below relies on more granular
  subheadings to give scanning readers more landing points.

## 3. Layout

- **Prose stays ~68ch**; panels (`DiagramPanel`, `CompareTable`, the
  quiz/rubric blocks) get a wider max-width breakout on viewports
  `>= 1024px` — up to `min(100%, 56rem)` against the prose column's
  `~44rem`, achieved with a negative-margin breakout wrapper, not by
  widening the whole content column. This is what turns today's dead
  right-hand margin at wide viewports into working diagram space.
- **Sidebar** (`SidebarNav.tsx`): apply `--color-sidebar-surface`,
  increase active-item treatment from a thin left border to a filled
  pill (`bg-brand/15`, rounded, no border-radius asymmetry), and add a
  section-group hairline divider so groups read as distinct blocks, not
  a continuous list.
- **Mobile nav trigger**: the sidebar currently just disappears below
  `md`, a known gap flagged in `TRACKER.md`. Since this pass touches
  `SidebarNav.tsx` anyway, add a hamburger trigger in `TopBar.tsx` that
  opens the same nav tree in a `Sheet`/slide-over (shadcn primitive,
  same family as the existing `dialog.tsx`) below `md`.

## 4. Content formatting — scannable-first prose

Amends CONTENT-GUIDE.md's "Writing the prose" section. New rules:

- **No wall of text longer than ~6 lines** before a bullet list, table,
  call-out, or diagram breaks it up.
- **Default to bullets** for: requirements, enumerable facts, API/field
  lists, step sequences (numbered), anything with more than 2 parallel
  items.
- **Keep short paragraphs (2-4 sentences)** only for: "why before what"
  motivation framing, and worked-example narrative (a sequence of events
  is genuinely easier to follow as connected prose than as bullets) —
  CONTENT-GUIDE's existing "explain why before what" and "one strong
  worked example" rules are unchanged, they just get less padding around
  them.
- **More granular subheadings** (the new h4 scale step from §2) — a
  reader scanning should hit a landing point every few paragraphs, not
  every full section.
- **Trade-offs become tables, not prose**: every trade-off pairing
  (CONTENT-GUIDE already requires naming the alternative explicitly)
  renders through the new `CompareTable` component instead of a
  paragraph — columns: Approach | Pros | Cons | Chosen because.
- **Concrete numbers get pulled out**, not buried mid-sentence: a metric
  central to the section's argument (e.g., "500K QPS peak") renders
  through the new `KeyStat` component as a visual call-out, with the
  full back-of-envelope math kept nearby in a `<details>`-style expand
  for readers who want it, not inline in the main flow.
- **More, smaller diagrams over fewer big ones**: a deep-dive that today
  is "one architecture diagram + 400 words explaining five things about
  it" should become several 2-4-node Mermaid diagrams, each paired with
  a short bullet list, one concept at a time. This does not relax
  CONTENT-GUIDE's existing diagram-type-matching rules — it changes
  diagram *granularity*, not diagram *kind*.
- **Icon-anchored bullets**: list items in Requirements/concept sections
  render through a new `Point` MDX component (`<Point icon="database">
  ...</Point>`) that prefixes a small `lucide-react` icon — this is the
  "vector image" ask, satisfied with the icon set already in the
  dependency tree rather than bespoke illustration assets (which would
  need an asset pipeline this repo doesn't have and CLAUDE.md doesn't
  scope for).

**New components** (added to `components/lesson/`, registered in
`lib/mdx-components.tsx` alongside the existing four):
- `CompareTable` — props: `rows: { approach: string; pros: string[];
  cons: string[]; chosen?: boolean }[]`. Renders as a responsive table
  (horizontal scroll on narrow viewports per the existing wide-content
  rule), chosen row gets the brand-teal left accent.
- `KeyStat` — props: `value: string; label: string; detail?: string`
  (detail renders collapsed via `<details>`). Renders as a bordered
  callout box, larger mono numeral for `value`.
- `Point` — props: `icon: keyof typeof ICONS; children`. Thin wrapper
  around a styled `<li>`-equivalent with a leading icon; used inside
  regular MDX lists.

## 5. Diagram engine (`components/lesson/DiagramPanel.tsx`)

Current state: Mermaid's `neutral` theme (flat, colorless), static SVG
injected via `innerHTML`, no interaction beyond browser page-scroll, no
motion. Target: color, motion, zoom — all as a rendering-layer change,
**zero edits to any lesson's Mermaid source**.

**5a. Color** — switch `mermaid.initialize` from `theme: "neutral"` to
`theme: "base"` with explicit `themeVariables` built from the design
tokens (`primaryColor`, `primaryBorderColor`, `primaryTextColor`,
`secondaryColor`, `tertiaryColor`, `lineColor`, `fontFamily` mapped to
the mono font). Layered on top: a post-render classifier
(`lib/diagram-roles.ts`) that walks the rendered SVG's node `<g>`
elements, reads each node's text content, and matches against a small
keyword table:

  | Role | Keywords (case-insensitive) | Color |
  |---|---|---|
  | client | client, browser, mobile, app, user | blue (`#3B6FD6`/`#7AA2F7`) |
  | network | cdn, gateway, load balancer, lb, waiting room | violet (accent-info) |
  | service | service, worker, handler | brand teal |
  | cache | cache, redis | amber (accent-warn) |
  | datastore | db, database, sql, dynamo, store, inventory | rose (`#B23A48`/`#F87171`, reusing `state-booked` family) |
  | queue | queue, kafka, sqs, mq, topic | slate/neutral with a distinct icon dash-pattern, not a 6th hue (keeps the palette from fragmenting past 5 signal colors) |

  A node matching no keyword keeps the theme's default primary color —
  this is additive coloring, never a required annotation, so it degrades
  gracefully on any diagram (including future ones) without extra
  authoring effort. Applied via a CSS class added to the node's `<g>`,
  not inline styles, so both themes' color values come from the same
  token system.

**5b. Motion** — after render, select edge `<path>` elements and apply a
CSS animation (`stroke-dasharray` + `stroke-dashoffset` keyframe loop,
~2.5s, linear, infinite) to suggest animated flow along the connector, only when
`window.matchMedia("(prefers-reduced-motion: reduce)").matches` is
false. Nodes get a small hover transform (`scale(1.02)` + brightness)
via CSS, no JS needed for that part.

**5c. Zoom/pan** — new `lib/use-pan-zoom.ts` hook: pointer-drag pans,
wheel zooms (clamped 0.5x–3x), applied as a CSS `transform` on the SVG's
wrapper `<div>`. `DiagramPanel` gains a small corner toolbar (+/−/reset)
and an expand icon-button that opens the same diagram, same pan/zoom
hook, inside a shadcn `Dialog` at a larger size (reusing `components/
ui/dialog.tsx`, already in the tree).

**5d. Panel chrome** — per-type accent color on the eyebrow label
(architecture/class/state/sequence/er each map to one of the five
existing accent hues, reusing §1/§5a's palette rather than inventing a
sixth), replace the flat `border border-line` with a subtle shadow +
slightly larger radius, keep the existing caption/title structure.

## 6. Retrofit scope

- All 6 existing lesson files (`ticketmaster/{hld,lld}.mdx`,
  `parking-lot/{hld,lld}.mdx`, `amazon-locker/{hld,lld}.mdx`) are
  rewritten to the §4 formatting rules: prose trimmed to short
  paragraphs + bullets, trade-off paragraphs converted to `CompareTable`,
  key metrics pulled into `KeyStat`, big single diagrams split into
  smaller paired-with-bullets diagrams where a deep-dive currently reads
  as one diagram plus a long explanation.
- **This is a reformat, not a re-scope**: every fact, diagram concern,
  trade-off, quiz question, and rubric item currently in each lesson's
  `CHECKLIST.md` must still be covered after the rewrite — the
  completeness pass (CLAUDE.md's existing "After writing a lesson" step)
  re-runs per lesson to confirm nothing was dropped, not to re-derive new
  checklist items.
- `CONTENT-GUIDE.md` and `CLAUDE.md`'s lesson template references get
  updated so every lesson built from now on follows §4 by default,
  without needing this spec re-read each time.
- **Ruling, extending the existing bulk-authorship ruling in
  `TRACKER.md`**: CLAUDE.md's default "one lesson at a time" applies to
  *new* lessons; this retrofit is a formatting pass over already-built,
  already-researched content, not new research/drafting, so it proceeds
  as one coordinated pass across all 6 files rather than one at a time.

## 7. Non-goals / explicitly deferred

- No lesson content edits beyond format (no new facts, no scope changes,
  no new sections).
- No changes to CONTENT-GUIDE.md's diagram *type*-matching rules — only
  granularity (§4) and rendering (§5).
- No heavy new dependencies — pan/zoom and role-coloring are hand-rolled
  against the existing `mermaid` + `lucide-react` + shadcn primitives
  already in the tree.
- No custom illustration/asset pipeline — "vector image" is satisfied by
  `lucide-react` icons (`Point` component) and richer Mermaid diagrams,
  not bespoke SVG art.
- Building the 12 HLD + 12 LLD concept lessons remains out of scope,
  unchanged from the existing ruling in `TRACKER.md`.

## 8. Files touched (implementation-plan input, not final)

- `app/globals.css` — new color tokens, type scale, sidebar surface token.
- `lib/mdx-components.tsx` — type-scale application, register `CompareTable`/`KeyStat`/`Point`.
- `components/lesson/DiagramPanel.tsx` — theme swap, role-coloring hookup, motion, zoom toolbar, fullscreen dialog.
- `lib/diagram-roles.ts` (new) — keyword → role → CSS class classifier.
- `lib/use-pan-zoom.ts` (new) — pan/zoom hook.
- `components/lesson/CompareTable.tsx`, `components/lesson/KeyStat.tsx`, `components/lesson/Point.tsx` (new).
- `components/nav/SidebarNav.tsx`, `components/nav/TopBar.tsx` — sidebar styling, mobile nav trigger (new `Sheet`-based component, or reuse `Dialog` styled as a slide-over if adding a new shadcn primitive proves unnecessary).
- `content/04-case-studies/{ticketmaster,parking-lot,amazon-locker}/{hld,lld}.mdx` — format retrofit.
- `CONTENT-GUIDE.md` — new "Formatting for fast reading" rules (§4), component authoring contracts.
- `docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md` — "Design system" section gets a pointer to this spec for color/type/layout amendments (kept in sync, not duplicated).

## 9. Verification

Per CLAUDE.md's UI verification rule, in both light and dark theme, on
every touched route:
- Diagram color/motion renders correctly; `prefers-reduced-motion:
  reduce` (Playwright emulation) disables the connector animation.
- Zoom in/out/reset and fullscreen expand all function; fullscreen
  dialog traps focus and closes on `Escape`.
- Sidebar mobile trigger opens/closes correctly below `md`; existing
  desktop sidebar unaffected.
- Contrast spot-check on the darkened `--color-ink-muted` and the two
  new accent colors in both themes.
- All 6 retrofitted lessons: re-run each `CHECKLIST.md`'s completeness
  pass against the rewritten content.
- `pnpm build` clean, full test suite green, same bar as every prior
  pass in this repo.
