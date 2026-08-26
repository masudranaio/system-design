"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
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

// Mermaid's "base" theme runs these values through khroma (invert/lighten
// etc.) at mermaid.initialize() time to derive secondary colors — khroma
// can only parse literal colors (hex/rgb/hsl), not CSS custom properties
// or color-mix(), so `var(--color-*)` here throws "Unsupported color
// format" and crashes the whole render (confirmed live: the case-study
// page hit Next's runtime-error overlay with zero nodes rendered).
// These are literal light-theme values mirroring globals.css's :root
// tokens (--color-brand, --color-surface, --color-ink, --color-line,
// --color-ink-muted); dark-theme adaptation and role coloring both
// happen afterwards via plain CSS in globals.css (.diagram-animate /
// .diagram-role-*), which operates on the rendered SVG's actual
// fill/stroke and freely uses var(--color-*) since it's regular CSS,
// not khroma.
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
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const diagramId = useId().replace(/:/g, "-");
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  // Mirrors svgMarkup for the fullscreen callback ref below, which fires
  // outside the normal render/effect cycle and would otherwise close
  // over a stale (often null) svgMarkup value.
  const svgMarkupRef = useRef<string | null>(null);
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
    svgMarkupRef.current = svgMarkup;
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

  // Fallback for the (rarer) case where the dialog is already open and
  // svgMarkup changes afterwards — the callback ref above only fires on
  // mount/unmount, not on every svgMarkup update.
  useEffect(() => {
    if (fullscreenOpen && fullscreenContainerRef.current) {
      injectDiagram(fullscreenContainerRef.current, svgMarkup);
    }
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
            <div ref={setFullscreenContainer} role="img" aria-label={title} />
          </div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}
