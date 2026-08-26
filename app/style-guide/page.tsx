import { QuizItem } from "@/components/lesson/QuizItem";
import { Rubric } from "@/components/lesson/Rubric";
import { DiagramPanel } from "@/components/lesson/DiagramPanel";
import { D2Diagram } from "@/components/lesson/D2Diagram";

export default function StyleGuidePage() {
  return (
    <div className="mx-auto flex max-w-[68ch] flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">Style guide</h1>

      <DiagramPanel
        title="Sample request flow"
        type="architecture"
        chart={"graph LR\n  Client --> Gateway --> Service"}
      />

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

      <QuizItem
        question="Why does DiagramPanel take a chart string instead of MDX children?"
        answer="Extracting Mermaid source from MDX-rendered children reliably needs a custom remark/rehype plugin -- a plain string prop is simpler and just as capable."
      />

      <Rubric
        items={[
          "Covers the six-part lesson template",
          "Diagrams render in both themes",
          "Quiz and rubric interactions work with keyboard only",
        ]}
      />
    </div>
  );
}
