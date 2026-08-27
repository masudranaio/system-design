"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw, Scan } from "lucide-react";
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
import type { DiagramRole } from "@/lib/diagram-palette";
import { DiagramLegend } from "@/components/lesson/DiagramLegend";

export type DiagramType = "architecture" | "class" | "state" | "sequence" | "er";

const TYPE_ACCENT: Record<DiagramType, string> = {
  architecture: "text-track-hld",
  state: "text-track-hld",
  sequence: "text-track-lld",
  class: "text-track-interview",
  er: "text-track-interview",
};

function injectDiagram(
  container: HTMLDivElement | null,
  svgMarkup: string | null,
  svgRef?: React.RefObject<SVGSVGElement | null>,
) {
  if (!container || !svgMarkup) return;
  container.innerHTML = svgMarkup;
  const svg = container.querySelector("svg");
  if (!svg) return;
  svg.classList.add("diagram-animate");
  applyDiagramRoleClasses(svg);

  // D2's output <svg> carries a viewBox but no width/height attributes
  // (unlike Mermaid's, which sets its own inline max-width) — without an
  // explicit width, a plain block-level <svg> with only a viewBox
  // stretches to fill 100% of its container's width, and since the
  // aspect ratio is preserved that also scales its height (and its text)
  // by the same factor. That cuts both ways and both were confirmed live:
  // a tall/narrow diagram (218x480) stretched to ~2600px tall in an
  // ~1100px panel; a wide diagram (2700+px) shrank down to fit a
  // ~1200px panel, scaling its labels down ~60% to the point of being
  // unreadable without using the zoom controls below. Rendering the SVG
  // at its own authored pixel width — never stretched, never shrunk —
  // fixes both: the pan/zoom wrapper's overflow-x-auto (and the zoom
  // controls) handle a diagram wider than its panel, exactly like the
  // fullscreen dialog already does.
  const viewBox = svg.getAttribute("viewBox");
  const intrinsicWidth = viewBox ? Number(viewBox.split(/\s+/)[2]) : NaN;
  svg.style.width =
    Number.isFinite(intrinsicWidth) && intrinsicWidth > 0
      ? `${intrinsicWidth}px`
      : "100%";
  svg.style.height = "auto";

  // A diagram's drawn content doesn't always start at (0,0) of its own
  // canvas — e.g. a hub-and-spoke layout where one branch's nodes sit
  // much further down than another's leaves the top of the canvas
  // blank. The panel's scroll container defaults to showing (0,0),
  // which for a diagram like that opens on empty space instead of any
  // node. Scroll to the SVG's actual content bounding box on load so
  // the panel opens on something drawn, not the diagram's blank
  // margin — getBBox() is in the same user-coordinate units as the
  // viewBox, which is what svg.style.width above maps 1:1 to CSS
  // pixels, so it can be used directly as a scroll offset.
  const scrollParent = container.parentElement;
  if (scrollParent) {
    try {
      const bbox = svg.getBBox();
      scrollParent.scrollLeft = Math.max(0, bbox.x - 16);
      scrollParent.scrollTop = Math.max(0, bbox.y - 16);
    } catch {
      // getBBox can throw if the SVG isn't laid out yet (e.g. a
      // display:none ancestor) — fall back to the default (0, 0) scroll.
    }
  }

  if (svgRef) svgRef.current = svg;
}

function DiagramToolbar({
  panZoom,
  scrollRef,
  svgRef,
  onExpand,
}: {
  panZoom: UsePanZoomResult;
  scrollRef?: React.RefObject<HTMLElement | null>;
  svgRef?: React.RefObject<SVGSVGElement | null>;
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
      {scrollRef && svgRef && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Fit to width"
          onClick={() => panZoom.fitToWidth(scrollRef.current, svgRef.current)}
        >
          <Scan className="size-3.5" aria-hidden="true" />
        </Button>
      )}
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
  roles,
  error,
}: {
  title: string;
  type: DiagramType;
  svgMarkup: string | null;
  roles?: DiagramRole[];
  error?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const svgMarkupRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fullscreenScrollRef = useRef<HTMLDivElement | null>(null);
  const fullscreenSvgRef = useRef<SVGSVGElement | null>(null);
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
    injectDiagram(containerRef.current, svgMarkup, svgRef);
  }, [svgMarkup]);

  // Kept in sync with the svgMarkup prop so the fullscreen container's
  // callback ref (below) can read the latest markup whenever it fires,
  // without needing svgMarkup itself as a dependency.
  useEffect(() => {
    svgMarkupRef.current = svgMarkup;
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
    if (node) injectDiagram(node, svgMarkupRef.current, fullscreenSvgRef);
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
      {(type === "architecture" || type === "class") && <DiagramLegend roles={roles} />}
      <div className="relative mt-3">
        <DiagramToolbar
          panZoom={panZoom}
          scrollRef={scrollRef}
          svgRef={svgRef}
          onExpand={() => setFullscreenOpen(true)}
        />
        <div className="overflow-hidden rounded-md border border-line">
          <div
            ref={scrollRef}
            className="max-h-[40rem] cursor-grab overflow-auto bg-diagram-canvas active:cursor-grabbing"
            onWheel={panZoom.bind.onWheel}
            onPointerDown={panZoom.bind.onPointerDown}
            onPointerMove={panZoom.bind.onPointerMove}
            onPointerUp={panZoom.bind.onPointerUp}
          >
            {/* The scale/pan transform must live on this content div, not
                on the overflow-auto scroll container above — a transform
                on the same element that owns the scroll clipping is
                self-referential: it repaints the whole clipped viewport
                (and its content) uniformly smaller/larger without ever
                changing what fraction of the content is visible.
                Confirmed live: with the transform on the scroll div,
                scale changes left scrollWidth/clientWidth unchanged, so
                zoom-out (and fit-to-width) never revealed more of a wide
                diagram — just a smaller repaint of the same crop.
                Transforming this inner div instead lets the browser
                compute the scroll container's scrollable-overflow region
                from the transformed content, so zoom and fit-to-width
                actually change how much is visible. */}
            <div
              ref={containerRef}
              role="img"
              aria-label={title}
              className="origin-top-left"
              style={{ transform: panZoom.transform }}
            />
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
          <DiagramToolbar
            panZoom={fullscreenPanZoom}
            scrollRef={fullscreenScrollRef}
            svgRef={fullscreenSvgRef}
          />
          <div
            ref={fullscreenScrollRef}
            className="max-h-[75vh] cursor-grab overflow-auto bg-diagram-canvas active:cursor-grabbing"
            onWheel={fullscreenPanZoom.bind.onWheel}
            onPointerDown={fullscreenPanZoom.bind.onPointerDown}
            onPointerMove={fullscreenPanZoom.bind.onPointerMove}
            onPointerUp={fullscreenPanZoom.bind.onPointerUp}
          >
            {/* Same reasoning as the inline panel above: the transform
                must stay on this content div, not on the overflow-auto
                scroll container it sits inside — applying it to the
                scroll container itself is self-referential and never
                changes what fraction of the diagram is visible (confirmed
                live). */}
            <div
              ref={setFullscreenContainer}
              role="img"
              aria-label={title}
              className="origin-top-left"
              style={{ transform: fullscreenPanZoom.transform }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}
