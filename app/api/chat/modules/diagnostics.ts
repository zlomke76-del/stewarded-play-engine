// ------------------------------------------------------------
// Chat Reliability & Summary Readiness Diagnostics
// AUTHORITATIVE — READ ONLY
// ------------------------------------------------------------
// Purpose:
// - Measure session stability
// - Signal when summaries should be recommended
// - Emit structured diagnostics to logs
// ------------------------------------------------------------

import { WorkingMemoryItem } from "./assembleContext";

// ------------------------------------------------------------
// Threshold Configuration (TUNABLE, VERSIONED)
// ------------------------------------------------------------
export const SUMMARY_THRESHOLDS = {
  WM_TURN_LIMIT: 8,            // soft recommendation
  WM_HARD_CAP: 10,             // danger zone
  AVG_TURN_CHARS: 1200,        // density signal
  MAX_TURN_CHARS: 2000,        // overload signal
  SESSION_DURATION_MS: 25 * 60 * 1000, // 25 minutes
};

// ------------------------------------------------------------
// Diagnostic Result Shape (EXPLICIT CONTRACT)
// ------------------------------------------------------------
export type ChatReliabilityDiag = {
  sessionId: string;

  wm: {
    totalTurns: number;
    avgTurnCharsLast3: number;
    maxTurnCharsLast3: number;
  };

  thresholds: {
    wmTurnLimit: boolean;
    charDensity: boolean;
    sessionDuration: boolean;
  };

  summaryRecommended: boolean;
  hardStopImminent: boolean;
};

// ------------------------------------------------------------
// Compute Diagnostics (PURE FUNCTION)
// ------------------------------------------------------------
export function computeChatDiagnostics(args: {
  sessionId: string;
  workingMemory: WorkingMemoryItem[];
  sessionStartMs: number;
}): ChatReliabilityDiag {
  const { sessionId, workingMemory, sessionStartMs } = args;

  const wmTurns = workingMemory.length;

  const last3 = workingMemory
    .slice(-3)
    .map(i => (i?.content?.length ?? 0));

  const avgTurnCharsLast3 =
    last3.length > 0
      ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length)
      : 0;

  const maxTurnCharsLast3 =
    last3.length > 0 ? Math.max(...last3) : 0;

  const thresholds = {
    wmTurnLimit: wmTurns >= SUMMARY_THRESHOLDS.WM_TURN_LIMIT,
    charDensity:
      avgTurnCharsLast3 >= SUMMARY_THRESHOLDS.AVG_TURN_CHARS ||
      maxTurnCharsLast3 >= SUMMARY_THRESHOLDS.MAX_TURN_CHARS,
    sessionDuration:
      Date.now() - sessionStartMs >= SUMMARY_THRESHOLDS.SESSION_DURATION_MS,
  };

  const summaryRecommended =
    thresholds.wmTurnLimit ||
    thresholds.charDensity ||
    thresholds.sessionDuration;

  const hardStopImminent =
    wmTurns >= SUMMARY_THRESHOLDS.WM_HARD_CAP - 1;

  return {
    sessionId,

    wm: {
      totalTurns: wmTurns,
      avgTurnCharsLast3,
      maxTurnCharsLast3,
    },

    thresholds,
    summaryRecommended,
    hardStopImminent,
  };
}

// ------------------------------------------------------------
// Log Emitter (SINGLE SOURCE OF TRUTH)
// ------------------------------------------------------------
export function logChatDiagnostics(diag: ChatReliabilityDiag) {
  console.log("[DIAG-CHAT-RELIABILITY]", diag);
}
