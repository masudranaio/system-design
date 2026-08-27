# Visual Design System Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's single-accent token system with the "Transit" palette and type scale, and make every diagram legible by retinting it at render time — without editing a single line of `content/`.

**Architecture:** One pure module (`lib/diagram-palette.ts`) owns diagram display colors and rewrites D2's SVG on the server; `app/globals.css` owns every UI token in a three-state theme cascade; components consume tokens only. The six role hexes already authored in MDX become semantic keys, so the 392-node content base needs no migration.

**Tech Stack:** Next.js 16 (App Router), Tailwind v4 `@theme inline`, next-themes, `@terrastruct/d2` (WASM), Mermaid 11, Vitest + Testing Library, Playwright MCP for UI verification. Package manager is **pnpm** — never npm.

**Spec:** [../specs/2026-08-27-visual-design-system-refresh-design.md](../specs/2026-08-27-visual-design-system-refresh-design.md)

## Global Constraints

- **pnpm only.** `pnpm test` (= `vitest run`), `pnpm dev`, `pnpm lint`. Never `npm`/`npx`.
- **No literal hex in any component.** Colors come from CSS tokens, except inside `lib/diagram-palette.ts`, which is the one authorized home for diagram hexes (they must be theme-invariant, applied to SVG).
- **Three-state theme cascade, every token, no exceptions.** Bare `:root` = complete light palette; `:root:not([data-theme="light"]) { @media (prefers-color-scheme: dark) { … } }`; `:root[data-theme="dark"] { … }`. A color whose only declaration sits inside a media or `[data-theme]` block is a defect.
- **`content/` is not edited by this plan.** Any task that thinks it needs to change an `.mdx` file has found a bug in the retint transform instead.
- **Exact values are copied verbatim from the spec's tables** (§3, §4.1, §5.2). Do not re-derive, round, or "improve" a hex or a size.
- **Diagram label contrast floor:** every node label ≥ 15px, weight 600, and ≥ 7:1 against its fill.
- **UI verification is mandatory** for any task touching `app/`, `components/`, or rendering: dev server + Playwright MCP, both themes forced explicitly, per `CLAUDE.md`. Code review alone never closes such a task.
- **Commit per task**, message prefix `feat(design):` or `refactor(design):`.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `lib/diagram-palette.ts` | Single source of diagram display colors; semantic-key→role map; `retintD2Svg()` pure transform. |
| `lib/diagram-palette.test.ts` | Unit tests for the transform against a real D2 fixture. |
| `lib/__fixtures__/d2-sample.svg` | Real D2 output captured from live content, so tests assert against reality rather than an assumed shape. |
| `components/lesson/DiagramLegend.tsx` | Role-chip legend row. |
| `components/lesson/DiagramLegend.test.tsx` | |

**Modified**

| File | Change |
|---|---|
| `app/globals.css` | Full token layer rewrite; delete the Mermaid dark-fill override block; add table/prose/diagram-canvas rules. |
| `app/layout.tsx` | Fonts: add Archivo + Source Sans 3, drop Source Serif 4. |
| `app/page.tsx` | Track-colored module cards. |
| `lib/mdx-components.tsx` | Type scale, 90ch measure, table/th/td/blockquote styling. |
| `lib/render-d2.ts` | `elk` layout; call `retintD2Svg`; return roles. |
| `lib/diagram-roles.ts` | Mermaid role classes read the shared palette. |
| `lib/nav-icons.tsx` | Add `SECTION_TRACK` map. |
| `components/lesson/D2Diagram.tsx` | Pass roles through to chrome. |
| `components/lesson/DiagramChrome.tsx` | Legend, paper canvas, 40rem, fit-to-width. |
| `components/nav/SidebarNav.tsx` | Track chips, counts, line rail, magenta active pill. |
| `components/nav/TopBar.tsx` | Wordmark + transit glyph. |
| `components/lesson/TableOfContents.tsx` | Reading-progress bar, magenta active. |
| `components/lesson/LessonShell.tsx` | Title + track rule, surface card. |
| `CONTENT-GUIDE.md`, `docs/.../nextjs-mdx-app-migration-design.md` | Doc alignment. |

---

## Task 1: Diagram palette module

**Files:**
- Create: `lib/diagram-palette.ts`, `lib/diagram-palette.test.ts`, `lib/__fixtures__/d2-sample.svg`
- Test: `lib/diagram-palette.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export type DiagramRole = "client" | "network" | "service" | "cache" | "datastore" | "queue";
  export const DIAGRAM_DISPLAY: Record<DiagramRole, { fill: string; stroke: string; label: string }>;
  export const DIAGRAM_EDGE: { stroke: string; labelBg: string; labelBorder: string; labelText: string };
  export const AUTHORED_FILL_TO_ROLE: Record<string, DiagramRole>;
  export const DIAGRAM_LABEL_MIN_PX = 15;
  export function retintD2Svg(svg: string): { svg: string; roles: DiagramRole[] };
  ```

- [ ] **Step 1: Capture a real D2 fixture**

Do not guess D2's SVG shape. Write a throwaway script and run it:

```bash
cat > /tmp/cap.mjs <<'EOF'
import { D2 } from "@terrastruct/d2";
const src = `direction: right
A: Customer App { style.fill: "#3b6fd6"; style.font-color: "#ffffff" }
B: API Gateway { style.fill: "#5b4fbf"; style.font-color: "#ffffff" }
C: Locker Service { style.fill: "#0e7c86"; style.font-color: "#ffffff" }
D: Redis Cache { style.fill: "#b8722a"; style.font-color: "#ffffff" }
A -> B: request
B -> C: reserve, 500K QPS
C -> D: hold (TTL)
`;
const d2 = new D2();
const c = await d2.compile(src, { options: { layout: "dagre" } });
process.stdout.write(await d2.render(c.diagram, { ...c.renderOptions, pad: 40 }));
EOF
pnpm exec node /tmp/cap.mjs > lib/__fixtures__/d2-sample.svg
```

