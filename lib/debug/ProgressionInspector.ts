// lib/debug/ProgressionInspector.ts
// ------------------------------------------------------------
// Echoes of Fate — Progression Inspector
// ------------------------------------------------------------
// Purpose:
// - Provide a deterministic human-readable snapshot of campaign progression
// - Help verify level pacing, fellowship gates, relic history, and campaign unlocks
// - Serve as a debugging surface for logs, tests, and dev UI
//
// Design rules:
// - PURE module: no mutation, no side effects
// - NO runtime dependencies on browser APIs
// - Same inputs -> same outputs
// ------------------------------------------------------------

import {
  type FellowshipGateId,
  type ProgressionState,
} from "@/lib/progression/ProgressionTypes";
import {
  deriveFellowshipGateEvaluations,
  isExtinctCompanionCombination,
  type SessionEvent,
} from "@/lib/progression/ProgressionEvolution";

export type ProgressionInspectorSummary = {
  hero: {
    level: number;
    experience: number;
    legacyRank: number;
    upgradePoints: number;
    upgrades: string[];
    masteryUnlocked: boolean;
    level30ReachedAtRun: number | null;
  };
  party: {
    activeSlots: number;
    unlockedSlots: number;
    maxSlots: number;
    livingMembers: number;
    fallenMembers: number;
    lowestFloorReached: 0 | -1 | -2;
  };
  inventory: {
    totalSlots: number;
    usedSlots: number;
    freeSlots: number;
  };
  companions: {
    recruited: string[];
    available: string[];
    declined: string[];
    lost: string[];
    extinctCombinations: string[];
  };
  campaign: {
    milestonesReached: string[];
    fullFellowshipAssembled: boolean;
    completionRequiresFullFellowship: boolean;
    completionBlocked: boolean;
    cryptFullyCleared: boolean;
    finalDescentUnlocked: boolean;
  };
  relics: {
    activePoolCount: number;
    storedCount: number;
    carriedCount: number;
    lostCount: number;
    equippedByHeroCount: number;
    equippedByCompanionCount: number;
    bondedCount: number;
    scarredCount: number;
    totalHistoryTracked: number;
  };
  gates: Record<
    FellowshipGateId,
    {
      allowed: boolean;
      partySize: number;
      minimumPartySize: number;
      exactPartySize?: number;
      shortfall: number;
      reason: string;
    }
  >;
  eventStats: {
    totalEvents: number;
    progressionEvents: number;
  };
};

function sortStrings(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}

function formatList(values: string[], emptyLabel = "none"): string {
  if (!values.length) return emptyLabel;
  return values.join(", ");
}

function countEquippedByCompanion(
  equippedByCompanion: Record<string, string[]>,
): number {
  let total = 0;

  for (const relicIds of Object.values(equippedByCompanion)) {
    total += relicIds.length;
  }

  return total;
}

function countBondStates(state: ProgressionState): {
  bondedCount: number;
  scarredCount: number;
} {
  let bondedCount = 0;
  let scarredCount = 0;

  for (const history of Object.values(state.relics.history)) {
    if (history.bondState === "BONDED") bondedCount += 1;
    if (history.bondState === "SCARRED") scarredCount += 1;
  }

  return { bondedCount, scarredCount };
}

