import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSearchIndex, hrefFor } from "./build-search-index.mjs";

interface SearchEntry {
  title: string;
  href: string;
  excerpt: string;
}

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
      (entry: SearchEntry) => entry.href === "/case-studies/ticketmaster/hld",
    );
    expect(ticketmaster?.title).toBe("Ticketmaster");
    expect(ticketmaster?.excerpt).toContain("Seat-hold and stampede handling.");
  });
});
