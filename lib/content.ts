import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavLink[];
}

export interface Lesson {
  title: string;
  source: string;
}

const CONCEPT_SECTIONS = [
  {
    dir: "02-high-level-design/concepts",
    title: "High-Level Design",
    hrefPrefix: "/hld",
  },
  {
    dir: "03-low-level-design/concepts",
    title: "Low-Level Design",
    hrefPrefix: "/lld",
  },
  { dir: "05-interview-prep", title: "Interview Prep", hrefPrefix: "/interview-prep" },
];

function listMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .sort();
}

function readTitle(filePath: string, fallback: string): string {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  return typeof data.title === "string" ? data.title : fallback;
}

export function buildNavTree(contentRoot: string): NavSection[] {
  const conceptSections: NavSection[] = CONCEPT_SECTIONS.map(
    ({ dir, title, hrefPrefix }) => {
      const fullDir = path.join(contentRoot, dir);
      const items = listMdxFiles(fullDir).map((file) => {
        const slug = file.replace(/\.mdx$/, "");
        const filePath = path.join(fullDir, file);
        return { label: readTitle(filePath, slug), href: `${hrefPrefix}/${slug}` };
      });
      return { title, items };
    },
  );

  const caseStudiesDir = path.join(contentRoot, "04-case-studies");
  const caseStudyItems: NavLink[] = fs.existsSync(caseStudiesDir)
    ? fs
        .readdirSync(caseStudiesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap((entry) => {
          const systemDir = path.join(caseStudiesDir, entry.name);
          const links: NavLink[] = [];
          const hldPath = path.join(systemDir, "hld.mdx");
          const lldPath = path.join(systemDir, "lld.mdx");
          if (fs.existsSync(hldPath)) {
            links.push({
              label: `${readTitle(hldPath, entry.name)} (HLD)`,
              href: `/case-studies/${entry.name}/hld`,
            });
          }
          if (fs.existsSync(lldPath)) {
            links.push({
              label: `${readTitle(lldPath, entry.name)} (LLD)`,
              href: `/case-studies/${entry.name}/lld`,
            });
          }
          return links;
        })
    : [];

  return [...conceptSections, { title: "Case Studies", items: caseStudyItems }];
}

export function getLesson(filePath: string): Lesson | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const title =
    typeof data.title === "string" ? data.title : path.basename(filePath, ".mdx");
  return { title, source: content };
}
