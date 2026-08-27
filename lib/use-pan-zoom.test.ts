import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanZoom } from "./use-pan-zoom";

describe("usePanZoom", () => {
  it("zooms in and out within clamped bounds, and resets", () => {
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

    act(() => result.current.reset());
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
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

  it("zooms on wheel, in on scroll-up and out on scroll-down", () => {
    const { result } = renderHook(() => usePanZoom());
    const preventDefault = () => {};

    act(() =>
      result.current.bind.onWheel(
        { deltaY: -100, preventDefault } as React.WheelEvent,
      ),
    );
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1.2)");

    act(() =>
      result.current.bind.onWheel(
        { deltaY: 100, preventDefault } as React.WheelEvent,
      ),
    );
    expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
  });

  describe("fitToWidth", () => {
    function makeContainer(clientWidth: number): HTMLElement {
      const el = document.createElement("div");
      Object.defineProperty(el, "clientWidth", { value: clientWidth, configurable: true });
      return el;
    }

    function makeSvg(boundingWidth: number): SVGSVGElement {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      el.getBoundingClientRect = () =>
        ({ width: boundingWidth }) as DOMRect;
      return el;
    }

    it("scales down to fit a diagram wider than its container", () => {
      const { result } = renderHook(() => usePanZoom());
      const container = makeContainer(400);
      const svg = makeSvg(800);

      act(() => result.current.fitToWidth(container, svg));

      // available / intrinsic = 400 / 800 = 0.5
      expect(result.current.transform).toBe("translate(0px, 0px) scale(0.5)");
    });

    it("never scales up past 1 for a diagram narrower than its container", () => {
      const { result } = renderHook(() => usePanZoom());
      const container = makeContainer(1000);
      const svg = makeSvg(400);

      act(() => result.current.fitToWidth(container, svg));

      expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
    });

    it("divides the svg's bounding width by the current scale to recover its intrinsic width", () => {
      const { result } = renderHook(() => usePanZoom());
      // Zoom in first, so the svg's bounding rect (as the browser would
      // report it) is already inflated by the current scale.
      act(() => result.current.zoomIn());
      expect(result.current.transform).toBe("translate(0px, 0px) scale(1.2)");

      const container = makeContainer(400);
      // Bounding width reported at scale 1.2 for an intrinsic width of 800.
      const svg = makeSvg(800 * 1.2);

      act(() => result.current.fitToWidth(container, svg));

      // intrinsic = 960 / 1.2 = 800; scale = 400 / 800 = 0.5
      expect(result.current.transform).toBe("translate(0px, 0px) scale(0.5)");
    });

    it("does nothing when container or svg is missing", () => {
      const { result } = renderHook(() => usePanZoom());
      act(() => result.current.fitToWidth(null, makeSvg(800)));
      expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
      act(() => result.current.fitToWidth(makeContainer(400), null));
      expect(result.current.transform).toBe("translate(0px, 0px) scale(1)");
    });
  });
});
