// lib/progression/ProgressionTypes.ts
// ------------------------------------------------------------
// Echoes of Fate — Progression Types
// ------------------------------------------------------------
// Purpose:
// - Canonical progression state for hero, fellowship, relics, and campaign gates
// - Shared type surface for progression events, evolution, UI, and dungeon checks
//
// Design rules:
// - PURE types/constants only
// - NO side effects
// - Keep campaign-level progression separate from dungeon runtime logic
// ------------------------------------------------------------

export type HeroUpgradeId = string;
export type CompanionId = string;
export type ProgressionRewardId = string;
export type ProgressionMilestoneId = string;
export type RelicId = string;
export type WorldSeed = string;
export type HeroId = string;
export type CompanionCombinationKey = string;

export type FellowshipGateId =
  | "GROUND_EXPLORATION"
  | "DESCENT_TO_MINUS_1"
  | "DESCENT_TO_MINUS_2"
  | "CRYPT_COMPLETION"
  | "FINAL_DESCENT";

export type RelicTier =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "LEGENDARY"
  | "MYTHIC";

export type RelicOriginKind =
  | "TAVERN"
  | "MORAL_GATE"
  | "PUZZLE"
  | "TRAP"
  | "BOSS"
  | "CRYPT"
  | "CHRONICLE"
  | "FACTION"
  | "DISCOVERY"
  | "RITUAL";

export type RelicBondState = "UNBONDED" | "BONDED" | "SCARRED";

export type RelicMajorEventType =
  | "DISCOVERED"
  | "EQUIPPED"
  | "TRANSFERRED"
  | "STORED"
  | "RECOVERED"
  | "BOND_FORGED"
  | "BOND_SCARRED"
  | "CARRIER_FELL"
  | "BOSS_DEFEATED"
  | "PUZZLE_SOLVED"
  | "MORAL_CHOICE"
  | "RUN_COMPLETED";

export type HeroProgressionState = {
  level: number;
  experience: number;
  legacyRank: number;
  upgradePoints: number;
  upgrades: HeroUpgradeId[];
  masteryUnlocked: boolean;
  level30ReachedAtRun: number | null;
};

export type PartyProgressionState = {
  unlockedSlots: number;
  activeSlots: number;
  maxSlots: number;
  livingMembers: number;
  fallenMembers: number;
  lowestFloorReached: 0 | -1 | -2;
};

export type CompanionRosterState = {
  recruited: CompanionId[];
  available: CompanionId[];
  declined: CompanionId[];
  lost: CompanionId[];
  extinctCombinations: CompanionCombinationKey[];
};

export type CampaignProgressionState = {
  milestonesReached: ProgressionMilestoneId[];
  fullFellowshipAssembled: boolean;
  completionRequiresFullFellowship: boolean;
  completionBlocked: boolean;
  cryptFullyCleared: boolean;
  finalDescentUnlocked: boolean;
};

export type OfferedProgressionReward = {
  rewardId: ProgressionRewardId;
  options: string[];
  offeredAtEventId?: string | null;
  offeredAtTimestamp?: number | null;
};

export type FellowshipGateRule = {
  gateId: FellowshipGateId;
  label: string;
  minimumPartySize: number;
  exactPartySize?: number;
  description: string;
  failureText: string;
  successText: string;
};

export type FellowshipGateEvaluation = {
  gateId: FellowshipGateId;
  allowed: boolean;
  partySize: number;
  minimumPartySize: number;
  exactPartySize?: number;
  shortfall: number;
  reason: string;
};

export type RelicDefinition = {
  id: RelicId;
  name: string;
  tier: RelicTier;
  originKind: RelicOriginKind;
  originLabel: string;
  flavor: string;
  effectText: string;
  ledgerKey?: string | null;
  transferable: boolean;
  bondable: boolean;
};

export type RelicCarrierKind = "HERO" | "COMPANION" | "STORAGE" | "LOST";

export type RelicCarrierRef = {
  kind: RelicCarrierKind;
  id: HeroId | CompanionId | "storage" | "lost";
};

export type RelicMajorEvent = {
  type: RelicMajorEventType;
  runNumber?: number | null;
  roomId?: string | null;
  floor?: 0 | -1 | -2 | null;
  note?: string | null;
  timestamp?: number | null;
};

export type RelicHistory = {
  discoveredBy: HeroId | CompanionId | null;
  discoveredAtRun: number | null;
  originStoryRevealed: boolean;
  currentCarrier: RelicCarrierRef;
  carriers: Array<HeroId | CompanionId>;
  bondedTo: HeroId | CompanionId | null;
  bondState: RelicBondState;
  bondedAtRun: number | null;
  runsSurvived: number;
  witnessedDeaths: number;
  bossesWitnessed: number;
  majorEvents: RelicMajorEvent[];
};

