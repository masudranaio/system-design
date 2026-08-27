"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.2;

/**
 * The lowest scale auto-fit will choose. Commit 0079b77 fixed D2 label
 * text becoming unreadable when a wide diagram was scaled down to panel
 * width; auto-fitting on mount reintroduces that exact pressure, so
 * auto-fit stops here and lets horizontal scroll (plus the expand
 * button) handle a diagram that still doesn't fit. A diagram that needs
 * less than this should be redrawn or split — see CONTENT-GUIDE.md's
 * "Diagram layout, size, and reading direction".
 */
export const MIN_AUTO_FIT_SCALE = 0.65;

interface PanZoomState {
  scale: number;
  x: number;
  y: number;
}

const INITIAL: PanZoomState = { scale: 1, x: 0, y: 0 };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampScale(scale: number): number {
  return round2(Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)));
}

/**
 * The diagram's authored width in CSS pixels, independent of the
 * current zoom. DiagramChrome sets svg.style.width to the viewBox's
 * intrinsic width precisely so it can be read back like this; deriving
 * it from getBoundingClientRect would make the result depend on the
 * scale being computed from it. Returns 0 — "unknown, don't fit" — for
 * a percentage width, which is the fallback DiagramChrome uses when a
 * diagram has no usable viewBox.
 */
export function intrinsicWidthOf(svg: SVGSVGElement): number {
  const fromStyle = Number.parseFloat(svg.style.width);
  if (svg.style.width.endsWith("px") && Number.isFinite(fromStyle) && fromStyle > 0) {
    return fromStyle;
  }
  const viewBox = svg.getAttribute("viewBox");
  const fromViewBox = viewBox ? Number(viewBox.split(/\s+/)[2]) : Number.NaN;
  return Number.isFinite(fromViewBox) && fromViewBox > 0 ? fromViewBox : 0;
}

/**
 * Never scales up past 1 (a small diagram blown up to panel width gains
 * nothing and blurs) and never below MIN_AUTO_FIT_SCALE. A missing
 * measurement yields 1, i.e. leave it alone.
 */
export function computeAutoFitScale(panelWidth: number, intrinsicWidth: number): number {
  if (!panelWidth || !intrinsicWidth) return 1;
  const raw = panelWidth / intrinsicWidth;
  return round2(Math.min(1, Math.max(MIN_AUTO_FIT_SCALE, raw)));
}

export interface UsePanZoomResult {
  transform: string;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToWidth: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
  autoFit: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
  resetToFit: (container: HTMLElement | null, svg: SVGSVGElement | null) => void;
  bind: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e?: React.PointerEvent) => void;
  };
}

export function usePanZoom(): UsePanZoomResult {
  const [state, setState] = useState<PanZoomState>(INITIAL);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // Set by every deliberate zoom control. DiagramChrome re-fits on
  // panel resize, and without this gate a window resize (or a sidebar
  // animating) would silently throw away a reader's chosen zoom.
  const userAdjusted = useRef(false);

  const zoomIn = useCallback(() => {
    userAdjusted.current = true;
    setState((s) => ({ ...s, scale: clampScale(s.scale + ZOOM_STEP) }));
  }, []);

  const zoomOut = useCallback(() => {
    userAdjusted.current = true;
    setState((s) => ({ ...s, scale: clampScale(s.scale - ZOOM_STEP) }));
  }, []);

  const fitToWidth = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      if (!container || !svg) return;
      const intrinsic = intrinsicWidthOf(svg);
      if (!container.clientWidth || !intrinsic) return;
      userAdjusted.current = true;
      // Deliberately unclamped at the bottom: pressing this button is an
      // informed request to see the whole diagram, however small.
      setState({ x: 0, y: 0, scale: round2(Math.min(1, container.clientWidth / intrinsic)) });
    },
    [],
  );

  const applyAutoFit = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      if (!container || !svg) return;
      const intrinsic = intrinsicWidthOf(svg);
      if (!intrinsic) return;
      setState({ x: 0, y: 0, scale: computeAutoFitScale(container.clientWidth, intrinsic) });
    },
    [],
  );

  const autoFit = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      if (userAdjusted.current) return;
      applyAutoFit(container, svg);
    },
    [applyAutoFit],
  );

  const resetToFit = useCallback(
    (container: HTMLElement | null, svg: SVGSVGElement | null) => {
      userAdjusted.current = false;
      applyAutoFit(container, svg);
    },
    [applyAutoFit],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setState((s) => ({ ...s, x: s.x + dx, y: s.y + dy }));
  }, []);

  const onPointerUp = useCallback((_e?: React.PointerEvent) => {
    dragging.current = false;
  }, []);

  // Memoized so the returned object's identity tracks `state` rather
  // than the render count. DiagramChrome's fit effects take this hook's
  // members as dependencies; a fresh object every render re-ran those
  // effects on every render, which re-injected the SVG and spun the
  // component. Confirmed live: it hung the test suite.
  return useMemo(
    () => ({
      transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
      zoomIn,
      zoomOut,
      fitToWidth,
      autoFit,
      resetToFit,
      bind: { onPointerDown, onPointerMove, onPointerUp },
    }),
    [
      state,
      zoomIn,
      zoomOut,
      fitToWidth,
      autoFit,
      resetToFit,
      onPointerDown,
      onPointerMove,
      onPointerUp,
    ],
  );
}
