"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  // D2's output <svg> carries a viewBox but no width/height attributes
  // (unlike Mermaid's, which sets its own inline max-width) — without a
  // cap, a plain block-level <svg> with only a viewBox stretches to fill
  // 100% of its container's width. For a tall/narrow diagram (D2 defaults
  // to top-to-bottom layout) that means a huge height, since the aspect
  // ratio is preserved: confirmed live, a 218x480 diagram in a ~1100px
  // panel rendered ~2600px tall, showing only its first node on screen.
  // Cap max-width to the diagram's own authored pixel width so it only
  // ever shrinks (for narrow viewports), never stretches past its
  // natural size — the same effect Mermaid gets automatically.
  const viewBox = svg.getAttribute("viewBox");
  const intrinsicWidth = viewBox ? Number(viewBox.split(/\s+/)[2]) : NaN;
  if (Number.isFinite(intrinsicWidth) && intrinsicWidth > 0) {
    svg.style.maxWidth = `${intrinsicWidth}px`;
  }
  svg.style.width = "100%";
  svg.style.height = "auto";
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

  // Runs on every render where svgMarkup changes, and also covers the
  // "svgMarkup is already non-null on the very first render" case (e.g.
  // D2Diagram, a Server Component that resolves its SVG before this
  // component ever mounts): a plain "inject during render" check against
  // containerRef.current doesn't work there because refs aren't attached
  // to the DOM until after that first render commits, and — unlike
  // DiagramPanel's async Mermaid effect — there's no later state update
  // to trigger a second render/injection attempt. Confirmed live against
  // the real dev server: the D2Diagram path silently rendered an empty
  // diagram without this effect.
  useEffect(() => {
    injectDiagram(containerRef.current, svgMarkup);
  }, [svgMarkup]);

  // Confirmed live (not caught by the mocked unit test): Base UI's
  // Dialog.Popup mounts its children into the DOM on a later render pass
  // than the `open` prop flip (its own internal open/animation-mount
  // sequencing) — a plain useRef + useEffect([fullscreenOpen, svgMarkup])
  // pairing fires before fullscreenContainerRef.current exists, so the
  // fullscreen diagram silently never rendered. A callback ref fires
  // exactly when React attaches (or detaches) that specific DOM node,
  // whenever that actually happens, so it can't lose this race.
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
