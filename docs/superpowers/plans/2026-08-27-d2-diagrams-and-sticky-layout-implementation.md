# D2 Diagram Engine and Sticky Layout Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-rendered D2 diagram path (no client-bundle WASM
cost) alongside the existing client-rendered Mermaid path, and replace
the static `SectionTracker` with a sticky, scroll-aware, clickable
right-rail table of contents plus a sticky/independently-scrollable
sidebar.

**Architecture:** `@terrastruct/d2`'s WASM file is ~22MB — shipping
that to every visitor's browser would be a real regression, so D2
diagrams are **not** rendered client-side the way Mermaid is. Because
this app's MDX is rendered via `next-mdx-remote-client/**rsc**`, the
whole lesson content tree — including custom components referenced in
`mdxComponents` — executes as part of the React Server Component tree.
That means a diagram component CAN be an `async` Server Component that
calls the D2 WASM renderer entirely on the server and sends only the
resulting SVG string (plus a lightweight interactive shell) to the
client. This is a real refinement beyond
[the design spec](../specs/2026-08-27-d2-diagrams-and-sticky-layout-design.md)'s
"engine prop on DiagramPanel" framing — a single component can't
switch between Server and Client Component behavior via a runtime
prop, so this plan uses two separate MDX components instead:
`DiagramPanel` (existing, unchanged external API, Mermaid, client-
rendered) and `D2Diagram` (new, Server Component, D2, server-rendered).
Both delegate their shared interactive chrome (pan/zoom, fullscreen,
toolbar, motion/role CSS) to one shared `DiagramChrome` client
component, so none of Task 5's prior zoom/fullscreen work is
duplicated or re-litigated.

Five tasks. Task 1 (dependency + server-only render helper + icon map)
is foundational. Tasks 2, 3, and 4 touch disjoint files and can run in
parallel once Task 1 lands. Task 5 (the page-shell wiring) depends on
Task 3's `TableOfContents` existing, so it runs after. Task 6 is a
Playwright verification pass. **Converting Ticketmaster's actual lesson
diagrams from Mermaid to D2 syntax is explicitly out of scope for this
plan** — it's content-authoring work against real diagram content, not
engineering with tests, and is tracked separately in `TRACKER.md`, the
same two-track split used for the prior redesign plan.

**Tech Stack:** Next.js 16 (App Router, React Server Components),
`@terrastruct/d2` (new — WASM, MPL-2.0, zero transitive deps), Mermaid
11 (unchanged, still used by 5 of 6 lessons), `rehype-slug` (new — tiny,
adds `id` attributes to headings), Vitest + RTL + jsdom, pnpm.

**Spec:** [docs/superpowers/specs/2026-08-27-d2-diagrams-and-sticky-layout-design.md](../specs/2026-08-27-d2-diagrams-and-sticky-layout-design.md)

## Global Constraints

