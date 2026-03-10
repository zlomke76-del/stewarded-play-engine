// lib/progression/ProgressionTypes.ts
// ------------------------------------------------------------
// Echoes of Fate — Progression Types
// ------------------------------------------------------------

export type HeroUpgradeId = string;
export type CompanionId = string;
export type ProgressionRewardId = string;
export type ProgressionMilestoneId = string;

export type HeroProgressionState = {
  level: number;
  upgradePoints: number;
  upgrades: HeroUpgradeId[];
};

export type PartyProgressionState = {
  unlockedSlots: number;
  activeSlots: number;
  maxSlots: number;
};

export type CompanionRosterState = {
  recruited: CompanionId[];
  available: CompanionId[];
  declined: CompanionId[];
  lost: CompanionId[];
};

export type CampaignProgressionState = {
  milestonesReached: ProgressionMilestoneId[];
  fullFellowshipAssembled: boolean;
  completionRequiresFullFellowship: boolean;
  completionBlocked: boolean;
};

export type OfferedProgressionReward = {
  rewardId: ProgressionRewardId;
  options: string[];
  offeredAtEventId?: string | null;
  offeredAtTimestamp?: number | null;
};

export type ProgressionState = {
  hero: HeroProgressionState;
  party: PartyProgressionState;
  companions: CompanionRosterState;
  campaign: CampaignProgressionState;
  offeredReward: OfferedProgressionReward | null;
};

export const INITIAL_PROGRESSION_STATE: ProgressionState = {
  hero: {
    level: 1,
    upgradePoints: 0,
    upgrades: [],
  },

  party: {
    unlockedSlots: 1,
    activeSlots: 1,
    maxSlots: 6,
  },

  companions: {
    recruited: [],
    available: [],
    declined: [],
    lost: [],
  },

  campaign: {
    milestonesReached: [],
    fullFellowshipAssembled: false,
    completionRequiresFullFellowship: true,
    completionBlocked: true,
  },

  offeredReward: null,
};
