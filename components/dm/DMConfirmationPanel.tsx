"use client";

import { SessionState, PendingChange } from "@/lib/session/SessionState";

export default function DMConfirmationPanel({
  state,
  onConfirm,
}: {
  state: SessionState;
  onConfirm: (id: string) => void;
}) {
  return (
    <section className="card dm-panel fade-in">
      <h2>DM Confirmation Required</h2>

      {state.pending.length === 0 ? (
        <p className="muted">No pending changes.</p>
      ) : (
        <ul>
          {state.pending.map((c) => (
            <li key={c.id} className="pending-item">
              <strong>{c.description}</strong>
              <button onClick={() => onConfirm(c.id)}>Confirm (DM)</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
