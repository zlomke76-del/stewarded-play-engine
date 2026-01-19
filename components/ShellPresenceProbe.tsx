// components/ShellPresenceProbe.tsx
"use client";

import { useEffect } from "react";

const DIAG_ENABLED =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_LAYOUT_DIAG === "true";

export default function ShellPresenceProbe() {
  useEffect(() => {
    if (!DIAG_ENABLED) return;

    const report = (label: string, el: Element | null) => {
      if (!el) {
        console.warn("[SHELL-MISS]", label);
        return;
      }

      const r = el.getBoundingClientRect();
      console.log("[SHELL-OK]", {
        label,
        width: Math.round(r.width),
        height: Math.round(r.height),
        top: Math.round(r.top),
        left: Math.round(r.left),
      });
    };

    // Adjust selectors if names differ
    report("NeuralSidebar", document.querySelector("[data-neural-sidebar]"));
    report("AppShell", document.querySelector("[data-app-shell]"));
    report("MainContent", document.querySelector("main"));

  }, []);

  return null;
}
