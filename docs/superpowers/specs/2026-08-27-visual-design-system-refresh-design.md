# Visual Design System Refresh — Design

**Date:** 2026-08-27
**Status:** proposed (awaiting approval)
**Supersedes:** the design-tokens, typography, and diagram-appearance
sections of
[2026-08-26-nextjs-mdx-app-migration-design.md](2026-08-26-nextjs-mdx-app-migration-design.md).
Its component contracts, folder structure, and routing decisions stand
unchanged. The diagram *authoring* rules in
[../../../CONTENT-GUIDE.md](../../../CONTENT-GUIDE.md) also change — see
§7.

## 1. Problem

The app is functional but visually undernourished, and two problems are
specific enough to fix directly:

1. **It reads as monochrome.** One brand hue drives every accent, so the
   sidebar, TOC, homepage cards, and lesson chrome are all the same
   color. Nothing tells the reader *where* they are.
2. **The diagrams are hard to read** — the actual blocker for a learning
   repo whose whole point is diagrams. Cause, measured rather than
   guessed: all 392 D2 nodes in `content/` use a deep saturated fill
   (`#0e7c86`, `#3b6fd6`, `#b8722a`, `#b23a48`, `#5b4fbf`, `#4b5262`)
   with `font-color: "#ffffff"`. Small white text on a dark saturated
   field is the least legible combination available, and D2's default
   label size makes it worse. Two secondary causes: D2's `dagre` layout
   produces diagonal spaghetti edges, and the diagram canvas is
   transparent, so in dark mode a light-tuned diagram sits on a near-black
   ground.

Reference point (supplied by the repo owner): AlgoMaster.io's course
reader. What is worth taking from it is **structural**, not chromatic:
a light tinted page ground, a white content card, a grouped icon
sidebar with per-section counts, a right-hand TOC with reading progress,
and — critically — diagrams built from **bright mid-saturation fills
with bold near-black labels**, which is the inverse of what this repo
does today and is the single largest legibility win available.

What is explicitly *not* taken from it: its green-on-white palette. Nor
are the two directions already rejected in review (teal + dark navy;
warm cream + amber), nor a blue primary.

## 2. Direction: "Transit"

The organizing metaphor is a transit map — the one diagram form built
specifically so a stranger can find their position in a large system at a
glance. It fits the content (a course made of four parallel tracks
through one subject) and it earns its colors instead of decorating with
them.

Three consequences, and these are the whole direction:

- **Color means location.** Each of the four top-level tracks (HLD, LLD,
  Case Studies, Interview Prep) owns one line color, used identically in
  the sidebar, on the homepage, and in the lesson header. The reader
  learns four colors once and never has to read a breadcrumb again.
- **One identity color that is never a track.** A magenta reserved for
  the site's own voice — links, CTAs, focus rings, active states. It is
  the only hue in the system that no diagram role and no track uses, so
  "this is interactive" can never be confused with "this is an LLD
  lesson."
- **Diagrams are printed artifacts.** A diagram canvas is always paper —
  light in both themes. This is a deliberate constraint, not an
  oversight (see §5.1).

**Signature element:** the **line rail** — a 2px vertical bar in the
track's color running down the active sidebar section and reappearing as
a short horizontal rule under the lesson title. Plus the **diagram
legend**: a row of role chips auto-derived from the diagram's own
content, so every architecture diagram explains its own color coding
without the author writing a caption for it.

## 3. Color

All values are final; contrast ratios noted where they carry text.

### 3.1 Neutrals — light

| Token | Hex | Role |
|---|---|---|
| `--color-ground` | `#f5f3f5` | Page background. Off-white with a faint warm-neutral cast — "a bit of bg color, not pure white". |
| `--color-surface` | `#ffffff` | Content card, sidebar card, panels. |
| `--color-sidebar-surface` | `#efecf0` | Sidebar rail behind the card. |
| `--color-ink` | `#191721` | Body text. 15.8:1 on surface. |
| `--color-ink-muted` | `#605a70` | Captions, inactive nav. 6.4:1 on surface. |
| `--color-line` | `#e2dfe8` | Hairlines, card borders. |

