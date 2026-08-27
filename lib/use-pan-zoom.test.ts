import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  usePanZoom,
  computeAutoFitScale,
  intrinsicWidthOf,
  MIN_AUTO_FIT_SCALE,
} from "./use-pan-zoom";

function makeContainer(clientWidth: number): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "clientWidth", { value: clientWidth, configurable: true });
  return el;
}

/**
 * Mirrors what DiagramChrome's injectDiagram does: it sets the svg's
 * style.width to the viewBox's intrinsic pixel width, and the hook reads
 * that back rather than measuring the rendered box.
 */
function makeSvg(intrinsicWidth: number): SVGSVGElement {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.style.width = `${intrinsicWidth}px`;
  return el;
}

describe("usePanZoom", () => {
  it("zooms in and out within clamped bounds, and resets to the fitted scale", () => {
    const { result } = renderHook(() => usePanZoom());
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");

    act(() => result.current.zoomIn());
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1.2)");

    act(() => {
      for (let i = 0; i < 20; i++) result.current.zoomIn();
    });
    expect(result.current.transform).toBe("translate(0px, 0px) scale(3)"); // clamped to MAX_SCALE

    act(() => {
      for (let i = 0; i < 20; i++) result.current.zoomOut();
    });
    expect(result.current.transform).toBe("translate(0px, 0px) scale(0.5)"); // clamped to MIN_SCALE

    // Replaces the old `reset()`, which returned to scale 1: the diagram
    // now opens fitted, so resetting to 1 would leave a wide diagram
    // cropped and read as the opposite of a reset.
    act(() => result.current.resetToFit(makeContainer(400), makeSvg(800)));
    expect(result.current.transform).toBe("translate(0px, 0px) scale(0.65)");
  });

  it("pans while dragging and stops panning after pointer up", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() =>
      result.current.bind.onPointerDown(
        { clientX: 0, clientY: 0 } as React.PointerEvent,
      ),
    );
    act(() =>
      result.current.bind.onPointerMove(
        { clientX: 10, clientY: 5 } as React.PointerEvent,
      ),
    );
    expect(result.current.transform).toBe("translate(10px, 5px) scale(1)");

    act(() => result.current.bind.onPointerUp());
    act(() =>
      result.current.bind.onPointerMove(
        { clientX: 999, clientY: 999 } as React.PointerEvent,
      ),
    );
    expect(result.current.transform).toBe("translate(10px, 5px) scale(1)"); // unchanged
  });

  // Replaces "zooms on wheel, in on scroll-up and out on scroll-down".
  // Wheel-zoom was removed deliberately: it called preventDefault, so
  // scrolling the article with the cursor over a diagram zoomed the
  // diagram instead of scrolling the page, and lessons are diagram-dense
  // enough that the cursor is over a diagram most of the time.
  it("binds no wheel handler, so the page scrolls over a diagram", () => {
    const { result } = renderHook(() => usePanZoom());
    expect("onWheel" in result.current.bind).toBe(false);
  });

  describe("fitToWidth", () => {
    it("scales down to fit a diagram wider than its container", () => {
      const { result } = renderHook(() => usePanZoom());

      act(() => result.current.fitToWidth(makeContainer(400), makeSvg(800)));

      // available / intrinsic = 400 / 800 = 0.5
      expect(result.current.transform).toBe("translate(0px, 0px) scale(0.5)");
    });

    it("never scales up past 1 for a diagram narrower than its container", () => {
      const { result } = renderHook(() => usePanZoom());

      act(() => result.current.fitToWidth(makeContainer(1000), makeSvg(400)));

      expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
    });

    // Replaces "divides the svg's bounding width by the current scale to
    // recover its intrinsic width". That old approach made fitToWidth
    // depend on its own output (and put state.scale in its dependency
    // array); it now reads the authored style.width DiagramChrome sets,
    // which is scale-independent. This test pins that: an existing zoom
    // must not change the computed fit.
    it("measures the authored width, so an existing zoom doesn't skew the fit", () => {
      const { result } = renderHook(() => usePanZoom());
      act(() => result.current.zoomIn());
      expect(result.current.transform).toBe("translate(0px, 0px) scale(1.2)");

      act(() => result.current.fitToWidth(makeContainer(400), makeSvg(800)));

      expect(result.current.transform).toBe("translate(0px, 0px) scale(0.5)");
    });

    it("is unclamped at the bottom — pressing the button is an informed request", () => {
      const { result } = renderHook(() => usePanZoom());

      act(() => result.current.fitToWidth(makeContainer(400), makeSvg(1200)));

      // Below MIN_AUTO_FIT_SCALE, unlike autoFit.
      expect(result.current.transform).toBe("translate(0px, 0px) scale(0.33)");
    });

    it("does nothing when container or svg is missing", () => {
      const { result } = renderHook(() => usePanZoom());
      act(() => result.current.fitToWidth(null, makeSvg(800)));
      expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
      act(() => result.current.fitToWidth(makeContainer(400), null));
      expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
    });
  });

  describe("autoFit", () => {
    it("fits a wide diagram to the panel", () => {
      const { result } = renderHook(() => usePanZoom());
      act(() => result.current.autoFit(makeContainer(900), makeSvg(1200)));
      expect(result.current.transform).toBe("translate(0px, 0px) scale(0.75)");
    });

    it("stops once the reader has zoomed, so a panel resize can't discard their choice", () => {
      const { result } = renderHook(() => usePanZoom());
      act(() => result.current.zoomIn());
      const afterZoom = result.current.transform;
      act(() => result.current.autoFit(makeContainer(900), makeSvg(1200)));
      expect(result.current.transform).toBe(afterZoom);
    });

    it("resetToFit clears that gate and re-arms auto-fitting", () => {
      const { result } = renderHook(() => usePanZoom());
      act(() => result.current.zoomIn());
      act(() => result.current.resetToFit(makeContainer(900), makeSvg(1200)));
      expect(result.current.transform).toBe("translate(0px, 0px) scale(0.75)");

      act(() => result.current.autoFit(makeContainer(600), makeSvg(1200)));
      expect(result.current.transform).toBe("translate(0px, 0px) scale(0.65)");
    });
  });
});

describe("computeAutoFitScale", () => {
  it("leaves a diagram narrower than the panel at 1 rather than blowing it up", () => {
    expect(computeAutoFitScale(1200, 600)).toBe(1);
  });

  it("scales a wide diagram down to the panel width", () => {
    expect(computeAutoFitScale(900, 1200)).toBe(0.75);
  });

  it("never scales below the readability floor", () => {
    expect(computeAutoFitScale(400, 1200)).toBe(MIN_AUTO_FIT_SCALE);
  });

  it("returns exactly the floor when the fit lands on it", () => {
    expect(computeAutoFitScale(650, 1000)).toBe(MIN_AUTO_FIT_SCALE);
  });

  it("declines to fit when either measurement is missing", () => {
    expect(computeAutoFitScale(0, 1200)).toBe(1);
    expect(computeAutoFitScale(900, 0)).toBe(1);
  });
});

describe("intrinsicWidthOf", () => {
  it("reads the authored pixel width DiagramChrome sets", () => {
    expect(intrinsicWidthOf(makeSvg(1440))).toBe(1440);
  });

  it("falls back to the viewBox when there is no pixel width", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 820 400");
    expect(intrinsicWidthOf(svg)).toBe(820);
  });

  it("reports 0 for a percentage width, which means do not fit", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.width = "100%";
    expect(intrinsicWidthOf(svg)).toBe(0);
  });
});