Then read the fixture and note, in a comment at the top of
`diagram-palette.ts`, the two facts the transform depends on:
1. how a shape's fill is expressed (`fill="#0e7c86"` attribute on
   `<rect>`/`<path>`, vs. a generated CSS class in the SVG's `<style>`),
2. how label text color and size are expressed (`fill=`/`font-size=`
   attributes on `<text>`, vs. classes like `.text-bold`).

The transform in Step 3 must match what the fixture actually shows. If
fills turn out to be class-based, implement the class-based branch
described in Step 3's note instead of the attribute branch — both are
specified, so this is a choice, not an unknown.

- [ ] **Step 2: Write the failing tests**

```ts
// lib/diagram-palette.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AUTHORED_FILL_TO_ROLE, DIAGRAM_DISPLAY, retintD2Svg } from "./diagram-palette";

const FIXTURE = readFileSync(new URL("./__fixtures__/d2-sample.svg", import.meta.url), "utf8");

describe("retintD2Svg", () => {
  it("replaces every authored role fill with its display fill", () => {
    const { svg } = retintD2Svg(FIXTURE);
    for (const authored of Object.keys(AUTHORED_FILL_TO_ROLE)) {
      expect(svg).not.toContain(authored);
    }
    expect(svg).toContain(DIAGRAM_DISPLAY.service.fill);
    expect(svg).toContain(DIAGRAM_DISPLAY.client.fill);
  });

  it("reports the roles it found, deduped and in palette order", () => {
    const { roles } = retintD2Svg(FIXTURE);
    expect(roles).toEqual(["client", "network", "service", "cache"]);
  });

  it("rewrites white node labels to the dark label color", () => {
    const { svg } = retintD2Svg(FIXTURE);
    expect(svg).toContain(DIAGRAM_DISPLAY.service.label);
  });

  it("raises any label font-size below the floor to 15px", () => {
    const { svg } = retintD2Svg('<text font-size="12" fill="#ffffff">x</text>');
    expect(svg).toContain('font-size="15"');
  });

  it("leaves an unrecognized fill untouched", () => {
    const input = '<rect fill="#123456"/>';
    expect(retintD2Svg(input).svg).toBe(input);
  });

  it("is idempotent", () => {
    const once = retintD2Svg(FIXTURE).svg;
    expect(retintD2Svg(once).svg).toBe(once);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test lib/diagram-palette.test.ts`
Expected: FAIL — `Failed to resolve import "./diagram-palette"`.

- [ ] **Step 4: Implement the module**

```ts
// lib/diagram-palette.ts
export type DiagramRole =
  | "client"
  | "network"
  | "service"
  | "cache"
  | "datastore"
  | "queue";

/** Display colors are theme-invariant by design — the diagram canvas is
 *  always paper in both themes (see the spec's "Canvas is always paper").
 *  This is the ONLY module allowed to hold diagram hexes. */
export const DIAGRAM_DISPLAY: Record<
  DiagramRole,
  { fill: string; stroke: string; label: string }
> = {
  client: { fill: "#62c8f2", stroke: "#1c6f96", label: "#0d1b24" },
  network: { fill: "#a99cf5", stroke: "#4f3fb0", label: "#0d1b24" },
  service: { fill: "#4fd1a5", stroke: "#0c7a5c", label: "#0d1b24" },
  cache: { fill: "#f9b64e", stroke: "#a76a10", label: "#0d1b24" },
  datastore: { fill: "#f78a95", stroke: "#a63241", label: "#0d1b24" },
  queue: { fill: "#b9c0cc", stroke: "#5a6472", label: "#0d1b24" },
};

export const DIAGRAM_EDGE = {
  stroke: "#5c6470",
  labelBg: "#ffffff",
  labelBorder: "#d6d9e0",
  labelText: "#3d4450",
};

/** The hexes already authored across 392 nodes in content/ are treated as
 *  semantic role keys, not as appearance. Nothing in content/ changes. */
export const AUTHORED_FILL_TO_ROLE: Record<string, DiagramRole> = {
  "#3b6fd6": "client",
  "#5b4fbf": "network",
  "#0e7c86": "service",
  "#b8722a": "cache",
  "#b23a48": "datastore",
  "#4b5262": "queue",
};

export const DIAGRAM_LABEL_MIN_PX = 15;

const ROLE_ORDER: DiagramRole[] = [
  "client",
  "network",
  "service",
  "cache",
  "datastore",
  "queue",
];

const AUTHORED_LABEL_WHITE = /#ffffff/gi;

export function retintD2Svg(svg: string): { svg: string; roles: DiagramRole[] } {
  const found = new Set<DiagramRole>();
  let out = svg;

  for (const [authored, role] of Object.entries(AUTHORED_FILL_TO_ROLE)) {
    const pattern = new RegExp(authored, "gi");
    if (pattern.test(out)) {
      found.add(role);
      out = out.replace(pattern, DIAGRAM_DISPLAY[role].fill);
    }
  }

  // Every role's label color is the same value, so white label text can be
  // rewritten in one pass without tracking which shape it belongs to.
  if (found.size > 0) {
    out = out.replace(AUTHORED_LABEL_WHITE, DIAGRAM_DISPLAY.client.label);
  }

  out = out.replace(
    /font-size="(\d+(?:\.\d+)?)"/g,
    (whole, size: string) =>
      Number(size) < DIAGRAM_LABEL_MIN_PX
        ? `font-size="${DIAGRAM_LABEL_MIN_PX}"`
        : whole,
  );

  return { svg: out, roles: ROLE_ORDER.filter((role) => found.has(role)) };
}
```