### 3.2 Neutrals — dark

| Token | Hex | Role |
|---|---|---|
| `--color-ground` | `#17151b` | Plum-charcoal. Deliberately not navy and not pure black. |
| `--color-surface` | `#1f1c25` | |
| `--color-sidebar-surface` | `#141218` | |
| `--color-ink` | `#eceaf2` | 13.9:1 on surface. |
| `--color-ink-muted` | `#a09aad` | 6.1:1 on surface. |
| `--color-line` | `#302b38` | |

### 3.3 Identity

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-brand` | `#c01f6b` | `#ff7fb2` | Links, primary buttons, focus ring, active TOC item, quiz "selected". 5.9:1 on white / 9.2:1 on dark surface. |
| `--color-brand-soft` | `#fdeef4` | `#2c1a25` | Tinted background for active/selected states. |

### 3.4 Track (line) colors

One palette, two renderings: light mode uses the deep value, dark mode
uses the bright value. These are the same hues as the diagram roles
(§5.2), so UI chrome and diagrams read as one system rather than two.

| Track | Light | Dark |
|---|---|---|
| `--color-track-hld` | `#1c6f96` (harbor blue) | `#62c8f2` |
| `--color-track-lld` | `#4f3fb0` (signal violet) | `#a99cf5` |
| `--color-track-case-studies` | `#0c7a5c` (line green) | `#4fd1a5` |
| `--color-track-interview` | `#a76a10` (amber) | `#f9b64e` |

### 3.5 Semantic states

Independent of accent and track; used by `QuizItem`, `Rubric`,
`SelfScoreBand`, and state-machine diagrams.

| Token | Light | Dark |
|---|---|---|
| `--color-state-ok` | `#0c7a5c` | `#4fd1a5` |
| `--color-state-warn` | `#a76a10` | `#f9b64e` |
| `--color-state-bad` | `#a63241` | `#f78a95` |

### 3.6 Rules

- Every color is declared as a token on bare `:root` (complete light
  palette), redefined inside
  `:root:not([data-theme="light"]) @media (prefers-color-scheme: dark)`,
  and redefined again under `:root[data-theme="dark"]`. No component may
  reference a literal hex, and no color may have its only declaration
  inside a media or `[data-theme]` block.
- Magenta is never used to mean a track or a state. Track colors are
  never used to mean "interactive".
- Diagram display colors (§5.2) live in `lib/diagram-palette.ts`, not in
  CSS, because they must be identical in both themes and are applied to
  SVG at render time.

## 4. Typography

Body text moves from serif to sans. A serif body at 17px inside a
technical reader — dense with identifiers, hex values, and inline code —
is the wrong tool; the reference sites are all-sans for this reason. The
character the serif was providing moves to the heading face instead.

| Role | Face | Weights | Notes |
|---|---|---|---|
| Headings | **Archivo** | 600, 700 | Sturdy grotesk with real width and a tight, engineered feel. Not Inter, not Space Grotesk. `letter-spacing: -0.011em`, `text-wrap: balance`. |
| Body | **Source Sans 3** | 400, 600 | Chosen for legibility at 17px and for keeping family kinship with the Source Serif it replaces. |
| Mono / utility | **IBM Plex Mono** | 500, 600 | Kept. Eyebrows, badges, inline code, code blocks, diagram edge labels. |

Source Serif 4 is dropped entirely — nothing in the new system uses it,
and keeping an unused family in `next/font` costs a request.

### 4.1 Scale

| Role | Size | Line-height | Weight | Face |
|---|---|---|---|---|
| Lesson title (h1) | 2.125rem / 34px | 1.15 | 700 | Archivo |
| Section (h2) | 1.625rem / 26px | 1.25 | 600 | Archivo |
| Subsection (h3) | 1.25rem / 20px | 1.35 | 600 | Archivo |
| Minor (h4) | 1.0625rem / 17px | 1.4 | 600 | Archivo |
| Body | 1.0625rem / 17px | 1.75 | 400 | Source Sans 3 |
| Secondary / list-dense | 0.9375rem / 15px | 1.6 | 400 | Source Sans 3 |
| Eyebrow / label | 0.75rem / 12px | 1.4 | 600, uppercase, `+0.08em` | IBM Plex Mono |
| Inline code | 0.9375rem / 15px | inherit | 500 | IBM Plex Mono |
| Diagram node label | 15px (floor) | 1.3 | 600 | Source Sans 3 |
| Diagram edge label | 13px | 1.3 | 600 | IBM Plex Mono |

