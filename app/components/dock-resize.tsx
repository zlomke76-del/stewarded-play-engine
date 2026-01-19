"use client";

import React from "react";

export function useDockSize() {
  const DEFAULT_W = 720;
  const DEFAULT_H = 540;

  const [dockW, setDockW] = React.useState(() => {
    if (typeof window === "undefined") return DEFAULT_W;
    return Number(localStorage.getItem("solace:dockW")) || DEFAULT_W;
  });

  const [dockH, setDockH] = React.useState(() => {
    if (typeof window === "undefined") return DEFAULT_H;
    return Number(localStorage.getItem("solace:dockH")) || DEFAULT_H;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("solace:dockW", String(dockW));
      localStorage.setItem("solace:dockH", String(dockH));
    } catch {}
  }, [dockW, dockH]);

  return { dockW, dockH, setDockW, setDockH };
}

export function createResizeController(
  dockW: number,
  dockH: number,
  setDockW: (v: number) => void,
  setDockH: (v: number) => void
) {
  return function startResize(e: React.MouseEvent) {
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = dockW;
    const startH = dockH;

    function onMove(ev: MouseEvent) {
      const newW = Math.max(480, startW + (ev.clientX - startX));
      const newH = Math.max(360, startH + (ev.clientY - startY));
      setDockW(newW);
      setDockH(newH);
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
}

export function ResizeHandle({
  onResizeStart,
}: {
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onMouseDown={onResizeStart}
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 18,
        height: 18,
        cursor: "nwse-resize",
        background:
          "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.25) 90%)",
      }}
    />
  );
}
