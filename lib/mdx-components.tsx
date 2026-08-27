import type { MDXComponents } from "mdx/types";
import { DiagramPanel } from "@/components/lesson/DiagramPanel";
import { D2Diagram } from "@/components/lesson/D2Diagram";
import { QuizItem } from "@/components/lesson/QuizItem";
import { Rubric } from "@/components/lesson/Rubric";
import { CompareTable } from "@/components/lesson/CompareTable";
import { KeyStat } from "@/components/lesson/KeyStat";
import { Point } from "@/components/lesson/Point";
import { Stage } from "@/components/lesson/Stage";
import { StackOptions } from "@/components/lesson/StackOptions";

export const mdxComponents: MDXComponents = {
  DiagramPanel,
  D2Diagram,
  QuizItem,
  Rubric,
  CompareTable,
  KeyStat,
  Point,
  Stage,
  StackOptions,
  h2: (props) => (
    <h2 className="mt-10 max-w-[90ch] scroll-mt-24 text-[1.625rem] leading-[1.25] font-semibold text-foreground" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-7 max-w-[90ch] scroll-mt-24 text-[1.25rem] leading-[1.35] font-semibold text-foreground" {...props} />
  ),
  h4: (props) => (
    <h4 className="mt-5 max-w-[90ch] text-[1.0625rem] leading-[1.4] font-semibold text-foreground" {...props} />
  ),
  p: (props) => (
    <p className="mt-4 max-w-[90ch] text-[1.0625rem] leading-[1.75] text-foreground" {...props} />
  ),
  ul: (props) => <ul className="mt-4 max-w-[90ch] list-disc pl-6 marker:text-brand" {...props} />,
  ol: (props) => <ol className="mt-4 max-w-[90ch] list-decimal pl-6 marker:text-ink-muted" {...props} />,
  li: (props) => <li className="mt-1.5 pl-1" {...props} />,
  code: (props) => (
    <code className="rounded-sm border border-line bg-sidebar-surface px-1.5 py-0.5 font-mono text-[0.9375rem] font-medium" {...props} />
  ),
  a: (props) => (
    <a className="font-medium text-brand underline decoration-brand/40 decoration-2 underline-offset-2 transition-colors hover:decoration-brand" {...props} />
  ),
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  table: (props) => (
    <div className="panel-breakout mt-6 overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-[0.9375rem] tabular-nums" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-sidebar-surface" {...props} />,
  th: (props) => (
    <th className="border-b border-line px-3 py-2.5 text-left font-mono text-xs font-semibold tracking-wide text-ink-muted uppercase" {...props} />
  ),
  td: (props) => (
    <td className="border-b border-line px-3 py-2.5 align-top text-foreground last:border-b-0" {...props} />
  ),
  tr: (props) => <tr className="even:bg-ground/60" {...props} />,
  blockquote: (props) => (
    <blockquote className="mt-5 max-w-[90ch] border-l-[3px] border-brand bg-brand-soft px-4 py-3 text-foreground" {...props} />
  ),
};
