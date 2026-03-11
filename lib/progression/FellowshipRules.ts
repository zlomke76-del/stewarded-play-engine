// lib/progression/FellowshipRules.ts
// ------------------------------------------------------------
// Echoes of Fate — Fellowship Threshold Rules
// ------------------------------------------------------------
// Purpose:
// - Centralize party-size requirements for dungeon progression
// - Keep fellowship gating deterministic and data-driven
// - Provide a single source of truth for UI, navigation, and story text
//
// Design rules:
// - PURE module: no mutation, no side effects
// - NO dungeon state writes here
// - Same inputs -> same outputs
// - Human-readable failure reasons for narrative surfaces
// ------------------------------------------------------------

export type DescentGateId =
  | "ground-exploration"
  | "stairs-ground-to-minus-1"
  | "stairs-minus-1-to-minus-2"
  | "crypt-completion"
  | "final-descent";

export type FellowshipGateRule = {
  id: DescentGateId;
  label: string;
  minimumPartySize: number;
  exactPartySize?: number;
  description: string;
  failureText: string;
  successText: string;
};

export type FellowshipGateEvaluation = {
  allowed: boolean;
  gateId: DescentGateId;
  partySize: number;
  minimumPartySize: number;
  exactPartySize?: number;
  shortfall: number;
  reason: string;
};

export const FELLOWSHIP_GATE_RULES: Record<DescentGateId, FellowshipGateRule> = {
  "ground-exploration": {
    id: "ground-exploration",
    label: "Ground Floor Exploration",
    minimumPartySize: 1,
    description: "A lone hero may begin the journey on the surface level.",
    failureText: "No living hero remains to continue the Chronicle.",
    successText: "The journey may begin.",
  },

  "stairs-ground-to-minus-1": {
    id: "stairs-ground-to-minus-1",
    label: "Descent to Floor -1",
    minimumPartySize: 2,
    description:
      "The first descent formula requires at least two living expedition members.",
    failureText: "The stair does not answer a solitary hand.",
    successText: "Two lives descend where one could not.",
  },

  "stairs-minus-1-to-minus-2": {
    id: "stairs-minus-1-to-minus-2",
    label: "Descent to Floor -2",
    minimumPartySize: 4,
    description:
      "The crypt requires a true expedition. Light, heat, vigilance, and burden cannot be sustained by too few.",
    failureText: "Four are required to descend into the crypt.",
    successText: "Four stand against the cold halls.",
  },

  "crypt-completion": {
    id: "crypt-completion",
    label: "Crypt Completion Eligibility",
    minimumPartySize: 6,
    description:
      "The crypt may be entered with four to six, but true completion requires the full fellowship.",
    failureText: "The crypt remains incomplete until all six stand together.",
    successText: "The fellowship is complete. The crypt may answer in full.",
  },

  "final-descent": {
    id: "final-descent",
    label: "Final Descent",
    minimumPartySize: 6,
    exactPartySize: 6,
    description:
      "The final way opens only for the full fellowship after the crypt has been completely cleared.",
    failureText: "The final door does not open. Six must stand before it.",
    successText: "Six names stand together. The final way opens.",
  },
} as const;

export type PartyThresholdSummary = {
  groundExploration: number;
  minus1Access: number;
  minus2Access: number;
  cryptCompletion: number;
  finalDescent: number;
};

export const PARTY_THRESHOLDS: PartyThresholdSummary = {
  groundExploration: FELLOWSHIP_GATE_RULES["ground-exploration"].minimumPartySize,
  minus1Access: FELLOWSHIP_GATE_RULES["stairs-ground-to-minus-1"].minimumPartySize,
  minus2Access: FELLOWSHIP_GATE_RULES["stairs-minus-1-to-minus-2"].minimumPartySize,
  cryptCompletion: FELLOWSHIP_GATE_RULES["crypt-completion"].minimumPartySize,
  finalDescent: FELLOWSHIP_GATE_RULES["final-descent"].minimumPartySize,
} as const;

