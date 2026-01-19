// app/components/solace-dock/dock-header.tsx
//-----------------------------------------------------------
// Header for SolaceDock
// Contains logo orb, modes, ministry, founder, minimize button
//-----------------------------------------------------------

"use client";

import React from "react";
import { UI } from "./dock-ui";

type HeaderProps = {
  ministryOn: boolean;
  founderMode: boolean;
  modeHint: string;
  memReady: boolean;
  onToggleMinistry: () => void;
  onToggleFounder: () => void;
  onMinimize: () => void;
  setModeHint: (m: any) => void;
  onDragStart: (e: React.MouseEvent) => void;
};

export default function SolaceDockHeader({
  ministryOn,
  founderMode,
  modeHint,
  memReady,
  onToggleMinistry,
  onToggleFounder,
  onMinimize,
  setModeHint,
  onDragStart,
}: HeaderProps) {
  const modes = ["Create", "Red Team", "Next Steps", "Neutral"] as const;

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
      {/* SOLACE ORB */}
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background:
            "radial-gradient(62% 62% at 50% 42%, rgba(251,191,36,1) 0%, rgba(251,191,36,.65) 38%, rgba(251,191,36,.22) 72%, rgba(251,191,36,.12) 100%)",
          boxShadow: "0 0 38px rgba(251,191,36,.55)",
        }}
      />

      <span style={{ font: "600 13px system-ui" }}>Solace</span>
      <span style={{ font: "12px system-ui", color: UI.sub }}>
        Create with moral clarity
      </span>

      {/* Memory indicator */}
      <span
        title={memReady ? "Memory ready" : "Loading memory…"}
        style={{
          marginLeft: 8,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: memReady ? "#34d399" : "#f59e0b",
          boxShadow: memReady ? "0 0 8px #34d399aa" : "none",
        }}
      />

      {/* Modes */}
      <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
        {modes.map((label) => (
          <button
            key={label}
            onClick={() => setModeHint(label)}
            style={{
              borderRadius: 8,
              padding: "7px 10px",
              font: "600 12px system-ui",
              background: modeHint === label ? "#d1d4db" : "#0e1726",
              color: modeHint === label ? "#000" : UI.text,
              border: UI.border,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right-side actions */}
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {/* Ministry */}
        <button
          onClick={onToggleMinistry}
          style={{
            borderRadius: 8,
            padding: "7px 10px",
            font: "700 12px system-ui",
            background: ministryOn ? "#f6c453" : "#0e1726",
            color: ministryOn ? "#000" : UI.text,
            border: ministryOn ? "1px solid #f4cf72" : UI.edge,
            cursor: "pointer",
          }}
        >
          Ministry
        </button>

        {/* Founder */}
        <button
          onClick={onToggleFounder}
          style={{
            borderRadius: 8,
            padding: "7px 10px",
            font: "700 12px system-ui",
            background: founderMode ? "#9ae6b4" : "#0e1726",
            color: founderMode ? "#000" : UI.text,
            border: founderMode ? "1px solid #81e6d9" : UI.edge,
            cursor: "pointer",
          }}
        >
          Founder
        </button>

        {/* Minimize */}
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
        >
          –
        </button>
      </div>
    </header>
  );
}