export type RelicInventoryState = {
  equippedByHero: RelicId[];
  equippedByCompanion: Record<CompanionId, RelicId[]>;
  storedRelics: RelicId[];
  carriedRelics: RelicId[];
  lostRelics: RelicId[];
  activePool: RelicId[];
  history: Record<RelicId, RelicHistory>;
};

export type CampaignRelicPoolState = {
  worldSeed: WorldSeed | null;
  selectedRelicIds: RelicId[];
  totalPoolSize: number;
  activePoolSize: number;
};

export type InventoryProgressionState = {
  totalSlots: number;
  usedSlots: number;
  freeSlots: number;
};

export type ProgressionState = {
  hero: HeroProgressionState;
  party: PartyProgressionState;
  companions: CompanionRosterState;
  campaign: CampaignProgressionState;
  relics: RelicInventoryState;
  relicPool: CampaignRelicPoolState;
  inventory: InventoryProgressionState;
  offeredReward: OfferedProgressionReward | null;
};

export const HERO_LEVEL_CAP = 30;
export const LEGACY_RANK_MIN = 0;
export const PARTY_SIZE_CAP = 6;
export const CAMPAIGN_RELIC_POOL_SIZE = 70;

export const FELLOWSHIP_GATE_RULES: Record<FellowshipGateId, FellowshipGateRule> = {
  GROUND_EXPLORATION: {
    gateId: "GROUND_EXPLORATION",
    label: "Ground Floor Exploration",
    minimumPartySize: 1,
    description: "A lone hero may begin the journey on the surface.",
    failureText: "No living hero remains to continue the Chronicle.",
    successText: "The journey may begin.",
  },

  DESCENT_TO_MINUS_1: {
    gateId: "DESCENT_TO_MINUS_1",
    label: "Descent to Floor -1",
    minimumPartySize: 2,
    description:
      "The first descent formula requires at least two living expedition members.",
    failureText: "The stair does not answer a solitary hand.",
    successText: "Two lives descend where one could not.",
  },

  DESCENT_TO_MINUS_2: {
    gateId: "DESCENT_TO_MINUS_2",
    label: "Descent to Floor -2",
    minimumPartySize: 4,
    description:
      "The crypt requires a true expedition. Light, heat, vigilance, and burden cannot be sustained by too few.",
    failureText: "Four are required to descend into the crypt.",
    successText: "Four stand against the cold halls.",
  },

  CRYPT_COMPLETION: {
    gateId: "CRYPT_COMPLETION",
    label: "Crypt Completion",
    minimumPartySize: 6,
    description:
      "The crypt may be entered with four to six, but true completion requires the full fellowship.",
    failureText: "The crypt remains incomplete until all six stand together.",
    successText: "The fellowship is complete. The crypt may answer in full.",
  },

  FINAL_DESCENT: {
    gateId: "FINAL_DESCENT",
    label: "Final Descent",
    minimumPartySize: 6,
    exactPartySize: 6,
    description:
      "The final way opens only for the full fellowship after the crypt has been completely cleared.",
    failureText: "The final door does not open. Six must stand before it.",
    successText: "Six names stand together. The final way opens.",
  },
} as const;

export const PARTY_SLOT_TOTAL_BY_ACTIVE_MEMBERS: Record<number, number> = {
  1: 8,
  2: 12,
  3: 16,
  4: 20,
  5: 24,
  6: 28,
} as const;

export const INITIAL_PROGRESSION_STATE: ProgressionState = {
  hero: {
    level: 1,
    experience: 0,
    legacyRank: 0,
    upgradePoints: 0,
    upgrades: [],
    masteryUnlocked: false,
    level30ReachedAtRun: null,
  },

  party: {
    unlockedSlots: 1,
    activeSlots: 1,
    maxSlots: PARTY_SIZE_CAP,
    livingMembers: 1,
    fallenMembers: 0,
    lowestFloorReached: 0,
  },

  companions: {
    recruited: [],
    available: [],
    declined: [],
    lost: [],
    extinctCombinations: [],
  },

  campaign: {
    milestonesReached: [],
    fullFellowshipAssembled: false,
    completionRequiresFullFellowship: true,
    completionBlocked: true,
    cryptFullyCleared: false,
    finalDescentUnlocked: false,
  },

  relics: {
    equippedByHero: [],
    equippedByCompanion: {},
    storedRelics: [],
    carriedRelics: [],
    lostRelics: [],
    activePool: [],
    history: {},
  },

  relicPool: {
    worldSeed: null,
    selectedRelicIds: [],
    totalPoolSize: 0,
    activePoolSize: CAMPAIGN_RELIC_POOL_SIZE,
  },

  inventory: {
    totalSlots: PARTY_SLOT_TOTAL_BY_ACTIVE_MEMBERS[1],
    usedSlots: 0,
    freeSlots: PARTY_SLOT_TOTAL_BY_ACTIVE_MEMBERS[1],
  },

  offeredReward: null,
};
