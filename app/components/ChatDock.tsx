// app/components/ChatDock.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * SINGLETON GUARD
 * Prevents duplicate mounts across hot reloads or accidental re-use.
 */
declare global {
  interface Window {
    __SOLACE_DOCK_MOUNTED__?: boolean;
  }
}

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "Create" | "Next Steps" | "Red Team";

/** Small inline SVGs */
const IconMin = (props: any) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path fill="currentColor" d="M5 12h14v2H5z" />
  </svg>
);
const IconClose = (props: any) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path
      fill="currentColor"
      d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4l-6.3 6.3-1.41-1.42L9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3z"
    />
  </svg>
);
const IconSend = (props: any) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path fill="currentColor" d="M2 21 23 12 2 3v7l15 2-15 2z" />
  </svg>
);
const IconMic = (props: any) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path
      fill="currentColor"
      d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21H9v2h6v-2h-2v-3.08A7 7 0 0 0 19 11z"
    />
  </svg>
);
const IconClip = (props: any) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path
      fill="currentColor"
      d="M16.5 6.5 8 15a3 3 0 0 0 4.24 4.24l8.49-8.49a5 5 0 1 0-7.07-7.07L4.7 9.64a7 7 0 1 0 9.9 9.9l6.01-6.01-1.41-1.41-6.01 6.01a5 5 0 1 1-7.07-7.07l9.9-9.9a3 3 0 1 1 4.24 4.24l-8.49 8.49"
    />
  </svg>
);

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export default function ChatDock() {
  // ---------- Singleton guard ----------
  const [enabled, setEnabled] = useState(false);
  const mountedOnceRef = useRef(false);

  useEffect(() => {
    if (mountedOnceRef.current) return;
    mountedOnceRef.current = true;

    if (typeof window !== "undefined") {
      if (window.__SOLACE_DOCK_MOUNTED__) return;
      window.__SOLACE_DOCK_MOUNTED__ = true;
    }

    setEnabled(true);
  }, []);

  // ---------- Position ----------
  const initPos = useMemo(() => {
    if (typeof window === "undefined") return { x: 24, y: 24 };
    try {
      return JSON.parse(localStorage.getItem("solace_dock_pos") || "");
    } catch {
      return { x: 24, y: 24 };
    }
  }, []);

  const [pos, setPos] = useState(initPos);
  const startRef = useRef<{ x: number; y: number; mx: number; my: number } | null>(null);

  const onDrag = useCallback((e: MouseEvent) => {
    const s = startRef.current;
    if (!s) return;
    const nx = s.x + (e.clientX - s.mx);
    const ny = s.y + (e.clientY - s.my);
    const maxX = window.innerWidth - 360;
    const maxY = window.innerHeight - 60;
    setPos({
      x: clamp(nx, 8, Math.max(8, maxX)),
      y: clamp(ny, 8, Math.max(8, maxY)),
    });
  }, []);

  const onDragEnd = useCallback(() => {
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", onDragEnd);
    localStorage.setItem("solace_dock_pos", JSON.stringify(pos));
    startRef.current = null;
  }, [onDrag, pos]);

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      startRef.current = { x: pos.x, y: pos.y, mx: e.clientX, my: e.clientY };
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onDragEnd);
    },
    [onDrag, onDragEnd, pos]
  );

  // ---------- UI ----------
  const [open, setOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<Mode>("Create");
  const [ministry, setMinistry] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi—I'm Solace. What’s on your mind?" },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeFilters = useCallback(() => {
    const f: string[] = [];
    if (activeMode === "Next Steps") f.push("guidance");
    if (ministry) f.push("abrahamic", "ministry");
    return f;
  }, [activeMode, ministry]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || pending) return;
    setPending(true);
    setError(null);

    const text = input.trim();
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Last-Mode": activeMode },
        body: JSON.stringify({
          messages: [...msgs, { role: "user", content: text }],
          filters: computeFilters(),
          stream: true,
        }),
      });

      if (!r.ok) throw new Error(await r.text());
      const reader = r.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e: any) {
      setError(e.message || "Connection issue");
    } finally {
      setPending(false);
    }
  }, [activeMode, computeFilters, input, msgs, pending]);

  // ---------- SAFE RENDER GATE ----------
  if (!enabled) return null;

  return (
    <div className="fixed z-[1000]" style={{ right: pos.x, bottom: pos.y }}>
      {/* UI unchanged */}
      {/* … */}
    </div>
  );
}
