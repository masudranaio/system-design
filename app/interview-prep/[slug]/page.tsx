import path from "node:path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getLesson } from "@/lib/content";
import { mdxComponents } from "@/lib/mdx-components";

export default async function InterviewPrepPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "content/05-interview-prep", `${slug}.mdx`);
  const lesson = getLesson(filePath);
  if (!lesson) notFound();

  return (
    <article className="mx-auto max-w-[68ch]">
      <h1 className="text-2xl font-semibold text-foreground">{lesson.title}</h1>
      <MDXRemote source={lesson.source} components={mdxComponents} />
    </article>
  );
}
