// executionGate.ts
// ------------------------------------------------------------
// Execution Gate v1.0
// Side-effect firewall enforcing DecisionTrace presence
// Refusal-first semantics
// ------------------------------------------------------------

import { DecisionTrace, createDecisionTrace } from "./decisionTrace";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type ExecutionResult<T> =
  | { ok: true; result: T }
  | { ok: false; error: "REFUSED" };

export type SideEffect<T> = () => T;

/* ------------------------------------------------------------
   Guard
------------------------------------------------------------ */

function isValidDecisionTrace(trace: unknown): trace is DecisionTrace {
  try {
    createDecisionTrace(trace as DecisionTrace);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------
   Execution Gate
------------------------------------------------------------ */

export function executeWithDecisionTrace<T>(
  trace: unknown,
  sideEffect: SideEffect<T>
): ExecutionResult<T> {
  if (!isValidDecisionTrace(trace)) {
    return { ok: false, error: "REFUSED" };
  }

  try {
    const result = sideEffect();
    return { ok: true, result };
  } catch {
    return { ok: false, error: "REFUSED" };
  }
}

/* ------------------------------------------------------------
   Hard Refusal Helpers
------------------------------------------------------------ */

export function refuseExecution(): ExecutionResult<never> {
  return { ok: false, error: "REFUSED" };
}
