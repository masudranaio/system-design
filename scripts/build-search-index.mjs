import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.name.endsWith(".mdx")) return [fullPath];
    return [];
  });
}

export function hrefFor(contentRoot, filePath) {
  const relative = path.relative(contentRoot, filePath).replace(/\\/g, "/");

  if (relative.startsWith("02-high-level-design/concepts/")) {
    return `/hld/${path.basename(relative, ".mdx")}`;
  }
  if (relative.startsWith("03-low-level-design/concepts/")) {
    return `/lld/${path.basename(relative, ".mdx")}`;
  }
  if (relative.startsWith("05-interview-prep/")) {
    return `/interview-prep/${path.basename(relative, ".mdx")}`;
  }

  const caseStudyMatch = relative.match(/^04-case-studies\/([^/]+)\/(hld|lld)\.mdx$/);
  if (caseStudyMatch) {
    return `/case-studies/${caseStudyMatch[1]}/${caseStudyMatch[2]}`;
  }

  return null;
}

export function buildSearchIndex(contentRoot) {
  const files = walk(contentRoot);
  return files
    .map((filePath) => {
      const href = hrefFor(contentRoot, filePath);
      if (!href) return null;
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      const title =
        typeof data.title === "string" ? data.title : path.basename(filePath, ".mdx");
      const excerpt = content.replace(/[#*`_>]/g, "").slice(0, 200).trim();
      return { title, href, excerpt };
    })
    .filter((entry) => entry !== null);
}

function main() {
  const contentRoot = path.join(process.cwd(), "content");
  const outputPath = path.join(process.cwd(), "public", "search-index.json");
  const index = buildSearchIndex(contentRoot);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`Wrote ${index.length} entries to ${path.relative(process.cwd(), outputPath)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
