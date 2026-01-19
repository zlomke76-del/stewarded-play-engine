"use client";

import { SessionState, PendingChange } from "@/lib/session/SessionState";

// ------------------------------------------------------------
// DM Confirmation Panel
//
// Purpose:
// - Surface ALL pending proposed changes
// - Preserve authority boundaries
// - Make proposer visible (Human vs Solace)
// - Never imply automatic resolution
// ------------------------------------------------------------

export default function DMConfirmationPanel({
  state,
  onConfirm,
}: {
  state: SessionState;
  onConfirm: (id: string) => void;
}) {
  const hasPending = state.pending.length > 0;

  return (
    <section className="card dm-panel fade-in">
      <h2>DM Confirmation Required</h2>

      {!hasPending ? (
        <p className="muted">
          No proposed resolutions awaiting confirmation.
        </p>
      ) : (
        <ul className="pending-list">
          {state.pending.map((c) => (
            <li key={c.id} className="pending-item">
              <div className="pending-text">
                <strong>{c.description}</strong>
                <div className="pending-meta muted">
                  Proposed by{" "}
                  {c.proposedBy === "system"
                    ? "Solace (neutral)"
                    : c.proposedBy}
                </div>
              </div>

              <button
                className="confirm-btn"
                onClick={() => onConfirm(c.id)}
              >
                Confirm Resolution
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
