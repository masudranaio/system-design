import { TableOfContents } from "./TableOfContents";

export function LessonShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[160rem] items-start gap-10">
      <article
        id="lesson-article"
        className="min-w-0 flex-1 rounded-lg border border-line bg-surface p-6 lg:p-8"
      >
        <h1 className="font-display text-[2.125rem] leading-[1.15] font-bold text-foreground">
          {title}
        </h1>
        <div className="mt-3 h-[3px] w-12 rounded-full bg-brand" />
        {children}
      </article>
      <TableOfContents containerId="lesson-article" />
    </div>
  );
}
