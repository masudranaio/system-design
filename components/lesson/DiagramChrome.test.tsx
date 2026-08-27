import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiagramChrome } from "./DiagramChrome";

describe("DiagramChrome", () => {
  it("applies the pan/zoom transform to the inner content div, not the overflow-auto scroll container", () => {
    render(
      <DiagramChrome
        title="Request flow"
        type="architecture"
        svgMarkup={'<svg viewBox="0 0 100 100"></svg>'}
      />,
    );

    // The content div is the one carrying role="img" (set directly in
    // DiagramChrome's JSX) and, per the fix, the inline transform style.
    const content = screen.getByRole("img", { name: "Request flow" });
    expect(content.style.transform).toBe("translate(0px, 0px) scale(1)");
    expect(content.className).not.toMatch(/overflow-auto/);

    // Its parent is the scroll-clipping container: overflow-auto, and
    // critically carrying no transform of its own — a transform on the
    // same element that owns the scroll clipping is self-referential
    // and never reveals more of the diagram when scaled (see the
    // comment in DiagramChrome.tsx for the full explanation).
    const scrollContainer = content.parentElement;
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer!.className).toMatch(/overflow-auto/);
    expect(scrollContainer!.style.transform).toBe("");
  });
});
