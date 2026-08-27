# Lesson Evolution Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the two new lesson components and the diagram interaction
changes, then rewrite both Parking Lot lessons onto the versioned
evolution spine.

**Architecture:** Phase 1 is infrastructure — a `<Stage>` marker and a
`<StackOptions>` table registered into the MDX component map, plus
`usePanZoom`/`DiagramChrome` changes that make zoom button-only and fit
diagrams to the panel on mount. Phase 2 and Phase 3 rewrite
`content/04-case-studies/parking-lot/hld.mdx` and `lld.mdx` against the
new section order, which depends on Phase 1's components existing.

**Tech Stack:** Next.js 16 (Turbopack, App Router), React 19, Tailwind
v4 (`@theme inline` tokens), MDX, D2 (server-rendered via
`lib/render-d2.ts`), Vitest + `@testing-library/react`, Playwright MCP
for live UI verification. Package manager: **pnpm**.

**Spec:** [docs/superpowers/specs/2026-08-27-lesson-evolution-format-design.md](../specs/2026-08-27-lesson-evolution-format-design.md)

**Authoring rules:** [CONTENT-GUIDE.md](../../../CONTENT-GUIDE.md) —
Phase 2 and Phase 3 tasks are graded against it, especially "The
evolution spine", "Text, tables, and code blocks", "Open-source and
cloud mapping", and the "Pre-ship checklist".

## Global Constraints

- **pnpm only.** `pnpm test`, `pnpm dev`, `pnpm lint`. Never `npm` or
  `yarn`.
- **Full test suite must stay green.** Baseline before this plan: 21
  test files, 54 tests passing.
- **Three-state theme cascade.** Any new color token is defined in all
  three blocks of `app/globals.css`: bare `:root` (light), the
  `@media (prefers-color-scheme: dark)` block guarded by
  `:root:not([data-theme="light"])`, and `:root[data-theme="dark"]`.
  Never style a component from inside a media or `[data-theme]` block.
- **No new color tokens unless unavoidable.** Reuse
  `--color-track-hld`, `--color-track-lld`, `--color-track-interview`,
  `--color-brand`, `--color-state-ok`, `--color-state-warn`,
  `--color-line`, `--color-card`, `--color-ground`,
  `--color-muted-foreground`.
- **Do not import `tw-animate-css` classes** (`animate-in`, `fade-in`,
  `slide-in-from-*`). The package is installed but never imported in
  `app/globals.css`, so those utilities are dead. Use CSS transitions.
- **UI verification is mandatory** for every task touching `app/`,
  `components/`, or rendering: drive the dev server with the Playwright
  MCP tools, in **both** `light` and `dark` themes, before marking the
  task done. Code review alone is never sufficient
  (`CLAUDE.md`, "UI verification").
- **Diagram authoring:** `direction: right` for architecture, class,
  and ER diagrams. `direction: down` only for sequence diagrams and
  lifecycle/state machines. Authored width budget ~1400px.
- **D2 node styling:** the six-role palette in `CONTENT-GUIDE.md` §"D2
  diagrams", every colored node paired with
  `style.font-color: "#ffffff"` (load-bearing — the retint transform
  keys on it), plus `style.shadow: true` and `style.stroke-width: 2`.
  Never add `style.border-radius` to a `shape: class` node with
  connected edges.
- **No raster images.** Every illustration is D2.
- **Auto-fit readability floor is `0.65`.** Verbatim from spec §5.3.
- **Commit style:** conventional commits (`feat(scope):`,
  `fix(scope):`, `docs(scope):`, `content(scope):`), a body explaining
  the *why*, and the trailer
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Never `git add -A` or `git add .`** — stage files by name.

## File Structure

| File | Responsibility | Phase |
|---|---|---|
| `components/lesson/Stage.tsx` | Create. Numbered version marker: chip + `h2` title + verdict line. | 1 |
| `components/lesson/Stage.test.tsx` | Create. Unit tests for `Stage`. | 1 |
| `components/lesson/StackOptions.tsx` | Create. Five-column OSS/AWS/GCP/when table. | 1 |
| `components/lesson/StackOptions.test.tsx` | Create. Unit tests for `StackOptions`. | 1 |
| `lib/mdx-components.tsx` | Modify. Register `Stage` and `StackOptions`. | 1 |
| `app/style-guide/page.tsx` | Modify. Add both components so they're visually verifiable in isolation. | 1 |
| `lib/use-pan-zoom.ts` | Modify. Remove wheel zoom; add `computeAutoFitScale`, `autoFit`, `resetToFit`, `userAdjusted` gate. | 1 |
| `lib/use-pan-zoom.test.ts` | Create. Unit tests for the clamp arithmetic and the gate. | 1 |
| `components/lesson/DiagramChrome.tsx` | Modify. Drop `onWheel` bindings; auto-fit on mount and on panel resize. | 1 |
| `components/lesson/DiagramChrome.test.tsx` | Modify. Add auto-fit and no-wheel-handler assertions. | 1 |
| `content/04-case-studies/parking-lot/CHECKLIST.md` | Modify. Re-derive against the new section order. | 2 |
| `content/04-case-studies/parking-lot/hld.mdx` | Rewrite. | 2 |
| `content/04-case-studies/parking-lot/lld.mdx` | Rewrite. | 3 |
| `content/04-case-studies/SYLLABUS.md` | Modify. Record the format retrofit against CS-03. | 3 |

---

# Phase 1 — Infrastructure

### Task 1: The `<Stage>` component

**Files:**
- Create: `components/lesson/Stage.tsx`
- Create: `components/lesson/Stage.test.tsx`
- Modify: `lib/mdx-components.tsx:1-17` (imports and the
  `mdxComponents` object)
- Modify: `app/style-guide/page.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (a `clsx` + `tailwind-merge`
  wrapper).
- Produces: `export function Stage(props: StageProps)` where
  ```ts
  interface StageProps {
    n: number;
    title: string;
    verdict: string;
    final?: boolean;
  }
  ```
  and `export function stageSlug(n: number, title: string): string`.
  Tasks 5–9 use `<Stage n={1} title="…" verdict="… ; …" />` in MDX.

**Why an `h2`:** `components/lesson/TableOfContents.tsx:21` collects
`h2[id]` only. Versions are top-level sections a reader wants to jump
to, so `Stage` renders a real `h2` carrying an `id`. It cannot rely on
`lib/mdx-components.tsx`'s `h2` override (that only applies to markdown
headings), so it reproduces those classes itself:
`mt-10 max-w-[90ch] scroll-mt-24 text-[1.625rem] leading-[1.25] font-semibold text-foreground`.

- [ ] **Step 1: Write the failing test**

Create `components/lesson/Stage.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stage, stageSlug } from "./Stage";

describe("stageSlug", () => {
  it("builds a stable id from the version number and title", () => {
    expect(stageSlug(2, "Availability service with counters")).toBe(
      "v2-availability-service-with-counters",
    );
  });

  it("strips punctuation and collapses runs of separators", () => {
    expect(stageSlug(3, "Redis + per-lot counters (finally!)")).toBe(
      "v3-redis-per-lot-counters-finally",
    );
  });
});

