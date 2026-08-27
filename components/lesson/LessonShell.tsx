import { TableOfContents } from "./TableOfContents";

export function LessonShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[110rem] items-start gap-10">
      <article id="lesson-article" className="min-w-0 max-w-[95ch] flex-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {children}
      </article>
      <TableOfContents containerId="lesson-article" />
    </div>
  );
}
