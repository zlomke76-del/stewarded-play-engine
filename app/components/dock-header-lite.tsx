// app/components/dock-header-lite.tsx
"use client";

import React from "react";
import { UI } from "./dock-ui";

interface Props {
  ministryOn: boolean;
  memReady: boolean;
  onToggleMinistry: () => void; // intentionally unused (kept for compatibility)
  onMinimize: () => void;
  onDragStart: (e: any) => void;
}

export default function SolaceDockHeaderLite({
  ministryOn,
  memReady,
  onMinimize,
  onDragStart,
}: Props) {
  // ------------------------------------------------------------
  // Anchor / Triangle visual state
  // ------------------------------------------------------------
  const anchorGlow = ministryOn
    ? "0 0 28px rgba(251,191,36,.65), 0 0 6px rgba(251,191,36,.45)"
    : "0 0 6px rgba(148,163,184,.25)";

  const anchorFill = ministryOn ? "#fbbf24" : "#94a3b8";

  return (
    <header
      onMouseDown={onDragStart}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: UI.edge,
        cursor: "move",
        userSelect: "none",
      }}
    >
      {/* Triangle / Anchor Mark */}
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(" + anchorGlow + ")",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={anchorFill}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Triangle */}
          <path d="M12 3 L21 19 H3 Z" />
          {/* Anchor stem */}
          <line x1="12" y1="8" x2="12" y2="19" />
          {/* Anchor base */}
          <path d="M8 19c1.5 2 6.5 2 8 0" />
        </svg>
      </span>

      {/* Title */}
      <span style={{ font: "600 13px system-ui" }}>Solace</span>

      <span style={{ font: "12px system-ui", color: UI.sub }}>
        Create with moral clarity
      </span>

      {/* Memory ready indicator */}
      <span
        title={memReady ? "Memory ready" : "Loading memory"}
        style={{
          marginLeft: 8,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: memReady ? "#34d399" : "#f59e0b",
          boxShadow: memReady ? "0 0 8px #34d399aa" : "none",
        }}
      />

      {/* Right controls */}
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button
          onClick={onMinimize}
          style={{
            borderRadius: 6,
            padding: "4px 8px",
            font: "600 12px system-ui",
            border: UI.edge,
            background: "#0e1726",
            color: UI.sub,
            cursor: "pointer",
          }}
          aria-label="Minimize Solace"
        >
          –
        </button>
      </div>
    </header>
  );
}