Note for the class-based branch: if Step 1's fixture shows fills coming
from generated CSS classes rather than `fill=` attributes, keep the same
exported surface and instead (a) read each class's declared fill from the
SVG's inline `<style>`, (b) rewrite the declaration's value, and (c)
append one `<style>` block that sets `text { font-size: 15px; font-weight: 600 }`
scoped to shape labels. The tests above are written against the exported
behavior, not the mechanism, so they hold either way.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test lib/diagram-palette.test.ts`
Expected: PASS (6 tests). Fix the transform, never the spec's values, if
the role-order or idempotency test fails.

- [ ] **Step 6: Commit**

```bash
git add lib/diagram-palette.ts lib/diagram-palette.test.ts lib/__fixtures__/d2-sample.svg
git commit -m "feat(design): add diagram display palette and D2 retint transform"
```

---

## Task 2: Wire the transform into D2 rendering

**Files:**
- Modify: `lib/render-d2.ts`, `components/lesson/D2Diagram.tsx`, `components/lesson/DiagramChrome.tsx:106-116` (prop only)
- Test: `lib/render-d2.test.ts` (create)

**Interfaces:**
- Consumes: `retintD2Svg`, `DiagramRole` from Task 1.
- Produces: `renderD2` returns `{ svg: string; roles: DiagramRole[] } | { error: string }`; `DiagramChrome` gains an optional `roles?: DiagramRole[]` prop (unused until Task 5).

- [ ] **Step 1: Write the failing test**

```ts
// lib/render-d2.test.ts
import { describe, expect, it } from "vitest";
import { renderD2 } from "./render-d2";
import { DIAGRAM_DISPLAY } from "./diagram-palette";

const SRC = `A: Locker Service { style.fill: "#0e7c86"; style.font-color: "#ffffff" }
B: Redis Cache { style.fill: "#b8722a"; style.font-color: "#ffffff" }
A -> B: hold (TTL)
`;

