import type { MDXComponents } from "mdx/types";
import { DiagramPanel } from "@/components/lesson/DiagramPanel";
import { D2Diagram } from "@/components/lesson/D2Diagram";
import { QuizItem } from "@/components/lesson/QuizItem";
import { Rubric } from "@/components/lesson/Rubric";
import { CompareTable } from "@/components/lesson/CompareTable";
import { KeyStat } from "@/components/lesson/KeyStat";
import { Point } from "@/components/lesson/Point";

export const mdxComponents: MDXComponents = {
  DiagramPanel,
  D2Diagram,
  QuizItem,
  Rubric,
  CompareTable,
  KeyStat,
  Point,
  h2: (props) => (
    <h2
      className="mt-8 max-w-[100ch] text-[1.5rem] leading-[1.3] font-semibold text-foreground"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-6 max-w-[100ch] text-[1.25rem] leading-[1.35] font-semibold text-foreground"
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      className="mt-5 max-w-[100ch] text-[1.0625rem] leading-[1.4] font-semibold text-foreground"
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="mt-4 max-w-[100ch] text-[1.09375rem] leading-[1.7] text-foreground"
      {...props}
    />
  ),
  ul: (props) => (
    <ul className="mt-4 max-w-[100ch] list-disc pl-6 text-foreground" {...props} />
  ),
  ol: (props) => (
    <ol className="mt-4 max-w-[100ch] list-decimal pl-6 text-foreground" {...props} />
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
