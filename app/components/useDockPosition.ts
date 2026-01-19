"use client";

import { useEffect, useRef, useState } from "react";

type Args = {
  canRender?: boolean; // OPTIONAL — deprecated lifecycle flag
  visible: boolean;
  viewport: { w: number; h: number };
  panelW: number;
  panelH: number;
  isMobile: boolean;
  PAD: number;
  posKey: string;
  x: number;
  y: number;
  setPos: (x: number, y: number) => void;

  /** NEW — prevents accidental drag snapping */
  minDragPx?: number;
};

export function useDockPosition({
  visible,
  viewport,
  panelW,
  panelH,
  isMobile,
  PAD,
  posKey,
  x,
  y,
  setPos,
  minDragPx = 0, // default to 0 if not provided
}: Args) {
  const [dragging, setDragging] = useState(false);
  const [posReady, setPosReady] = useState(false);

  // NEW — track whether we've crossed the drag threshold
  const [dragActivated, setDragActivated] = useState(false);

  const [offset, setOffset] = useState({ dx: 0, dy: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // Load / initialize position
  // --------------------------------------------------
  useEffect(() => {
    if (!visible) return;
    if (viewport.w === 0 || viewport.h === 0) return;

    // Mobile: no persistence, always ready
    if (viewport.w <= 768) {
      setPosReady(true);
      return;
    }

    try {
      const raw = localStorage.getItem(posKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) {
          setPos(
            Math.max(PAD, Math.min(viewport.w - panelW - PAD, saved.x)),
            Math.max(PAD, Math.min(viewport.h - panelH - PAD, saved.y))
          );
          setPosReady(true);
          return;
        }
      }
    } catch {}

    // Fallback: center-ish default
    setPos(
      Math.round((viewport.w - 760) / 2),
      Math.round((viewport.h - 560) / 2)
    );
    setPosReady(true);
  }, [
    visible,
    viewport.w,
    viewport.h,
    panelW,
    panelH,
    PAD,
    posKey,
    setPos,
  ]);

  // --------------------------------------------------
  // Persist position
  // --------------------------------------------------
  useEffect(() => {
    if (dragging) return;
    if (!posReady) return;
    if (viewport.w <= 768) return;

    try {
      localStorage.setItem(posKey, JSON.stringify({ x, y }));
    } catch {}
  }, [dragging, posReady, x, y, viewport.w, posKey]);

  // --------------------------------------------------
  // Drag handlers
  // --------------------------------------------------
  function onHeaderMouseDown(e: React.MouseEvent) {
    if (isMobile) return;

    const rect = containerRef.current?.getBoundingClientRect();

    setOffset({
      dx: e.clientX - (rect?.left ?? 0),
      dy: e.clientY - (rect?.top ?? 0),
    });

    // NEW — record starting mouse position
    startPosRef.current = { x: e.clientX, y: e.clientY };

    setDragActivated(false);
    setDragging(true);
  }

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      // NEW — threshold check
      if (!dragActivated) {
        const dx = Math.abs(e.clientX - startPosRef.current.x);
        const dy = Math.abs(e.clientY - startPosRef.current.y);

        if (dx < minDragPx && dy < minDragPx) {
          return; // do not drag yet
        }

        setDragActivated(true);
      }

      // Only drag after threshold is crossed
      setPos(e.clientX - offset.dx, e.clientY - offset.dy);
    };

    const onUp = () => {
      setDragging(false);
      setDragActivated(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, dragActivated, offset.dx, offset.dy, setPos, minDragPx]);

  return {
    containerRef,
    posReady,
    dragging,
    onHeaderMouseDown,
  };
}
