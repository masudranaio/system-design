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