describe("Stage", () => {
  it("renders the version chip, title, and verdict as a linkable h2", () => {
    render(
      <Stage
        n={2}
        title="Cached availability"
        verdict="Fixes the read load on the ticket DB; adds a cache that can drift from it."
      />,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id", "v2-cached-availability");
    expect(heading).toHaveTextContent("Cached availability");
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Fixes the read load on the ticket DB; adds a cache that can drift from it.",
      ),
    ).toBeInTheDocument();
  });

  it("marks the accepted design without changing the heading contract", () => {
    render(
      <Stage
        n={4}
        title="Regional partitioning"
        verdict="Survives a region outage; doubles the operational surface."
        final
      />,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute(
      "id",
      "v4-regional-partitioning",
    );
    // The `final` variant is announced to assistive tech, not conveyed
    // by color alone.
    expect(screen.getByText("final design")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- Stage`
Expected: FAIL — `Failed to resolve import "./Stage"`.

- [ ] **Step 3: Write the implementation**

Create `components/lesson/Stage.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface StageProps {
  n: number;
  title: string;
  verdict: string;
  final?: boolean;
}

export function stageSlug(n: number, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `v${n}-${slug}`;
}

export function Stage({ n, title, verdict, final = false }: StageProps) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold tracking-wide uppercase",
            final
              ? "bg-state-ok text-ground"
              : "bg-track-hld/15 text-track-hld",
          )}
        >
          v{n}
        </span>
        {final && (
          <span className="font-mono text-xs font-semibold tracking-wide text-state-ok uppercase">
            final design
          </span>
        )}
      </div>
      {/* Renders a real h2 with an id so TableOfContents (which queries
          h2[id]) lists every version as a jumpable section. The classes
          are copied from lib/mdx-components.tsx's h2 override, which
          only applies to markdown headings and so can't be reused
          here. mt-0 because the wrapper above already carries mt-10. */}
      <h2
        id={stageSlug(n, title)}
        className="mt-2 max-w-[90ch] scroll-mt-24 text-[1.625rem] leading-[1.25] font-semibold text-foreground"
      >
        {title}
      </h2>
      <p className="mt-1.5 max-w-[90ch] text-[0.9375rem] leading-[1.6] text-muted-foreground">
        {verdict}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- Stage`
Expected: PASS, 4 tests.

- [ ] **Step 5: Register the component for MDX**

In `lib/mdx-components.tsx`, add the import after the `Point` import
(line 8) and the entry after `Point,` (line 17):

```tsx
import { Stage } from "@/components/lesson/Stage";
```

```tsx
  Stage,
```

- [ ] **Step 6: Add it to the style guide**

In `app/style-guide/page.tsx`, add a section rendering three stages —
a first version, a middle version, and a `final` one — so the
progression's visual weight can be judged in isolation:

```tsx
<Stage
  n={1}
  title="One server, one database"
  verdict="Correct to ~200 vehicles/day across two gates; a single failure takes the whole lot offline."
/>
<Stage
  n={2}
  title="Cached availability counters"
  verdict="Fixes the read load on the ticket DB; the cache can now drift from the source of truth."
/>
<Stage
  n={3}
  title="Availability service with reconciliation"
  verdict="Closes the drift window to one reconcile interval; adds an event pipeline to operate."
  final
/>
```

Import `Stage` from `@/components/lesson/Stage` at the top of the file.

- [ ] **Step 7: Verify in the browser, both themes**

Start the dev server if one isn't already running (`pnpm dev` — check
first, the repo often has one on port 3000), then with the Playwright
MCP tools:
1. `browser_navigate` to `http://localhost:3000/style-guide`.
2. Set the theme to `light`:
   `browser_evaluate` →
   `() => document.documentElement.setAttribute('data-theme','light')`.
3. `browser_take_screenshot` and read it back. Check: the chip is
   legible against its fill, the title outweighs the verdict, and the
   `final` chip is distinguishable from the numbered ones.
4. Repeat steps 2–3 with `'dark'`.
5. Fix anything illegible before continuing.

- [ ] **Step 8: Run the full suite and lint**

Run: `pnpm test && pnpm lint`
Expected: all tests pass (54 baseline + 4 new = 58), no lint errors.

- [ ] **Step 9: Commit**

```bash
git add components/lesson/Stage.tsx components/lesson/Stage.test.tsx lib/mdx-components.tsx app/style-guide/page.tsx
git commit -m "$(cat <<'EOF'
feat(lesson): add Stage component for versioned design sections

Four consecutive "### v2 — ..." headings make a design's evolution
invisible when skimming, which defeats the point of the evolution
spine. Stage renders a numbered chip, the version's defining change as
a linkable h2, and a required one-line verdict whose two halves (what
it buys; what it costs) mechanically enforce "every version states its
cost."

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: The `<StackOptions>` component

**Files:**
- Create: `components/lesson/StackOptions.tsx`
- Create: `components/lesson/StackOptions.test.tsx`
- Modify: `lib/mdx-components.tsx`
- Modify: `app/style-guide/page.tsx`

**Interfaces:**
- Consumes: nothing beyond React.
- Produces: `export function StackOptions(props: StackOptionsProps)`
  where
  ```ts
  interface StackOptionRow {
    component: string;
    oss: string;
    aws: string;
    gcp: string;
    when: string;
  }
  interface StackOptionsProps {
    title: string;
    rows: StackOptionRow[];
  }
  ```
  Every field is required — a row without a `when` judgment is the
  exact defect the component exists to prevent
  (`CONTENT-GUIDE.md`, "Open-source and cloud mapping").

**Pattern to follow:** `components/lesson/CompareTable.tsx` — same
`panel-breakout` wrapper, same `overflow-x-auto` + `min-w-` table so
the page body never scrolls sideways, same uppercase mono title bar.
Use `text-track-case-studies` for the title bar (CompareTable already
owns `text-state-warn`) so the two tables are distinguishable when both
appear in one lesson.

- [ ] **Step 1: Write the failing test**

Create `components/lesson/StackOptions.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StackOptions } from "./StackOptions";

describe("StackOptions", () => {
  it("renders every row across the open-source, AWS, GCP, and when columns", () => {
    render(
      <StackOptions
        title="Availability counters"
        rows={[
          {
            component: "In-memory counter store",
            oss: "Redis",
            aws: "ElastiCache for Redis",
            gcp: "Memorystore for Redis",
            when: "Managed earns its cost once you need HA failover you don't want to operate.",
          },
          {
            component: "Durable event log",
            oss: "Kafka",
            aws: "MSK",
            gcp: "Pub/Sub",
            when: "Self-host only if you already run Kafka for something else.",
          },
        ]}
      />,
    );

    expect(screen.getByText("Availability counters")).toBeInTheDocument();
    expect(screen.getByText("In-memory counter store")).toBeInTheDocument();
    expect(screen.getByText("Memorystore for Redis")).toBeInTheDocument();
    expect(screen.getByText("Durable event log")).toBeInTheDocument();
    expect(screen.getByText("Pub/Sub")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Self-host only if you already run Kafka for something else.",
      ),
    ).toBeInTheDocument();
  });

  it("gives the table an accessible name and a scoped header per column", () => {
    render(
      <StackOptions
        title="Ticket storage"
        rows={[
          {
            component: "Relational store",
            oss: "PostgreSQL",
            aws: "RDS for PostgreSQL",
            gcp: "Cloud SQL for PostgreSQL",
            when: "Managed from day one — nobody should hand-roll PITR backups.",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("table", { name: /Ticket storage/ }),
    ).toBeInTheDocument();
    for (const header of ["Component", "Open source", "AWS", "GCP", "When managed is worth it"]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- StackOptions`
Expected: FAIL — `Failed to resolve import "./StackOptions"`.

- [ ] **Step 3: Write the implementation**

Create `components/lesson/StackOptions.tsx`:

```tsx
interface StackOptionRow {
  component: string;
  oss: string;
  aws: string;
  gcp: string;
  when: string;
}

interface StackOptionsProps {
  title: string;
  rows: StackOptionRow[];
}

const COLUMNS = ["Component", "Open source", "AWS", "GCP", "When managed is worth it"] as const;

export function StackOptions({ title, rows }: StackOptionsProps) {
  const captionId = `stack-options-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;

  return (
    <div className="panel-breakout mt-6 overflow-x-auto rounded-lg border border-line bg-card shadow-sm">
      <p
        id={captionId}
        className="border-b border-line px-4 py-2 font-mono text-xs font-semibold tracking-wide text-track-case-studies uppercase"
      >
        Build vs buy — {title}
      </p>
      <table
        aria-labelledby={captionId}
        className="w-full min-w-[48rem] border-collapse text-left text-sm"
      >
        <thead>
          <tr className="border-b border-line text-xs font-semibold text-muted-foreground uppercase">
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className="px-4 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.component} className="border-b border-line align-top last:border-b-0">
              <th scope="row" className="px-4 py-3 text-left font-semibold text-foreground">
                {row.component}
              </th>
              <td className="px-4 py-3 text-foreground">{row.oss}</td>
              <td className="px-4 py-3 text-foreground">{row.aws}</td>
              <td className="px-4 py-3 text-foreground">{row.gcp}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- StackOptions`
Expected: PASS, 2 tests.

Note: the accessible-name test relies on `aria-labelledby` pointing at
the title paragraph. If `getByRole("table", { name: /Ticket storage/ })`
fails, the rendered title text is `Build vs buy — Ticket storage`, which
the regex still matches — check the `id`/`aria-labelledby` pair, not the
regex.

- [ ] **Step 5: Register the component for MDX**

In `lib/mdx-components.tsx`, add:

```tsx
import { StackOptions } from "@/components/lesson/StackOptions";
```

and `StackOptions,` to the `mdxComponents` object.

- [ ] **Step 6: Add it to the style guide**

In `app/style-guide/page.tsx`, render one `StackOptions` with two rows
(reuse the Redis and Kafka rows from the test) so the column widths can
be judged against a realistic `when` sentence.

- [ ] **Step 7: Verify in the browser, both themes**

With the Playwright MCP tools, at `/style-guide`, in `light` and then
`dark`:
1. Screenshot and read back. Check: the `when` column's longer text
   doesn't crush the four short columns; the title bar's
   `track-case-studies` color is legible on `bg-card`; the row header
   column reads as a header.
2. `browser_resize` to 640×900 and confirm the table scrolls inside its
   own container and the page body does **not** scroll horizontally:
   `browser_evaluate` →
   `() => document.body.scrollWidth <= document.documentElement.clientWidth`
   must be `true`.

- [ ] **Step 8: Run the full suite and lint**

Run: `pnpm test && pnpm lint`
Expected: 60 tests passing, no lint errors.

- [ ] **Step 9: Commit**

```bash
git add components/lesson/StackOptions.tsx components/lesson/StackOptions.test.tsx lib/mdx-components.tsx app/style-guide/page.tsx
git commit -m "$(cat <<'EOF'
feat(lesson): add StackOptions build-vs-buy table

Lessons name components generically ("a cache", "a message queue") with
no mapping to what you would actually run, which is the mapping a
working engineer needs and interviewers probe. Roughly 20 of these
tables will exist across the course, so a component fixes the column
order, the header wording, and — critically — the required "when
managed is worth it" judgment column that a hand-written markdown table
would quietly drop.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `usePanZoom` — button-only zoom and a clamped auto-fit

**Files:**
- Modify: `lib/use-pan-zoom.ts` (whole file — the exported interface
  changes)
- Create: `lib/use-pan-zoom.test.ts`

**Interfaces:**
- Consumes: nothing beyond React.
- Produces:
  ```ts
  export const MIN_AUTO_FIT_SCALE = 0.65;
  export function computeAutoFitScale(panelWidth: number, intrinsicWidth: number): number;
  export function intrinsicWidthOf(svg: SVGSVGElement): number;
  export interface UsePanZoomResult {
    transform: string;
    zoomIn: () => void;
    zoomOut: () => void;
    fitToWidth: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
    autoFit: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
    resetToFit: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
    bind: {
      onPointerDown: (e: React.PointerEvent) => void;
      onPointerMove: (e: React.PointerEvent) => void;
      onPointerUp: (e?: React.PointerEvent) => void;
    };
  }
  ```
  Task 4 consumes `autoFit`, `resetToFit`, and the `onWheel`-free
  `bind`. **`reset` is removed and replaced by `resetToFit`** — Task 4
  updates the only caller (`DiagramChrome`'s toolbar).

**Three behaviours being changed, and why:**

1. **`onWheel` deleted.** It called `e.preventDefault()` and mapped
   `deltaY` to scale, so scrolling the article with the cursor over a
   diagram zoomed the diagram instead of scrolling the page. Lessons
   are diagram-dense, so the cursor is over a diagram most of the time.
   With no handler the event bubbles and the page scrolls (spec §5.1).
2. **`autoFit` added, clamped to `[0.65, 1]`.** Diagrams currently
   mount at `scale: 1`, so anything wider than the panel opens cropped.
   The `0.65` floor exists because commit `0079b77` fixed D2 label text
   becoming unreadable when scaled to panel width, and auto-fitting
   reintroduces that exact pressure (spec §5.3).
3. **`userAdjusted` gate.** Task 4 re-fits on panel resize. Without a
   gate, a window resize (or a sidebar animating) would throw away a
   reader's deliberate zoom.

**Why measure width from `svg.style.width`:** the existing `fitToWidth`
divides `getBoundingClientRect().width` by the current `state.scale` to
recover the intrinsic width, which makes it depend on its own output
and puts `state.scale` in its dependency array.
`components/lesson/DiagramChrome.tsx:54-60` already sets
`svg.style.width` to the viewBox's intrinsic pixel width, so reading
that back is exact and scale-independent. Fall back to the `viewBox`
attribute for the Mermaid path, and return `0` (meaning "unknown, don't
fit") when the width is `100%`.

- [ ] **Step 1: Write the failing test**

Create `lib/use-pan-zoom.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  usePanZoom,
  computeAutoFitScale,
  intrinsicWidthOf,
  MIN_AUTO_FIT_SCALE,
} from "./use-pan-zoom";

function svgWithStyleWidth(px: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.width = px;
  return svg;
}

function panel(width: number): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "clientWidth", { value: width, configurable: true });
  return el;
}

describe("computeAutoFitScale", () => {
  it("leaves a diagram narrower than the panel at 1 rather than blowing it up", () => {
    expect(computeAutoFitScale(1200, 600)).toBe(1);
  });

  it("scales a wide diagram down to the panel width", () => {
    expect(computeAutoFitScale(900, 1200)).toBe(0.75);
  });

  it("never scales below the readability floor", () => {
    // 400/1200 is 0.33 — well past the point D2 labels stop being
    // readable, so it clamps and the panel keeps horizontal scroll.
    expect(computeAutoFitScale(400, 1200)).toBe(MIN_AUTO_FIT_SCALE);
  });

  it("returns exactly the floor when the fit lands on it", () => {
    expect(computeAutoFitScale(650, 1000)).toBe(MIN_AUTO_FIT_SCALE);
  });

  it("declines to fit when either measurement is missing", () => {
    expect(computeAutoFitScale(0, 1200)).toBe(1);
    expect(computeAutoFitScale(900, 0)).toBe(1);
  });
});

describe("intrinsicWidthOf", () => {
  it("reads the authored pixel width DiagramChrome sets", () => {
    expect(intrinsicWidthOf(svgWithStyleWidth("1440px"))).toBe(1440);
  });

  it("falls back to the viewBox when there is no pixel width", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 820 400");
    expect(intrinsicWidthOf(svg)).toBe(820);
  });

  it("reports 0 for a percentage width, which means do not fit", () => {
    expect(intrinsicWidthOf(svgWithStyleWidth("100%"))).toBe(0);
  });
});

describe("usePanZoom", () => {
  it("no longer binds a wheel handler, so the page scrolls over a diagram", () => {
    const { result } = renderHook(() => usePanZoom());
    expect("onWheel" in result.current.bind).toBe(false);
  });

  it("auto-fits a wide diagram on demand", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() => result.current.autoFit(panel(900), svgWithStyleWidth("1200px")));
    expect(result.current.transform).toBe("translate(0px, 0px) scale(0.75)");
  });

  it("stops auto-fitting once the reader has zoomed", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() => result.current.zoomIn());
    const afterZoom = result.current.transform;
    act(() => result.current.autoFit(panel(900), svgWithStyleWidth("1200px")));
    expect(result.current.transform).toBe(afterZoom);
  });

  it("resetToFit clears that gate and re-fits", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() => result.current.zoomIn());
    act(() => result.current.resetToFit(panel(900), svgWithStyleWidth("1200px")));
    expect(result.current.transform).toBe("translate(0px, 0px) scale(0.75)");

    // And auto-fit is live again afterwards.
    act(() => result.current.autoFit(panel(600), svgWithStyleWidth("1200px")));
    expect(result.current.transform).toBe("translate(0px, 0px) scale(0.65)");
  });

  it("fitToWidth is unclamped at the bottom — pressing it is an informed request", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() => result.current.fitToWidth(panel(400), svgWithStyleWidth("1200px")));
    expect(result.current.transform).toBe("translate(0px, 0px) scale(0.33)");
  });

  it("pans by the pointer delta while dragging", () => {
    const { result } = renderHook(() => usePanZoom());
    act(() => result.current.bind.onPointerDown({ clientX: 10, clientY: 10 } as React.PointerEvent));
    act(() => result.current.bind.onPointerMove({ clientX: 30, clientY: 25 } as React.PointerEvent));
    expect(result.current.transform).toBe("translate(20px, 15px) scale(1)");

    act(() => result.current.bind.onPointerUp());
    act(() => result.current.bind.onPointerMove({ clientX: 90, clientY: 90 } as React.PointerEvent));
    expect(result.current.transform).toBe("translate(20px, 15px) scale(1)");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- use-pan-zoom`
Expected: FAIL — `computeAutoFitScale`, `intrinsicWidthOf`,
`MIN_AUTO_FIT_SCALE`, `autoFit`, and `resetToFit` are not exported, and
`"onWheel" in bind` is currently `true`.

- [ ] **Step 3: Write the implementation**

Replace the whole of `lib/use-pan-zoom.ts` with:

```ts
"use client";

import { useCallback, useRef, useState } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.2;

/**
 * The lowest scale auto-fit will choose. Commit 0079b77 fixed D2 label
 * text becoming unreadable when a wide diagram was scaled down to panel
 * width; auto-fitting on mount reintroduces that exact pressure, so
 * auto-fit stops here and lets horizontal scroll (plus the expand
 * button) handle a diagram that still doesn't fit. A diagram that needs
 * less than this should be redrawn or split — see CONTENT-GUIDE.md's
 * "Diagram layout, size, and reading direction".
 */
export const MIN_AUTO_FIT_SCALE = 0.65;

interface PanZoomState {
  scale: number;
  x: number;
  y: number;
}

const INITIAL: PanZoomState = { scale: 1, x: 0, y: 0 };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampScale(scale: number): number {
  return round2(Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)));
}

