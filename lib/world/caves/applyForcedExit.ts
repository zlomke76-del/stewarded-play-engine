// ------------------------------------------------------------
// Forced Exit Applier (AUTHORITATIVE)
// ------------------------------------------------------------
// Resolves player presence during cave collapse / flood
// Burial is terminal and halts the session immediately
// ------------------------------------------------------------

import type { SessionState } from "@/lib/session/SessionState";
import { handleTerminalSession } from "@/lib/session/handleTerminalSession";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type ForcedExitResult =
  | {
      outcome: "ejected";
      description: string;
      exitNodeId: string;
    }
  | {
      outcome: "buried";
      description: string;
    }
  | null;

/* ------------------------------------------------------------
   Resolver (deterministic, Solace-owned)
------------------------------------------------------------ */

export function resolveForcedExit(
  params: {
    playerNodeId: string;
    collapsingNodeId: string;
    severity: "partial" | "total";
  }
): ForcedExitResult {
  const { playerNodeId, collapsingNodeId, severity } = params;

  // Player not inside collapsing node
  if (playerNodeId !== collapsingNodeId) {
    return null;
  }

  // Total collapse = burial
  if (severity === "total") {
    return {
      outcome: "buried",
      description:
        "The stone closes without sound. No path remains.",
    };
  }

  // Partial collapse = violent ejection
  return {
    outcome: "ejected",
    description:
      "Stone shears loose. You are thrown into the open by force alone.",
    exitNodeId: "windscar-overhang", // canonical fallback
  };
}

/* ------------------------------------------------------------
   Session Application (HARD STOP)
------------------------------------------------------------ */

export function applyForcedExitToSession(
  state: SessionState,
  forcedExit: ForcedExitResult
): SessionState {
  if (!forcedExit) return state;

  // 🔒 TERMINAL PATH — NO CONTINUATION
  if (forcedExit.outcome === "buried") {
    return handleTerminalSession(
      state,
      "buried",
      forcedExit.description
    );
  }

  // Non-terminal exits return unchanged session;
  // world relocation is handled elsewhere
  return state;
}
