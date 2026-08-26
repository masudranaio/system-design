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
    return { svg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