describe("renderD2", () => {
  it("returns SVG retinted to the display palette with the roles it found", async () => {
    const result = await renderD2(SRC);
    if ("error" in result) throw new Error(result.error);
    expect(result.svg).toContain(DIAGRAM_DISPLAY.service.fill);
    expect(result.svg).not.toContain("#0e7c86");
    expect(result.roles).toEqual(["service", "cache"]);
  }, 30_000);

  it("reports a compile error instead of throwing", async () => {
    const result = await renderD2("A -> ->");
    expect("error" in result).toBe(true);
  }, 30_000);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test lib/render-d2.test.ts`
Expected: FAIL — `result.roles` is `undefined`.

- [ ] **Step 3: Update `renderD2`**

Change the result type and the two lines that build it. Keep the existing
per-call `new D2()` instance and the `fill-N7` background strip exactly as
they are — both carry comments explaining live-confirmed bugs.

```ts
import { D2 } from "@terrastruct/d2";
import { retintD2Svg, type DiagramRole } from "./diagram-palette";

export type RenderD2Result =
  | { svg: string; roles: DiagramRole[] }
  | { error: string };
```

Inside the try block, change the layout option and wrap the return:

```ts
    // "elk" routes edges on right angles instead of dagre's diagonals,
    // which is the single biggest readability difference in a dense
    // architecture diagram (see spec §5.4).
    const compiled = await d2.compile(source, { options: { layout: "elk" } });
```

```ts
    const transparentSvg = svg.replace(/<rect[^>]*class="[^"]*fill-N7[^"]*"[^>]*\/>/, "");
    return retintD2Svg(transparentSvg);
```

- [ ] **Step 4: Update the two consumers**

`components/lesson/D2Diagram.tsx` — pass roles through:

```tsx
export async function D2Diagram({ title, type, chart }: D2DiagramProps) {
  const result = await renderD2(chart);
  return (
    <DiagramChrome
      title={title}
      type={type}
      svgMarkup={"svg" in result ? result.svg : null}
      roles={"roles" in result ? result.roles : undefined}
      error={"error" in result ? result.error : undefined}
    />
  );
}
```

`components/lesson/DiagramChrome.tsx` — add the prop to the signature and
its type only (rendering it is Task 5):

```tsx
export function DiagramChrome({
  title,
  type,
  svgMarkup,
  roles,
  error,
}: {
  title: string;
  type: DiagramType;
  svgMarkup: string | null;
  roles?: DiagramRole[];
  error?: string;
}) {
```

- [ ] **Step 5: Run the full suite**

Run: `pnpm test`
Expected: PASS. `DiagramPanel.test.tsx` and `DiagramChrome`'s existing
consumers must stay green — `roles` is optional precisely so they do.

- [ ] **Step 6: Verify `elk` against real content in the browser**

Start `pnpm dev`, then with Playwright MCP navigate to the D2-heaviest
lesson (`content/04-case-studies/amazon-locker/hld.mdx`'s route) and
screenshot every diagram panel. Confirm: no diagram is empty, no edge
crosses through a node box, no label is clipped by its shape. If one
diagram regresses under `elk`, note the diagram — do not revert the
global layout setting (spec §5.4.2).

- [ ] **Step 7: Commit**

```bash
git add lib/render-d2.ts lib/render-d2.test.ts components/lesson/D2Diagram.tsx components/lesson/DiagramChrome.tsx
git commit -m "feat(design): retint D2 output and route edges with elk"
```

---

## Task 3: Token layer

**Files:**
- Modify: `app/globals.css:4-131` (token blocks), `app/globals.css:190-306` (diagram override block), `lib/diagram-roles.ts`

**Interfaces:**
- Consumes: `DIAGRAM_DISPLAY` from Task 1 (as the source of truth the CSS values are copied from — Mermaid's class-based path needs them in CSS).
- Produces: token names every later task consumes — `--color-ground`, `--color-surface`, `--color-sidebar-surface`, `--color-ink`, `--color-ink-muted`, `--color-line`, `--color-brand`, `--color-brand-soft`, `--color-track-{hld,lld,case-studies,interview}`, `--color-state-{ok,warn,bad}`, `--color-diagram-canvas`, `--radius: 0.625rem`, and Tailwind utilities `bg-brand-soft`, `text-track-hld`, `bg-diagram-canvas`, etc. via `@theme inline`.

- [ ] **Step 1: Replace the three theme blocks**

Copy values verbatim from spec §3. Light (`:root`):

```css
:root {
  --color-ground: #f5f3f5;
  --color-surface: #ffffff;
  --color-sidebar-surface: #efecf0;
  --color-ink: #191721;
  --color-ink-muted: #605a70;
  --color-line: #e2dfe8;

  --color-brand: #c01f6b;
  --color-brand-soft: #fdeef4;

  --color-track-hld: #1c6f96;
  --color-track-lld: #4f3fb0;
  --color-track-case-studies: #0c7a5c;
  --color-track-interview: #a76a10;

  --color-state-ok: #0c7a5c;
  --color-state-warn: #a76a10;
  --color-state-bad: #a63241;

  /* Diagrams are printed artifacts: the canvas stays light in both
     themes so one static palette can serve D2 (whose SVG cannot react
     to a theme at all) and Mermaid alike. See spec §5.1. */
  --color-diagram-canvas: #fbfbfc;

  --radius: 0.625rem;
}
```

Both dark blocks — `:root:not([data-theme="light"]) { @media (prefers-color-scheme: dark) { … } }`
and `:root[data-theme="dark"] { … }` — get the identical body:

```css
  --color-ground: #17151b;
  --color-surface: #1f1c25;
  --color-sidebar-surface: #141218;
  --color-ink: #eceaf2;
  --color-ink-muted: #a09aad;
  --color-line: #302b38;

  --color-brand: #ff7fb2;
  --color-brand-soft: #2c1a25;

  --color-track-hld: #62c8f2;
  --color-track-lld: #a99cf5;
  --color-track-case-studies: #4fd1a5;
  --color-track-interview: #f9b64e;

  --color-state-ok: #4fd1a5;
  --color-state-warn: #f9b64e;
  --color-state-bad: #f78a95;

  --color-diagram-canvas: #f2f1f4;
```

Keep the existing shadcn alias block (`--background`, `--primary`, …)
pointing at the new names; `--destructive` maps to `--color-state-bad`,
`--ring` and `--primary` to `--color-brand`. Delete the retired tokens
`--color-teal`, `--color-accent-blue`, `--color-accent-info`,
`--color-accent-warn`, `--color-state-available`, `--color-state-held`,
`--color-state-booked` **only after** Step 2 has repointed their consumers.

- [ ] **Step 2: Repoint the retired tokens' consumers**

```bash
grep -rn "accent-warn\|accent-info\|accent-blue\|state-available\|state-held\|state-booked\|text-teal\|color-teal" app components lib
```

Rewrite each hit to the new name: `accent-warn`/`state-held` →
`state-warn`, `accent-info` → `track-lld`, `accent-blue` → `track-hld`,
`state-available` → `state-ok`, `state-booked` → `state-bad`, `teal` →
`track-hld`. Expected hits include `CompareTable.tsx`,
`DiagramChrome.tsx`'s `TYPE_ACCENT`, `Rubric.tsx`, `SelfScoreBand.tsx`,
`KeyStat.tsx`.

- [ ] **Step 3: Rewrite `@theme inline`**

Expose exactly the tokens from Step 1 (drop the retired ones), keep the
shadcn aliases, and set the font families:

```css
  --font-sans: var(--font-sans);
  --font-display: var(--font-display);
  --font-mono: var(--font-mono);
```

- [ ] **Step 4: Replace the Mermaid diagram-color block**

Delete `globals.css`'s current generic-default and per-role fill/stroke
rules **and** the `.node .nodeLabel` dark-text workaround (lines ~218-306)
— the paper canvas makes the entire dark-mode adaptation unnecessary.
Replace with one static block per role, values copied from spec §5.2, and
keep the `!important` and the `.basic`/tag-name selector list exactly as
the existing comments explain (mermaid's ID-scoped embedded style still
out-specifies this file):

```css
.diagram-animate .diagram-role-service .basic,
.diagram-animate .diagram-role-service rect,
.diagram-animate .diagram-role-service polygon,
.diagram-animate .diagram-role-service circle,
.diagram-animate .diagram-role-service path {
  fill: #4fd1a5 !important;
  stroke: #0c7a5c !important;
  stroke-width: 2px !important;
}
```

…repeated for `client` (`#62c8f2`/`#1c6f96`), `network`
(`#a99cf5`/`#4f3fb0`), `cache` (`#f9b64e`/`#a76a10`), `datastore`
(`#f78a95`/`#a63241`), `queue` (`#b9c0cc`/`#5a6472`, keeping its existing
`stroke-dasharray: 4 2`). Generic default (no role match) uses the
`queue` values. Then one label rule for both engines:

```css
.diagram-animate .node .nodeLabel,
.diagram-animate .node .nodeLabel *,
.diagram-animate text {
  color: #0d1b24 !important;
  fill: #0d1b24 !important;
  font-weight: 600 !important;
}
```

Preserve the whole `@media (prefers-reduced-motion: no-preference)` edge
animation block and the `.node:hover` transform block untouched.

- [ ] **Step 5: Add a palette-drift guard test**

```ts
// lib/diagram-palette.test.ts — append
import { readFileSync } from "node:fs";
import { DIAGRAM_DISPLAY } from "./diagram-palette";

it("globals.css carries the same role colors as the palette module", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const { fill, stroke } of Object.values(DIAGRAM_DISPLAY)) {
    expect(css).toContain(fill);
    expect(css).toContain(stroke);
  }
});
```

- [ ] **Step 6: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS. A failure here is almost always a component still
referencing a deleted token — fix the component.

- [ ] **Step 7: Verify both themes in the browser**

`pnpm dev`, then Playwright MCP: navigate to `/`, force
`localStorage.setItem('theme','light')` + reload, screenshot; repeat with
`'dark'`. Then run the drift check in-page and paste the result into the
task report:

```js
() => {
  const el = document.documentElement;
  const missing = ["--color-ground","--color-surface","--color-sidebar-surface","--color-ink","--color-ink-muted","--color-line","--color-brand","--color-brand-soft","--color-track-hld","--color-track-lld","--color-track-case-studies","--color-track-interview","--color-state-ok","--color-state-warn","--color-state-bad","--color-diagram-canvas"]
    .filter(t => !getComputedStyle(el).getPropertyValue(t).trim());
  return { missing, noOverflow: el.scrollWidth === el.clientWidth, bodyBg: getComputedStyle(document.body).backgroundColor };
}
```

Expected: `missing: []`, `noOverflow: true`, and a `bodyBg` that differs
between the two themes.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css lib/diagram-palette.test.ts app components
git commit -m "feat(design): replace token layer with the Transit palette"
```

---

## Task 4: Typography

**Files:**
- Modify: `app/layout.tsx:2-19`, `app/globals.css` (`@import`, `body`, heading rules), `lib/mdx-components.tsx`

**Interfaces:**
- Consumes: `--font-sans`/`--font-display`/`--font-mono` exposure from Task 3 Step 3.
- Produces: Tailwind `font-display`, `font-sans`, `font-mono`; prose measure class `max-w-[90ch]` used by every MDX element.

- [ ] **Step 1: Swap the font imports**

```tsx
import { Archivo, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});
```

and on `<html>`: `className={`${archivo.variable} ${sourceSans.variable} ${plexMono.variable}`}`.
Remove the `Source_Serif_4` import and its constant entirely.

- [ ] **Step 2: Update the base type rules in `globals.css`**

Delete the top-of-file `@import url("https://fonts.googleapis.com/…")`
line — `next/font` self-hosts these faces, so that request is now both
redundant and a render-blocking third-party fetch.

```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  font-size: 1.0625rem;
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display), ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.011em;
  text-wrap: balance;
}

