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
