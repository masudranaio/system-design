# Visual & Readability Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the site's flat color/contrast, cramped typography, plain
sidebar, and colorless static diagrams — replace Mermaid's flat theme
with a colorful, subtly-animated, zoomable diagram engine, and ship the
three new scannable-content components (`CompareTable`, `KeyStat`,
`Point`) the content retrofit (a separate, non-SDD pass) will use.

**Architecture:** Six tasks in three waves. Wave 1 (Task 1) lands new
design tokens everything else reads. Wave 2 (Tasks 2-4) touches three
disjoint file sets in parallel — content components, diagram logic
(pure functions/hooks, no rendering yet), and nav layout — none of
which import from each other. Wave 3 (Task 5) wires the diagram logic
from Task 3 into `DiagramPanel`, then Task 6 is a full Playwright
verification pass. **The 6 existing case-study lessons' content
retrofit is explicitly out of scope for this plan** — it's
content-authoring work (research/rewrite against `CHECKLIST.md`, not
code with tests) and is tracked separately in `TRACKER.md`, dispatched
once this plan's components exist to write against.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, `@base-ui/react`
(shadcn scaffolds Base UI, Radix-compatible API), `mermaid` 11,
`lucide-react`, Vitest + React Testing Library + jsdom, pnpm.

**Spec:** [docs/superpowers/specs/2026-08-27-visual-and-readability-redesign-design.md](../specs/2026-08-27-visual-and-readability-redesign-design.md)

## Global Constraints

- pnpm exclusively — never npm/yarn (`pnpm test`, `pnpm build`, `pnpm dev`).
- No new dependencies. Build only against packages already in
  `package.json` (`mermaid`, `lucide-react`, `@base-ui/react`,
  `tailwind-merge`, `clsx`, `class-variance-authority`, `tw-animate-css`).
- TDD for every logic-bearing file (write failing test → verify fail →
  implement → verify pass → commit). CSS-token-only changes (Task 1) are
  the sole exception — no unit-testable behavior exists for them; they're
  verified via `pnpm build` and the Task 6 Playwright pass instead.
- Every existing test file must keep passing:
  `components/nav/Sidebar.test.tsx`, `components/lesson/{DiagramPanel,
  QuizItem,Rubric,SectionTracker,SelfScoreBand}.test.tsx`. No regressions.
- Both themes (light + `data-theme="dark"`) verified for every visual
  change, per `CLAUDE.md`'s UI verification rule — Task 6 is where this
  happens end-to-end; earlier tasks just need `pnpm build` clean.
- Reuse existing primitives (`components/ui/button.tsx`,
  `components/ui/dialog.tsx`) rather than adding new ones. Where a new
  primitive shape is genuinely needed (the mobile nav slide-over in
  Task 4), compose `@base-ui/react/dialog` directly, the same way
  `components/ui/dialog.tsx` already does — don't fight the existing
  `DialogContent`'s centered-modal classes.
- Git identity for this repo is already configured locally
  (`masud.cseian@gmail.com` / Masud Rana) — don't reconfigure it.

---

### Task 1: Design tokens & type scale

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: CSS custom properties `--color-accent-warn`,
  `--color-accent-info`, `--color-sidebar-surface` (light + dark, plus
  `@theme inline` Tailwind exposure as `accent-warn`, `accent-info`,
  `sidebar-surface` utility colors — e.g. `text-accent-warn`,
  `bg-sidebar-surface`, `border-accent-warn/40`); a `.panel-breakout`
  utility class; `body` font-size/line-height. Every later task that
  touches `app/globals.css` (Task 5) or references these Tailwind
  classes (Tasks 2, 4, 5) depends on this task landing first.

