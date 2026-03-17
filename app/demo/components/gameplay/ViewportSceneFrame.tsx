"use client";

import { type ReactNode } from "react";

export function SceneAdvanceBar(props: {
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  const { label, hint, onClick } = props;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "14px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            opacity: 0.58,
          }}
        >
          Next Step
        </div>
        {hint ? (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: "rgba(228,232,240,0.72)",
            }}
          >
            {hint}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClick}
        style={{
          padding: "11px 14px",
          borderRadius: 12,
          border: "1px solid rgba(214,188,120,0.24)",
          background:
            "linear-gradient(180deg, rgba(214,188,120,0.16), rgba(214,188,120,0.06))",
          color: "rgba(245,236,216,0.96)",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    </div>
  );
}

export function StageTabs(props: {
  activeScene: "pressure" | "chamber" | "puzzle" | "action" | "combat";
  hasPuzzleRoom: boolean;
  onSelectPressure: () => void;
  onSelectChamber: () => void;
  onSelectPuzzle: () => void;
  onSelectAction: () => void;
}) {
  const {
    activeScene,
    hasPuzzleRoom,
    onSelectPressure,
    onSelectChamber,
    onSelectPuzzle,
    onSelectAction,
  } = props;

  const tabs = [
    {
      key: "pressure",
      label: "Threshold",
      onClick: onSelectPressure,
      visible: true,
    },
    {
      key: "chamber",
      label: "Chamber",
      onClick: onSelectChamber,
      visible: true,
    },
    {
      key: "puzzle",
      label: "Trial",
      onClick: onSelectPuzzle,
      visible: hasPuzzleRoom,
    },
    {
      key: "action",
      label: "Command",
      onClick: onSelectAction,
      visible: true,
    },
  ].filter((tab) => tab.visible);

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        padding: "0 16px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {tabs.map((tab) => {
        const active = activeScene === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={tab.onClick}
            style={{
              padding: "8px 11px",
              borderRadius: 999,
              border: active
                ? "1px solid rgba(214,188,120,0.28)"
                : "1px solid rgba(255,255,255,0.10)",
              background: active
                ? "rgba(214,188,120,0.10)"
                : "rgba(255,255,255,0.04)",
              color: active
                ? "rgba(245,236,216,0.96)"
                : "rgba(228,232,240,0.84)",
              fontSize: 11,
              fontWeight: active ? 800 : 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SceneFrame(props: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
}) {
  const { title, eyebrow, description, children, footer, headerExtra } = props;

  return (
    <div
      style={{
        borderRadius: 24,
        border: "1px solid rgba(214, 188, 120, 0.16)",
        background:
          "linear-gradient(180deg, rgba(16,18,28,0.94), rgba(10,12,20,0.92))",
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow: "visible",
      }}
    >
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: headerExtra ? "none" : "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.15,
            textTransform: "uppercase",
            opacity: 0.58,
          }}
        >
          {eyebrow}
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            lineHeight: 1.08,
            color: "rgba(245,236,216,0.98)",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(227, 231, 239, 0.78)",
            maxWidth: 860,
          }}
        >
          {description}
        </div>
      </div>

      {headerExtra ? headerExtra : null}

      <div
        style={{
          padding: 16,
          overflow: "visible",
        }}
      >
        {children}
      </div>
      {footer ? footer : null}
    </div>
  );
}
