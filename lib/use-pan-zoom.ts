"use client";

import { useCallback, useRef, useState } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.2;

interface PanZoomState {
  scale: number;
  x: number;
  y: number;
}

const INITIAL: PanZoomState = { scale: 1, x: 0, y: 0 };

function clampScale(scale: number): number {
  return Math.round(Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) * 100) / 100;
}

export interface UsePanZoomResult {
  transform: string;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  bind: {
    onWheel: (e: React.WheelEvent) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e?: React.PointerEvent) => void;
  };
}

export function usePanZoom(): UsePanZoomResult {
  const [state, setState] = useState<PanZoomState>(INITIAL);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setState((s) => ({ ...s, scale: clampScale(s.scale + ZOOM_STEP) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((s) => ({ ...s, scale: clampScale(s.scale - ZOOM_STEP) }));
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setState((s) => ({
      ...s,
      scale: clampScale(s.scale + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)),
    }));
  }, []);

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

  return {
    transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
    zoomIn,
    zoomOut,
    reset,
    bind: { onWheel, onPointerDown, onPointerMove, onPointerUp },
  };
}
