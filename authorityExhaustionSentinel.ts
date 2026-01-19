// authorityExhaustionSentinel.ts
// ------------------------------------------------------------
// Authority Exhaustion Sentinel v1.0
// Pure detection of escalation dead ends
// ------------------------------------------------------------

export type ExhaustionResult = {
  exhausted: boolean;
  terminal_state: "HALT" | "SAFE_MODE" | "DEAD_END_REFUSAL" | null;
  detection_reason:
    | "NO_VALID_AUTHORITY"
    | "CIRCULAR_ESCALATION"
    | "SATURATED_ESCALATION"
    | null;
};

export function detectAuthorityExhaustion(
  escalationPath: string[], // AuthorityInstance IDs, ordered
  maxDepth: number
): ExhaustionResult {
  if (!Array.isArray(escalationPath) || maxDepth <= 0) {
    return {
      exhausted: true,
      terminal_state: "HALT",
      detection_reason: "NO_VALID_AUTHORITY",
    };
  }

  // CIRCULAR_ESCALATION
  const set = new Set<string>();
  let hasCycle = false;
  for (const id of escalationPath) {
    if (set.has(id)) {
      hasCycle = true;
      break;
    }
    set.add(id);
  }
  if (hasCycle) {
    return {
      exhausted: true,
      terminal_state: "HALT",
      detection_reason: "CIRCULAR_ESCALATION",
    };
  }

  // SATURATED_ESCALATION
  if (escalationPath.length >= maxDepth) {
    return {
      exhausted: true,
      terminal_state: "SAFE_MODE",
      detection_reason: "SATURATED_ESCALATION",
    };
  }

  // NO_VALID_AUTHORITY (zero-length path)
  if (escalationPath.length === 0) {
    return {
      exhausted: true,
      terminal_state: "DEAD_END_REFUSAL",
      detection_reason: "NO_VALID_AUTHORITY",
    };
  }

  // Not exhausted
  return {
    exhausted: false,
    terminal_state: null,
    detection_reason: null,
  };
}

/* --------- Minimal invariant tests (can remove if not wanted) --------- */

function assertEqual(a: any, b: any) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`Assertion failed: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
  }
}

// Test: cycle in path
assertEqual(
  detectAuthorityExhaustion(["a", "b", "c", "b"], 10),
  {
    exhausted: true,
    terminal_state: "HALT",
    detection_reason: "CIRCULAR_ESCALATION",
  }
);

// Test: saturated path
assertEqual(
  detectAuthorityExhaustion(["a", "b", "c", "d", "e"], 5),
  {
    exhausted: true,
    terminal_state: "SAFE_MODE",
    detection_reason: "SATURATED_ESCALATION",
  }
);

// Test: no authorities
assertEqual(
  detectAuthorityExhaustion([], 3),
  {
    exhausted: true,
    terminal_state: "DEAD_END_REFUSAL",
    detection_reason: "NO_VALID_AUTHORITY",
  }
);

// Test: normal path, not exhausted
assertEqual(
  detectAuthorityExhaustion(["a", "b", "c"], 5),
  {
    exhausted: false,
    terminal_state: null,
    detection_reason: null,
  }
);
