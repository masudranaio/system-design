import path from "node:path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import rehypeSlug from "rehype-slug";
import { getLesson } from "@/lib/content";
import { mdxComponents } from "@/lib/mdx-components";
import { LessonShell } from "@/components/lesson/LessonShell";

export default async function LldLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const filePath = path.join(
    process.cwd(),
    "content/03-low-level-design/concepts",
    `${slug}.mdx`,
  );
  const lesson = getLesson(filePath);
  if (!lesson) notFound();

  return (
    <LessonShell title={lesson.title}>
      <MDXRemote
        source={lesson.source}
        components={mdxComponents}
        options={{ mdxOptions: { rehypePlugins: [rehypeSlug] } }}
      />
    </LessonShell>
  );
}