.font-mono, code, kbd {
  font-family: var(--font-mono), ui-monospace, "SFMono-Regular", monospace;
}
```

Note the behavior change this fixes: the old rule put `.font-mono` in the
same selector as the headings, so every eyebrow and badge in the app was
being styled by the heading rule.

- [ ] **Step 3: Update `lib/mdx-components.tsx` to the spec scale**

Values from spec §4.1; measure `90ch` on every text element (not on
`DiagramPanel`/`D2Diagram`/`CompareTable`, which break out):

```tsx
  h2: (props) => (
    <h2 className="mt-10 max-w-[90ch] scroll-mt-24 text-[1.625rem] leading-[1.25] font-semibold text-foreground" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-7 max-w-[90ch] scroll-mt-24 text-[1.25rem] leading-[1.35] font-semibold text-foreground" {...props} />
  ),
  h4: (props) => (
    <h4 className="mt-5 max-w-[90ch] text-[1.0625rem] leading-[1.4] font-semibold text-foreground" {...props} />
  ),
  p: (props) => (
    <p className="mt-4 max-w-[90ch] text-[1.0625rem] leading-[1.75] text-foreground" {...props} />
  ),
  ul: (props) => <ul className="mt-4 max-w-[90ch] list-disc pl-6 marker:text-brand" {...props} />,
  ol: (props) => <ol className="mt-4 max-w-[90ch] list-decimal pl-6 marker:text-ink-muted" {...props} />,
  li: (props) => <li className="mt-1.5 pl-1" {...props} />,
  code: (props) => (
    <code className="rounded-sm border border-line bg-sidebar-surface px-1.5 py-0.5 font-mono text-[0.9375rem] font-medium" {...props} />
  ),
  a: (props) => (
    <a className="font-medium text-brand underline decoration-brand/40 decoration-2 underline-offset-2 transition-colors hover:decoration-brand" {...props} />
  ),
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
```

- [ ] **Step 4: Add table and blockquote styling**

Five MDX files contain raw markdown tables that currently render with
**no** styling at all, because no `table` component was ever defined.

```tsx
  table: (props) => (
    <div className="panel-breakout mt-6 overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-[0.9375rem] tabular-nums" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-sidebar-surface" {...props} />,
  th: (props) => (
    <th className="border-b border-line px-3 py-2.5 text-left font-mono text-xs font-semibold tracking-wide text-ink-muted uppercase" {...props} />
  ),
  td: (props) => (
    <td className="border-b border-line px-3 py-2.5 align-top text-foreground last:border-b-0" {...props} />
  ),
  tr: (props) => <tr className="even:bg-ground/60" {...props} />,
  blockquote: (props) => (
    <blockquote className="mt-5 max-w-[90ch] border-l-[3px] border-brand bg-brand-soft px-4 py-3 text-foreground" {...props} />
  ),
```

- [ ] **Step 5: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS. If a component test asserted the old serif class or the
old `1.09375rem` size, update the assertion to the new value — the spec
is the authority.

- [ ] **Step 6: Verify in the browser**

Playwright MCP, both themes, at 1440 and 1024: a lesson with tables
(`content/04-case-studies/parking-lot/lld.mdx`'s route) and one concept
lesson. Confirm the table has a header band, zebra rows, and scrolls
inside its own container while `document.documentElement.scrollWidth ===
clientWidth` stays true. Confirm no element renders in a serif face:

```js
() => [...document.querySelectorAll("p,h1,h2,li,td")]
  .map(el => getComputedStyle(el).fontFamily)
  .filter(f => /serif/i.test(f) && !/sans-serif/i.test(f))
```

Expected: `[]`.

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx app/globals.css lib/mdx-components.tsx
git commit -m "feat(design): move to Archivo/Source Sans type scale and style tables"
```

---

## Task 5: Diagram chrome — legend, paper canvas, fit-to-width

**Files:**
- Create: `components/lesson/DiagramLegend.tsx`, `components/lesson/DiagramLegend.test.tsx`
- Modify: `components/lesson/DiagramChrome.tsx`, `lib/use-pan-zoom.ts`
- Test: `components/lesson/DiagramLegend.test.tsx`

**Interfaces:**
- Consumes: `DiagramRole`, `DIAGRAM_DISPLAY` (Task 1); `roles` prop (Task 2); `--color-diagram-canvas` (Task 3).
- Produces: `<DiagramLegend roles={DiagramRole[]} />`; `usePanZoom()` gains `fitToWidth(container: HTMLElement | null, svg: SVGSVGElement | null): void`.

- [ ] **Step 1: Write the failing legend test**

```tsx
// components/lesson/DiagramLegend.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiagramLegend } from "./DiagramLegend";

describe("DiagramLegend", () => {
  it("renders one chip per role, labelled", () => {
    render(<DiagramLegend roles={["client", "service", "cache"]} />);
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Cache")).toBeInTheDocument();
  });

  it("renders nothing below two roles — a two-box diagram needs no legend", () => {
    const { container } = render(<DiagramLegend roles={["client"]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when roles is undefined", () => {
    const { container } = render(<DiagramLegend />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test components/lesson/DiagramLegend.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `DiagramLegend`**

```tsx
import { DIAGRAM_DISPLAY, type DiagramRole } from "@/lib/diagram-palette";

const ROLE_LABEL: Record<DiagramRole, string> = {
  client: "Client",
  network: "Network",
  service: "Service",
  cache: "Cache",
  datastore: "Datastore",
  queue: "Queue",
};

export function DiagramLegend({ roles }: { roles?: DiagramRole[] }) {
  if (!roles || roles.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {roles.map((role) => (
        <li key={role} className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-semibold tracking-wide text-ink-muted uppercase">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{
              backgroundColor: DIAGRAM_DISPLAY[role].fill,
              boxShadow: `inset 0 0 0 1.5px ${DIAGRAM_DISPLAY[role].stroke}`,
            }}
          />
          {ROLE_LABEL[role]}
        </li>
      ))}
    </ul>
  );
}
```

Inline `style` is correct here and is the documented exception to the
no-literal-hex rule: these values must match the SVG's baked-in colors
exactly and must not change with the theme.

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test components/lesson/DiagramLegend.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Add `fitToWidth` to `usePanZoom`**

Read `lib/use-pan-zoom.ts` first and follow its existing state shape.
Add, alongside `zoomIn`/`zoomOut`/`reset`:

```ts
  const fitToWidth = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      if (!container || !svg) return;
      const available = container.clientWidth;
      const intrinsic = svg.getBoundingClientRect().width / scale;
      if (!available || !intrinsic) return;
      // Never scale up past 1: a small diagram blown up to panel width
      // loses nothing by staying at its authored size, and blurs.
      setScale(Math.min(1, available / intrinsic));
    },
    [scale],
  );
