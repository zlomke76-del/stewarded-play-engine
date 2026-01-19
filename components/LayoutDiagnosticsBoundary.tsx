// components/LayoutDiagnosticsBoundary.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  id: string;
  children: React.ReactNode;
};

const DIAG_ENABLED =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_LAYOUT_DIAG === "true";

export default function LayoutDiagnosticsBoundary({ id, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const last = useRef<string>("");

  useEffect(() => {
    if (!DIAG_ENABLED || !ref.current) return;

    const el = ref.current;

    const emit = () => {
      const rect = el.getBoundingClientRect();

      const snapshot = JSON.stringify({
        id,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        overflowX: el.scrollWidth > el.clientWidth,
        overflowY: el.scrollHeight > el.clientHeight,
      });

      if (snapshot !== last.current) {
        last.current = snapshot;
        console.log("[LAYOUT-BOUNDARY]", JSON.parse(snapshot));
      }
    };

    emit();

    const ro = new ResizeObserver(emit);
    ro.observe(el);

    return () => ro.disconnect();
  }, [id]);

  return (
    <div
      ref={ref}
      data-layout-boundary={id}
      style={DIAG_ENABLED ? { outline: "1px dashed rgba(255,255,255,0.15)" } : {}}
    >
      {children}
    </div>
  );
}