- pnpm exclusively.
- Two new dependencies are justified and expected here (unlike the
  prior plan's "no new deps" default): `@terrastruct/d2` and
  `rehype-slug`. Don't add anything beyond these two without a reason
  as strong as the ones in the spec.
- `lib/render-d2.ts` (the D2 render helper) and `D2Diagram.tsx` (the
  Server Component that calls it) must **never** be imported from any
  `"use client"` file — that would ship the 22MB WASM to the browser,
  defeating the entire point of this architecture. Verify with
  `pnpm build`'s client-bundle output, not just "it compiled."
- These routes must run in the Node.js runtime, not Edge — `@terrastruct/d2`'s
  Node build uses `node:worker_threads`/`node:fs`. Confirm none of the
  touched page files set `export const runtime = "edge"` (none currently
  do, per the existing codebase — just don't introduce one).
- Every existing test file must keep passing: `Sidebar.test.tsx`,
  `DiagramPanel.test.tsx`, `QuizItem.test.tsx`, `Rubric.test.tsx`,
  `SectionTracker.test.tsx` (deleted in Task 5, along with the
  component — its removal from the suite is the expected outcome, not
  a regression), `SelfScoreBand.test.tsx`, `CompareTable.test.tsx`,
  `KeyStat.test.tsx`, `Point.test.tsx`, `MobileNav.test.tsx`,
  `diagram-roles.test.ts`, `use-pan-zoom.test.ts`.
- Both themes verified for every visual change, per CLAUDE.md's UI
  verification rule — Task 6 is where this happens end-to-end.
- An async Server Component (`D2Diagram`) is not straightforwardly
  unit-testable with Vitest + RTL the way client components are — no
  task below pretends otherwise. `D2Diagram` gets verified via Task 6's
  live Playwright pass, not a `.test.tsx` file. Everything else that
  can be unit-tested, is.
- Git identity for this repo is already configured locally
  (`masud.cseian@gmail.com` / Masud Rana) — don't reconfigure it.

---

### Task 1: D2 dependency, server-only render helper, icon map, CONTENT-GUIDE update

**Files:**
- Modify: `package.json` (add `@terrastruct/d2`, `rehype-slug`)
- Create: `lib/render-d2.ts`
- Create: `lib/diagram-icons.ts`
- Modify: `CONTENT-GUIDE.md`

**Interfaces:**
- Produces: `renderD2(source: string, options?: { pad?: number }):
  Promise<{ svg: string; error?: undefined } | { svg?: undefined;
  error: string }>` from `lib/render-d2.ts` — Task 2's `D2Diagram`
  Server Component is the only consumer. `DIAGRAM_ICONS: Record<string,
  string>` (role name → `data:image/svg+xml;base64,...` URI) from
  `lib/diagram-icons.ts` — consumed by whatever D2 source strings
  reference icons (the content-authoring task that converts
  Ticketmaster's diagrams, tracked separately — this task just produces
  the map, doesn't consume it anywhere itself).

This task has no client-side behavior to unit-test the way Tasks 2-4
do — `renderD2` wraps a WASM library already validated in a manual
spike. Skip TDD fail/pass steps for it; verify by actually calling it
once (Step 3) instead.

- [ ] **Step 1: Add the two dependencies**

Run: `pnpm add @terrastruct/d2 rehype-slug`

- [ ] **Step 2: Write `lib/render-d2.ts`**

```ts
// lib/render-d2.ts
import { D2 } from "@terrastruct/d2";

let d2Instance: D2 | null = null;

function getD2(): D2 {
  if (!d2Instance) d2Instance = new D2();
  return d2Instance;
}

export type RenderD2Result = { svg: string } | { error: string };

export async function renderD2(source: string): Promise<RenderD2Result> {
  try {
    const d2 = getD2();
    const compiled = await d2.compile(source, { layout: "dagre" });
    const svg = await d2.render(compiled.diagram, {
      ...compiled.renderOptions,
      pad: 40,
    });
    return { svg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
```

The module-level `d2Instance` singleton avoids re-initializing the WASM
worker on every call within the same server process — matches the
existing `mermaidInitialized` singleton pattern in `DiagramPanel.tsx`.

- [ ] **Step 3: Verify it actually renders**

This repo has no ad hoc TS script runner (it's a Next.js project, not a
Node script project), so don't improvise one. `renderD2`'s underlying
`@terrastruct/d2` call pattern was already validated in a manual spike
(see the design spec's §"Why this changed") — real end-to-end
verification of `renderD2` happens in Task 2, Step 8, once `D2Diagram`
calls it through the actual Next.js dev server. Skip a standalone check
here; don't block this task on inventing one.

- [ ] **Step 4: Build the icon map**

Source simple, single-color line icons for these roles from
`lucide-react`'s own SVG markup (open `node_modules/lucide-react/dist/esm/icons/*.js`
for the relevant icon, e.g. `globe.js`, `server.js`, `database.js`,
`zap.js` for cache, `network.js` for gateway/CDN, `list.js` or
`layers.js` for queue, `shield-check.js` for identity/auth,
`smartphone.js` for mobile client, `external-link.js` for third-party)
— extract each icon's `<svg>...</svg>` markup with `stroke="white"`
(these sit on saturated colored node backgrounds, matching the spike's
result), base64-encode it into a `data:image/svg+xml;base64,...` URI.

```ts
// lib/diagram-icons.ts
/**
 * Local, self-hosted icon set for D2 diagram nodes, sourced from
 * lucide-react (already a dependency) and encoded as data URIs so D2
 * diagrams reference them with zero runtime network calls.
 */
function svgIcon(paths: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export const DIAGRAM_ICONS: Record<string, string> = {
  client: svgIcon(
    '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  ),
  network: svgIcon(
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  ),
  service: svgIcon(
    '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
  ),
  cache: svgIcon(
    '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  ),
  datastore: svgIcon(
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  ),
  queue: svgIcon(
    '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
  ),
  identity: svgIcon(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  ),
  external: svgIcon(
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  ),
};
```

The exact path data above is a reasonable-fidelity hand-transcription
of the named lucide icons' shapes, not a byte-for-byte copy from the
package — confirm each one visually once (render a quick D2 test
diagram using it, same technique as the earlier spike) and fix any
that don't look right rather than assuming the paths are perfect on
the first try.

- [ ] **Step 5: Add the role-color reference table to CONTENT-GUIDE.md**

Insert a new subsection under "Diagrams (Mermaid)" — rename that
heading to "Diagrams (Mermaid and D2)" and add:

```markdown
### D2 diagrams (architecture/network, class, sequence, ER)

D2 diagrams (used via the `<D2Diagram>` MDX component, currently piloted
on Ticketmaster only) set color explicitly per node via `style.fill`/
`style.stroke`/`style.font-color`, rather than relying on automatic
keyword classification the way Mermaid diagrams do. Use these values
consistently so diagrams read as one system:

| Role | Fill (light) | Fill (dark) | Use for |
|---|---|---|---|
| client | `#3b6fd6` | `#6d93e8` | browsers, mobile apps, end users |
| network | `#5b4fbf` | `#9c93e0` | CDN, gateway, load balancer, waiting room |
| service | `#0e7c86` | `#34c7b8` | application services, workers |
| cache | `#b8722a` | `#e8a659` | Redis, in-memory caches |
| datastore | `#b23a48` | `#f87171` | databases, persistent stores |
| queue | `#4b5262` | `#9ba3b4` | message queues, event streams |

Always pair a colored fill with `style.font-color: "#ffffff"` — every
role color above is dark/saturated enough that white label text is the
only choice that stays legible. Reference `lib/diagram-icons.ts`'s
`DIAGRAM_ICONS` map for the matching icon per role rather than sourcing
a new one per lesson.

Diagram-type mapping: architecture/network → plain shapes +
connections; state machines → same technique (no dedicated D2
state-shape exists); class → `shape: class`; sequence →
`shape: sequence_diagram`; ER → `shape: sql_table` per entity with
`constraint: primary_key`/`foreign_key`.
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm build`
Expected: clean (the new deps shouldn't break anything yet — nothing
imports them until Task 2).

```bash
git add package.json pnpm-lock.yaml lib/render-d2.ts lib/diagram-icons.ts CONTENT-GUIDE.md
git commit -m "Add D2 dependency, server-only render helper, icon map, and CONTENT-GUIDE table"
```

---

### Task 2: Diagram chrome extraction + D2 Server Component

**Depends on:** Task 1 (`renderD2`, `DIAGRAM_ICONS`) merged.

**Files:**
- Create: `components/lesson/DiagramChrome.tsx`
- Modify: `components/lesson/DiagramPanel.tsx`
- Modify: `components/lesson/DiagramPanel.test.tsx` (should need **no**
  behavioral changes — its assertions test the public component's
  rendered output, which doesn't change; only add a step confirming
  this explicitly)
- Create: `components/lesson/D2Diagram.tsx`
- Modify: `lib/mdx-components.tsx` (register `D2Diagram`)
- Modify: `app/style-guide/page.tsx` (add a `D2Diagram` demo)

**Interfaces:**
- Produces: `DiagramChrome({ title, type, svgMarkup, error }: {
  title: string; type: "architecture"|"class"|"state"|"sequence"|"er";
  svgMarkup: string | null; error?: string })` — a `"use client"`
  component with zero knowledge of Mermaid or D2, just renders the
  toolbar/pan-zoom/fullscreen chrome around whatever SVG string it's
  given. `D2Diagram` — an `async` Server Component (no `"use client"`
  directive) with the same public props as `DiagramPanel`
  (`title`, `type`, `chart`), calling `renderD2(chart)` and passing the
  result into `DiagramChrome`.

- [ ] **Step 1: Confirm the baseline**

Run: `pnpm test DiagramPanel`
Expected: PASS (existing 4 assertions, unchanged so far).

- [ ] **Step 2: Extract `DiagramChrome`**

Move everything from the current `DiagramPanel.tsx` EXCEPT the
Mermaid-specific rendering effects (`initMermaid`, the `mermaid.render()`
call, `svgMarkup`/`error` state) into a new file. This is the same JSX
structure Task 5 already built — moved, not rewritten:

```tsx
// components/lesson/DiagramChrome.tsx
"use client";

import { useCallback, useRef, useState } from "react";
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

export type DiagramType = "architecture" | "class" | "state" | "sequence" | "er";

const TYPE_ACCENT: Record<DiagramType, string> = {
  architecture: "text-brand",
  state: "text-brand",
  sequence: "text-accent-info",
  class: "text-accent-warn",
  er: "text-accent-warn",
};

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
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Zoom in" onClick={panZoom.zoomIn}>
        <Plus className="size-3.5" aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Zoom out" onClick={panZoom.zoomOut}>
        <Minus className="size-3.5" aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" aria-label="Reset zoom" onClick={panZoom.reset}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
      </Button>
      {onExpand && (
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Expand diagram" onClick={onExpand}>
          <Maximize2 className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export function DiagramChrome({
  title,
  type,
  svgMarkup,
  error,
}: {
  title: string;
  type: DiagramType;
  svgMarkup: string | null;
  error?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const svgMarkupRef = useRef<string | null>(null);
  svgMarkupRef.current = svgMarkup;
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const panZoom = usePanZoom();
  const fullscreenPanZoom = usePanZoom();

  if (containerRef.current) injectDiagram(containerRef.current, svgMarkup);

  const setFullscreenContainer = useCallback((node: HTMLDivElement | null) => {
    fullscreenContainerRef.current = node;
    if (node) injectDiagram(node, svgMarkupRef.current);
  }, []);

  return (
    <figure
      className="panel-breakout relative mt-6 rounded-lg border border-line bg-card p-4 shadow-sm"
      data-diagram-type={type}
    >
      <figcaption className={cn("font-mono text-xs font-semibold tracking-wide uppercase", TYPE_ACCENT[type])}>
        {type}
      </figcaption>
      <h4 className="mt-1 font-mono text-sm font-semibold text-foreground">{title}</h4>
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
      {error && <p className="mt-2 text-sm text-destructive">Diagram failed to render: {error}</p>}

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
            <div ref={setFullscreenContainer} role="img" aria-label={title} />
          </div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}
```

Note the change from Task 5's two `useEffect`s that injected into
`containerRef` to a direct call during render (`if (containerRef.current)
injectDiagram(...)`). This is intentional: `DiagramChrome` no longer
owns the async fetch of `svgMarkup` (its parent does, whether that's
`DiagramPanel`'s Mermaid effect or `D2Diagram`'s server-side await) — by
the time `DiagramChrome` receives a non-null `svgMarkup` prop, injecting
immediately during render (React allows DOM mutation via refs during
render for exactly this kind of imperative-library-integration case) is
simpler and avoids a redundant effect-based re-injection. If this causes
any lint/strict-mode double-invocation issue in practice, fall back to
a `useEffect(() => injectDiagram(containerRef.current, svgMarkup), [svgMarkup])`
instead — verify against the real dev server rather than assuming
either approach is trouble-free.

- [ ] **Step 3: Slim `DiagramPanel` down to the Mermaid-specific path**

Replace the full contents of `components/lesson/DiagramPanel.tsx`:

```tsx
// components/lesson/DiagramPanel.tsx
"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";
import { DiagramChrome, type DiagramType } from "./DiagramChrome";

interface DiagramPanelProps {
  title: string;
  type: DiagramType;
  chart: string;
}

let mermaidInitialized = false;

function initMermaid() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      primaryColor: "#d9f0ee",
      primaryBorderColor: "#0e7c86",
      primaryTextColor: "#14171f",
      secondaryColor: "#ffffff",
      secondaryBorderColor: "#d8dee6",
      tertiaryColor: "#ffffff",
      tertiaryBorderColor: "#d8dee6",
      lineColor: "#3a4051",
      fontFamily: "var(--font-mono), ui-monospace, monospace",
    },
  });
  mermaidInitialized = true;
}

export function DiagramPanel({ title, type, chart }: DiagramPanelProps) {
  const diagramId = useId().replace(/:/g, "-");
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

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

  return <DiagramChrome title={title} type={type} svgMarkup={svgMarkup} error={error} />;
}
```

- [ ] **Step 4: Confirm `DiagramPanel.test.tsx` still passes unchanged**

Run: `pnpm test DiagramPanel`
Expected: PASS, all 4 existing assertions — the public component's
title/eyebrow/toolbar/fullscreen behavior is identical, only its
internals moved. If anything fails, the refactor changed observable
behavior and that's a bug to fix, not a test to loosen.

- [ ] **Step 5: Write `D2Diagram`**

```tsx
// components/lesson/D2Diagram.tsx
import { renderD2 } from "@/lib/render-d2";
import { DiagramChrome, type DiagramType } from "./DiagramChrome";

interface D2DiagramProps {
  title: string;
  type: DiagramType;
  chart: string;
}

export async function D2Diagram({ title, type, chart }: D2DiagramProps) {
  const result = await renderD2(chart);
  return (
    <DiagramChrome
      title={title}
      type={type}
      svgMarkup={"svg" in result ? result.svg : null}
      error={"error" in result ? result.error : undefined}
    />
  );
}
```

No `"use client"` directive — this file must stay a Server Component so
`renderD2`'s D2 WASM import never reaches the client bundle.

- [ ] **Step 6: Register `D2Diagram` in the MDX component map**

In `lib/mdx-components.tsx`, add the import and registration alongside
the existing `DiagramPanel`:

```tsx
import { D2Diagram } from "@/components/lesson/D2Diagram";
```
```tsx
export const mdxComponents: MDXComponents = {
  DiagramPanel,
  D2Diagram,
  // ...unchanged...
};
```

- [ ] **Step 7: Add a demo to the style guide**

In `app/style-guide/page.tsx`, add a `D2Diagram` usage near the
existing `DiagramPanel` one, so there's a permanent, low-stakes place
to verify the D2 path renders correctly without touching real lesson
content:

```tsx
<D2Diagram
  title="Sample D2 request flow"
  type="architecture"
  chart={`
client: Client {
  style.fill: "#3b6fd6"
  style.font-color: "#ffffff"
}
gateway: API Gateway {
  style.fill: "#5b4fbf"
  style.font-color: "#ffffff"
}
service: Service {
  style.fill: "#0e7c86"
  style.font-color: "#ffffff"
}
client -> gateway -> service
`}
/>
```
(Import `D2Diagram` from `@/components/lesson/D2Diagram` at the top of
the file, alongside the existing `DiagramPanel` import.)

- [ ] **Step 8: Verify and commit**

Run: `pnpm test`
Expected: all tests pass (`DiagramPanel.test.tsx` unchanged assertions,
no new test file for `D2Diagram` per the Global Constraints note on
async Server Components).

Run: `pnpm build`
Expected: clean. Additionally, check the build output / a bundle
analysis isn't required here, but do a sanity check: search the client
bundle output under `.next/` for the literal string `d2.wasm` or
`@terrastruct` — it should **not** appear in any file under
`.next/static/chunks/` (client bundles). If it does, `D2Diagram` or
`render-d2.ts` got imported into a client component somewhere and the
whole point of this task's architecture is broken — fix the import
chain, don't ignore it.

```bash
git add components/lesson/DiagramChrome.tsx components/lesson/DiagramPanel.tsx \
  components/lesson/D2Diagram.tsx lib/mdx-components.tsx app/style-guide/page.tsx
git commit -m "Extract shared DiagramChrome; add server-rendered D2Diagram component"
```

---

### Task 3: `TableOfContents` — scroll-aware, clickable right-rail

**Files:**
- Create: `components/lesson/TableOfContents.tsx`
- Create: `components/lesson/TableOfContents.test.tsx`

**Interfaces:**
- Produces: `TableOfContents({ containerId }: { containerId: string })`
  — a `"use client"` component. On mount, it queries
  `document.getElementById(containerId)?.querySelectorAll("h2[id]")`
  for `{id, text}` pairs (this works because `next-mdx-remote-client`
  renders headings server-side and `rehype-slug` — wired in Task 5 —
  adds their `id`s before the client ever sees the page, so by the time
  this component mounts, the real ids are already in the DOM). Task 5's
  `LessonShell` is the only consumer, passing the id of its `<article>`.

- [ ] **Step 1: Stub `IntersectionObserver` for jsdom**

jsdom (this repo's test environment) has no native
`IntersectionObserver` — without a stub, any test that mounts
`TableOfContents` throws `ReferenceError: IntersectionObserver is not
defined`, the same class of gap `vitest-setup.ts` already patches for
`ResizeObserver`/`scrollIntoView` (needed by `cmdk`). Add the matching
stub there:

```ts
// vitest-setup.ts — add alongside the existing ResizeObserver stub
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(_callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
}
```

- [ ] **Step 2: Write the failing test**

```tsx
// components/lesson/TableOfContents.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TableOfContents } from "./TableOfContents";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function renderArticleWithHeadings() {
  document.body.innerHTML = `
    <article id="lesson-article">
      <h2 id="problem-framing">Problem framing</h2>
      <p>...</p>
      <h2 id="architecture">Architecture</h2>
      <p>...</p>
    </article>
  `;
}

describe("TableOfContents", () => {
  it("renders one clickable link per h2 heading found in the target article", () => {
    renderArticleWithHeadings();
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<TableOfContents containerId="lesson-article" />, { container });

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent("Problem framing");
    expect(links[0]).toHaveAttribute("href", "#problem-framing");
    expect(links[1]).toHaveTextContent("Architecture");
    expect(links[1]).toHaveAttribute("href", "#architecture");
  });

  it("renders nothing (no nav) when the target article has no headings", () => {
    document.body.innerHTML = `<article id="lesson-article"></article>`;
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<TableOfContents containerId="lesson-article" />, { container });

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `pnpm test TableOfContents`
Expected: FAIL — `Cannot find module './TableOfContents'`

- [ ] **Step 4: Implement it**

```tsx
// components/lesson/TableOfContents.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
}

export function TableOfContents({ containerId }: { containerId: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const nodes = Array.from(container.querySelectorAll<HTMLHeadingElement>("h2[id]"));
    setHeadings(nodes.map((node) => ({ id: node.id, text: node.textContent ?? "" })));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [containerId]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-20 hidden max-h-[calc(100vh-5rem)] w-56 shrink-0 overflow-y-auto xl:block"
    >
      <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        On this page
      </p>
      <ul className="mt-3 flex flex-col gap-1 border-l border-line">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "-ml-px block border-l-2 py-1 pl-3 text-sm transition-colors",
                  active
                    ? "border-brand font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:border-line hover:text-foreground",
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

The `top-20`/`max-h-[calc(100vh-6rem)]` values mirror the sidebar's
sticky offset — Task 4 measures the real `TopBar` height; use that same
confirmed value here too (both should be pinned to the same visual
line). The `xl:block` breakpoint (1280px) matches the spec's "no room
below this width" call — confirm during Task 6 that this is actually
the right cutoff against the real page layout, not just the spec's
directional guess.

- [ ] **Step 5: Run it, verify it passes**

Run: `pnpm test TableOfContents`
Expected: PASS

- [ ] **Step 6: Verify and commit**

Run: `pnpm test && pnpm build`
Expected: both clean.

```bash
git add components/lesson/TableOfContents.tsx components/lesson/TableOfContents.test.tsx vitest-setup.ts
git commit -m "Add scroll-aware clickable TableOfContents right-rail"
```

---

### Task 4: Sidebar sticky + independently scrollable

**Files:**
- Modify: `components/nav/Sidebar.tsx`

**Interfaces:**
- No prop/API changes — `Sidebar()` still takes no props and is used
  exactly as today in `app/layout.tsx`. Purely a styling change.

- [ ] **Step 1: Confirm the baseline**

Run: `pnpm test Sidebar`
Expected: PASS.

- [ ] **Step 2: Measure the real TopBar height**

Run `pnpm dev`, open any page, inspect the rendered `<header>` (the
`TopBar`) in devtools, and read its actual computed height. It's
expected to land near `56px` (`py-3` = `0.75rem` top+bottom padding
plus one line of `text-sm`/mono content), but confirm the real number
rather than assuming — round up to the nearest Tailwind spacing step
for the sticky `top-*`/`max-h-[calc(100vh-*)]` values below.

- [ ] **Step 3: Apply sticky/scroll styling**

In `components/nav/Sidebar.tsx`, change the `<nav>`'s className from:
```
"hidden w-56 shrink-0 border-r border-line bg-sidebar-surface px-4 py-6 md:block"
```
to (using the height confirmed in Step 2 — `5rem`/`top-20` shown here
as a starting point, matching `TableOfContents`'s value so both rails
line up visually):
```
"hidden w-56 shrink-0 overflow-y-auto border-r border-line bg-sidebar-surface px-4 py-6 md:sticky md:top-20 md:block md:max-h-[calc(100vh-5rem)]"
```

- [ ] **Step 4: Verify visually**

With `pnpm dev` running, open a page with a long enough sidebar list to
exceed the viewport height (once Ticketmaster/Parking Lot/Amazon
Locker are all listed, the Case Studies section already should),
scroll the main content down, and confirm the sidebar stays pinned to
the viewport while its own content (if it overflows) scrolls
independently with its own scrollbar. Fix the exact `top`/`max-h`
values here if they're off by a few pixels against the real rendered
TopBar rather than leaving a visible gap or overlap.

- [ ] **Step 5: Confirm nothing broke, then commit**

Run: `pnpm test Sidebar && pnpm build`
Expected: both clean — this is a pure CSS change, the existing test
(which checks link rendering/active state, not layout) should be
unaffected.

```bash
git add components/nav/Sidebar.tsx
git commit -m "Make Sidebar sticky and independently scrollable"
```

---

### Task 5: `LessonShell`, page-route wiring, `SectionTracker` removal

**Depends on:** Task 3 (`TableOfContents`) merged.

**Files:**
- Create: `components/lesson/LessonShell.tsx`
- Modify: `app/hld/[slug]/page.tsx`, `app/lld/[slug]/page.tsx`,
  `app/interview-prep/[slug]/page.tsx`,
  `app/case-studies/[system]/hld/page.tsx`,
  `app/case-studies/[system]/lld/page.tsx`
- Modify: `lib/mdx-components.tsx` (remove `SectionTracker`
  registration)
- Modify: `app/style-guide/page.tsx` (remove `SectionTracker` usage —
  it can no longer be imported once deleted)
- Delete: `components/lesson/SectionTracker.tsx`,
  `components/lesson/SectionTracker.test.tsx`
- Modify: all 6 lesson files under `content/04-case-studies/` (remove
  the `<SectionTracker ... />` block only — no prose changes)

**Interfaces:**
- Produces: `LessonShell({ title, children }: { title: string;
  children: React.ReactNode })` — a Server Component (no `"use client"`
  needed itself; it renders `<TableOfContents>`, which is a client leaf,
  same pattern as `Sidebar`/`SidebarNav`). Every page route in the
  Files list above switches from its own `<article className="mx-auto
  max-w-[68ch]">...</article>` markup to using this shared shell.

- [ ] **Step 1: Write `LessonShell`**

```tsx
// components/lesson/LessonShell.tsx
import { TableOfContents } from "./TableOfContents";

export function LessonShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[90rem] items-start gap-10">
      <article id="lesson-article" className="min-w-0 max-w-[74ch] flex-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {children}
      </article>
      <TableOfContents containerId="lesson-article" />
    </div>
  );
}
```

The `max-w-[74ch]`/`max-w-[90rem]` values are starting points, not
final — Task 6's live pass is where these get tuned against real
rendered lesson text and the freed-up right-rail space. Adjust if the
prose column looks visibly off from the ~68ch original or if the
right-rail and prose crowd each other at common laptop widths
(1280-1440px).

- [ ] **Step 2: Wire `rehypePlugins: [rehypeSlug]` and `LessonShell` into every page route**

Each of the 5 files listed follows the same shape. Using
`app/case-studies/[system]/hld/page.tsx` as the concrete example (the
other 4 differ only in their `filePath`/`params` details, which are
unchanged from what's already there — don't touch that part):

```tsx
import path from "node:path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import rehypeSlug from "rehype-slug";
import { getLesson } from "@/lib/content";
import { mdxComponents } from "@/lib/mdx-components";
import { LessonShell } from "@/components/lesson/LessonShell";

export default async function CaseStudyHldPage({
  params,
}: {
  params: Promise<{ system: string }>;
}) {
  const { system } = await params;
  const filePath = path.join(process.cwd(), "content/04-case-studies", system, "hld.mdx");
  const lesson = getLesson(filePath);
  if (!lesson) notFound();

  return (
    <LessonShell title={lesson.title}>
      <MDXRemote
        source={lesson.source}
        components={mdxComponents}
        options={{ mdxOptions: { rehypePlugins: [rehypeSlug] } }}
      />
    </LessonShell>
  );
}
```

Apply the same pattern (imports + `options` + swapping the old
`<article className="mx-auto max-w-[68ch]">...</article>` for
`<LessonShell title={lesson.title}>...</LessonShell>`) to the other 4
route files. If any of them already pass an `options` prop to
`MDXRemote` today, merge into it rather than overwriting — check each
file's current content before editing rather than assuming they're
all identical to the case-studies one shown above.

- [ ] **Step 3: Remove `SectionTracker` from the MDX component map and the style guide**

In `lib/mdx-components.tsx`, delete the `SectionTracker` import and its
entry in the `mdxComponents` object.

In `app/style-guide/page.tsx`, delete the `SectionTracker` import and
its usage block (the `<SectionTracker sections={...} active="..." />`
JSX).

- [ ] **Step 4: Delete the component and its test**

```bash
git rm components/lesson/SectionTracker.tsx components/lesson/SectionTracker.test.tsx
```

- [ ] **Step 5: Strip `<SectionTracker ... />` from all 6 lesson files**

For each of `content/04-case-studies/{ticketmaster,parking-lot,amazon-locker}/{hld,lld}.mdx`,
remove the `<SectionTracker ... />` JSX block (it spans from
`<SectionTracker` to the closing `/>`, typically ~11 lines per the
existing pattern) and nothing else — leave every word of prose,
every diagram, every quiz untouched. This is a mechanical removal, not
a content edit; if a lesson's block looks meaningfully different from
the others, re-read it carefully before removing to make sure you're
only removing that one component invocation.

- [ ] **Step 6: Verify**

Run: `pnpm test`
Expected: all tests pass — `SectionTracker.test.tsx` is gone (expected,
not a regression), everything else green.

Run: `pnpm build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add LessonShell with right-rail TOC; remove SectionTracker everywhere"
```

---

### Task 6: Full verification pass

**Depends on:** Tasks 1-5 all merged.

**Files:** none (verification only — fix forward if something's
genuinely broken).

- [ ] **Step 1: Start the dev server, drive it with Playwright**

Cover, in both light and dark theme:
- `/style-guide` — the new `D2Diagram` demo renders with correct colors
  (no washed-out defaults, no visible errors), alongside the existing
  Mermaid `DiagramPanel` demo still working unchanged.
- Every lesson route (`/hld/*`, `/lld/*`, `/case-studies/*/hld`,
  `/case-studies/*/lld`, `/interview-prep/*`) — confirm `LessonShell`
  renders, the right-rail TOC appears at a wide viewport (>=1280px),
  lists the lesson's real section headings, highlights the section
  currently in view while scrolling, and clicking a link jumps to and
  highlights that section.
- Confirm the right-rail does **not** render (or is hidden, matching
  the `xl:` breakpoint) below 1280px, and that nothing overflows
  horizontally at 1024px, 768px, and 375px.
- Confirm the sidebar stays pinned while scrolling a long lesson page,
  and scrolls independently once its own content exceeds the viewport.
- Confirm no console errors anywhere touched.

- [ ] **Step 2: Confirm the WASM bundle-size constraint held**

Run `pnpm build`, then check `.next/static/chunks/` (or wherever the
client bundle output lands for this Next.js version) does not contain
`d2.wasm` or a chunk that pulls in `@terrastruct/d2`. If it does, trace
which file created the client-side import path and fix it — this is
the single most important thing this plan set out to get right.

- [ ] **Step 3: Fix anything found, then final green run**

Run: `pnpm test && pnpm build`
Expected: both clean.

- [ ] **Step 4: Stop the dev server, clean up verification screenshots, commit if fixes were needed**

Same pattern as every prior verification pass in this repo (e.g.
commit `5cf7f31`) — if Step 1/2 required real fixes, commit them with a
message describing what was found; if nothing needed fixing, there's
nothing to commit for this task.

---

## After this plan

Update `docs/superpowers/plans/TRACKER.md` (mark this plan
**Completed**, note commits). Then, per the design spec's pilot scope,
the actual Ticketmaster diagram conversion (Mermaid syntax → D2 syntax,
using `<D2Diagram>` instead of `<DiagramPanel>`, referencing
`CONTENT-GUIDE.md`'s new role-color table and `lib/diagram-icons.ts`)
is a content-authoring task, tracked separately in `TRACKER.md`'s
"Content-authoring tasks" table — not part of this SDD plan. Only once
that pilot is built and reviewed does "migrate the other 5 lessons"
become a decision to make, not before.
