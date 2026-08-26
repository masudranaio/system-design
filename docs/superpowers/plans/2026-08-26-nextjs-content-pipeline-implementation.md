# Content Pipeline, MDX Rendering, and Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the infrastructure that turns files in `content/` into
rendered, navigable, searchable pages — `lib/content.ts`, MDX rendering,
the five dynamic lesson routes, a real (no longer stub) sidebar, and
static search. This is Plan 2 of 2 implementing
[2026-08-26-nextjs-mdx-app-migration-design.md](../specs/2026-08-26-nextjs-mdx-app-migration-design.md),
building on
[2026-08-26-nextjs-app-shell-implementation.md](2026-08-26-nextjs-app-shell-implementation.md)
(Plan 1 — must be complete and merged before this plan starts: it
provides the design tokens, `components/ui/button.tsx`,
`components/ui/checkbox.tsx`, and all `components/lesson/*`/`components/nav/*`
components this plan imports).

**Does not include:** authoring Ticketmaster's actual `hld.mdx`/`lld.mdx`
content. That's a content-research-and-writing task (like the
`CHECKLIST.md` work already done), not an engineering task with tests —
it follows CLAUDE.md's research-before-drafting workflow and gets its
own tracking, not a numbered task in this plan. See the plans tracker.

**Architecture:** `lib/content.ts` reads `content/` at request/build
time via Node's `fs` (sync calls — no async needed) and exposes pure,
directly-testable functions. MDX bodies render through
`next-mdx-remote-client`'s RSC entry point (chosen over `@next/mdx`
because our content lives outside `app/`, which `@next/mdx`'s file-based
routing doesn't support — verified live against the current package
registry before writing this plan, not assumed from memory). Search is
fully static: a build-time script writes `public/search-index.json`,
and the client queries it with `fuse.js` — no API route, no database.

**Tech Stack:** `next-mdx-remote-client` (RSC), `gray-matter`
(frontmatter), `fuse.js` (client-side fuzzy search), shadcn/ui's
`dialog` and `command` primitives (deferred from Plan 1 specifically
because nothing needed them until now).

**Spec:** [docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../specs/2026-08-26-nextjs-mdx-app-migration-design.md)

## Global Constraints

