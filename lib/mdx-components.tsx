import type { MDXComponents } from "mdx/types";
import { DiagramPanel } from "@/components/lesson/DiagramPanel";
import { QuizItem } from "@/components/lesson/QuizItem";
import { Rubric } from "@/components/lesson/Rubric";
import { SectionTracker } from "@/components/lesson/SectionTracker";

export const mdxComponents: MDXComponents = {
  DiagramPanel,
  QuizItem,
  Rubric,
  SectionTracker,
  h2: (props) => (
    <h2 className="mt-8 text-xl font-semibold text-foreground" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-6 text-lg font-semibold text-foreground" {...props} />
  ),
  p: (props) => <p className="mt-4 text-foreground" {...props} />,
  ul: (props) => (
    <ul className="mt-4 list-disc pl-6 text-foreground" {...props} />
  ),
  ol: (props) => (
    <ol className="mt-4 list-decimal pl-6 text-foreground" {...props} />
  ),
  li: (props) => <li className="mt-1" {...props} />,
  code: (props) => (
    <code
      className="rounded bg-card px-1 py-0.5 font-mono text-sm"
      {...props}
    />
  ),
  a: (props) => <a className="text-brand underline" {...props} />,
};
