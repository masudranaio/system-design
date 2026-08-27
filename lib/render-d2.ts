import { D2 } from "@terrastruct/d2";
import { retintD2Svg, type DiagramRole } from "./diagram-palette";

export type RenderD2Result =
  | { svg: string; roles: DiagramRole[] }
  | { error: string };

export async function renderD2(source: string): Promise<RenderD2Result> {
  try {
    // A shared D2 instance is not safe under concurrent compile()/render()
    // calls: React renders sibling Server Components (each lesson's
    // multiple <D2Diagram>s) concurrently, and calling into one WASM
    // instance from several in-flight calls at once deadlocks — confirmed
    // live (9 concurrent calls against one shared instance: only 1 of 9
    // ever returned, even after 30s). A fresh instance per call costs an
    // extra ~1-2s of WASM instantiation but renders correctly and stays
    // fast in aggregate (9 diagrams, each its own instance, all resolved
    // concurrently in ~2.3s total).
    const d2 = new D2();
    // "elk" routes edges on right angles instead of dagre's diagonals,
    // which is the single biggest readability difference in a dense
    // architecture diagram (see spec §5.4).
    const compiled = await d2.compile(source, { options: { layout: "elk" } });
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
    return retintD2Svg(transparentSvg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