- **Never touch** `docs/`, `CLAUDE.md`, or `SYLLABUS.md`. `content/` IS
  touched by this plan (it's read by every task) but only ever
  **read**, never written — no task in this plan creates or edits an
  `.mdx` file under `content/`. Task 7's browser verification uses a
  throwaway fixture file that is explicitly deleted before the task
  ends (see Task 7) — never committed.
- Package manager is **pnpm** exclusively.
- The original migration spec's folder-structure sketch used an
  `app/(site)/` route group for nav chrome. Plan 1 didn't create that
  group — it wired `TopBar`/`Sidebar` directly into the root
  `app/layout.tsx` instead (simpler, since every route in this app
  wants the same chrome). This plan follows that: routes are flat under
  `app/` (`app/hld/[slug]/page.tsx`, not `app/(site)/hld/[slug]/page.tsx`).
- Every dynamic route reads `params` as a `Promise` and `await`s it
  (Next.js 16's async params convention, already confirmed against the
  installed version in Plan 1).
- Frontmatter's `title` field is the source of truth for a lesson's
  display title everywhere (nav, search index, page heading) — never
  derive a title from the filename except as a fallback when
  frontmatter is missing.

---

### Task 1: `lib/content.ts` — nav tree + lesson loading

**Files:**
- Create: `lib/content.ts`
- Test: `lib/content.test.ts`
- Modify: `package.json` (adds `gray-matter`)

**Interfaces:**
- Produces: `buildNavTree(contentRoot: string): NavSection[]` where
  `NavSection = { title: string; items: NavLink[] }` and
  `NavLink = { label: string; href: string }`. `getLesson(filePath: string): Lesson | null`
  where `Lesson = { title: string; source: string }` (`source` is the
  MDX body with frontmatter stripped). Task 3 (routes) calls `getLesson`
  directly with a constructed file path; Task 4 (Sidebar) calls
  `buildNavTree`.

- [ ] **Step 1: Add gray-matter**

```bash
pnpm add gray-matter
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildNavTree, getLesson } from "./content";

describe("content.ts", () => {
  let contentRoot: string;

  beforeAll(() => {
    contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), "content-test-"));
    fs.mkdirSync(path.join(contentRoot, "02-high-level-design/concepts"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(
        contentRoot,
        "02-high-level-design/concepts/HLD-01-scalability.mdx",
      ),
      "---\ntitle: Scalability & Core Metrics\n---\n\n## Problem framing\n\nContent.",
    );
    fs.mkdirSync(path.join(contentRoot, "04-case-studies/ticketmaster"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(contentRoot, "04-case-studies/ticketmaster/hld.mdx"),
      "---\ntitle: Ticketmaster\n---\n\nHLD body.",
    );
  });

  afterAll(() => {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  });

  it("builds nav sections from frontmatter titles, with an empty array for a missing module dir", () => {
    const nav = buildNavTree(contentRoot);

    const hld = nav.find((s) => s.title === "High-Level Design");
    expect(hld?.items).toEqual([
      { label: "Scalability & Core Metrics", href: "/hld/HLD-01-scalability" },
    ]);

    const lld = nav.find((s) => s.title === "Low-Level Design");
    expect(lld?.items).toEqual([]);

    const caseStudies = nav.find((s) => s.title === "Case Studies");
    expect(caseStudies?.items).toEqual([
      { label: "Ticketmaster (HLD)", href: "/case-studies/ticketmaster/hld" },
    ]);
  });

  it("returns null for a lesson file that doesn't exist", () => {
    expect(getLesson(path.join(contentRoot, "nope.mdx"))).toBeNull();
  });

  it("returns the frontmatter title and the MDX source body (frontmatter stripped) for a lesson that exists", () => {
    const lesson = getLesson(
      path.join(
        contentRoot,
        "02-high-level-design/concepts/HLD-01-scalability.mdx",
      ),
    );
    expect(lesson?.title).toBe("Scalability & Core Metrics");
    expect(lesson?.source.trim()).toBe("## Problem framing\n\nContent.");
  });
});
```

- [ ] **Step 3: Run the test, confirm it fails**

Run: `pnpm test content.test`
Expected: FAIL — `./content` module not found.

- [ ] **Step 4: Write `lib/content.ts`**

```ts
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
```

- [ ] **Step 5: Run the test, confirm it passes**

Run: `pnpm test content.test`
Expected: PASS (all 3 assertions).

- [ ] **Step 6: Commit**

```bash
git add lib/content.ts lib/content.test.ts package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Add lib/content.ts: nav tree + lesson loading from content/

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `lib/mdx-components.tsx` — MDX element mapping

**Files:**
- Create: `lib/mdx-components.tsx`

**Interfaces:**
- Consumes: `DiagramPanel`, `QuizItem`, `Rubric`, `SectionTracker` from
  `components/lesson/*` (Plan 1)
- Produces: `mdxComponents: MDXComponents` (from the `mdx/types`
  package, bundled with `@mdx-js/mdx`, itself a transitive dependency of
  `next-mdx-remote-client` — no separate install needed). Task 3 (routes)
  passes this to every `<MDXRemote components={mdxComponents} .../>` call.
  No automated test — this is a declarative mapping table with no
  branching logic; Task 7's browser verification is what actually proves
  it renders correctly.

- [ ] **Step 1: Write `lib/mdx-components.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify the project still type-checks**

```bash
pnpm build
```

Expected: succeeds (this file isn't imported by anything yet — Task 3
wires it in — so this step only confirms the file itself has no type
errors).

- [ ] **Step 3: Commit**

```bash
git add lib/mdx-components.tsx
git commit -m "$(cat <<'EOF'
Add lib/mdx-components.tsx: MDX element and lesson-widget mapping

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Dynamic lesson routes

**Files:**
- Create: `app/hld/[slug]/page.tsx`
- Create: `app/lld/[slug]/page.tsx`
- Create: `app/case-studies/[system]/hld/page.tsx`
- Create: `app/case-studies/[system]/lld/page.tsx`
- Create: `app/interview-prep/[slug]/page.tsx`
- Modify: `package.json` (adds `next-mdx-remote-client`)

**Interfaces:**
- Consumes: `getLesson` from `@/lib/content` (Task 1), `mdxComponents`
  from `@/lib/mdx-components` (Task 2)
- Produces: nothing consumed by a later task in this plan — Task 7's
  browser verification is what exercises these.

- [ ] **Step 1: Add next-mdx-remote-client**

```bash
pnpm add next-mdx-remote-client
```

- [ ] **Step 2: Write `app/hld/[slug]/page.tsx`**

```tsx
import path from "node:path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getLesson } from "@/lib/content";
import { mdxComponents } from "@/lib/mdx-components";

export default async function HldLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const filePath = path.join(
    process.cwd(),
    "content/02-high-level-design/concepts",
    `${slug}.mdx`,
  );
  const lesson = getLesson(filePath);
  if (!lesson) notFound();

  return (
    <article className="mx-auto max-w-[68ch]">
      <h1 className="text-2xl font-semibold text-foreground">{lesson.title}</h1>
      <MDXRemote source={lesson.source} components={mdxComponents} />
    </article>
  );
}
```

- [ ] **Step 3: Write `app/lld/[slug]/page.tsx`**

```tsx
import path from "node:path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getLesson } from "@/lib/content";
import { mdxComponents } from "@/lib/mdx-components";

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
    <article className="mx-auto max-w-[68ch]">
      <h1 className="text-2xl font-semibold text-foreground">{lesson.title}</h1>
      <MDXRemote source={lesson.source} components={mdxComponents} />
    </article>
  );
}
```

- [ ] **Step 4: Write `app/case-studies/[system]/hld/page.tsx`**

```tsx
import path from "node:path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getLesson } from "@/lib/content";
import { mdxComponents } from "@/lib/mdx-components";

export default async function CaseStudyHldPage({
  params,
}: {
  params: Promise<{ system: string }>;
}) {
  const { system } = await params;
  const filePath = path.join(process.cwd(), "content/04-case-studies", system, "hld.mdx");
  const lesson = getLesson(filePath);
  if (!lesson) notFound();

  return (
    <article className="mx-auto max-w-[68ch]">
      <h1 className="text-2xl font-semibold text-foreground">{lesson.title}</h1>
      <MDXRemote source={lesson.source} components={mdxComponents} />
    </article>
  );
}
```

- [ ] **Step 5: Write `app/case-studies/[system]/lld/page.tsx`**

```tsx
import path from "node:path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getLesson } from "@/lib/content";
import { mdxComponents } from "@/lib/mdx-components";

export default async function CaseStudyLldPage({
  params,
}: {
  params: Promise<{ system: string }>;
}) {
  const { system } = await params;
  const filePath = path.join(process.cwd(), "content/04-case-studies", system, "lld.mdx");
  const lesson = getLesson(filePath);
  if (!lesson) notFound();

  return (
    <article className="mx-auto max-w-[68ch]">
      <h1 className="text-2xl font-semibold text-foreground">{lesson.title}</h1>
      <MDXRemote source={lesson.source} components={mdxComponents} />
    </article>
  );
}
```

- [ ] **Step 6: Write `app/interview-prep/[slug]/page.tsx`**

```tsx
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
```

- [ ] **Step 7: Verify the build succeeds**

```bash
pnpm build
```

Expected: succeeds. (No automated route-rendering test here — current
React Server Component testing tooling doesn't support async Server
Components well; Task 7's Playwright pass against a throwaway fixture
file is the real verification these routes work end to end.)

- [ ] **Step 8: Commit**

```bash
git add app/hld app/lld app/case-studies app/interview-prep package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Add dynamic lesson routes (hld, lld, case-studies, interview-prep)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Wire the real nav tree into `Sidebar`

**Files:**
- Modify: `components/nav/Sidebar.tsx` (replaces `STUB_NAV` from Plan 1)
- Modify: `components/nav/Sidebar.test.tsx` (replaces Plan 1's version,
  which tested `STUB_NAV`)

**Interfaces:**
- Consumes: `buildNavTree` from `@/lib/content` (Task 1)
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `components/nav/Sidebar.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

vi.mock("@/lib/content", () => ({
  buildNavTree: () => [
    {
      title: "High-Level Design",
      items: [
        { label: "Scalability & Core Metrics", href: "/hld/HLD-01-scalability" },
      ],
    },
    { title: "Case Studies", items: [] },
  ],
}));

describe("Sidebar", () => {
  it("renders a section's links, and a fallback message for an empty section", () => {
    render(<Sidebar />);

    const link = screen.getByRole("link", {
      name: "Scalability & Core Metrics",
    });
    expect(link).toHaveAttribute("href", "/hld/HLD-01-scalability");
    expect(screen.getByText("No lessons yet")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test Sidebar`
Expected: FAIL — `Sidebar` still renders `STUB_NAV`, so "No lessons yet"
doesn't appear and the mocked link isn't rendered.

- [ ] **Step 3: Replace `components/nav/Sidebar.tsx`**

```tsx
import Link from "next/link";
import path from "node:path";
import { buildNavTree } from "@/lib/content";

export function Sidebar() {
  const contentRoot = path.join(process.cwd(), "content");
  const sections = buildNavTree(contentRoot);

  return (
    <nav
      className="w-56 shrink-0 border-r border-line px-4 py-6"
      aria-label="Course navigation"
    >
      {sections.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {section.title}
          </p>
          {section.items.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No lessons yet</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm test Sidebar`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/nav/Sidebar.tsx components/nav/Sidebar.test.tsx
git commit -m "$(cat <<'EOF'
Wire Sidebar to the real content/ nav tree, replacing the Plan 1 stub

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Static search index

**Files:**
- Create: `scripts/build-search-index.mjs`
- Test: `scripts/build-search-index.test.ts`
- Modify: `package.json` (adds `fuse.js`; adds a `prebuild` script)

**Interfaces:**
- Produces: `hrefFor(contentRoot: string, filePath: string): string | null`
  and `buildSearchIndex(contentRoot: string): SearchEntry[]` (named
  exports, both pure and directly testable) where
  `SearchEntry = { title: string; href: string; excerpt: string }`.
  Running the file directly (`node scripts/build-search-index.mjs`)
  writes `public/search-index.json` — Task 6's `SearchDialog` fetches
  that file at runtime; nothing in this plan imports the script's
  exports at runtime, only in its own test.

- [ ] **Step 1: Add fuse.js**

```bash
pnpm add fuse.js
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSearchIndex, hrefFor } from "./build-search-index.mjs";

describe("build-search-index", () => {
  let contentRoot: string;

  beforeAll(() => {
    contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), "search-index-test-"));
    fs.mkdirSync(path.join(contentRoot, "02-high-level-design/concepts"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(
        contentRoot,
        "02-high-level-design/concepts/HLD-01-scalability.mdx",
      ),
      "---\ntitle: Scalability & Core Metrics\n---\n\nAvailability, latency, and CAP theorem.",
    );
    fs.mkdirSync(path.join(contentRoot, "04-case-studies/ticketmaster"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(contentRoot, "04-case-studies/ticketmaster/hld.mdx"),
      "---\ntitle: Ticketmaster\n---\n\nSeat-hold and stampede handling.",
    );
  });

  afterAll(() => {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  });

  it("maps a concept lesson path to its route href", () => {
    const filePath = path.join(
      contentRoot,
      "02-high-level-design/concepts/HLD-01-scalability.mdx",
    );
    expect(hrefFor(contentRoot, filePath)).toBe("/hld/HLD-01-scalability");
  });

  it("maps a case study hld.mdx to its route href", () => {
    const filePath = path.join(contentRoot, "04-case-studies/ticketmaster/hld.mdx");
    expect(hrefFor(contentRoot, filePath)).toBe("/case-studies/ticketmaster/hld");
  });

  it("builds one index entry per mdx file, with title, href, and a plain-text excerpt", () => {
    const index = buildSearchIndex(contentRoot);
    expect(index).toHaveLength(2);

    const ticketmaster = index.find(
      (entry) => entry.href === "/case-studies/ticketmaster/hld",
    );
    expect(ticketmaster?.title).toBe("Ticketmaster");
    expect(ticketmaster?.excerpt).toContain("Seat-hold and stampede handling.");
  });
});
```

- [ ] **Step 3: Run the test, confirm it fails**

Run: `pnpm test build-search-index`
Expected: FAIL — `./build-search-index.mjs` module not found.

- [ ] **Step 4: Write `scripts/build-search-index.mjs`**

```js
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
      const excerpt = content.replace(/[#*`_>-]/g, "").slice(0, 200).trim();
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
```

- [ ] **Step 5: Run the test, confirm it passes**

Run: `pnpm test build-search-index`
Expected: PASS (all 3 assertions).

- [ ] **Step 6: Wire it as a prebuild step**

In `package.json`'s `"scripts"` block, add:

```json
"prebuild": "node scripts/build-search-index.mjs"
```

- [ ] **Step 7: Verify it runs standalone**

```bash
node scripts/build-search-index.mjs
cat public/search-index.json
```

Expected: prints "Wrote 0 entries..." (no `.mdx` files exist under
`content/` yet) and `public/search-index.json` contains `[]`. This is
correct for the current state of the repo.

- [ ] **Step 8: Commit**

```bash
git add scripts package.json pnpm-lock.yaml public/search-index.json
git commit -m "$(cat <<'EOF'
Add static search index build script

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `SearchDialog` component

**Files:**
- Create: `components/search/SearchDialog.tsx`
- Test: `components/search/SearchDialog.test.tsx`
- Modify: `components/nav/TopBar.tsx` (adds `<SearchDialog />`)

**Interfaces:**
- Consumes: shadcn `dialog`/`command` primitives (added this task —
  deferred from Plan 1), `fuse.js` (Task 5), the
  `public/search-index.json` shape from Task 5
  (`{ title, href, excerpt }[]`)
- Produces: nothing consumed elsewhere in this plan.

- [ ] **Step 1: Add the shadcn dialog and command primitives**

```bash
pnpm dlx shadcn@latest add dialog command --yes --cwd .
```

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchDialog } from "./SearchDialog";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockClear();
  global.fetch = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve([
        {
          title: "Scalability & Core Metrics",
          href: "/hld/HLD-01-scalability",
          excerpt: "Availability and CAP theorem.",
        },
      ]),
  }) as unknown as typeof fetch;
});

describe("SearchDialog", () => {
  it("opens on trigger click, lists a fetched entry, and navigates to it on select", async () => {
    const user = userEvent.setup();
    render(<SearchDialog />);

    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByText("Scalability & Core Metrics")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Scalability & Core Metrics"));
    expect(push).toHaveBeenCalledWith("/hld/HLD-01-scalability");
  });
});
```

- [ ] **Step 3: Run the test, confirm it fails**

Run: `pnpm test SearchDialog`
Expected: FAIL — `./SearchDialog` module not found.

- [ ] **Step 4: Write `components/search/SearchDialog.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchEntry {
  title: string;
  href: string;
  excerpt: string;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/search-index.json")
      .then((res) => res.json())
      .then((data: SearchEntry[]) => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fuse = new Fuse(entries, { keys: ["title", "excerpt"], threshold: 0.35 });
  const results = query.trim() === "" ? entries : fuse.search(query).map((r) => r.item);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Search
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search lessons..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No lessons found.</CommandEmpty>
          <CommandGroup heading="Lessons">
            {results.map((entry) => (
              <CommandItem
                key={entry.href}
                value={entry.title}
                onSelect={() => {
                  setOpen(false);
                  router.push(entry.href);
                }}
              >
                {entry.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

- [ ] **Step 5: Run the test, confirm it passes**

Run: `pnpm test SearchDialog`
Expected: PASS.

- [ ] **Step 6: Wire `SearchDialog` into `TopBar`**

Replace `components/nav/TopBar.tsx` in full:

```tsx
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SearchDialog } from "@/components/search/SearchDialog";

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-3">
      <Link
        href="/"
        className="font-mono text-sm font-semibold uppercase tracking-wide text-foreground"
      >
        System Design Course
      </Link>
      <div className="flex items-center gap-2">
        <SearchDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Run the full test suite and build**

```bash
pnpm test
pnpm build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add components/search components/nav/TopBar.tsx package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Add SearchDialog and wire it into TopBar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: End-to-end verification with a throwaway fixture lesson

**Files:**
- Create, then delete before this task ends: a temporary fixture file
  `content/02-high-level-design/concepts/ZZ-pipeline-smoke-test.mdx`
  (never committed)

**Interfaces:**
- Consumes: the entire pipeline built in Tasks 1-6.
- Produces: nothing — this is the plan's final verification gate.

- [ ] **Step 1: Write a temporary fixture lesson**

This is the only way to prove the MDX pipeline genuinely renders content
end-to-end (real Mermaid diagram, real quiz interaction, real rubric) —
unit tests already cover the plumbing in isolation, but nothing so far
has rendered a real `.mdx` file through a real route in a real browser.

Create `content/02-high-level-design/concepts/ZZ-pipeline-smoke-test.mdx`:

```mdx
---
title: Pipeline Smoke Test
---

## Problem framing

This lesson exists only to verify the MDX pipeline end-to-end. It is
deleted at the end of this task and never committed.

<DiagramPanel title="Sample flow" type="architecture" chart={`graph LR
  Client --> Server`} />

<QuizItem question="Is this file committed?" answer="No -- deleted before this task ends." />

## Practice & Self-Check

<Rubric items={["Diagram rendered", "Quiz revealed an answer", "Nav link worked"]} />
```

- [ ] **Step 2: Rebuild the search index and start the dev server**

```bash
node scripts/build-search-index.mjs
pnpm dev &
```

- [ ] **Step 3: Verify via browser (Playwright)**

Navigate to `http://localhost:3000` and confirm:
- The sidebar's "High-Level Design" section now shows a "Pipeline Smoke
  Test" link (proves `Sidebar` + `buildNavTree` pick up real files)

Click that link, navigate to `/hld/ZZ-pipeline-smoke-test`, and confirm:
- The page heading reads "Pipeline Smoke Test" (frontmatter title, not
  the slug)
- The `DiagramPanel` renders an actual SVG diagram, not raw Mermaid text
- Clicking the `QuizItem`'s reveal button shows its answer
- Checking a `Rubric` item updates the self-score band text
- Toggle dark mode: confirm the whole page (including the rendered
  diagram) switches themes together

Open the search dialog (click "Search" in the top bar, or Cmd/Ctrl+K),
type "smoke", and confirm:
- "Pipeline Smoke Test" appears in the results
- Clicking it navigates to `/hld/ZZ-pipeline-smoke-test`

Navigate to `/hld/does-not-exist` and confirm Next.js's default 404 page
renders (proves the `notFound()` call in the route works).

If anything looks or behaves wrong, fix the underlying code (in
`lib/content.ts`, `lib/mdx-components.tsx`, the routes, `Sidebar`, or
`SearchDialog`) before proceeding — do not adjust the fixture file to
work around a real bug.

- [ ] **Step 4: Stop the dev server**

```bash
kill %1
```

- [ ] **Step 5: Delete the fixture file and rebuild the search index**

```bash
rm content/02-high-level-design/concepts/ZZ-pipeline-smoke-test.mdx
node scripts/build-search-index.mjs
git status
```

Expected: `git status` shows `content/` as clean (no trace of the
fixture — it was never `git add`ed) and `public/search-index.json`
modified back to `[]`.

- [ ] **Step 6: Run the full test suite and build one final time**

```bash
pnpm test
pnpm build
```

Expected: all tests pass, build succeeds, with `content/` back to its
real (currently empty-of-lessons) state.

- [ ] **Step 7: Commit**

```bash
git add public/search-index.json
git commit -m "$(cat <<'EOF'
Verify content pipeline end-to-end with a throwaway fixture lesson

Confirmed via browser: real MDX renders through the dynamic routes,
DiagramPanel/QuizItem/Rubric all work with real content, search finds
and navigates to a real lesson, both themes render correctly, and
notFound() fires for a missing slug. Fixture file was never committed.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
