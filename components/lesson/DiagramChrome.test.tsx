import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DiagramChrome } from "./DiagramChrome";

// jsdom has no ResizeObserver. DiagramChrome re-fits on panel resize,
// so it needs one to exist; this stub also lets a test fire a resize.
const resizeCallbacks: ResizeObserverCallback[] = [];

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

// Wrapped in act() because the observer callback sets state outside
// React's event system; without it the update isn't flushed before the
// assertion reads the transform back.
function fireResize() {
  act(() => {
    resizeCallbacks.forEach((cb) =>
      cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver),
    );
  });
}

function renderWide(intrinsicWidth = 1200, panelWidth = 900) {
  const view = render(
    <DiagramChrome
      title="Request flow"
      type="architecture"
      svgMarkup={`<svg viewBox="0 0 ${intrinsicWidth} 400"></svg>`}
    />,
  );
  const content = screen.getByRole("img", { name: "Request flow" });
  const scrollContainer = content.parentElement!;
  Object.defineProperty(scrollContainer, "clientWidth", {
    value: panelWidth,
    configurable: true,
  });
  return { ...view, content, scrollContainer };
}

describe("DiagramChrome", () => {
  it("applies the pan/zoom transform to the inner content div, not the overflow-auto scroll container", () => {
    const { content, scrollContainer } = renderWide();
    expect(content.className).not.toMatch(/overflow-auto/);
    expect(scrollContainer.className).toMatch(/overflow-auto/);
    expect(scrollContainer.style.transform).toBe("");
  });

  it("does not swallow the wheel event, so the article scrolls over a diagram", () => {
    const { scrollContainer } = renderWide();
    const wheel = new WheelEvent("wheel", {
      deltaY: -120,
      bubbles: true,
      cancelable: true,
    });
    scrollContainer.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it("fits a diagram wider than its panel once the panel is measurable", () => {
    const { content } = renderWide(1200, 900);
    // The mount-time fit ran before clientWidth was stubbed, so drive
    // the resize path the ResizeObserver would have driven.
    fireResize();
    expect(content.style.transform).toBe("translate(0px, 0px) scale(0.75)");
  });

  it("never auto-fits below the readability floor", () => {
    const { content } = renderWide(1200, 400);
    fireResize();
    expect(content.style.transform).toBe("translate(0px, 0px) scale(0.65)");
  });

  it("stops auto-fitting once the reader zooms, so a resize can't discard their choice", () => {
    const { content } = renderWide(1200, 900);
    fireEvent.click(screen.getAllByRole("button", { name: "Zoom in" })[0]);
    const afterZoom = content.style.transform;
    fireResize();
    expect(content.style.transform).toBe(afterZoom);
  });

  it("reset returns the diagram to its fitted scale, not to 1", () => {
    const { content } = renderWide(1200, 900);
    fireEvent.click(screen.getAllByRole("button", { name: "Zoom in" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Reset zoom" })[0]);
    expect(content.style.transform).toBe("translate(0px, 0px) scale(0.75)");
  });
});