export function inspectProgressionState(args: {
  state: ProgressionState;
  events?: readonly SessionEvent[];
}): ProgressionInspectorSummary {
  const { state, events = [] } = args;
  const gateEvaluations = deriveFellowshipGateEvaluations({ state });
  const { bondedCount, scarredCount } = countBondStates(state);

  return {
    hero: {
      level: state.hero.level,
      experience: state.hero.experience,
      legacyRank: state.hero.legacyRank,
      upgradePoints: state.hero.upgradePoints,
      upgrades: sortStrings(state.hero.upgrades),
      masteryUnlocked: state.hero.masteryUnlocked,
      level30ReachedAtRun: state.hero.level30ReachedAtRun,
    },

    party: {
      activeSlots: state.party.activeSlots,
      unlockedSlots: state.party.unlockedSlots,
      maxSlots: state.party.maxSlots,
      livingMembers: state.party.livingMembers,
      fallenMembers: state.party.fallenMembers,
      lowestFloorReached: state.party.lowestFloorReached,
    },

    inventory: {
      totalSlots: state.inventory.totalSlots,
      usedSlots: state.inventory.usedSlots,
      freeSlots: state.inventory.freeSlots,
    },

    companions: {
      recruited: sortStrings(state.companions.recruited),
      available: sortStrings(state.companions.available),
      declined: sortStrings(state.companions.declined),
      lost: sortStrings(state.companions.lost),
      extinctCombinations: sortStrings(state.companions.extinctCombinations),
    },

    campaign: {
      milestonesReached: sortStrings(state.campaign.milestonesReached),
      fullFellowshipAssembled: state.campaign.fullFellowshipAssembled,
      completionRequiresFullFellowship:
        state.campaign.completionRequiresFullFellowship,
      completionBlocked: state.campaign.completionBlocked,
      cryptFullyCleared: state.campaign.cryptFullyCleared,
      finalDescentUnlocked: state.campaign.finalDescentUnlocked,
    },

    relics: {
      activePoolCount: state.relics.activePool.length,
      storedCount: state.relics.storedRelics.length,
      carriedCount: state.relics.carriedRelics.length,
      lostCount: state.relics.lostRelics.length,
      equippedByHeroCount: state.relics.equippedByHero.length,
      equippedByCompanionCount: countEquippedByCompanion(
        state.relics.equippedByCompanion,
      ),
      bondedCount,
      scarredCount,
      totalHistoryTracked: Object.keys(state.relics.history).length,
    },

    gates: {
      GROUND_EXPLORATION: gateEvaluations.GROUND_EXPLORATION,
      DESCENT_TO_MINUS_1: gateEvaluations.DESCENT_TO_MINUS_1,
      DESCENT_TO_MINUS_2: gateEvaluations.DESCENT_TO_MINUS_2,
      CRYPT_COMPLETION: gateEvaluations.CRYPT_COMPLETION,
      FINAL_DESCENT: gateEvaluations.FINAL_DESCENT,
    },

    eventStats: {
      totalEvents: events.length,
      progressionEvents: events.filter((event) => typeof event?.type === "string")
        .length,
    },
  };
}

