// ------------------------------------------------------------
// Handle Terminal Session (AUTHORITATIVE)
// ------------------------------------------------------------
// - Ends session via canonical OUTCOME event
// - No mutation of SessionState shape
// - Terminality is event-derived, not flag-based
// ------------------------------------------------------------

import type { SessionState } from "./SessionState";
import { recordEvent } from "./SessionState";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type TerminalOutcome =
  | "buried"
  | "starved"
  | "frozen"
  | "lost";

/* ------------------------------------------------------------
   Core Handler
------------------------------------------------------------ */

export function handleTerminalSession(
  state: SessionState,
  outcome: TerminalOutcome,
  description: string
): SessionState {
  return recordEvent(state, {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: "system",
    type: "OUTCOME",
    payload: {
      terminal: true, // ✅ legal INSIDE payload
      outcome,
      description,
      audit: ["Terminal state reached"],
      world: {
        primary: "terminal",
        outcome,
      },
    },
  });
}