function clampPartySize(partySize: number): number {
  if (!Number.isFinite(partySize)) return 0;
  return Math.max(0, Math.floor(partySize));
}

export function getFellowshipGateRule(gateId: DescentGateId): FellowshipGateRule {
  return FELLOWSHIP_GATE_RULES[gateId];
}

export function evaluateFellowshipGate(
  gateId: DescentGateId,
  partySize: number,
): FellowshipGateEvaluation {
  const normalizedPartySize = clampPartySize(partySize);
  const rule = getFellowshipGateRule(gateId);
  const shortfall = Math.max(0, rule.minimumPartySize - normalizedPartySize);

  const meetsMinimum = normalizedPartySize >= rule.minimumPartySize;
  const meetsExact =
    rule.exactPartySize == null || normalizedPartySize === rule.exactPartySize;

  const allowed = meetsMinimum && meetsExact;

  let reason = allowed ? rule.successText : rule.failureText;

  if (!allowed && rule.exactPartySize != null && normalizedPartySize > rule.exactPartySize) {
    reason = `Too many stand before the threshold. Exactly ${rule.exactPartySize} are required.`;
  }

  return {
    allowed,
    gateId,
    partySize: normalizedPartySize,
    minimumPartySize: rule.minimumPartySize,
    exactPartySize: rule.exactPartySize,
    shortfall,
    reason,
  };
}

export function canAccessGroundFloor(partySize: number): boolean {
  return evaluateFellowshipGate("ground-exploration", partySize).allowed;
}

export function canDescendToMinus1(partySize: number): boolean {
  return evaluateFellowshipGate("stairs-ground-to-minus-1", partySize).allowed;
}

export function canDescendToMinus2(partySize: number): boolean {
  return evaluateFellowshipGate("stairs-minus-1-to-minus-2", partySize).allowed;
}

export function canCompleteCrypt(partySize: number): boolean {
  return evaluateFellowshipGate("crypt-completion", partySize).allowed;
}

export function canOpenFinalDescent(args: {
  partySize: number;
  cryptFullyCleared: boolean;
}): FellowshipGateEvaluation {
  const base = evaluateFellowshipGate("final-descent", args.partySize);

  if (!base.allowed) {
    return base;
  }

  if (!args.cryptFullyCleared) {
    return {
      ...base,
      allowed: false,
      reason: "The crypt grows silent, yet the final door does not open.",
    };
  }

  return base;
}

export function getNextFellowshipMilestone(partySize: number): FellowshipGateRule | null {
  const normalizedPartySize = clampPartySize(partySize);

  const ordered: DescentGateId[] = [
    "ground-exploration",
    "stairs-ground-to-minus-1",
    "stairs-minus-1-to-minus-2",
    "crypt-completion",
    "final-descent",
  ];

  for (const gateId of ordered) {
    const rule = getFellowshipGateRule(gateId);

    if (rule.exactPartySize != null) {
      if (normalizedPartySize < rule.exactPartySize) {
        return rule;
      }
      continue;
    }

    if (normalizedPartySize < rule.minimumPartySize) {
      return rule;
    }
  }

  return null;
}

export function describeFellowshipProgress(partySize: number): string {
  const normalizedPartySize = clampPartySize(partySize);
  const next = getNextFellowshipMilestone(normalizedPartySize);

  if (!next) {
    return "The fellowship stands complete.";
  }

  const needed = Math.max(0, next.minimumPartySize - normalizedPartySize);

  if (needed <= 0 && next.exactPartySize != null && normalizedPartySize !== next.exactPartySize) {
    return `The way ahead answers only to exactly ${next.exactPartySize}.`;
  }

  if (needed === 1) {
    return `One more living companion is needed for ${next.label}.`;
  }

  return `${needed} more living companions are needed for ${next.label}.`;
}