### 4.2 Measure and rhythm

- Prose measure caps at **90ch**, down from the current 100ch. This
  keeps the deliberate widening from commits `c11c223`/`1575e70` while
  cutting the worst 17px line lengths on a 1800px display.
- Diagrams, tables, `CompareTable`, and code blocks break out to the full
  content column width (they keep `panel-breakout`).
- Vertical rhythm on a 4px grid. Section spacing: `h2` gets `2.5rem`
  top, `h3` `1.75rem`, `p`/`ul` `1rem`.
- Radius: `--radius: 0.625rem` (10px) for cards, panels, buttons and
  inputs; `0.375rem` small; pills fully round. Up from today's 4px,
  which reads severe next to the softer reference.
- Elevation, light only: `0 1px 2px rgb(0 0 0 / 0.05), 0 1px 3px rgb(0 0
  0 / 0.04)`. Dark mode uses borders, not shadows.

## 5. Diagrams

This is the section that matters most; everything above is chrome.

### 5.1 Canvas is always paper

The scrollable canvas inside a diagram panel uses
`--color-diagram-canvas`: `#fbfbfc` in light, `#f2f1f4` in dark (a
slightly dimmed paper so it does not glare against a dark page). The
panel *frame* — border, eyebrow, title, legend, toolbar — stays fully
theme-aware.

Rationale, and why this is a feature rather than a compromise:

- D2's SVG output is static. It cannot react to a theme, so any
  theme-dependent diagram palette is unachievable on the D2 path
  regardless of effort.
- Mermaid bakes literal colors at render time for the same reason, which
  is why `globals.css` currently carries ~100 lines of `!important`
  fill/stroke/label overrides just to make dark mode survivable.
- A fixed light canvas lets **one** palette serve both themes, deletes
  that entire override block, and matches how these diagrams are
  actually used — screenshotted into notes, printed, pasted into
  interview prep.

### 5.2 Display palette

Bright mid-saturation fill, bold near-black label, deep stroke. The
label color is a single value across all roles so labels never shift
weight between node types.

| Role | Fill | Stroke | Label | Used for |
|---|---|---|---|---|
| client | `#62c8f2` | `#1c6f96` | `#0d1b24` | browsers, mobile apps, end users |
| network | `#a99cf5` | `#4f3fb0` | `#0d1b24` | CDN, gateway, load balancer, waiting room |
| service | `#4fd1a5` | `#0c7a5c` | `#0d1b24` | application services, workers |
| cache | `#f9b64e` | `#a76a10` | `#0d1b24` | Redis, in-memory caches |
| datastore | `#f78a95` | `#a63241` | `#0d1b24` | databases, persistent stores |
| queue | `#b9c0cc` | `#5a6472` | `#0d1b24` | message queues, event streams |

Every label/fill pair clears 7:1. Stroke width 2px. Edges: `#5c6470` at
1.75px with a filled arrowhead; edge labels get a `#ffffff` pill with a
1px `#d6d9e0` border and `#3d4450` text.

### 5.3 Authored hex becomes a semantic key

Content is **not** rewritten. The six hexes already authored across 392
nodes keep their current values in MDX and are reinterpreted as
*semantic role keys*, mapped to the display palette at render time by
`lib/diagram-palette.ts`:

| Authored (semantic key) | Renders as |
|---|---|
| `#0e7c86` | service |
| `#3b6fd6` | client |
| `#5b4fbf` | network |
| `#b8722a` | cache |
| `#b23a48` | datastore |
| `#4b5262` | queue |

`font-color: "#ffffff"` on a node carrying any of those fills is
rewritten to the label color. A node with an unrecognized fill is left
exactly as authored — the transform is additive and cannot break an
unusual diagram.

