"use client";

// ------------------------------------------------------------
// DMConfirmationPanel.tsx
// ------------------------------------------------------------
// Stewarded Play Engine
//
// Purpose:
// - Display pending session changes
// - Require explicit human confirmation
// - Prevent silent or automatic state mutation
//
// This UI is intentionally plain and authoritative.
// ------------------------------------------------------------

import React from "react";
import {
  SessionState,
  PendingChange,
} from "@/lib/session/SessionState";

type Props = {
  state: SessionState;

  /** Called when the DM confirms a change */
  onConfirm: (changeId: string) => void;
};

export default function DMConfirmationPanel({
  state,
  onConfirm,
}: Props) {
  const pending = state.pending;

  return (
    <div
      style={{
        border: "2px solid #c00",
        padding: "16px",
        borderRadius: "6px",
        background: _attachBackground(),
        color: "#111827", // ← ASSERT TEXT COLOR (critical)
        maxWidth: "480px",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        DM Confirmation Required
      </h2>

      {pending.length === 0 ? (
        <p style={{ color: "#4b5563" }}>
          No pending changes.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {pending.map((change) => (
            <PendingItem
              key={change.id}
              change={change}
              onConfirm={onConfirm}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   Pending Item
------------------------------------------------------------ */

function PendingItem({
  change,
  onConfirm,
}: {
  change: PendingChange;
  onConfirm: (id: string) => void;
}) {
  return (
    <li
      style={{
        border: "1px solid #9ca3af",
        borderRadius: "4px",
        padding: "12px",
        marginBottom: "12px",
        background: "#ffffff",
        color: "#111827",
      }}
    >
      <p style={{ margin: "0 0 6px 0", fontWeight: 600 }}>
        Proposed change:
      </p>

      <p style={{ margin: "0 0 6px 8px" }}>
        {change.description}
      </p>

      <p style={{ fontSize: "0.85em", color: "#6b7280" }}>
        Proposed by: {change.proposedBy}
      </p>

      <button
        onClick={() => onConfirm(change.id)}
        style={{
          marginTop: "8px",
          padding: "8px 12px",
          background: "#c00",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Confirm (DM)
      </button>
    </li>
  );
}

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

function _attachBackground(): string {
  return "linear-gradient(180deg, #ffffff, #f3f4f6)";
}
