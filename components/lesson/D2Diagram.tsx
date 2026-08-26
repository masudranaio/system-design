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
