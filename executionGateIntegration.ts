// executionGateIntegration.ts
// ------------------------------------------------------------
// Execution Gate Integration Layer v1.0
// Deterministic binding of constraints → execution
// No IO, no persistence, refusal-first semantics
// ------------------------------------------------------------

import { DecisionTrace, createDecisionTrace } from "./decisionTrace";
import { AuthorityInstance } from "./authorityModel";
import {
  ConstraintPolicy,
  compileConstraints,
  evaluateConstraints,
  EnforcementAction,
} from "./constraintCompiler";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type ExecutionOutcome<T> =
  | { ok: true; result: T; enforcement: "ALLOW" | "DEGRADE" }
  | { ok: false; enforcement: "BLOCK" | "ESCALATE" };

export type SideEffect<T> = () => T;

/* ------------------------------------------------------------
   Integrated Execution Gate
------------------------------------------------------------ */

export function executeGoverned<T>(
  traceInput: unknown,
  policy: ConstraintPolicy,
  authority: AuthorityInstance | null,
  sideEffect: SideEffect<T>
): ExecutionOutcome<T> {
  let trace: DecisionTrace;

  try {
    trace = createDecisionTrace(traceInput as DecisionTrace);
  } catch {
    return { ok: false, enforcement: "BLOCK" };
  }

  const compiled = compileConstraints(policy, trace, authority);
  const enforcement: EnforcementAction = evaluateConstraints(compiled);

  switch (enforcement) {
    case "BLOCK":
    case "ESCALATE":
      return { ok: false, enforcement };

    case "DEGRADE": {
      try {
        const result = sideEffect();
        return { ok: true, result, enforcement: "DEGRADE" };
      } catch {
        return { ok: false, enforcement: "BLOCK" };
      }
    }

    case "ALLOW": {
      try {
        const result = sideEffect();
        return { ok: true, result, enforcement: "ALLOW" };
      } catch {
        return { ok: false, enforcement: "BLOCK" };
      }
    }
  }
}
