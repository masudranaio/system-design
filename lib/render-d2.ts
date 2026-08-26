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
    const compiled = await d2.compile(source, { options: { layout: "dagre" } });
    const svg = await d2.render(compiled.diagram, {
      ...compiled.renderOptions,
      pad: 40,
    });
    // D2 always draws a full-canvas background <rect> tagged "fill-N7"
    // (its own convention for the theme's canvas-background element,
    // stable across all built-in themes) as the first shape. Strip only
    // that element so the diagram stays transparent and inherits the
    // surrounding panel's theme-aware background (bg-card) instead of a
    // hardcoded white rect that reads as a stray white box in dark mode
    // — matches how Mermaid's SVGs already behave.
    const transparentSvg = svg.replace(/<rect[^>]*class="[^"]*fill-N7[^"]*"[^>]*\/>/, "");
    return { svg: transparentSvg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