```

Return it from the hook and add it to `UsePanZoomResult`.

- [ ] **Step 6: Update `DiagramChrome`**

Four changes, all inside the existing structure:

1. Render `<DiagramLegend roles={roles} />` directly under the `<h4>`
   title, for `type === "architecture"` and `type === "class"` only.
2. The scroll container gets the paper canvas and the taller cap:
   `className="origin-top-left max-h-[40rem] cursor-grab overflow-auto bg-diagram-canvas active:cursor-grabbing"`
   (was `max-h-[32rem]`, no background).
3. `DiagramToolbar` gains a fit-to-width button using the
   `Scan`/`MoveHorizontal` lucide icon, `aria-label="Fit to width"`,
   calling `panZoom.fitToWidth(scrollRef.current, svgRef.current)`. Add a
   `scrollRef` to the scroll container and capture the injected `<svg>`
   into an `svgRef` at the end of `injectDiagram`.
4. Keep `TYPE_ACCENT` but repoint it at the new tokens: architecture and
   state → `text-track-hld`, sequence → `text-track-lld`, class and er →
   `text-track-interview`.

Leave `injectDiagram`'s intrinsic-width logic, the `getBBox` scroll, and
the callback-ref fullscreen mount exactly as they are — all three carry
comments recording live-confirmed bugs.

- [ ] **Step 7: Run the suite**

Run: `pnpm test`
Expected: PASS, including the existing `DiagramPanel.test.tsx`.

- [ ] **Step 8: Verify in the browser — this is the task the whole plan exists for**

Playwright MCP, both themes, on a D2-heavy case-study lesson and on a
Mermaid lesson. Confirm by screenshot and by measurement:

```js
() => {
  const texts = [...document.querySelectorAll(".diagram-animate text, .diagram-animate .nodeLabel")];
  const sizes = texts.map(t => parseFloat(getComputedStyle(t).fontSize));
  return { count: texts.length, min: Math.min(...sizes) };
}
```

Expected: `min >= 15`. Then read the screenshots back and confirm: bold
dark labels on bright fills, legend chips match the node colors, the
canvas is light in dark mode while the panel frame is dark, fit-to-width
brings a wide diagram fully into view.

- [ ] **Step 9: Commit**

```bash
git add components/lesson lib/use-pan-zoom.ts
git commit -m "feat(design): add diagram legend, paper canvas, and fit-to-width"
```

---

## Task 6: Navigation chrome

**Files:**
- Modify: `lib/nav-icons.tsx`, `components/nav/SidebarNav.tsx`, `components/nav/Sidebar.tsx`, `components/nav/TopBar.tsx`, `components/lesson/TableOfContents.tsx`, `components/lesson/LessonShell.tsx`
- Test: `components/nav/Sidebar.test.tsx` (extend), `components/lesson/TableOfContents.test.tsx` (extend)

**Interfaces:**
- Consumes: track tokens (Task 3).
- Produces: `SECTION_TRACK: Record<string, string>` from `lib/nav-icons.tsx`, mapping a section title to its Tailwind track color class group.

- [ ] **Step 1: Add the track map**

```tsx
// lib/nav-icons.tsx — append
/** Tailwind class fragments per track, so the sidebar, homepage, and
 *  lesson header can all reach the same line color. Full class strings
 *  (not interpolated fragments) — Tailwind v4 only sees literals. */