This is the load-bearing decision of the whole refresh: it turns a
392-node content migration into one pure function with unit tests, and
it means future palette changes never touch `content/` again.

### 5.4 Legibility requirements

Each is independently checkable:

1. **Label floor 15px, weight 600.** No rendered node label may compute
   below 15px at 100% zoom.
2. **Orthogonal routing.** D2 layout moves from `dagre` to `elk`, which
   routes edges on right angles instead of diagonals. Applied globally in
   `renderD2`. If any existing diagram regresses under `elk`, that
   diagram — not the global setting — is the thing to fix.
3. **Legend.** Architecture and class diagrams render a legend row of
   role chips, auto-derived from the roles the transform actually found.
   No legend when fewer than two roles are present (a two-box diagram
   does not need one).
4. **Panel height** rises from `32rem` to `40rem`; existing pan/zoom and
   fullscreen are unchanged, plus a **fit-to-width** control alongside
   the existing zoom buttons.
5. **Mermaid parity.** The three MDX files still on `<DiagramPanel>` get
   the same palette via `lib/diagram-roles.ts` class hooks reading the
   same `diagram-palette.ts` values, so the two engines cannot drift.

## 6. Layout and components

Structure is unchanged — topbar, left sidebar, content, right TOC. What
changes is treatment.

- **TopBar.** Height 3.5rem, `--color-surface`, bottom hairline. Wordmark
  in Archivo 700 with the site's own magenta; the icon becomes a 4-bar
  transit glyph rather than a lucide network icon.
- **Sidebar.** White card on the tinted rail, radius 10px. Each section
  header gets a track-tinted icon chip (icon in track color on a 12%
  track-color wash) and a right-aligned lesson count in mono 12px. The
  active lesson is a magenta-soft pill; its group shows the 2px track
  rail on its left edge.
- **Content.** White surface card, radius 10px, 2rem padding at ≥1024px.
  Lesson title followed by a 3rem-wide, 3px track-color rule.
- **TOC.** Kept sticky at `top-16`; eyebrow, then items with a 2px left
  border that goes magenta and bold when active. A reading-progress bar
  (magenta on `--color-line`) sits under the eyebrow, driven by the
  existing scroll tracking.
- **Homepage cards.** Each of the four module cards gets a 3px top rule
  and icon chip in its track color; hover raises elevation and reveals a
  magenta arrow.
- **Markdown tables** — currently rendered with **zero** styling, since
  `lib/mdx-components.tsx` defines no `table`/`th`/`td` and five MDX
  files contain raw tables. New: `overflow-x: auto` wrapper, radius 10px,
  header row on `--color-sidebar-surface` in mono 12px uppercase, 1px
  row separators, zebra on even rows, `tabular-nums` on numeric columns.
- **Focus.** Every interactive element gets `focus-visible` with a 2px
  magenta ring and 2px offset. No element may rely on hover alone.

Out of scope, recorded so it is not silently absorbed: a callout/admonition
component, syntax highlighting for code blocks, per-lesson progress
persistence, and search.

## 7. Documentation changes

- **`CONTENT-GUIDE.md`** — the D2 role table's "Fill / Stroke" columns
  are reframed as semantic keys with a pointer to §5.3, and the
  "always pair a colored fill with `font-color: #ffffff`" rule stays
  (it is what the transform keys on). The "Mermaid dark-mode fill"
  column is deleted — there is no dark-mode diagram fill any more.
- **`nextjs-mdx-app-migration-design.md`** — a header note pointing its
  tokens/typography sections here.

## 8. Verification

Per `CLAUDE.md`, no part of this is done from code review. Every task
that touches `app/`, `components/`, or rendering ends with the dev
server driven through Playwright:

- Routes: `/`, one HLD concept lesson, one LLD concept lesson, one
  case-study HLD lesson (D2-heavy), one lesson still on Mermaid.
- Both themes forced explicitly (`data-theme=light`, `data-theme=dark`),
  not just the OS default.
- Widths 1440 and 1024, plus 390 for the mobile nav.
- Checked each time: label legibility inside diagrams, no horizontal
  body scroll (`scrollWidth === clientWidth`), visible focus rings, and
  no color declared only under one theme.