/**
 * The diagram's authored width in CSS pixels, independent of the
 * current zoom. DiagramChrome sets svg.style.width to the viewBox's
 * intrinsic width precisely so it can be read back like this; deriving
 * it from getBoundingClientRect would make the result depend on the
 * scale being computed from it. Returns 0 — "unknown, don't fit" — for
 * a percentage width, which is the fallback DiagramChrome uses when a
 * diagram has no usable viewBox.
 */
export function intrinsicWidthOf(svg: SVGSVGElement): number {
  const fromStyle = Number.parseFloat(svg.style.width);
  if (svg.style.width.endsWith("px") && Number.isFinite(fromStyle) && fromStyle > 0) {
    return fromStyle;
  }
  const viewBox = svg.getAttribute("viewBox");
  const fromViewBox = viewBox ? Number(viewBox.split(/\s+/)[2]) : Number.NaN;
  return Number.isFinite(fromViewBox) && fromViewBox > 0 ? fromViewBox : 0;
}

/**
 * Never scales up past 1 (a small diagram blown up to panel width gains
 * nothing and blurs) and never below MIN_AUTO_FIT_SCALE. A missing
 * measurement yields 1, i.e. leave it alone.
 */
export function computeAutoFitScale(panelWidth: number, intrinsicWidth: number): number {
  if (!panelWidth || !intrinsicWidth) return 1;
  const raw = panelWidth / intrinsicWidth;
  return round2(Math.min(1, Math.max(MIN_AUTO_FIT_SCALE, raw)));
}

