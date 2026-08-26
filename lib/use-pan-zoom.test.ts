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
});