export const SECTION_TRACK: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  "High-Level Design": { text: "text-track-hld", bg: "bg-track-hld/12", border: "border-track-hld" },
  "Low-Level Design": { text: "text-track-lld", bg: "bg-track-lld/12", border: "border-track-lld" },
  "Case Studies": { text: "text-track-case-studies", bg: "bg-track-case-studies/12", border: "border-track-case-studies" },
  "Interview Prep": { text: "text-track-interview", bg: "bg-track-interview/12", border: "border-track-interview" },
};

export const FALLBACK_TRACK = { text: "text-ink-muted", bg: "bg-line", border: "border-line" };
```

- [ ] **Step 2: Write the failing sidebar test**

Add to `components/nav/Sidebar.test.tsx`:

```tsx
it("gives each section an icon chip in its track color and a lesson count", () => {
  render(<SidebarNav sections={[{ title: "Low-Level Design", items: [
    { href: "/lld/a", label: "A" }, { href: "/lld/b", label: "B" },
  ] }]} />);
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByTestId("section-chip-Low-Level Design").className).toContain("bg-track-lld/12");
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm test components/nav/Sidebar.test.tsx`
Expected: FAIL — no such test id, no count rendered.

- [ ] **Step 4: Restyle `SidebarNav`**

- Section header: icon inside `<span data-testid={`section-chip-${section.title}`} className={cn("flex size-6 items-center justify-center rounded-md", track.bg)}>` with the icon in `track.text`; title in mono 12px uppercase `text-foreground`; a right-aligned count badge (`section.items.length`, or the sum across `section.groups`) in mono 11px `text-ink-muted`. Use `flex items-center gap-2` with the count pushed by `ml-auto`.
- Group list: `border-l-2` in `track.border` instead of `border-line` — this is the line rail.
- Active link: `bg-brand-soft font-semibold text-brand` (was `bg-brand/15 … text-foreground`); inactive keeps `text-ink-muted hover:bg-sidebar-surface hover:text-foreground`. Keep the existing `focus-visible` ring classes verbatim.
- `components/nav/Sidebar.tsx`: the rail becomes `bg-sidebar-surface` with the nav content in a `rounded-lg border border-line bg-surface p-3` card.

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm test components/nav`
Expected: PASS. `MobileNav.test.tsx` and `ThemeToggle.test.tsx` stay green.

- [ ] **Step 6: TopBar and lesson header**

- `TopBar.tsx`: `h-14 border-b border-line bg-surface`; wordmark in
  `font-display text-base font-bold tracking-tight text-brand`; replace the
  lucide `Network` icon with an inline 4-bar transit glyph:
  ```tsx
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
    {[2, 6, 10, 14].map((x, i) => (
      <rect key={x} x={x - 1} y={2 + i * 1.5} width="2" height={12 - i * 3} rx="1" fill="currentColor" />
    ))}
  </svg>
  ```
- `LessonShell.tsx`: title becomes `font-display text-[2.125rem] leading-[1.15] font-bold`, followed by
  `<div className="mt-3 h-[3px] w-12 rounded-full bg-brand" />`; the
  `<article>` sits in a `rounded-lg border border-line bg-surface p-6 lg:p-8` card.

- [ ] **Step 7: TOC reading progress**

In `TableOfContents.tsx`, keep the whole `updateActive` machinery
untouched (its comment records a live-confirmed IntersectionObserver
bug) and add, inside the same rAF-throttled callback, a scroll
percentage:

```tsx
  const [progress, setProgress] = useState(0);
```

```tsx
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.round((doc.scrollTop / scrollable) * 100)) : 0);
```

Render under the eyebrow:

```tsx
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="presentation">
        <div className="h-full rounded-full bg-brand transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
```

Active item: `border-brand font-semibold text-brand` (was
`text-foreground`).

Add to `TableOfContents.test.tsx`:

```tsx
it("renders a progress bar starting at zero width", () => {
  // …existing heading setup…
  expect(document.querySelector<HTMLElement>("[role=presentation] > div")!.style.width).toBe("0%");
});
```

- [ ] **Step 8: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS.

- [ ] **Step 9: Verify in the browser**

Playwright MCP, both themes, at 1440 / 1024 / 390. Confirm: four
distinguishable track colors in the sidebar, active lesson legible as
magenta-on-soft-magenta in both themes, TOC progress bar advances on
scroll, mobile nav still opens, and every nav link shows a visible
focus ring under keyboard Tab.

- [ ] **Step 10: Commit**

```bash
git add lib/nav-icons.tsx components/nav components/lesson/TableOfContents.tsx components/lesson/LessonShell.tsx components/lesson/TableOfContents.test.tsx
git commit -m "feat(design): give navigation per-track line colors and reading progress"
```

---

## Task 7: Homepage module cards

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `SECTION_TRACK`, `FALLBACK_TRACK` (Task 6).

- [ ] **Step 1: Apply track colors to the cards**

For each entry in the existing `MODULES` array, resolve
`SECTION_TRACK[module.title] ?? FALLBACK_TRACK` and apply:
- a `<div className={cn("h-[3px] w-full rounded-t-lg", track.border.replace("border-", "bg-"))} />`
  — no: use an explicit per-track literal `bg-track-*` class in the map
  instead of string surgery, since Tailwind v4 only sees literal classes.
  Extend `SECTION_TRACK` with a `rail: "bg-track-lld"` field and use that.
- the icon chip: `cn("flex size-9 items-center justify-center rounded-md", track.bg)` with the icon in `track.text` (replacing today's uniform `bg-brand/10 text-brand`).
- card: `rounded-lg border border-line bg-surface transition-shadow hover:shadow-md`, with a `text-brand` arrow that goes from `opacity-0` to `opacity-100` on `group-hover`/`group-focus-visible`.

- [ ] **Step 2: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Verify in the browser**

Playwright MCP: `/` in both themes at 1440 and 390. Four cards, four
distinct rail colors, hover elevation visible, arrow appears on keyboard
focus (not hover only).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx lib/nav-icons.tsx
git commit -m "feat(design): color homepage module cards by track"
```

---

## Task 8: Documentation alignment

**Files:**
- Modify: `CONTENT-GUIDE.md`, `docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md`

- [ ] **Step 1: Update `CONTENT-GUIDE.md`'s D2 color section**

- Reframe the role table: rename the "Fill"/"Stroke" columns to
  "Authored `style.fill` (semantic key)" and keep the existing hex
  values unchanged — authors keep writing `#0e7c86` for a service.
- Delete the "Mermaid dark-mode fill" column and the sentence about D2's
  output being static-but-legible-in-both-themes; replace with one
  paragraph: the authored hex is a semantic key, `lib/diagram-palette.ts`
  maps it to the bright display fill and dark bold label at render time,
  and the canvas is always light — with a pointer to the spec's §5.3.
- Keep the `font-color: "#ffffff"` rule and add *why* it is now
  load-bearing: the retint transform keys on it to find node labels.
- Keep the `style.shadow`/`stroke-width` chrome rule and the
  `border-radius`-on-connected-class-shapes warning verbatim.

- [ ] **Step 2: Add the supersession note**

At the top of `2026-08-26-nextjs-mdx-app-migration-design.md`, note that
its design-tokens, typography, and diagram-appearance sections are
superseded by `2026-08-27-visual-design-system-refresh-design.md`, and
that its component contracts and folder structure still stand.

- [ ] **Step 3: Commit**

```bash
git add CONTENT-GUIDE.md docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md
git commit -m "docs(design): align content guide and migration spec with the refresh"
```

---

## Task 9: Full verification sweep and cleanup

**Files:** none created; fixes land in whichever file the sweep implicates.

- [ ] **Step 1: Full build and suite**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all PASS. A build failure here is usually a `next/font` weight
that Archivo or Source Sans 3 does not publish — check the error text
before changing the spec's weights.

- [ ] **Step 2: Route sweep in both themes**

`pnpm dev`, then with Playwright MCP visit each of: `/`, one HLD concept
lesson, one LLD concept lesson, one case-study HLD lesson (D2-heavy), one
lesson still on `<DiagramPanel>` (Mermaid). For every route, force
`data-theme=light` then `data-theme=dark`, screenshot both, and read the
screenshots back. Record a pass/fail line per route per theme in the
task report.

- [ ] **Step 3: Run the polish assertions on each route**

```js
() => {
  const doc = document.documentElement;
  const tiny = [...document.querySelectorAll(".diagram-animate text, .diagram-animate .nodeLabel")]
    .filter(t => parseFloat(getComputedStyle(t).fontSize) < 15).length;
  const wide = [...document.querySelectorAll("body *")]
    .filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === "visible")
    .map(el => el.tagName + "." + el.className).slice(0, 5);
  return { noBodyOverflow: doc.scrollWidth === doc.clientWidth, tinyDiagramLabels: tiny, unexpectedlyWide: wide };
}
```

Expected on every route, both themes: `noBodyOverflow: true`,
`tinyDiagramLabels: 0`, `unexpectedlyWide: []`. Fix anything that fails
before proceeding — this step is the gate, not a report.

- [ ] **Step 4: Keyboard pass**

On one lesson route, Tab through topbar → sidebar → TOC → a `QuizItem`
option → the diagram toolbar buttons, screenshotting the focused state
each time. Every stop must show a visible magenta ring.

- [ ] **Step 5: Remove the scratch screenshots left in the repo root**

```bash
git status --porcelain
rm -f home-light.png home-light2.png home-light3.png lesson-light.png lesson-wide.png cache-tier-capped.png /tmp/cap.mjs
```

Confirm with `git status` that no stray PNG remains untracked.

- [ ] **Step 6: Commit any fixes from this sweep**

```bash
git add -A
git commit -m "fix(design): resolve issues found in the cross-route verification sweep"
```

---

## Self-Review

**Spec coverage.** §3 colors → Task 3. §4 typography → Task 4. §5.1 paper
canvas → Tasks 3 (token) + 5 (applied). §5.2 display palette → Task 1.
§5.3 semantic keys → Tasks 1-2. §5.4 legibility: label floor → Task 1
(transform) + 9 (assertion); `elk` → Task 2; legend → Task 5; panel
height and fit-to-width → Task 5; Mermaid parity → Task 3 Step 4. §6
layout: topbar/sidebar/TOC/lesson shell → Task 6; homepage → Task 7;
tables → Task 4 Step 4; focus → Tasks 6, 9. §7 docs → Task 8. §8
verification → every task's browser step plus Task 9.

**Type consistency.** `DiagramRole` is declared once in
`lib/diagram-palette.ts` (Task 1) and imported by `render-d2.ts`,
`D2Diagram.tsx`, `DiagramChrome.tsx`, and `DiagramLegend.tsx`. The
pre-existing duplicate `DiagramRole` in `lib/diagram-roles.ts` must
**re-export** the palette's type rather than declare its own — Task 3
Step 4 touches that file; make the change there. `RenderD2Result` gains
`roles` in Task 2 and every consumer is updated in the same task.
`UsePanZoomResult` gains `fitToWidth` in Task 5 Step 5 and is consumed in
Step 6 of the same task.

**Known sequencing constraint.** Task 3 deletes tokens that Tasks 5-7
would otherwise still reference, which is why Task 3 Step 2 repoints all
consumers in the same commit. Do not reorder Tasks 3 and 4 ahead of Tasks
1-2: the palette module is the type source for the render path.