export interface UsePanZoomResult {
  transform: string;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToWidth: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
  autoFit: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
  resetToFit: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
  bind: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e?: React.PointerEvent) => void;
  };
}

export function usePanZoom(): UsePanZoomResult {
  const [state, setState] = useState<PanZoomState>(INITIAL);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // Set by every deliberate zoom control. DiagramChrome re-fits on
  // panel resize, and without this gate a window resize (or a sidebar
  // animating) would silently throw away a reader's chosen zoom.
  const userAdjusted = useRef(false);

  const zoomIn = useCallback(() => {
    userAdjusted.current = true;
    setState((s) => ({ ...s, scale: clampScale(s.scale + ZOOM_STEP) }));
  }, []);

  const zoomOut = useCallback(() => {
    userAdjusted.current = true;
    setState((s) => ({ ...s, scale: clampScale(s.scale - ZOOM_STEP) }));
  }, []);

  const fitToWidth = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      if (!container || !svg) return;
      const intrinsic = intrinsicWidthOf(svg);
      if (!container.clientWidth || !intrinsic) return;
      userAdjusted.current = true;
      // Deliberately unclamped at the bottom: pressing this button is an
      // informed request to see the whole diagram, however small.
      setState({ x: 0, y: 0, scale: round2(Math.min(1, container.clientWidth / intrinsic)) });
    },
    [],
  );

  const applyAutoFit = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      if (!container || !svg) return;
      const intrinsic = intrinsicWidthOf(svg);
      if (!intrinsic) return;
      setState({ x: 0, y: 0, scale: computeAutoFitScale(container.clientWidth, intrinsic) });
    },
    [],
  );

  const autoFit = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      if (userAdjusted.current) return;
      applyAutoFit(container, svg);
    },
    [applyAutoFit],
  );

  const resetToFit = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      userAdjusted.current = false;
      applyAutoFit(container, svg);
    },
    [applyAutoFit],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setState((s) => ({ ...s, x: s.x + dx, y: s.y + dy }));
  }, []);

  const onPointerUp = useCallback((_e?: React.PointerEvent) => {
    dragging.current = false;
  }, []);

  return {
    transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
    zoomIn,
    zoomOut,
    fitToWidth,
    autoFit,
    resetToFit,
    bind: { onPointerDown, onPointerMove, onPointerUp },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- use-pan-zoom`
Expected: PASS, 12 tests.

- [ ] **Step 5: Confirm the only other caller is Task 4's file**

Run: `grep -rn "usePanZoom\|\.reset\b" --include="*.tsx" --include="*.ts" components/ lib/ app/`
Expected: `usePanZoom` appears only in `lib/use-pan-zoom.ts`,
`lib/use-pan-zoom.test.ts`, and
`components/lesson/DiagramChrome.tsx`. `DiagramChrome` will still
reference the removed `reset` and `bind.onWheel` and so will fail
typechecking until Task 4 — that is expected, and is why Tasks 3 and 4
share one commit boundary. **Do not commit here.** Continue to Task 4.

---

### Task 4: `DiagramChrome` — fit on mount, re-fit on resize, no wheel zoom

**Files:**
- Modify: `components/lesson/DiagramChrome.tsx:87-127` (the toolbar) and
  `:187-274` (both scroll containers)
- Modify: `components/lesson/DiagramChrome.test.tsx`

**Interfaces:**
- Consumes: `autoFit`, `resetToFit`, `fitToWidth`, `zoomIn`, `zoomOut`,
  and the `onWheel`-free `bind` from Task 3.
- Produces: no new exports. `DiagramChrome`'s props are unchanged.

- [ ] **Step 1: Write the failing test**

Replace `components/lesson/DiagramChrome.test.tsx` with the version
below. It keeps the existing transform-placement test (which guards a
previously-fixed bug — a transform on the scroll container is
self-referential and never reveals more of a wide diagram) and adds the
new behaviour.

```tsx
import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiagramChrome } from "./DiagramChrome";

// jsdom has no ResizeObserver. DiagramChrome re-fits on panel resize,
// so it needs one to exist; this stub also lets a test fire a resize.
let resizeCallbacks: ResizeObserverCallback[] = [];

