// constraintCompiler.ts
// ------------------------------------------------------------
// Constraint Compiler Interface v1.0
// Compiles Abrahamic Code imperatives into mechanical rules
// Pure, deterministic, no IO
// ------------------------------------------------------------

import { DecisionTrace } from "./decisionTrace";
import { AuthorityInstance } from "./authorityModel";

/* ------------------------------------------------------------
   Primitive Types
------------------------------------------------------------ */

export type Imperative =
  | "TRUTH"
  | "ACCOUNTABILITY"
  | "NON_COERCIVE_COMPASSION"
  | "HUMAN_STOP_AUTHORITY"
  | "REVERSIBILITY_REQUIRED";

export type EnforcementAction =
  | "ALLOW"
  | "BLOCK"
  | "DEGRADE"
  | "ESCALATE";

export type CompiledConstraint = {
  imperative: Imperative;
  action: EnforcementAction;
  reason: string;
};

/* ------------------------------------------------------------
   Input Policy Spec
------------------------------------------------------------ */

export type ConstraintPolicy = {
  imperatives: Imperative[];
};

/* ------------------------------------------------------------
   Compiler
------------------------------------------------------------ */

export function compileConstraints(
  policy: ConstraintPolicy,
  trace: DecisionTrace,
  authority: AuthorityInstance | null
): CompiledConstraint[] {
  const constraints: CompiledConstraint[] = [];

  for (const imperative of policy.imperatives) {
    switch (imperative) {
      case "TRUTH": {
        if (trace.confidence.value < 0.5) {
          constraints.push({
            imperative,
            action: "DEGRADE",
            reason: "Insufficient confidence for truth-bearing output",
          });
        }
        break;
      }

      case "ACCOUNTABILITY": {
        if (!trace.authority_ratification && !trace.exhaustion_flag.exhausted) {
          constraints.push({
            imperative,
            action: "BLOCK",
            reason: "No accountable authority bound to decision",
          });
        }
        break;
      }

      case "NON_COERCIVE_COMPASSION": {
        if (trace.suppression.suppressed) {
          constraints.push({
            imperative,
            action: "ESCALATE",
            reason: "Suppression requires oversight review",
          });
        }
        break;
      }

      case "HUMAN_STOP_AUTHORITY": {
        if (!authority || authority.role !== "HUMAN") {
          constraints.push({
            imperative,
            action: "BLOCK",
            reason: "Human stop authority not present",
          });
        }
        break;
      }

      case "REVERSIBILITY_REQUIRED": {
        if (!trace.outcome.reversible) {
          constraints.push({
            imperative,
            action: "BLOCK",
            reason: "Action is not reversible under policy",
          });
        }
        break;
      }
    }
  }

  return constraints;
}

/* ------------------------------------------------------------
   Constraint Evaluation
------------------------------------------------------------ */

export function evaluateConstraints(
  compiled: CompiledConstraint[]
): EnforcementAction {
  if (compiled.some((c) => c.action === "BLOCK")) return "BLOCK";
  if (compiled.some((c) => c.action === "ESCALATE")) return "ESCALATE";
  if (compiled.some((c) => c.action === "DEGRADE")) return "DEGRADE";
  return "ALLOW";
}
