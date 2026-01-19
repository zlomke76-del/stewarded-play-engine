"use client";

// ------------------------------------------------------------
// DMConfirmationPanel.tsx
// ------------------------------------------------------------
// Purpose:
// - Display pending session changes
// - Require explicit human confirmation
// - Prevent silent or automatic state mutation
// ------------------------------------------------------------

import React from "react";
import {
  SessionState,
  PendingChange,
} from "@/lib/session/SessionState";

type Props = {
  state: SessionState;
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
        borderRadius: "8px",
        background: "linear-gradient(180deg, #ffffff, #f4f4f4)",
        color: "#111",
        maxWidth: "480px",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        DM Confirmation Required
      </h2>

      {pending.length === 0 ? (
        <p style={{ opacity: 0.7 }}>
          No pending changes.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
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

// ------------------------------------------------------------

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
        border: "1px solid #999",
        borderRadius: "6px",
        padding: "12px",
        marginBottom: "12px",
        background: "#fff",
        color: "#111",
      }}
    >
      <p>
        <strong>Proposed change:</strong>
      </p>

      <p style={{ marginLeft: "8px" }}>
        {change.description}
      </p>

      <p style={{ fontSize: "0.85em", opacity: 0.7 }}>
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
