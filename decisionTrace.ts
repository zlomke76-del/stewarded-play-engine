// decisionTrace.ts
// ------------------------------------------------------------
// DecisionTrace v1.0
// Canonical schema + constructor + invariant enforcement
// ------------------------------------------------------------

/* ------------------------------------------------------------
   Primitive Types
------------------------------------------------------------ */

export type UUID = string; // validated at runtime

export type RFC3339 = string;

export type InputRef = {
  id: string;
  type: string;
  provenance: string;
};

export type ConstraintRef = {
  id: string;
  version: string;
};

export type SuppressionReason = string;

export type AuthorityInstanceID = UUID;

/* ------------------------------------------------------------
   DecisionTrace Schema (v1.0 — frozen)
------------------------------------------------------------ */

export type DecisionTrace = {
  decision_id: UUID;
  timestamp: RFC3339;

  inputs: InputRef[];
  constraints_applied: ConstraintRef[];

  suppression: {
    suppressed: boolean;
    reasons: SuppressionReason[];
  };

  confidence: {
    value: number; // 0–1, write-once
    decay_curve: "LINEAR" | "EXPONENTIAL" | "STEP" | "CUSTOM";
    decay_params: Record<string, unknown>;
  };

  authority_ratification: {
    authority_id: AuthorityInstanceID;
    ratified_at: RFC3339;
    ratification_signature: string;
  } | null;

  escalation_path: AuthorityInstanceID[];

  exhaustion_flag: {
    exhausted: boolean;
    terminal_state: "HALT" | "SAFE_MODE" | "DEAD_END_REFUSAL" | null;
    detection_reason:
      | "NO_VALID_AUTHORITY"
      | "CIRCULAR_ESCALATION"
      | "SATURATED_ESCALATION"
      | null;
  };

  outcome: {
    status: "FULL" | "PARTIAL" | "NONE";
    reversible: boolean;
    expiry: RFC3339 | null;
  };
};

/* ------------------------------------------------------------
   Constructor Input (explicit, no implicit defaults)
------------------------------------------------------------ */

export type DecisionTraceInput = DecisionTrace;

/* ------------------------------------------------------------
   Invariant Validators
------------------------------------------------------------ */

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isRFC3339(value: string): boolean {
  return !isNaN(Date.parse(value));
}

function hasNoDuplicates(arr: string[]): boolean {
  return new Set(arr).size === arr.length;
}

/* ------------------------------------------------------------
   Canonical Constructor (single choke point)
------------------------------------------------------------ */

export function createDecisionTrace(
  input: DecisionTraceInput
): DecisionTrace {
  // UUID
  if (!isValidUUID(input.decision_id)) {
    throw new Error("Invalid decision_id UUID");
  }

  // Timestamp
  if (!isRFC3339(input.timestamp)) {
    throw new Error("Invalid RFC3339 timestamp");
  }

  // Constraints
  if (!input.constraints_applied || input.constraints_applied.length === 0) {
    throw new Error("At least one constraint must be applied");
  }

  // Confidence
  if (
    typeof input.confidence.value !== "number" ||
    input.confidence.value < 0 ||
    input.confidence.value > 1
  ) {
    throw new Error("Confidence value must be between 0 and 1");
  }

  // Escalation path integrity
  if (!hasNoDuplicates(input.escalation_path)) {
    throw new Error("Escalation path contains duplicate authority IDs");
  }

  // Authority completeness
  const hasAuthority = input.authority_ratification !== null;
  const exhausted = input.exhaustion_flag.exhausted;

  if (!hasAuthority && !exhausted) {
    throw new Error(
      "DecisionTrace must have authority ratification or exhaustion"
    );
  }

  // Exhaustion terminality
  if (exhausted && input.outcome.status !== "NONE") {
    throw new Error(
      "Exhausted DecisionTrace cannot produce a non-NONE outcome"
    );
  }

  // Outcome expiry coherence
  if (
    input.outcome.expiry !== null &&
    !isRFC3339(input.outcome.expiry)
  ) {
    throw new Error("Outcome expiry must be RFC3339 or null");
  }

  // Ratification coherence
  if (input.authority_ratification) {
    if (!isValidUUID(input.authority_ratification.authority_id)) {
      throw new Error("Invalid authority_id UUID");
    }
    if (!isRFC3339(input.authority_ratification.ratified_at)) {
      throw new Error("Invalid ratified_at timestamp");
    }
  }

  // Exhaustion coherence
  if (input.exhaustion_flag.exhausted) {
    if (
      input.exhaustion_flag.terminal_state === null ||
      input.exhaustion_flag.detection_reason === null
    ) {
      throw new Error(
        "Exhaustion flag requires terminal_state and detection_reason"
      );
    }
  }

  return Object.freeze({ ...input });
}