export function formatProgressionInspectorReport(args: {
  state: ProgressionState;
  events?: readonly SessionEvent[];
}): string {
  const summary = inspectProgressionState(args);

  const lines: string[] = [];

  lines.push("=== Echoes of Fate — Progression Inspector ===");
  lines.push("");

  lines.push("[Hero]");
  lines.push(`Level: ${summary.hero.level}`);
  lines.push(`XP Banked: ${summary.hero.experience}`);
  lines.push(`Legacy Rank: ${summary.hero.legacyRank}`);
  lines.push(`Upgrade Points: ${summary.hero.upgradePoints}`);
  lines.push(`Mastery Unlocked: ${yesNo(summary.hero.masteryUnlocked)}`);
  lines.push(
    `Level 30 Reached At Run: ${
      summary.hero.level30ReachedAtRun == null
        ? "not yet"
        : String(summary.hero.level30ReachedAtRun)
    }`,
  );
  lines.push(
    `Upgrades (${summary.hero.upgrades.length}): ${formatList(summary.hero.upgrades)}`,
  );
  lines.push("");

  lines.push("[Party]");
  lines.push(
    `Active / Unlocked / Max: ${summary.party.activeSlots} / ${summary.party.unlockedSlots} / ${summary.party.maxSlots}`,
  );
  lines.push(`Living Members: ${summary.party.livingMembers}`);
  lines.push(`Fallen Members: ${summary.party.fallenMembers}`);
  lines.push(`Lowest Floor Reached: ${summary.party.lowestFloorReached}`);
  lines.push("");

  lines.push("[Inventory]");
  lines.push(`Total Slots: ${summary.inventory.totalSlots}`);
  lines.push(`Used Slots: ${summary.inventory.usedSlots}`);
  lines.push(`Free Slots: ${summary.inventory.freeSlots}`);
  lines.push("");

  lines.push("[Companions]");
  lines.push(
    `Recruited (${summary.companions.recruited.length}): ${formatList(summary.companions.recruited)}`,
  );
  lines.push(
    `Available (${summary.companions.available.length}): ${formatList(summary.companions.available)}`,
  );
  lines.push(
    `Declined (${summary.companions.declined.length}): ${formatList(summary.companions.declined)}`,
  );
  lines.push(
    `Lost (${summary.companions.lost.length}): ${formatList(summary.companions.lost)}`,
  );
  lines.push(
    `Extinct Combinations (${summary.companions.extinctCombinations.length}): ${formatList(summary.companions.extinctCombinations)}`,
  );
  lines.push("");

  lines.push("[Campaign]");
  lines.push(
    `Milestones Reached (${summary.campaign.milestonesReached.length}): ${formatList(summary.campaign.milestonesReached)}`,
  );
  lines.push(
    `Full Fellowship Assembled: ${yesNo(summary.campaign.fullFellowshipAssembled)}`,
  );
  lines.push(
    `Completion Requires Full Fellowship: ${yesNo(
      summary.campaign.completionRequiresFullFellowship,
    )}`,
  );
  lines.push(`Completion Blocked: ${yesNo(summary.campaign.completionBlocked)}`);
  lines.push(`Crypt Fully Cleared: ${yesNo(summary.campaign.cryptFullyCleared)}`);
  lines.push(
    `Final Descent Unlocked: ${yesNo(summary.campaign.finalDescentUnlocked)}`,
  );
  lines.push("");

  lines.push("[Relics]");
  lines.push(`Active Pool: ${summary.relics.activePoolCount}`);
  lines.push(`Stored: ${summary.relics.storedCount}`);
  lines.push(`Carried: ${summary.relics.carriedCount}`);
  lines.push(`Lost: ${summary.relics.lostCount}`);
  lines.push(`Equipped by Hero: ${summary.relics.equippedByHeroCount}`);
  lines.push(
    `Equipped by Companions: ${summary.relics.equippedByCompanionCount}`,
  );
  lines.push(`Bonded: ${summary.relics.bondedCount}`);
  lines.push(`Scarred: ${summary.relics.scarredCount}`);
  lines.push(`History Tracked: ${summary.relics.totalHistoryTracked}`);
  lines.push("");

  lines.push("[Fellowship Gates]");
  for (const [gateId, gate] of Object.entries(summary.gates)) {
    lines.push(
      `${gateId}: ${gate.allowed ? "OPEN" : "BLOCKED"} | party=${gate.partySize} | min=${gate.minimumPartySize}${
        gate.exactPartySize != null ? ` | exact=${gate.exactPartySize}` : ""
      } | shortfall=${gate.shortfall}`,
    );
    lines.push(`  Reason: ${gate.reason}`);
  }
  lines.push("");

  lines.push("[Events]");
  lines.push(`Total Events: ${summary.eventStats.totalEvents}`);
  lines.push(`Progression Events Seen: ${summary.eventStats.progressionEvents}`);
  lines.push("");

  return lines.join("\n");
}

export function formatExtinctionCheck(args: {
  state: ProgressionState;
  combinationKey: string;
}): string {
  const extinct = isExtinctCompanionCombination(args.state, args.combinationKey);
  return `${args.combinationKey}: ${extinct ? "EXTINCT" : "AVAILABLE"}`;
}

export function formatCompactProgressionBanner(args: {
  state: ProgressionState;
}): string {
  const { state } = args;
  const finalGate = deriveFellowshipGateEvaluations({ state }).FINAL_DESCENT;

  return [
    `Lv.${state.hero.level}`,
    `${state.party.activeSlots}/${state.party.maxSlots} ${pluralize(
      state.party.activeSlots,
      "member",
    )}`,
    `${state.inventory.usedSlots}/${state.inventory.totalSlots} slots`,
    `crypt=${state.campaign.cryptFullyCleared ? "cleared" : "open"}`,
    `final=${finalGate.allowed && state.campaign.cryptFullyCleared ? "ready" : "locked"}`,
  ].join(" · ");
}
