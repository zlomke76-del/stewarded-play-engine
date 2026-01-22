// ------------------------------------------------------------
// Solace Resolution Store Adapter
// ------------------------------------------------------------
// Ledger Persistence Layer
//
// Purpose:
// - Persist SolaceResolution objects to canon
// - Remain append-only and irreversible
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import { recordEvent, SessionState } from "@/lib/session/SessionState";

export function storeSolaceResolution(
  state: SessionState,
  resolution: SolaceResolution
): SessionState {
  return recordEvent(state, {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: "solace",
    type: "RESOLUTION",
    payload: resolution
  });
}