This task has no unit-testable behavior (it's CSS tokens) — skip the
TDD test/fail steps below and go straight to the edit, per Global
Constraints' stated exception.

- [ ] **Step 1: Add the two new accent tokens and darken `--color-ink-muted`, light mode**

In `app/globals.css`, inside the `:root { ... }` block (after
`--color-state-booked`):

```css
  --color-accent-warn: #b8722a;
  --color-accent-info: #5b4fbf;
  --color-sidebar-surface: #eef1f6;
```

Change the existing line:
```css
  --color-ink-muted: #4b5262;
```
to:
```css
  --color-ink-muted: #3a4051;
```

- [ ] **Step 2: Mirror the new tokens into both dark blocks**

In `app/globals.css`, inside `:root:not([data-theme="light"]) { @media
(prefers-color-scheme: dark) { ... } }` (after `--color-state-booked`):

```css
    --color-accent-warn: #e8a659;
    --color-accent-info: #9c93e0;
    --color-sidebar-surface: #10131a;
```

Add the identical three lines to the `:root[data-theme="dark"] { ... }`
block below it (this block must always mirror the media-query block
exactly — that's the existing pattern for every other dark-mode token).

- [ ] **Step 3: Expose the new tokens as Tailwind utilities**

In `app/globals.css`'s `@theme inline { ... }` block, after the existing
`--color-state-booked: var(--color-state-booked);` line:

```css
  --color-accent-warn: var(--color-accent-warn);
  --color-accent-info: var(--color-accent-info);
  --color-sidebar-surface: var(--color-sidebar-surface);
```

- [ ] **Step 4: Body type scale and the panel-breakout utility**

Change the existing `body { ... }` block to:

```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
  font-size: 1.09375rem;
  line-height: 1.7;
}
```

Then add, after the existing `h1, h2, ... { ... }` block at the bottom
of the file:

```css
.panel-breakout {
  width: 100%;
}

@media (min-width: 1024px) {
  .panel-breakout {
    max-width: 56rem;
    margin-left: 50%;
    transform: translateX(-50%);
  }
}
```

- [ ] **Step 5: Verify**

Run: `pnpm build`
Expected: clean build, same warnings as before this change (the two
pre-existing dynamic-fs-tracing advisories), no new errors.

Run: `pnpm test`
Expected: all existing tests still pass (this task doesn't touch any
component, so nothing should change).

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "Add accent-warn/accent-info/sidebar-surface tokens and body type scale"
```

---

### Task 2: Scannable-content components — `CompareTable`, `KeyStat`, `Point`

**Files:**
- Create: `components/lesson/CompareTable.tsx`
- Create: `components/lesson/CompareTable.test.tsx`
- Create: `components/lesson/KeyStat.tsx`
- Create: `components/lesson/KeyStat.test.tsx`
- Create: `components/lesson/Point.tsx`
- Create: `components/lesson/Point.test.tsx`
- Modify: `lib/mdx-components.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (already used throughout the repo,
  e.g. `components/nav/SidebarNav.tsx`); Tailwind classes `text-accent-warn`,
  `bg-brand/5`, `border-l-brand`, `.panel-breakout` from Task 1 — this
  task can be implemented and its own tests will pass without Task 1,
  but visually depends on it, so don't dispatch before Task 1 is merged.
- Produces: `CompareTable({ title, rows }: { title: string; rows: {
  approach: string; pros: string[]; cons: string[]; chosenBecause?:
  string }[] })`, `KeyStat({ value, label, detail }: { value: string;
  label: string; detail?: string })`, `Point({ icon, children }: { icon:
  "database"|"cache"|"service"|"network"|"lock"|"clock"|"users"|"shield"|
  "branch"|"layers"; children: React.ReactNode })` — all three exported
  and registered by name in `lib/mdx-components.tsx`'s `mdxComponents`
  object (Task 5's `DiagramPanel` does not depend on any of these three).

- [ ] **Step 1: Write the failing test for `CompareTable`**

```tsx
// components/lesson/CompareTable.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompareTable } from "./CompareTable";

describe("CompareTable", () => {
  it("renders every approach with its pros, cons, and the chosen reason", () => {
    render(
      <CompareTable
        title="Optimistic vs. pessimistic locking"
        rows={[
          {
            approach: "Optimistic locking",
            pros: ["No held connections", "Scales under low contention"],
            cons: ["Wasted work on conflict"],
            chosenBecause: "Seat holds are short-lived, conflicts are rare",
          },
          {
            approach: "Pessimistic locking",
            pros: ["No wasted work"],
            cons: ["Holds a DB connection for the lock's duration"],
          },
        ]}
      />,
    );

    expect(
      screen.getByText("Optimistic vs. pessimistic locking"),
    ).toBeInTheDocument();
    expect(screen.getByText("Optimistic locking")).toBeInTheDocument();
    expect(screen.getByText("Pessimistic locking")).toBeInTheDocument();
    expect(screen.getByText("No held connections")).toBeInTheDocument();
    expect(
      screen.getByText("Wasted work on conflict"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Seat holds are short-lived, conflicts are rare"),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `pnpm test CompareTable`
Expected: FAIL — `Cannot find module './CompareTable'`

- [ ] **Step 3: Implement `CompareTable`**

```tsx
// components/lesson/CompareTable.tsx
import { cn } from "@/lib/utils";

interface CompareRow {
  approach: string;
  pros: string[];
  cons: string[];
  chosenBecause?: string;
}

interface CompareTableProps {
  title: string;
  rows: CompareRow[];
}

export function CompareTable({ title, rows }: CompareTableProps) {
  return (
    <div className="panel-breakout mt-6 overflow-x-auto rounded-lg border border-line bg-card shadow-sm">
      <p className="border-b border-line px-4 py-2 font-mono text-xs font-semibold tracking-wide text-accent-warn uppercase">
        {title}
      </p>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs font-semibold text-muted-foreground uppercase">
            <th scope="col" className="px-4 py-2">
              Approach
            </th>
            <th scope="col" className="px-4 py-2">
              Pros
            </th>
            <th scope="col" className="px-4 py-2">
              Cons
            </th>
            <th scope="col" className="px-4 py-2">
              Chosen because
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.approach}
              className={cn(
                "border-b border-line align-top last:border-b-0",
                row.chosenBecause && "border-l-2 border-l-brand bg-brand/5",
              )}
            >
              <th
                scope="row"
                className="px-4 py-3 font-mono text-sm font-semibold text-foreground"
              >
                {row.approach}
              </th>
              <td className="px-4 py-3 text-foreground">
                <ul className="list-disc pl-4">
                  {row.pros.map((pro) => (
                    <li key={pro}>{pro}</li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3 text-foreground">
                <ul className="list-disc pl-4">
                  {row.cons.map((con) => (
                    <li key={con}>{con}</li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.chosenBecause ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `pnpm test CompareTable`
Expected: PASS

- [ ] **Step 5: Write the failing test for `KeyStat`**

```tsx
// components/lesson/KeyStat.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyStat } from "./KeyStat";

describe("KeyStat", () => {
  it("renders the value and label, and puts the detail behind a disclosure", () => {
    render(
      <KeyStat
        value="500K QPS"
        label="Peak reservation traffic, Prime Day"
        detail="2,000 events/sec baseline × ~15x read amplification × ~17x Prime-Day spike ≈ 500K"
      />,
    );

    expect(screen.getByText("500K QPS")).toBeInTheDocument();
    expect(
      screen.getByText("Peak reservation traffic, Prime Day"),
    ).toBeInTheDocument();
    expect(screen.getByText("Show the math")).toBeInTheDocument();
    expect(
      screen.getByText(/2,000 events\/sec baseline/),
    ).toBeInTheDocument();
  });

  it("renders without a disclosure when no detail is given", () => {
    render(<KeyStat value="99.99%" label="Availability SLO" />);
    expect(screen.queryByText("Show the math")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run it, verify it fails**

Run: `pnpm test KeyStat`
Expected: FAIL — `Cannot find module './KeyStat'`

- [ ] **Step 7: Implement `KeyStat`**

```tsx
// components/lesson/KeyStat.tsx
interface KeyStatProps {
  value: string;
  label: string;
  detail?: string;
}

export function KeyStat({ value, label, detail }: KeyStatProps) {
  return (
    <div className="mt-6 flex flex-col gap-1 rounded-lg border border-line bg-card p-4 shadow-sm sm:flex-row sm:items-baseline sm:gap-4">
      <p className="font-mono text-2xl font-semibold text-brand">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {detail && (
        <details className="mt-2 w-full text-sm text-muted-foreground sm:mt-0 sm:ml-auto sm:w-auto">
          <summary className="cursor-pointer font-mono text-xs font-semibold tracking-wide text-brand uppercase">
            Show the math
          </summary>
          <p className="mt-2 max-w-prose">{detail}</p>
        </details>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Run it, verify it passes**

Run: `pnpm test KeyStat`
Expected: PASS

- [ ] **Step 9: Write the failing test for `Point`**

```tsx
// components/lesson/Point.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Point } from "./Point";

describe("Point", () => {
  it("renders its text with a role='listitem' wrapper and an icon", () => {
    render(
      <Point icon="database">
        Seat inventory lives in Postgres, the single source of truth.
      </Point>,
    );

    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent(
      "Seat inventory lives in Postgres, the single source of truth.",
    );
    expect(item.querySelector("svg")).not.toBeNull();
  });
});
```

- [ ] **Step 10: Run it, verify it fails**

Run: `pnpm test Point`
Expected: FAIL — `Cannot find module './Point'`

- [ ] **Step 11: Implement `Point`**

```tsx
// components/lesson/Point.tsx
import {
  Database,
  Zap,
  Server,
  Globe,
  Lock,
  Clock,
  Users,
  ShieldCheck,
  GitBranch,
  Layers,
  type LucideIcon,
} from "lucide-react";

const POINT_ICONS = {
  database: Database,
  cache: Zap,
  service: Server,
  network: Globe,
  lock: Lock,
  clock: Clock,
  users: Users,
  shield: ShieldCheck,
  branch: GitBranch,
  layers: Layers,
} satisfies Record<string, LucideIcon>;

interface PointProps {
  icon: keyof typeof POINT_ICONS;
  children: React.ReactNode;
}

export function Point({ icon, children }: PointProps) {
  const Icon = POINT_ICONS[icon];
  return (
    <div className="mt-2 flex items-start gap-2 first:mt-0" role="listitem">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
      <p className="text-foreground">{children}</p>
    </div>
  );
}
```

- [ ] **Step 12: Run it, verify it passes**

Run: `pnpm test Point`
Expected: PASS

- [ ] **Step 13: Register the three components and apply the type scale in `mdx-components.tsx`**

Replace the full contents of `lib/mdx-components.tsx` with:

```tsx
import type { MDXComponents } from "mdx/types";
import { DiagramPanel } from "@/components/lesson/DiagramPanel";
import { QuizItem } from "@/components/lesson/QuizItem";
import { Rubric } from "@/components/lesson/Rubric";
import { SectionTracker } from "@/components/lesson/SectionTracker";
import { CompareTable } from "@/components/lesson/CompareTable";
import { KeyStat } from "@/components/lesson/KeyStat";
import { Point } from "@/components/lesson/Point";

export const mdxComponents: MDXComponents = {
  DiagramPanel,
  QuizItem,
  Rubric,
  SectionTracker,
  CompareTable,
  KeyStat,
  Point,
  h2: (props) => (
    <h2
      className="mt-8 text-[1.5rem] leading-[1.3] font-semibold text-foreground"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-6 text-[1.25rem] leading-[1.35] font-semibold text-foreground"
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      className="mt-5 text-[1.0625rem] leading-[1.4] font-semibold text-foreground"
      {...props}
    />
  ),
  p: (props) => (
    <p className="mt-4 text-[1.09375rem] leading-[1.7] text-foreground" {...props} />
  ),
  ul: (props) => (
    <ul className="mt-4 list-disc pl-6 text-foreground" {...props} />
  ),
  ol: (props) => (
    <ol className="mt-4 list-decimal pl-6 text-foreground" {...props} />
  ),
  li: (props) => <li className="mt-1" {...props} />,
  code: (props) => (
    <code
      className="rounded bg-card px-1 py-0.5 font-mono text-sm"
      {...props}
    />
  ),
  a: (props) => <a className="text-brand underline" {...props} />,
};
```

- [ ] **Step 14: Verify nothing broke**

Run: `pnpm test`
Expected: all tests pass, including the three new files.

Run: `pnpm build`
Expected: clean build.

- [ ] **Step 15: Commit**

```bash
git add components/lesson/CompareTable.tsx components/lesson/CompareTable.test.tsx \
  components/lesson/KeyStat.tsx components/lesson/KeyStat.test.tsx \
  components/lesson/Point.tsx components/lesson/Point.test.tsx \
  lib/mdx-components.tsx
git commit -m "Add CompareTable, KeyStat, and Point scannable-content components"
```

---

### Task 3: Diagram role classifier and pan/zoom hook

**Files:**
- Create: `lib/diagram-roles.ts`
- Create: `lib/diagram-roles.test.ts`
- Create: `lib/use-pan-zoom.ts`
- Create: `lib/use-pan-zoom.test.ts`

**Interfaces:**
- Produces: `classifyNodeRole(label: string): DiagramRole | null` and
  `applyDiagramRoleClasses(svg: SVGSVGElement): void` from
  `lib/diagram-roles.ts`; `usePanZoom(): UsePanZoomResult` from
  `lib/use-pan-zoom.ts`, where `UsePanZoomResult` is `{ transform:
  string; zoomIn(): void; zoomOut(): void; reset(): void; bind: {
  onWheel, onPointerDown, onPointerMove, onPointerUp } }`. Task 5's
  `DiagramPanel` imports both directly by these names — do not rename
  without updating Task 5.
- This task is pure logic (a classifier function and a React hook) —
  no rendering, no `DiagramPanel` changes. It doesn't touch mermaid at
  all.

- [ ] **Step 1: Write the failing tests for `diagram-roles.ts`**

```ts
// lib/diagram-roles.test.ts
import { describe, it, expect } from "vitest";
import { classifyNodeRole, applyDiagramRoleClasses } from "./diagram-roles";

describe("classifyNodeRole", () => {
  it("classifies known role keywords case-insensitively", () => {
    expect(classifyNodeRole("Redis seat-hold cache")).toBe("cache");
    expect(classifyNodeRole("Postgres booking DB")).toBe("datastore");
    expect(classifyNodeRole("API Gateway")).toBe("network");
    expect(classifyNodeRole("Mobile client")).toBe("client");
    expect(classifyNodeRole("Notification Service")).toBe("service");
    expect(classifyNodeRole("Kafka events queue")).toBe("queue");
  });

  it("returns null for a label matching no known role", () => {
    expect(classifyNodeRole("Seat C12")).toBeNull();
  });

  it("prefers a specific role over the generic 'service' catch-all", () => {
    expect(classifyNodeRole("Cache service")).toBe("cache");
  });
});

describe("applyDiagramRoleClasses", () => {
  it("adds a diagram-role-* class only to nodes whose label matches a known role", () => {
    document.body.innerHTML = `
      <svg>
        <g class="node"><text>Redis Cache</text></g>
        <g class="node"><text>Seat Inventory Service</text></g>
        <g class="node"><text>Seat C12</text></g>
      </svg>
    `;
    const svg = document.querySelector("svg")!;
    applyDiagramRoleClasses(svg);

    const groups = svg.querySelectorAll("g.node");
    expect(groups[0].classList.contains("diagram-role-cache")).toBe(true);
    expect(groups[1].classList.contains("diagram-role-service")).toBe(true);
    expect(groups[2].classList.length).toBe(1); // only "node", nothing added
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `pnpm test diagram-roles`
Expected: FAIL — `Cannot find module './diagram-roles'`

- [ ] **Step 3: Implement `diagram-roles.ts`**

```ts
// lib/diagram-roles.ts
export type DiagramRole =
  | "client"
  | "network"
  | "service"
  | "cache"
  | "datastore"
  | "queue";

const ROLE_KEYWORDS: Record<DiagramRole, RegExp> = {
  cache: /\b(cache|redis)\b/i,
  datastore: /\b(db|database|sql|dynamo|store|inventory)\b/i,
  queue: /\b(queue|kafka|sqs|mq|topic)\b/i,
  network: /\b(cdn|gateway|load balancer|lb|waiting room)\b/i,
  client: /\b(client|browser|mobile|app|user)\b/i,
  service: /\b(service|worker|handler)\b/i,
};

// Order matters: more specific roles are checked before the generic
// "service" catch-all, so e.g. "Cache service" reads as cache, not service.
const ROLE_PRIORITY: DiagramRole[] = [
  "cache",
  "datastore",
  "queue",
  "network",
  "client",
  "service",
];

export function classifyNodeRole(label: string): DiagramRole | null {
  for (const role of ROLE_PRIORITY) {
    if (ROLE_KEYWORDS[role].test(label)) return role;
  }
  return null;
}

/**
 * Adds a `diagram-role-<role>` class to every rendered Mermaid node
 * whose text label matches a known role keyword. Additive only — a
 * node matching nothing keeps the theme's default color, so this
 * degrades gracefully on any diagram without requiring per-lesson
 * authoring.
 */
export function applyDiagramRoleClasses(svg: SVGSVGElement): void {
  const nodes = svg.querySelectorAll<SVGGElement>("g.node");
  nodes.forEach((node) => {
    const label = node.textContent?.trim() ?? "";
    if (!label) return;
    const role = classifyNodeRole(label);
    if (role) node.classList.add(`diagram-role-${role}`);
  });
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `pnpm test diagram-roles`
Expected: PASS

- [ ] **Step 5: Write the failing tests for `use-pan-zoom.ts`**

```ts
// lib/use-pan-zoom.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanZoom } from "./use-pan-zoom";

describe("usePanZoom", () => {
  it("zooms in and out within clamped bounds, and resets", () => {
    const { result } = renderHook(() => usePanZoom());
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");

    act(() => result.current.zoomIn());
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1.2)");

    act(() => {
      for (let i = 0; i < 20; i++) result.current.zoomIn();
    });
    expect(result.current.transform).toBe("translate(0px, 0px) scale(3)"); // clamped to MAX_SCALE

    act(() => {
      for (let i = 0; i < 20; i++) result.current.zoomOut();
    });
    expect(result.current.transform).toBe("translate(0px, 0px) scale(0.5)"); // clamped to MIN_SCALE

    act(() => result.current.reset());
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
  });

  it("pans while dragging and stops panning after pointer up", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() =>
      result.current.bind.onPointerDown(
        { clientX: 0, clientY: 0 } as React.PointerEvent,
      ),
    );
    act(() =>
      result.current.bind.onPointerMove(
        { clientX: 10, clientY: 5 } as React.PointerEvent,
      ),
    );
    expect(result.current.transform).toBe("translate(10px, 5px) scale(1)");

    act(() => result.current.bind.onPointerUp());
    act(() =>
      result.current.bind.onPointerMove(
        { clientX: 999, clientY: 999 } as React.PointerEvent,
      ),
    );
    expect(result.current.transform).toBe("translate(10px, 5px) scale(1)"); // unchanged
  });

  it("zooms on wheel, in on scroll-up and out on scroll-down", () => {
    const { result } = renderHook(() => usePanZoom());
    const preventDefault = () => {};

    act(() =>
      result.current.bind.onWheel(
        { deltaY: -100, preventDefault } as React.WheelEvent,
      ),
    );
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1.2)");

    act(() =>
      result.current.bind.onWheel(
        { deltaY: 100, preventDefault } as React.WheelEvent,
      ),
    );
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
  });
});
```

- [ ] **Step 6: Run it, verify it fails**

Run: `pnpm test use-pan-zoom`
Expected: FAIL — `Cannot find module './use-pan-zoom'`

- [ ] **Step 7: Implement `use-pan-zoom.ts`**

```ts
// lib/use-pan-zoom.ts
"use client";

import { useCallback, useRef, useState } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.2;

interface PanZoomState {
  scale: number;
  x: number;
  y: number;
}

const INITIAL: PanZoomState = { scale: 1, x: 0, y: 0 };

function clampScale(scale: number): number {
  return Math.round(Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) * 100) / 100;
}

export interface UsePanZoomResult {
  transform: string;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  bind: {
    onWheel: (e: React.WheelEvent) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
}

export function usePanZoom(): UsePanZoomResult {
  const [state, setState] = useState<PanZoomState>(INITIAL);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setState((s) => ({ ...s, scale: clampScale(s.scale + ZOOM_STEP) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((s) => ({ ...s, scale: clampScale(s.scale - ZOOM_STEP) }));
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setState((s) => ({
      ...s,
      scale: clampScale(s.scale + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)),
    }));
  }, []);

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

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return {
    transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
    zoomIn,
    zoomOut,
    reset,
    bind: { onWheel, onPointerDown, onPointerMove, onPointerUp },
  };
}
```

- [ ] **Step 8: Run it, verify it passes**

Run: `pnpm test use-pan-zoom`
Expected: PASS

- [ ] **Step 9: Verify nothing broke, then commit**

Run: `pnpm test && pnpm build`
Expected: everything green.

```bash
git add lib/diagram-roles.ts lib/diagram-roles.test.ts lib/use-pan-zoom.ts lib/use-pan-zoom.test.ts
git commit -m "Add diagram node-role classifier and pan/zoom hook"
```

---

### Task 4: Sidebar/TopBar layout refresh + mobile nav

**Files:**
- Modify: `components/nav/SidebarNav.tsx`
- Modify: `components/nav/Sidebar.tsx`
- Modify: `components/nav/TopBar.tsx`
- Create: `components/nav/MobileNav.tsx`
- Create: `components/nav/MobileNav.test.tsx`

**Interfaces:**
- Consumes: `NavSection` type and `buildNavTree` from `@/lib/content`
  (existing); `SECTION_ICONS` from `@/lib/nav-icons` (existing); `Button`
  from `@/components/ui/button` (existing); `--color-sidebar-surface`
  Tailwind token from Task 1.
- Produces: `SidebarNav` no longer renders its own `<nav>` wrapper — it
  becomes a bare section-list renderer (`sections: NavSection[]` prop
  unchanged) that its two callers (`Sidebar`, `MobileNav`) each wrap
  with their own `<nav>`/container. `Sidebar` and `MobileNav`'s own
  public contracts (`Sidebar()` no props, `MobileNav({ sections:
  NavSection[] })`) are what `app/layout.tsx` and other tasks should
  rely on — nothing outside this task should import `SidebarNav`
  directly.

- [ ] **Step 1: Update `Sidebar.test.tsx`'s expectations are unaffected — confirm the baseline first**

Run: `pnpm test Sidebar`
Expected: PASS (this file isn't changed by this task; confirm it's
green before refactoring `SidebarNav` underneath it, so any later
failure is attributable to this task's own changes).

- [ ] **Step 2: Refactor `SidebarNav` to drop its own `<nav>` wrapper**

Replace the full contents of `components/nav/SidebarNav.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_ICONS } from "@/lib/nav-icons";
import type { NavSection } from "@/lib/content";

export function SidebarNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.title] ?? Layers;
        return (
          <div
            key={section.title}
            className="mb-6 border-b border-line pb-6 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <p>{section.title}</p>
            </div>
            {section.items.length === 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground italic">
                <FileQuestion className="size-3.5 shrink-0" aria-hidden="true" />
                No lessons yet
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          active
                            ? "bg-brand/15 font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: Update `Sidebar` to own the `<nav>` wrapper and the sidebar-surface tint**

Replace the full contents of `components/nav/Sidebar.tsx` with:

```tsx
import path from "node:path";
import { buildNavTree } from "@/lib/content";
import { SidebarNav } from "./SidebarNav";

export function Sidebar() {
  const contentRoot = path.join(process.cwd(), "content");
  const sections = buildNavTree(contentRoot);

  return (
    <nav
      className="hidden w-56 shrink-0 border-r border-line bg-sidebar-surface px-4 py-6 md:block"
      aria-label="Course navigation"
    >
      <SidebarNav sections={sections} />
    </nav>
  );
}
```

- [ ] **Step 4: Run `Sidebar.test.tsx` again, confirm it's still green**

Run: `pnpm test Sidebar`
Expected: PASS — the refactor changed how `SidebarNav` composes with
its callers, not the rendered link structure the test asserts on.

- [ ] **Step 5: Write the failing test for `MobileNav`**

```tsx
// components/nav/MobileNav.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileNav } from "./MobileNav";

const sections = [
  {
    title: "High-Level Design",
    items: [{ label: "Scalability", href: "/hld/HLD-01-scalability" }],
  },
];

vi.mock("next/navigation", () => ({
  usePathname: () => "/hld/HLD-01-scalability",
}));

describe("MobileNav", () => {
  it("opens the nav tree in an overlay when the trigger is clicked, and closes it", async () => {
    render(<MobileNav sections={sections} />);

    expect(screen.queryByText("Scalability")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open navigation/i }));
    expect(await screen.findByText("Scalability")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close navigation/i }));
    expect(screen.queryByText("Scalability")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run it, verify it fails**

Run: `pnpm test MobileNav`
Expected: FAIL — `Cannot find module './MobileNav'`

- [ ] **Step 7: Implement `MobileNav`**

```tsx
// components/nav/MobileNav.tsx
"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NavSection } from "@/lib/content";
import { SidebarNav } from "./SidebarNav";

export function MobileNav({ sections }: { sections: NavSection[] }) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open navigation"
          />
        }
      >
        <Menu className="size-5" aria-hidden="true" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-sidebar-surface py-6 shadow-lg outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <div className="flex items-center justify-between px-4">
            <DialogPrimitive.Title className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Navigation
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Close navigation" />
              }
            >
              <XIcon className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div className="mt-4 px-4">
            <SidebarNav sections={sections} />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

- [ ] **Step 8: Run it, verify it passes**

Run: `pnpm test MobileNav`
Expected: PASS

- [ ] **Step 9: Wire `MobileNav` into `TopBar`**

Replace the full contents of `components/nav/TopBar.tsx` with:

```tsx
import path from "node:path";
import Link from "next/link";
import { Network } from "lucide-react";
import { buildNavTree } from "@/lib/content";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { SearchDialog } from "@/components/search/SearchDialog";

export function TopBar() {
  const contentRoot = path.join(process.cwd(), "content");
  const sections = buildNavTree(contentRoot);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-background/85 px-4 py-3 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/70 sm:px-6">
      <div className="flex min-w-0 items-center gap-1">
        <MobileNav sections={sections} />
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-md font-mono text-sm font-semibold tracking-wide text-foreground uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Network className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <span className="truncate">System Design Course</span>
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SearchDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
```

`TopBar` now reads `buildNavTree` independently of `Sidebar` (both are
Server Components that each source their own copy of the nav tree).
This duplicates one cheap `fs` read per request rather than restructuring
`app/layout.tsx`'s composition — an intentional, low-risk tradeoff; note
it in the task report, don't silently "fix" it by threading props through
`RootLayout` unless a reviewer specifically asks for that.

- [ ] **Step 10: Verify nothing broke**

Run: `pnpm test`
Expected: all tests pass, including `Sidebar.test.tsx` (unchanged
behavior) and the new `MobileNav.test.tsx`.

Run: `pnpm build`
Expected: clean build.

- [ ] **Step 11: Commit**

```bash
git add components/nav/SidebarNav.tsx components/nav/Sidebar.tsx \
  components/nav/TopBar.tsx components/nav/MobileNav.tsx components/nav/MobileNav.test.tsx
git commit -m "Refresh sidebar styling and add mobile nav slide-over"
```

---

### Task 5: `DiagramPanel` — color, motion, zoom, fullscreen

**Depends on:** Task 1 (tokens) and Task 3 (`diagram-roles.ts`,
`use-pan-zoom.ts`) must both be merged before this task starts.

**Files:**
- Modify: `components/lesson/DiagramPanel.tsx`
- Modify: `components/lesson/DiagramPanel.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `classifyNodeRole`/`applyDiagramRoleClasses` from
  `@/lib/diagram-roles` (Task 3), `usePanZoom` from `@/lib/use-pan-zoom`
  (Task 3), `Dialog`/`DialogContent`/`DialogTitle`/`DialogDescription`
  from `@/components/ui/dialog` (existing), `Button` from
  `@/components/ui/button` (existing).
- `DiagramPanelProps` is unchanged (`title`, `type`, `chart`) — this is
  a pure internal rewrite, no caller anywhere in the codebase needs to
  change.

- [ ] **Step 1: Confirm the current test is green before touching the component**

Run: `pnpm test DiagramPanel`
Expected: PASS (baseline, from the existing `mermaid` mock already in
the test file).

- [ ] **Step 2: Add the two new failing assertions to `DiagramPanel.test.tsx`**

Add `fireEvent` and `within` to the existing RTL import, and append two
new `it` blocks inside the existing `describe("DiagramPanel", ...)`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { DiagramPanel } from "./DiagramPanel";
```

```tsx
  it("renders zoom controls and a fullscreen expand button", async () => {
    render(
      <DiagramPanel title="Request flow" type="architecture" chart={"graph LR\n  A-->B"} />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Request flow" }).innerHTML,
      ).toContain("mock-svg");
    });

    expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset zoom/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expand diagram/i })).toBeInTheDocument();
  });

  it("opens a fullscreen dialog showing the same diagram when expand is clicked", async () => {
    render(
      <DiagramPanel title="Request flow" type="architecture" chart={"graph LR\n  A-->B"} />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Request flow" }).innerHTML,
      ).toContain("mock-svg");
    });

    fireEvent.click(screen.getByRole("button", { name: /expand diagram/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Request flow")).toBeInTheDocument();
  });
```

- [ ] **Step 3: Run it, verify the two new tests fail**

Run: `pnpm test DiagramPanel`
Expected: FAIL — no button with an accessible name matching `/zoom in/i`
etc. exists yet (the original test still passes).

- [ ] **Step 4: Implement the new `DiagramPanel`**

Replace the full contents of `components/lesson/DiagramPanel.tsx` with:

```tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { applyDiagramRoleClasses } from "@/lib/diagram-roles";
import { usePanZoom, type UsePanZoomResult } from "@/lib/use-pan-zoom";

interface DiagramPanelProps {
  title: string;
  type: "architecture" | "class" | "state" | "sequence" | "er";
  chart: string;
}

const TYPE_ACCENT: Record<DiagramPanelProps["type"], string> = {
  architecture: "text-brand",
  state: "text-brand",
  sequence: "text-accent-info",
  class: "text-accent-warn",
  er: "text-accent-warn",
};

let mermaidInitialized = false;

function initMermaid() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      primaryColor: "color-mix(in srgb, var(--color-brand) 18%, var(--color-surface))",
      primaryBorderColor: "var(--color-brand)",
      primaryTextColor: "var(--color-ink)",
      secondaryColor: "var(--color-surface)",
      secondaryBorderColor: "var(--color-line)",
      tertiaryColor: "var(--color-surface)",
      tertiaryBorderColor: "var(--color-line)",
      lineColor: "var(--color-ink-muted)",
      fontFamily: "var(--font-mono), ui-monospace, monospace",
    },
  });
  mermaidInitialized = true;
}

function injectDiagram(container: HTMLDivElement | null, svgMarkup: string | null) {
  if (!container || !svgMarkup) return;
  container.innerHTML = svgMarkup;
  const svg = container.querySelector("svg");
  if (!svg) return;
  svg.classList.add("diagram-animate");
  applyDiagramRoleClasses(svg);
}

function DiagramToolbar({
  panZoom,
  onExpand,
}: {
  panZoom: UsePanZoomResult;
  onExpand?: () => void;
}) {
  return (
    <div className="absolute top-2 right-2 z-10 flex gap-1 rounded-md border border-line bg-card/90 p-1 backdrop-blur-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Zoom in"
        onClick={panZoom.zoomIn}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Zoom out"
        onClick={panZoom.zoomOut}
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Reset zoom"
        onClick={panZoom.reset}
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
      </Button>
      {onExpand && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Expand diagram"
          onClick={onExpand}
        >
          <Maximize2 className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export function DiagramPanel({ title, type, chart }: DiagramPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const diagramId = useId().replace(/:/g, "-");
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const panZoom = usePanZoom();
  const fullscreenPanZoom = usePanZoom();

  useEffect(() => {
    initMermaid();
    let cancelled = false;
    mermaid
      .render(`diagram-${diagramId}`, chart)
      .then(({ svg }) => {
        if (!cancelled) setSvgMarkup(svg);
      })
      .catch((renderError: Error) => {
        if (!cancelled) setError(renderError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [chart, diagramId]);

  useEffect(() => {
    injectDiagram(containerRef.current, svgMarkup);
  }, [svgMarkup]);

  useEffect(() => {
    if (fullscreenOpen) injectDiagram(fullscreenContainerRef.current, svgMarkup);
  }, [fullscreenOpen, svgMarkup]);

  return (
    <figure
      className="panel-breakout relative mt-6 rounded-lg border border-line bg-card p-4 shadow-sm"
      data-diagram-type={type}
    >
      <figcaption
        className={cn(
          "font-mono text-xs font-semibold tracking-wide uppercase",
          TYPE_ACCENT[type],
        )}
      >
        {type}
      </figcaption>
      <h4 className="mt-1 font-mono text-sm font-semibold text-foreground">
        {title}
      </h4>
      <div className="relative mt-3">
        <DiagramToolbar panZoom={panZoom} onExpand={() => setFullscreenOpen(true)} />
        <div className="overflow-hidden rounded-md border border-line">
          <div
            className="origin-top-left cursor-grab overflow-x-auto active:cursor-grabbing"
            style={{ transform: panZoom.transform }}
            onWheel={panZoom.bind.onWheel}
            onPointerDown={panZoom.bind.onPointerDown}
            onPointerMove={panZoom.bind.onPointerMove}
            onPointerUp={panZoom.bind.onPointerUp}
          >
            <div ref={containerRef} role="img" aria-label={title} />
          </div>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive">
          Diagram failed to render: {error}
        </p>
      )}

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-4xl">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Fullscreen, zoomable view of the {type} diagram.
          </DialogDescription>
          <DiagramToolbar panZoom={fullscreenPanZoom} />
          <div
            className="max-h-[75vh] origin-top-left cursor-grab overflow-auto active:cursor-grabbing"
            style={{ transform: fullscreenPanZoom.transform }}
            onWheel={fullscreenPanZoom.bind.onWheel}
            onPointerDown={fullscreenPanZoom.bind.onPointerDown}
            onPointerMove={fullscreenPanZoom.bind.onPointerMove}
            onPointerUp={fullscreenPanZoom.bind.onPointerUp}
          >
            <div ref={fullscreenContainerRef} role="img" aria-label={title} />
          </div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}
```

If `Dialog`'s `open`/`onOpenChange` props don't match `@base-ui/react`'s
actual controlled-dialog API (check `node_modules/@base-ui/react/dialog`'s
type definitions if TypeScript complains — Base UI mirrors Radix's
`open`/`onOpenChange` convention, but confirm rather than assume), adjust
to whatever the installed version's `Root` actually exposes.

- [ ] **Step 5: Run the tests, verify all pass**

Run: `pnpm test DiagramPanel`
Expected: PASS — all four `it` blocks (2 original + 2 new).

- [ ] **Step 6: Add motion keyframes and hover treatment to `app/globals.css`**

Append, after the `.panel-breakout` block added in Task 1:

```css
@media (prefers-reduced-motion: no-preference) {
  .diagram-animate .edgePaths path {
    stroke-dasharray: 6 4;
    animation: diagram-flow 2.5s linear infinite;
  }
}

@keyframes diagram-flow {
  to {
    stroke-dashoffset: -20;
  }
}

.diagram-animate .node {
  transition:
    transform 150ms ease,
    filter 150ms ease;
  transform-box: fill-box;
  transform-origin: center;
}

.diagram-animate .node:hover {
  transform: scale(1.02);
  filter: brightness(1.05);
}
```

- [ ] **Step 7: Add role-color fills, using real rendered output to confirm selectors**

Run `pnpm dev`, open any existing case-study HLD/LLD lesson in a
browser, and inspect one rendered architecture diagram's SVG in
devtools. Mermaid v11's "base" theme typically renders a default
flowchart node as a `<rect>` (or `<polygon>` for decision shapes,
`<circle>` for terminators) inside `g.node` — confirm which shape
elements are actually present before finalizing the selector list below;
extend it if a shape you see isn't covered.

Append to `app/globals.css`, after the block from Step 6:

```css
.diagram-role-client rect,
.diagram-role-client polygon,
.diagram-role-client circle {
  fill: color-mix(in srgb, #3b6fd6 20%, var(--color-surface));
  stroke: #3b6fd6;
}

.diagram-role-network rect,
.diagram-role-network polygon,
.diagram-role-network circle {
  fill: color-mix(in srgb, var(--color-accent-info) 20%, var(--color-surface));
  stroke: var(--color-accent-info);
}

.diagram-role-cache rect,
.diagram-role-cache polygon,
.diagram-role-cache circle {
  fill: color-mix(in srgb, var(--color-accent-warn) 20%, var(--color-surface));
  stroke: var(--color-accent-warn);
}

.diagram-role-datastore rect,
.diagram-role-datastore polygon,
.diagram-role-datastore circle {
  fill: color-mix(in srgb, var(--color-state-booked) 18%, var(--color-surface));
  stroke: var(--color-state-booked);
}

.diagram-role-queue rect,
.diagram-role-queue polygon,
.diagram-role-queue circle {
  stroke-dasharray: 4 2;
}
```

`.diagram-role-service` intentionally has no rule here — service nodes
keep the theme's default primary (brand teal) fill, since teal is
already the "structural" default and doesn't need a second override.

- [ ] **Step 8: Verify visually in both themes**

With `pnpm dev` still running, open a case-study diagram in light theme,
then toggle to dark theme (the existing `ThemeToggle`). Confirm: node
colors differ by role, connector lines show the slow ambient dash
animation, zoom in/out/reset buttons work, drag-to-pan works, wheel-zoom
works, and the expand button opens a fullscreen dialog with working
zoom/pan there too. Fix anything that looks wrong before moving on —
this is exactly the kind of thing Task 6's full pass re-checks, but
don't leave a known-broken visual for that later pass to discover.

- [ ] **Step 9: Full verification**

Run: `pnpm test`
Expected: all tests pass.

Run: `pnpm build`
Expected: clean build.

- [ ] **Step 10: Commit**

```bash
git add components/lesson/DiagramPanel.tsx components/lesson/DiagramPanel.test.tsx app/globals.css
git commit -m "Give DiagramPanel colorful role-based theming, ambient motion, and pan/zoom"
```

---

### Task 6: Full UI verification pass

**Depends on:** Tasks 1-5 all merged.

**Files:** none (verification only — fix forward in whichever file if
something's actually broken, but don't plan new work here).

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev` (background)

- [ ] **Step 2: Drive it with Playwright, light theme**

Navigate to `/`, each of the 6 case-study lesson routes, and
`/style-guide`. For each: snapshot/screenshot, confirm diagrams render
with role-based color and the ambient connector animation, confirm the
sidebar shows the new active-pill styling and section dividers, confirm
`CompareTable`/`KeyStat`/`Point` render correctly if any lesson content
already uses them (none will yet — that's fine, confirm via
`/style-guide` or a temporary inline test MDX snippet if `/style-guide`
doesn't already showcase them), confirm no console errors, confirm no
horizontal overflow.

- [ ] **Step 3: Same pass, dark theme**

Toggle to dark via `ThemeToggle`, repeat Step 2's checks. Confirm the
two new accent colors and the darker `--color-ink-muted` are legible
against the dark ground.

- [ ] **Step 4: Interaction checks**

On at least one diagram: click zoom in/out/reset, drag to pan, click
expand and confirm the fullscreen dialog opens with its own working
zoom/pan, confirm `Escape` closes it and returns focus sensibly. At a
375px viewport: confirm the sidebar is hidden and the new mobile-nav
hamburger opens/closes the slide-over correctly, with no horizontal
overflow on the page body.

- [ ] **Step 5: Reduced-motion check**

Emulate `prefers-reduced-motion: reduce` (Playwright's
`page.emulateMedia`) and confirm the connector dash animation is absent
while node colors and layout stay correct.

- [ ] **Step 6: Fix anything found, then final green run**

Run: `pnpm test && pnpm build`
Expected: both clean.

- [ ] **Step 7: Stop the dev server, clean up any verification screenshots, commit if any fixes were made**

If Step 6 required fixes, commit them with a message describing what
was found and fixed (matching this repo's existing pattern for
verification-driven fixes, e.g. commit `5cf7f31` from the prior pass).
If nothing needed fixing, there's nothing to commit for this task.

---

## After this plan

Once Task 6 is clean, update `docs/superpowers/plans/TRACKER.md` (mark
this plan **Completed**, note commits) and `SYLLABUS.md`/`content/
04-case-studies/SYLLABUS.md` are unaffected (no lesson content changed
here). Then dispatch the 6-lesson content-format retrofit as
content-authoring tasks (not a new SDD plan), per the ruling in the
design spec's §6 — each lesson rewritten against its existing
`CHECKLIST.md` using the now-available `CompareTable`/`KeyStat`/`Point`
components and the new `DiagramPanel` capabilities, tracked in
`TRACKER.md`'s "Content-authoring tasks" table the same way the
original 6 lessons were.
