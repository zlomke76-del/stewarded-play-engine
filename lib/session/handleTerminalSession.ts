// ------------------------------------------------------------
// Terminal Session Handler
// ------------------------------------------------------------
// Burial is final.
// No turns, no narration, no recovery.
// ------------------------------------------------------------

import type { SessionState } from "./SessionState";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type TerminalReason = "buried";

/* ------------------------------------------------------------
   Handler
------------------------------------------------------------ */

export function handleTerminalSession(
  state: SessionState,
  reason: TerminalReason,
  description: string
): SessionState {
  // Idempotent — terminal stays terminal
  if ((state as any).terminal === true) {
    return state;
  }

  return {
    ...state,

    // 🔒 Hard terminal flag
    terminal: true,

    terminalReason: reason,

    terminalDescription: description,

    // 🔒 Freeze timeline
    frozenAt: Date.now(),
  };
}
