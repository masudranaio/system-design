import { SectionTracker } from "@/components/lesson/SectionTracker";
import { QuizItem } from "@/components/lesson/QuizItem";
import { Rubric } from "@/components/lesson/Rubric";
import { DiagramPanel } from "@/components/lesson/DiagramPanel";

export default function StyleGuidePage() {
  return (
    <div className="mx-auto flex max-w-[68ch] flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">Style guide</h1>

      <SectionTracker
        sections={["Problem framing", "Core content", "Trade-offs"]}
        active="Core content"
      />

      <DiagramPanel
        title="Sample request flow"
        type="architecture"
        chart={"graph LR\n  Client --> Gateway --> Service"}
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
