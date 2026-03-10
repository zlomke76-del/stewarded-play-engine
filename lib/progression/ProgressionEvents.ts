// lib/progression/ProgressionEvents.ts
// ------------------------------------------------------------
// Echoes of Fate — Progression Event Vocabulary
// ------------------------------------------------------------

import type {
  CompanionId,
  HeroUpgradeId,
  ProgressionMilestoneId,
  ProgressionRewardId,
} from "@/lib/progression/ProgressionTypes";

export type ProgressionEventType =
  | "PROGRESSION_REWARD_OFFERED"
  | "PROGRESSION_REWARD_RESOLVED"
  | "HERO_UPGRADE_CHOSEN"
  | "HERO_STAT_INCREASED"
  | "HERO_LEVEL_GAINED"
  | "HERO_UPGRADE_POINTS_GRANTED"
  | "PARTY_SLOT_UNLOCKED"
  | "COMPANION_AVAILABLE"
  | "COMPANION_RECRUITED"
  | "COMPANION_DECLINED"
  | "COMPANION_LOST"
  | "PROGRESSION_MILESTONE_REACHED"
  | "FULL_PARTY_ASSEMBLED"
  | "CAMPAIGN_COMPLETION_BLOCKED";

export type ProgressionRewardOfferedPayload = {
  rewardId: ProgressionRewardId;
  options: string[];
};

export type ProgressionRewardResolvedPayload = {
  rewardId: ProgressionRewardId;
  choice: string;
};

export type HeroUpgradeChosenPayload = {
  upgradeId: HeroUpgradeId;
};

export type HeroStatIncreasedPayload = {
  stat: string;
  amount: number;
};

export type HeroLevelGainedPayload = {
  level: number;
};

export type HeroUpgradePointsGrantedPayload = {
  points: number;
};

export type PartySlotUnlockedPayload = {
  slots: number;
};

export type CompanionAvailablePayload = {
  companionId: CompanionId;
};

export type CompanionRecruitedPayload = {
  companionId: CompanionId;
};

export type CompanionDeclinedPayload = {
  companionId: CompanionId;
};

export type CompanionLostPayload = {
  companionId: CompanionId;
};

export type ProgressionMilestoneReachedPayload = {
  milestoneId: ProgressionMilestoneId;
};

export type FullPartyAssembledPayload = {
  activeSlots: number;
};

export type CampaignCompletionBlockedPayload = {
  reason?: string | null;
};

export type ProgressionPayloadByType = {
  PROGRESSION_REWARD_OFFERED: ProgressionRewardOfferedPayload;
  PROGRESSION_REWARD_RESOLVED: ProgressionRewardResolvedPayload;
  HERO_UPGRADE_CHOSEN: HeroUpgradeChosenPayload;
  HERO_STAT_INCREASED: HeroStatIncreasedPayload;
  HERO_LEVEL_GAINED: HeroLevelGainedPayload;
  HERO_UPGRADE_POINTS_GRANTED: HeroUpgradePointsGrantedPayload;
  PARTY_SLOT_UNLOCKED: PartySlotUnlockedPayload;
  COMPANION_AVAILABLE: CompanionAvailablePayload;
  COMPANION_RECRUITED: CompanionRecruitedPayload;
  COMPANION_DECLINED: CompanionDeclinedPayload;
  COMPANION_LOST: CompanionLostPayload;
  PROGRESSION_MILESTONE_REACHED: ProgressionMilestoneReachedPayload;
  FULL_PARTY_ASSEMBLED: FullPartyAssembledPayload;
  CAMPAIGN_COMPLETION_BLOCKED: CampaignCompletionBlockedPayload;
};

export type ProgressionEventDraft<T extends ProgressionEventType = ProgressionEventType> = {
  type: T;
  payload: ProgressionPayloadByType[T];
};

export function isProgressionEventType(type: string): type is ProgressionEventType {
  return (
    type === "PROGRESSION_REWARD_OFFERED" ||
    type === "PROGRESSION_REWARD_RESOLVED" ||
    type === "HERO_UPGRADE_CHOSEN" ||
    type === "HERO_STAT_INCREASED" ||
    type === "HERO_LEVEL_GAINED" ||
    type === "HERO_UPGRADE_POINTS_GRANTED" ||
    type === "PARTY_SLOT_UNLOCKED" ||
    type === "COMPANION_AVAILABLE" ||
    type === "COMPANION_RECRUITED" ||
    type === "COMPANION_DECLINED" ||
    type === "COMPANION_LOST" ||
    type === "PROGRESSION_MILESTONE_REACHED" ||
    type === "FULL_PARTY_ASSEMBLED" ||
    type === "CAMPAIGN_COMPLETION_BLOCKED"
  );
}

export function makeProgressionEventDraft<T extends ProgressionEventType>(
  type: T,
  payload: ProgressionPayloadByType[T]
): ProgressionEventDraft<T> {
  return { type, payload };
}