beforeAll(() => {
  resizeCallbacks = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function renderWide(intrinsicWidth = 1200, panelWidth = 900) {
  const view = render(
    <DiagramChrome
      title="Request flow"
      type="architecture"
      svgMarkup={`<svg viewBox="0 0 ${intrinsicWidth} 400"></svg>`}
    />,
  );
  const content = screen.getByRole("img", { name: "Request flow" });
  const scrollContainer = content.parentElement!;
  Object.defineProperty(scrollContainer, "clientWidth", {
    value: panelWidth,
    configurable: true,
  });
  return { ...view, content, scrollContainer };
}

describe("DiagramChrome", () => {
  it("applies the pan/zoom transform to the inner content div, not the overflow-auto scroll container", () => {
    const { content, scrollContainer } = renderWide();
    expect(content.className).not.toMatch(/overflow-auto/);
    expect(scrollContainer.className).toMatch(/overflow-auto/);
    expect(scrollContainer.style.transform).toBe("");
  });

  it("does not swallow the wheel event, so the article scrolls over a diagram", () => {
    const { scrollContainer } = renderWide();
    const wheel = new WheelEvent("wheel", {
      deltaY: -120,
      bubbles: true,
      cancelable: true,
    });
    scrollContainer.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it("fits a diagram wider than its panel once the panel is measurable", () => {
    const { content, scrollContainer } = renderWide(1200, 900);
    // The mount-time fit ran before clientWidth was stubbed, so drive
    // the resize path the ResizeObserver would have driven.
    resizeCallbacks.forEach((cb) =>
      cb([{ target: scrollContainer } as unknown as ResizeObserverEntry], {} as ResizeObserver),
    );
    expect(content.style.transform).toBe("translate(0px, 0px) scale(0.75)");
  });

  it("never auto-fits below the readability floor", () => {
    const { content, scrollContainer } = renderWide(1200, 400);
    resizeCallbacks.forEach((cb) =>
      cb([{ target: scrollContainer } as unknown as ResizeObserverEntry], {} as ResizeObserver),
    );
    expect(content.style.transform).toBe("translate(0px, 0px) scale(0.65)");
  });

  it("stops auto-fitting once the reader zooms, so a resize can't discard their choice", () => {
    const { content, scrollContainer } = renderWide(1200, 900);
    fireEvent.click(screen.getAllByRole("button", { name: "Zoom in" })[0]);
    const afterZoom = content.style.transform;
    resizeCallbacks.forEach((cb) =>
      cb([{ target: scrollContainer } as unknown as ResizeObserverEntry], {} as ResizeObserver),
    );
    expect(content.style.transform).toBe(afterZoom);
  });

  it("reset returns the diagram to its fitted scale, not to 1", () => {
    const { content, scrollContainer } = renderWide(1200, 900);
    fireEvent.click(screen.getAllByRole("button", { name: "Zoom in" })[0]);
    void scrollContainer;
    fireEvent.click(screen.getAllByRole("button", { name: "Reset zoom" })[0]);
    expect(content.style.transform).toBe("translate(0px, 0px) scale(0.75)");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- DiagramChrome`
Expected: FAIL — the wheel event is still `defaultPrevented`, no
auto-fit happens, and `panZoom.reset` no longer exists (a TypeScript
error from Task 3's interface change).

- [ ] **Step 3: Remove the wheel bindings**

In `components/lesson/DiagramChrome.tsx`, delete `onWheel={panZoom.bind.onWheel}`
from the inline scroll container (line ~208) and
`onWheel={fullscreenPanZoom.bind.onWheel}` from the fullscreen one
(line ~254). Leave the three pointer handlers on both.

- [ ] **Step 4: Rewire the toolbar's reset and fit buttons**

`DiagramToolbar` currently calls `panZoom.reset` with no arguments and
only renders the fit button when both refs are present. Both reset and
fit now need the container and svg, so make the refs required and route
reset through `resetToFit`:

```tsx
function DiagramToolbar({
  panZoom,
  scrollRef,
  svgRef,
  onExpand,
}: {
  panZoom: UsePanZoomResult;
  scrollRef: React.RefObject<HTMLElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onExpand?: () => void;
}) {
  return (
    <div className="absolute top-2 right-2 z-10 flex gap-1 rounded-md border border-line bg-card/90 p-1 backdrop-blur-sm">
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Zoom in" onClick={panZoom.zoomIn}>
        <Plus className="size-3.5" aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Zoom out" onClick={panZoom.zoomOut}>
        <Minus className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Reset zoom"
        onClick={() => panZoom.resetToFit(scrollRef.current, svgRef.current)}
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Fit to width"
        onClick={() => panZoom.fitToWidth(scrollRef.current, svgRef.current)}
      >
        <Scan className="size-3.5" aria-hidden="true" />
      </Button>
      {onExpand && (
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Expand diagram" onClick={onExpand}>
          <Maximize2 className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
```

Both call sites already pass `scrollRef` and `svgRef`, so neither
changes.

- [ ] **Step 5: Fit on mount and on panel resize**

In `DiagramChrome`, extend the existing injection effect (currently
lines 163-165) and add a resize observer. Place both after the existing
`svgMarkupRef` sync effect:

```tsx
  // Fit on mount: the SVG is injected at its authored pixel width (see
  // injectDiagram), so a diagram wider than the panel would otherwise
  // open cropped with the reader having to find the fit button.
  useEffect(() => {
    injectDiagram(containerRef.current, svgMarkup, svgRef);
    panZoom.autoFit(scrollRef.current, svgRef.current);
  }, [svgMarkup, panZoom]);

  // Re-fit when the panel's width changes — a window resize, or the
  // sidebar collapsing. autoFit is a no-op once the reader has touched
  // a zoom control, so this can't discard a deliberate zoom.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      panZoom.autoFit(scrollRef.current, svgRef.current);
    });
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [panZoom]);
```

Replace the existing `useEffect(() => { injectDiagram(...) }, [svgMarkup])`
with the first block above rather than adding a second injection.

For the fullscreen dialog, fit inside the existing callback ref — it
already fires exactly when the node attaches, which is the only moment
the fullscreen panel is measurable:

```tsx
  const setFullscreenContainer = useCallback(
    (node: HTMLDivElement | null) => {
      fullscreenContainerRef.current = node;
      if (node) {
        injectDiagram(node, svgMarkupRef.current, fullscreenSvgRef);
        fullscreenPanZoom.autoFit(fullscreenScrollRef.current, fullscreenSvgRef.current);
      }
    },
    [fullscreenPanZoom],
  );
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test -- DiagramChrome`
Expected: PASS, 6 tests.

If the mount-time fit fires an extra render loop, the symptom is a
React "Maximum update depth exceeded" error: `panZoom` is a new object
every render, so it must not be a dependency of an effect that also
sets pan/zoom state. If that happens, memoize the returned object in
`usePanZoom` with `useMemo` over `[state, ...callbacks]` — every
callback is already `useCallback`-stable, so the object only changes
when `state` does, which breaks the loop.

- [ ] **Step 7: Verify in the browser, both themes**

With the Playwright MCP tools against a real diagram-dense lesson:
1. `browser_navigate` to
   `http://localhost:3000/case-studies/ticketmaster/hld` (13 diagrams,
   several wide — the best stress case).
2. **Wheel no longer zooms.** `browser_evaluate` to record
   `window.scrollY`, hover a diagram with `browser_hover`, then
   `browser_press_key` `PageDown`, and confirm `window.scrollY`
   increased and the diagram's transform is unchanged.
3. **Fit on mount.** `browser_evaluate` →
   ```js
   () => Array.from(document.querySelectorAll('[data-diagram-type]')).map((f) => {
     const content = f.querySelector('[role="img"]');
     const scroll = content?.parentElement;
     return {
       transform: content?.getAttribute('style'),
       overflowing: scroll ? scroll.scrollWidth > scroll.clientWidth + 1 : null,
     };
   })
   ```
   Expected: every diagram either sits at `scale(1)` and does not
   overflow, or sits between `0.65` and `1`. A diagram at `0.65` that
   still overflows is acceptable (that is the floor doing its job) —
   note it, because it means that diagram is too wide and Phase 2/3
   should split it.
4. **Zoom survives resize.** Click "Zoom in" on the first diagram, then
   `browser_resize` to 900×900, then re-read the transform: the scale
   must be unchanged.
5. **Reset re-fits.** Click "Reset zoom" and confirm the scale returns
   to the fitted value, not to `1`.
6. Repeat 2–5 with `data-theme` set to `light` and to `dark`, and
   screenshot each so the toolbar's contrast on `bg-card/90` is
   confirmed in both.

- [ ] **Step 8: Run the full suite and lint**

Run: `pnpm test && pnpm lint`
Expected: all tests pass (60 from Tasks 1–2, plus 12 from Task 3, plus
the DiagramChrome file growing from 1 test to 6 = 77), no lint errors.

- [ ] **Step 9: Commit**

```bash
git add lib/use-pan-zoom.ts lib/use-pan-zoom.test.ts components/lesson/DiagramChrome.tsx components/lesson/DiagramChrome.test.tsx
git commit -m "$(cat <<'EOF'
fix(diagram): make zoom button-only and fit diagrams to the panel

Scrolling a lesson with the cursor over a diagram zoomed the diagram
instead of scrolling the page — and lessons are diagram-dense enough
that the cursor is over a diagram most of the time. Diagrams also
mounted at scale 1, so anything wider than the panel opened cropped
with no hint that a fit control existed.

Wheel handling is removed entirely (the event now bubbles and the page
scrolls); zoom is +/-/reset/fit/expand only, and drag-to-pan is
unchanged. Diagrams fit on mount and re-fit on panel resize, clamped to
a 0.65 floor so D2 label text stays readable — below that the panel
keeps horizontal scroll instead, which correctly signals a diagram
that should be split. A userAdjusted gate stops a resize from
discarding a reader's deliberate zoom, and reset now returns to the
fitted scale rather than to 1.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

# Phase 2 — Parking Lot HLD

Read before starting: `CLAUDE.md` ("Before writing any lesson",
"Writing the lesson"), `CONTENT-GUIDE.md` in full, and the format spec's
§3.1. The existing lesson is
`content/04-case-studies/parking-lot/hld.mdx` (787 lines) — it is a
source of researched material to reuse, not a structure to preserve.

### Task 5: Re-derive the Parking Lot checklist and research the gaps

**Files:**
- Modify: `content/04-case-studies/parking-lot/CHECKLIST.md`

**Interfaces:**
- Produces: the checklist Tasks 6–8 are graded against, and the named
  version list (v1…vN titles and verdicts) those tasks implement.

- [ ] **Step 1: Read what exists**

Read `content/04-case-studies/parking-lot/CHECKLIST.md` and
`content/04-case-studies/parking-lot/hld.mdx` end to end. List, in the
checklist's own commit message later, which existing sections carry
material worth keeping and which are being retired.

- [ ] **Step 2: Research the gaps the new format opens**

The new format needs material the old lesson never covered: the
build-vs-buy mappings, and the failure analysis per version. Per
`CLAUDE.md`, research before drafting. Use WebSearch/WebFetch for:
- Geospatial availability search at scale (how "lots near me with free
  spots" is actually served — PostGIS vs Redis geo vs a managed
  geospatial index).
- Counter drift and reconciliation patterns for cached availability
  counters.
- Offline-tolerant edge devices (a gate that must keep issuing tickets
  when the network is down) and reconciliation on reconnect.
- The AWS and GCP managed equivalents for: relational store, cache,
  event log/stream, object storage, API gateway, IoT/edge device
  connectivity, geospatial query.

Record the AWS and GCP service names you confirm — a wrong service name
is worse than an empty cell (`CONTENT-GUIDE.md`, "Open-source and cloud
mapping").

- [ ] **Step 3: Rewrite the checklist against the new section order**

Restructure `CHECKLIST.md` so its HLD side mirrors the format spec
§3.1, with a checkbox per required artifact. It must name, explicitly:
- The in-scope / out-of-scope boundary lines.
- The context illustration's actors and external dependencies.
- **The version list**: each version's number, title, and the
  two-part verdict. Draft these now so Tasks 6–8 implement a decided
  structure rather than inventing one. The expected shape, to be
  confirmed or corrected by the research in Step 2:

  | v | Title | Fixes | Costs |
  |---|---|---|---|
  | 1 | One facility, one server, one database | — | SPOF; one facility only |
  | 2 | Many facilities behind one API, with cached availability | Read load on the ticket DB; a single facility ceiling | The cache can drift from the source of truth |
  | 3 | Availability service with per-facility counters and reconciliation | Counter drift; the "lots near me" query | An event pipeline to operate and monitor |
  | 4 | Regional partitioning and offline-tolerant gates | A region outage; a gate cut off from the network | Doubled operational surface; reconciliation conflicts |

- One checkbox per deep dive, each naming the mechanism **and** its
  `<StackOptions>` table.
- The consolidated build-vs-buy table.
- The worked example's scenario, named concretely.
- Quiz coverage: one inline check per version transition, plus 5–8
  recap questions.

- [ ] **Step 4: Commit**

```bash
git add content/04-case-studies/parking-lot/CHECKLIST.md
git commit -m "$(cat <<'EOF'
docs(parking-lot): re-derive the checklist for the evolution format

The old checklist was written against the previous section order, so it
can't grade a lesson built on the versioned spine. Restructures the HLD
side around the four named versions, adds a checkbox per StackOptions
table, and records the confirmed AWS/GCP service names the build-vs-buy
tables will use.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Parking Lot HLD — problem statement through the evolution recap

**Files:**
- Modify: `content/04-case-studies/parking-lot/hld.mdx` (replace
  everything from the frontmatter through the end of the current
  architecture/deep-dive material with the new sections 1–6; leave the
  existing trade-offs, worked example, interview angle, and practice
  sections in place for now — Task 7 handles them)

**Interfaces:**
- Consumes: `<Stage>` and `<StackOptions>` from Tasks 1–2;
  `<D2Diagram>`, `<KeyStat>`, `<QuizItem>`, `<Point>` as already
  registered in `lib/mdx-components.tsx`; the version list from Task 5.
- Produces: sections 1–6 of the finished lesson. Task 7 appends
  sections 7–12 and must not renumber or retitle any `<Stage>`.

- [ ] **Step 1: Write the problem statement**

Per `CONTENT-GUIDE.md`, "The problem-statement illustration" and the
format spec §3.1.1:
- ≤5 sentences of prose framing why a *network* of parking facilities is
  a different problem from one facility (the LLD lesson owns the
  single-facility object model — link to `/case-studies/parking-lot/lld`
  rather than re-explaining it).
- A must-do / must-not-do bullet pair.
- An in-scope / out-of-scope markdown table.
- One `<D2Diagram type="architecture">` context illustration:
  `direction: right`, 4–6 nodes, drivers and gate hardware on the left,
  one "Parking network" box in the middle, payment provider and the
  driver's phone app on the right. Edges labelled with interactions
  ("parks a vehicle", "checks nearby availability"), not protocols. A
  caption stating the boundary in one sentence.

- [ ] **Step 2: Write requirements and scale**

- Functional and non-functional bullets.
- A capacity markdown table.
- The arithmetic in a ` ```text ` code block, per
  `CONTENT-GUIDE.md`'s "show arithmetic, never assert it". Use
  `<KeyStat>` for the one number the rest of the lesson turns on (peak
  availability reads/sec), with its `detail` prop carrying the working.

- [ ] **Step 3: Write v1 and its failure table**

```mdx
<Stage
  n={1}
  title="One facility, one server, one database"
  verdict="..."
/>
```

Then: a `direction: right` D2 architecture diagram (gates → app server
→ database, 4 nodes max); three bullets on how it works; the scale at
which it is genuinely correct, **with a number**; then a "Where v1
breaks" markdown table with columns *failure · what triggers it ·
symptom the driver sees*. A `<QuizItem>` immediately before that table
asking the reader to predict the first thing to break.

v1 must be defensible, not a straw man — see `CONTENT-GUIDE.md`, "v1
must be genuinely defensible". Do not editorialise about it being bad.

- [ ] **Step 4: Write v2, v3, and v4**

Each as the four-part unit: `<Stage>` → diagram → what it fixes (named
against the previous version's specific failure) → what it costs →
"what still breaks" table. Mark v4 `final`. One `<QuizItem>` per
transition.

Constraints from `CONTENT-GUIDE.md`, "Version count is discovered, not
targeted": if the research in Task 5 showed one of these versions isn't
forced by the requirements, cut it and mark the previous one `final`
rather than padding. If a version's "what it fixes" names two unrelated
problems, split it. Report either decision in the task's report rather
than making it silently.

- [ ] **Step 5: Write the evolution recap table**

One markdown table — *version · change · problem solved · new cost* —
each cell one line, readable without having read the section it
summarises, no cross-references.

- [ ] **Step 6: Check every diagram in the browser**

Start the dev server, then with the Playwright MCP tools navigate to
`http://localhost:3000/case-studies/parking-lot/hld`:
1. Screenshot each new diagram and read every label. Any label you
   cannot read at the default fitted zoom means the diagram is too wide
   or too dense — split it (`CONTENT-GUIDE.md`, "Check the fitted size,
   not the source").
2. `browser_console_messages` — expect no errors. A malformed SVG path
   error means a `border-radius` on a shape with connected edges
   (`CONTENT-GUIDE.md`, "D2 diagrams").
3. Confirm no diagram sits at `0.65` and still overflows, using the
   `browser_evaluate` snippet from Task 4 Step 7.3.
4. Repeat in both `light` and `dark`.

- [ ] **Step 7: Commit**

```bash
git add content/04-case-studies/parking-lot/hld.mdx
git commit -m "$(cat <<'EOF'
content(parking-lot): rebuild the HLD's design sections as versions

The lesson opened on the finished multi-facility architecture and
explained its parts, so a reader never saw why a single server stops
being the right answer — which is exactly the derivation an interview
asks for. Rebuilds the problem statement, requirements, and design as
four versions, each with its diagram, what it fixes, what it costs, and
what still breaks, closing with a standalone evolution recap table.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Parking Lot HLD — deep dives through practice

**Files:**
- Modify: `content/04-case-studies/parking-lot/hld.mdx` (sections 7–12)

**Interfaces:**
- Consumes: the version numbers and titles Task 6 committed — deep
  dives reference them ("the drift window v3 introduced").
- Produces: the finished HLD lesson.

- [ ] **Step 1: Write the deep dives**

One `###` section per mechanism the final version depends on, from the
Task 5 checklist. Each: 2–5 small D2 diagrams across the section (2–5
nodes each, `direction: right`), bullets and tables over prose, and a
closing `<StackOptions>` scoped to that mechanism. Per
`CONTENT-GUIDE.md`'s "More granular topic coverage", each deep dive
covers the 2–3 mechanisms a real interview would branch into, not one.

- [ ] **Step 2: Write the trade-offs section**

`<CompareTable>` for each decision where a competent engineer could
have gone the other way. Every row's `chosenBecause` names the
requirement that decided it.

- [ ] **Step 3: Write the consolidated build-vs-buy section**

One `<StackOptions>` covering every component named anywhere in the
lesson. Only services confirmed in Task 5's research. Where
self-hosting is the right answer, say so in the `when` column.

- [ ] **Step 4: Write the worked example**

One concrete scenario traced end to end — specific actors, specific
numbers — as a `<D2Diagram type="sequence">` (`direction: down` is
correct here; time flows down) plus a numbered walkthrough. Trace a
scenario that exercises the final version's interesting path: a driver
arriving at a facility whose cached counter is stale.

- [ ] **Step 5: Write the interview angle and practice sections**

Interview angle, then Practice & Self-Check: 5–8 `<QuizItem>` recap
questions (each answer carrying a "why"), one open design challenge
that extends rather than restates, a `<Rubric>` with independently
checkable items, and a `<SelfScoreBand>`. Follow
`CONTENT-GUIDE.md`'s quiz and self-check rules.

- [ ] **Step 6: Run the pre-ship checklist**

Walk `CONTENT-GUIDE.md`'s "Pre-ship checklist" item by item against the
finished lesson and record each as covered or explicitly cut.

- [ ] **Step 7: Run the completeness pass**

Walk `content/04-case-studies/parking-lot/CHECKLIST.md`'s HLD side item
by item. Mark each covered or flag it as dropped **out loud** — per
`CLAUDE.md`, report gaps rather than silently omitting them.

- [ ] **Step 8: Verify the whole page in the browser, both themes**

With the Playwright MCP tools at
`http://localhost:3000/case-studies/parking-lot/hld`:
1. Full-page screenshot in `light`, then `dark`.
2. Confirm the table of contents lists every `<Stage>` version (they
   render `h2[id]`, which is what `TableOfContents` collects) and that
   clicking one scrolls to it.
3. Confirm every `<StackOptions>` and `<CompareTable>` scrolls inside
   its own container with no horizontal scroll on the page body.
4. Tab through the page and confirm every `<QuizItem>` toggle and
   diagram control shows a visible focus ring.
5. `browser_console_messages` — no errors.
6. `browser_resize` to 640×900 and re-check items 3 and 5.

- [ ] **Step 9: Run the full suite and lint**

Run: `pnpm test && pnpm lint`
Expected: 77 tests passing, no lint errors. (MDX content has no unit
tests; this catches a broken component prop that would fail the build.)

- [ ] **Step 10: Commit**

```bash
git add content/04-case-studies/parking-lot/hld.mdx
git commit -m "$(cat <<'EOF'
content(parking-lot): finish the HLD's deep dives and build-vs-buy

Completes the HLD rewrite: deep dives on geospatial availability
search, counter drift and reconciliation, and offline-tolerant gates —
each closing with its own OSS/AWS/GCP mapping — plus the consolidated
build-vs-buy table, a worked example tracing a stale-counter arrival,
and the rebuilt practice section.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

# Phase 3 — Parking Lot LLD

### Task 8: Parking Lot LLD — problem statement through the version ladder

**Files:**
- Modify: `content/04-case-studies/parking-lot/CHECKLIST.md` (the LLD
  side)
- Modify: `content/04-case-studies/parking-lot/lld.mdx` (sections 1–7)

**Interfaces:**
- Consumes: `<Stage>`, `<StackOptions>`, `<D2Diagram>`, `<CompareTable>`.
- Produces: sections 1–7 of the finished LLD lesson. Task 9 appends
  8–15.

- [ ] **Step 1: Re-derive the checklist's LLD side**

Mirror the format spec §3.2, with the version list named up front:

| v | Title | Fixes | Costs |
|---|---|---|---|
| 1 | One class, one thread | — | Type switches; untestable fee math; O(n) spot scan; no lifecycle; unsafe under concurrent gates |
| 2 | Decomposed, with the patterns the defects force | Every v1 defect above | More classes to hold in your head; indirection through strategies |
| 3 | Thread-safe in one process | The double-allocation race between two gates | Lock contention on a single free-spot structure |
| 4 | Correct across processes | Two app servers allocating the same spot | Retry handling in every caller; an idempotency key to carry |

Commit the checklist change with the lesson in Step 8 — it is one
reviewable unit.

- [ ] **Step 2: Write the problem statement and the nouns table**

≤5 sentences; a D2 domain illustration (`direction: right`); a nouns
markdown table — *noun · becomes a class? · why / why not*. Keep the
existing lesson's strong material on over-modelling (a fee is not an
entity) — it is exactly the right content, in the right place.

- [ ] **Step 3: Write v1 as real code**

`<Stage n={1} …>`, then the naive implementation in a ` ```python `
or ` ```java ` block (match whatever language the existing lesson
uses — check `content/04-case-studies/parking-lot/lld.mdx` first and
stay consistent with it), 15–25 lines: a type switch on vehicle type,
inline fee arithmetic, a linear spot scan, no locking. Then a "Where v1
breaks" table naming the specific principle each defect violates and
its concrete maintenance cost.

- [ ] **Step 4: Write v2 — decompose for change**

The class split, plus only the patterns v1's defects actually force
(Strategy for pricing and for spot assignment, State for the spot
lifecycle, Factory for vehicle/spot construction, Observer for the
display board). One small `shape: class` D2 diagram per relationship —
never one diagram carrying the whole model. Each pattern section names
the v1 defect it removes. Per the global constraints, no
`style.border-radius` on a class shape with connected edges.

- [ ] **Step 5: Write v3 — one process, many threads**

- The double-allocation race as a `<D2Diagram type="sequence">`
  (`direction: down`), with two gates interleaved.
- The critical section in a code block, with the comment on the lock
  acquisition carrying the teaching.
- A markdown table comparing a global lock, a per-level lock, and a
  lock-free free-spot pool with compare-and-swap: *approach ·
  contention · correctness risk · complexity*.

- [ ] **Step 6: Write v4 — correct across processes**

Open with the explicit gate: "you only need this if …" followed by the
requirement that triggers it. Then:
- The conditional update in a ` ```sql ` block:
  `UPDATE spot SET status = 'OCCUPIED', version = version + 1 WHERE id = $1 AND status = 'FREE'`,
  and what `rowcount = 0` means to the caller.
- The optimistic `version` column and why it beats holding a
  transaction open across the gate's round trip.
- An idempotency key on ticket issue, and the exact failure it prevents
  (a gate retrying a timed-out request and issuing two tickets).
- A distributed lock **only** where genuinely required, with the
  sentence explaining why the conditional update covers the rest.
  Reaching for coordination the problem doesn't need is the
  most-penalised LLD interview mistake and the lesson must not model
  it.

- [ ] **Step 7: Verify the diagrams in the browser, both themes**

Same procedure as Task 6 Step 6, at
`http://localhost:3000/case-studies/parking-lot/lld`. Class diagrams
are the most likely to exceed the width budget — check each one's
fitted scale and split any that hits `0.65` and still overflows.

- [ ] **Step 8: Commit**

```bash
git add content/04-case-studies/parking-lot/CHECKLIST.md content/04-case-studies/parking-lot/lld.mdx
git commit -m "$(cat <<'EOF'
content(parking-lot): rebuild the LLD as a four-version ladder

The lesson jumped from class design to a thread-safe design without
walking the single-process to multi-threaded to multi-process
progression, so a reader never learned when distribution is actually
warranted — the judgment an LLD interview penalises hardest when it's
missing. Rebuilds it as v1 one class one thread, v2 decomposed with the
patterns each defect forces, v3 thread-safe in one process, v4 correct
across processes behind an explicit "you only need this if" gate.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Parking Lot LLD — API design, schema, and practice

**Files:**
- Modify: `content/04-case-studies/parking-lot/lld.mdx` (sections 8–15)
- Modify: `content/04-case-studies/SYLLABUS.md`

**Interfaces:**
- Consumes: v4's conditional update and idempotency key from Task 8 —
  the API section's idempotency column and the schema's `version`
  column must agree with them exactly.
- Produces: the finished LLD lesson.

- [ ] **Step 1: Write the API design section**

Per `CONTENT-GUIDE.md`, "LLD: API design":
- An endpoint markdown table: *method · path · request · response ·
  idempotent?*. Versioned paths (`/v1/`), resource-named
  (`POST /v1/lots/{lotId}/tickets`).
- One full request and response pair in ` ```json ` blocks, with real
  values.
- One error response with its status code and body — the `409 Conflict`
  a lost allocation race returns, and what the gate does next.

- [ ] **Step 2: Write the database design section's four movements**

Per `CONTENT-GUIDE.md`, "LLD: database design":
1. The naive single table in ` ```sql `, redundancy visible.
2. The normalization walk — 1NF, 2NF, 3NF, each naming the specific
   anomaly it removes *in this system* (e.g. the vehicle type's rate
   stored on every ticket row means a rate change rewrites history —
   the 2NF violation). Abstract normal-form definitions are not enough.
3. The cost of full normalization on this system's hottest query
   (availability per level), with the join it forces.
4. The final schema: 3NF plus the one deliberately denormalized
   free-spot counter, each denormalization justified by movement 3.
   As a `<D2Diagram type="er">` (`shape: sql_table` per entity, with
   `constraint: primary_key`/`foreign_key`) **and** the `CREATE TABLE`
   SQL.

Then: an index table (*index · the query it serves · why this column
order*); every constraint that enforces a requirement (the unique
constraint on active-ticket-per-spot is the real guard against the
race); and the isolation level the v4 conditional update assumes.

- [ ] **Step 3: Write the class-level evolution recap**

One markdown table: *version · what changed · principle or pattern
applied · cost*.

- [ ] **Step 4: Write trade-offs, build vs buy, worked example**

- `<CompareTable>` for the locking strategy and the SQL-vs-NoSQL
  decision.
- One consolidated `<StackOptions>`: relational store, connection
  pooler, cache, and — where an LLD lesson genuinely touches it — the
  managed equivalents. Keep it honest: if a component has no meaningful
  managed distinction, leave it out rather than padding the table.
- Worked example: the reserve-spot flow where the conditional update
  returns `rowcount = 0` and the caller retries, as a sequence diagram
  plus a numbered walkthrough.

- [ ] **Step 5: Write the interview angle and practice sections**

As Task 7 Step 5.

- [ ] **Step 6: Run the pre-ship checklist and the completeness pass**

`CONTENT-GUIDE.md`'s "Pre-ship checklist", then the LLD side of
`content/04-case-studies/parking-lot/CHECKLIST.md`. Report gaps out
loud.

- [ ] **Step 7: Verify the whole page in the browser, both themes**

Same procedure as Task 7 Step 8, at `/case-studies/parking-lot/lld`.
Additionally: confirm every ` ```sql `, ` ```json `, and code block
renders with a language-appropriate treatment and scrolls inside its
own container rather than widening the page body.

- [ ] **Step 8: Update the syllabus**

In `content/04-case-studies/SYLLABUS.md`, record against CS-03 that
both sides were rebuilt on the evolution format on 2026-08-27, and note
in the Progress section that the remaining 11 lesson files still use
the previous format and are queued for the same retrofit. Do not change
any status checkbox — CS-03 was already `[x]`.

- [ ] **Step 9: Run the full suite and lint**

Run: `pnpm test && pnpm lint`
Expected: 77 tests passing, no lint errors.

- [ ] **Step 10: Commit**

```bash
git add content/04-case-studies/parking-lot/lld.mdx content/04-case-studies/SYLLABUS.md
git commit -m "$(cat <<'EOF'
content(parking-lot): add the LLD's API and schema derivation

The schema arrived pre-normalized with no argument for it, and there
was no API surface at all — so a reader saw the answer without the
reasoning, and never saw what a lost allocation race returns to a
caller. Adds the endpoint table with an idempotency column, the four
schema movements (naive, the normalization walk naming this system's
own anomalies, the cost of full normalization on the availability
query, and the final schema with its one justified denormalization),
plus the index and constraint tables.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 11: Stop and report**

Both Parking Lot sides are done. Per spec §7, **stop here** — the
owner reviews both lessons before any other system is touched. Report:
which versions each lesson landed on (and any version cut or split, per
Task 6 Step 4), every checklist item flagged as dropped, and any
diagram that hit the `0.65` floor and still overflows.

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §2 evolution spine, four-part unit | Tasks 6, 8 (and `CONTENT-GUIDE.md`, already committed) |
| §3.1 HLD section order | Tasks 6, 7 |
| §3.2 LLD section order | Tasks 8, 9 |
| §3.3 inline checks at version boundaries | Task 6 Step 3–4, Task 8 |
| §4.1 `<Stage>` | Task 1 |
| §4.2 `<StackOptions>` | Task 2 |
| §5.1 wheel no longer zooms | Tasks 3, 4 |
| §5.2 fit by default, `userAdjusted` gate | Tasks 3, 4 |
| §5.3 the 0.65 floor | Task 3 (arithmetic), Task 4 (wiring) |
| §5.4 horizontal-first authoring | Global Constraints; enforced in Tasks 6–9 |
| §6 testing table | Every task's test and browser-verification steps |
| §7 rollout order | Phase order; Task 9 Step 11 is the stop |
| §8 scope boundaries | No task touches concept modules, adds a system, or migrates Mermaid |

**Type consistency:** `stageSlug(n, title)` is defined in Task 1 and
used only there. `computeAutoFitScale`, `intrinsicWidthOf`,
`MIN_AUTO_FIT_SCALE`, `autoFit`, `resetToFit` are defined in Task 3 and
consumed in Task 4 under exactly those names. `reset` is removed in
Task 3 and its only caller updated in Task 4 — Task 3 Step 5 flags the
intentional broken-build window between them. `StackOptionRow`'s five
required fields are used consistently in Tasks 2, 7, and 9.

**Known cross-task risk:** Tasks 3 and 4 leave the tree
non-typechecking between them, by design (the `reset` → `resetToFit`
rename). They must be executed back to back and are covered by one
commit. Do not review Task 3 as independently shippable.
