// governedAction.ts
// ------------------------------------------------------------
// Solace Governance Adapter
// Canonical adapter: packages inputs only
// ------------------------------------------------------------

import { executeGoverned } from "./executionGateIntegration";
import { ConstraintPolicy } from "./constraintCompiler";
import { DecisionTrace } from "./decisionTrace";
import { AuthorityInstance } from "./authorityModel";

export type GovernedActionInput<T> = {
  trace: DecisionTrace;
  authority: AuthorityInstance | null;
  policy: ConstraintPolicy;
  effect: () => T;
};

export type GovernedActionResult<T> =
  | { status: "ALLOW"; result: T }
  | { status: "DEGRADE"; result: T }
  | { status: "BLOCK" }
  | { status: "ESCALATE" };

// Adapter simply packages canonical inputs for the kernel
export function governedAction<T>(
  input: GovernedActionInput<T>
): GovernedActionResult<T> {
  const { trace, authority, policy, effect } = input;

  const outcome = executeGoverned(
    trace,
    policy,
    authority,
    effect
  );

  switch (outcome.enforcement) {
    case "ALLOW":
      return { status: "ALLOW", result: outcome.result as T };
    case "DEGRADE":
      return { status: "DEGRADE", result: outcome.result as T };
    case "BLOCK":
      return { status: "BLOCK" };
    case "ESCALATE":
      return { status: "ESCALATE" };
  }
}
