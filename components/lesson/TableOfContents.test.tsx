import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TableOfContents } from "./TableOfContents";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function renderArticleWithHeadings() {
  document.body.innerHTML = `
    <article id="lesson-article">
      <h2 id="problem-framing">Problem framing</h2>
      <p>...</p>
      <h2 id="architecture">Architecture</h2>
      <p>...</p>
    </article>
  `;
}

describe("TableOfContents", () => {
  it("renders one clickable link per h2 heading found in the target article", () => {
    renderArticleWithHeadings();
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<TableOfContents containerId="lesson-article" />, { container });

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent("Problem framing");
    expect(links[0]).toHaveAttribute("href", "#problem-framing");
    expect(links[1]).toHaveTextContent("Architecture");
    expect(links[1]).toHaveAttribute("href", "#architecture");
  });

  it("gives each link a focus-visible ring matching the app's other nav links, not the browser default", () => {
    // Regression: TOC links previously relied on the browser's default
    // blue outline instead of the app's magenta focus-visible ring used
    // by SidebarNav/TopBar (focus-visible:ring-2 focus-visible:ring-ring).
    renderArticleWithHeadings();
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<TableOfContents containerId="lesson-article" />, { container });

    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toMatch(/focus-visible:ring-2/);
      expect(link.className).toMatch(/focus-visible:ring-ring/);
    }
  });

  it("renders a progress bar starting at zero width", () => {
    renderArticleWithHeadings();
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<TableOfContents containerId="lesson-article" />, { container });

    expect(document.querySelector<HTMLElement>("[role=presentation] > div")!.style.width).toBe("0%");
  });

  it("renders nothing (no nav) when the target article has no headings", () => {
    document.body.innerHTML = `<article id="lesson-article"></article>`;
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<TableOfContents containerId="lesson-article" />, { container });

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
