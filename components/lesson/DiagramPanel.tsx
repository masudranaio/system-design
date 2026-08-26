"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

interface DiagramPanelProps {
  title: string;
  type: "architecture" | "class" | "state" | "sequence" | "er";
  chart: string;
}

let mermaidInitialized = false;

export function DiagramPanel({ title, type, chart }: DiagramPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramId = useId().replace(/:/g, "-");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({ startOnLoad: false, theme: "neutral" });
      mermaidInitialized = true;
    }

    let cancelled = false;
    mermaid
      .render(`diagram-${diagramId}`, chart)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((renderError: Error) => {
        if (!cancelled) setError(renderError.message);
      });

    return () => {
      cancelled = true;
    };
  }, [chart, diagramId]);

  return (
    <figure
      className="rounded-md border border-line bg-card p-4"
      data-diagram-type={type}
    >
      <figcaption className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {type}
      </figcaption>
      <h4 className="mt-1 font-mono text-sm font-semibold text-foreground">
        {title}
      </h4>
      <div
        className="mt-3 overflow-x-auto"
        ref={containerRef}
        role="img"
        aria-label={title}
      />
      {error && (
        <p className="mt-2 text-sm text-destructive">
          Diagram failed to render: {error}
        </p>
      )}
    </figure>
  );
}
