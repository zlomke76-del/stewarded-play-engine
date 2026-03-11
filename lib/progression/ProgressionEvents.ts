// lib/progression/ProgressionEvents.ts
// ------------------------------------------------------------
// Echoes of Fate — Progression Event Vocabulary
// ------------------------------------------------------------
// Purpose:
// - Canonical event vocabulary for campaign progression
// - Strongly typed payloads for hero growth, fellowship, relics, and campaign gates
//
// Design rules:
// - PURE type helpers only
// - NO side effects
// - Keep event names stable once adopted
// ------------------------------------------------------------

import type {
  CompanionCombinationKey,
  CompanionId,
  HeroUpgradeId,
  ProgressionMilestoneId,
  ProgressionRewardId,
  RelicId,
  type FellowshipGateId,
} from "@/lib/progression/ProgressionTypes";

export type ProgressionEventType =
  | "PROGRESSION_REWARD_OFFERED"
  | "PROGRESSION_REWARD_RESOLVED"
  | "HERO_UPGRADE_CHOSEN"
  | "HERO_STAT_INCREASED"
  | "HERO_LEVEL_GAINED"
  | "HERO_UPGRADE_POINTS_GRANTED"
  | "HERO_EXPERIENCE_GAINED"
  | "HERO_LEGACY_RANK_GAINED"
  | "HERO_MASTERY_UNLOCKED"
  | "PARTY_DECLARED"
  | "PARTY_ACTIVE_SIZE_SET"
  | "PARTY_SLOT_UNLOCKED"
  | "LOWEST_FLOOR_REACHED"
  | "FELLOWSHIP_GATE_TESTED"
  | "COMPANION_AVAILABLE"
  | "COMPANION_RECRUITED"
  | "COMPANION_DECLINED"
  | "COMPANION_LOST"
  | "COMPANION_EXTINCTION_RECORDED"
  | "PROGRESSION_MILESTONE_REACHED"
  | "FULL_PARTY_ASSEMBLED"
  | "CAMPAIGN_COMPLETION_BLOCKED"
  | "CRYPT_FULLY_CLEARED"
  | "FINAL_DESCENT_UNLOCKED"
  | "CAMPAIGN_RELIC_POOL_SELECTED"
  | "RELIC_DISCOVERED"
  | "RELIC_STORED"
  | "RELIC_RECOVERED"
  | "RELIC_EQUIPPED_TO_HERO"
  | "RELIC_EQUIPPED_TO_COMPANION"
  | "RELIC_TRANSFERRED"
  | "RELIC_BOND_FORGED"
  | "RELIC_BOND_SCARRED"
  | "RELIC_LOST"
  | "RELIC_RUN_SURVIVED"
  | "RELIC_BOSS_WITNESSED";

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

export type HeroExperienceGainedPayload = {
  amount: number;
  runNumber?: number | null;
  source?: string | null;
};

export type HeroLegacyRankGainedPayload = {
  amount?: number;
  reason?: string | null;
};

export type HeroMasteryUnlockedPayload = {
  level?: number;
  runNumber?: number | null;
};

export type PartyDeclaredPayload = {
  members: string[];
};

export type PartyActiveSizeSetPayload = {
  activeSlots: number;
};

export type PartySlotUnlockedPayload = {
  slots: number;
};

export type LowestFloorReachedPayload = {
  floor: 0 | -1 | -2;
};

export type FellowshipGateTestedPayload = {
  gateId: FellowshipGateId;
  partySize: number;
  allowed: boolean;
  reason?: string | null;
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
  combinationKey?: CompanionCombinationKey | null;
  speciesClassGenderKey?: CompanionCombinationKey | null;
  extinctionKey?: CompanionCombinationKey | null;
  runNumber?: number | null;
  roomId?: string | null;
  floor?: 0 | -1 | -2 | null;
};

export type CompanionExtinctionRecordedPayload = {
  combinationKey?: CompanionCombinationKey | null;
  speciesClassGenderKey?: CompanionCombinationKey | null;
  extinctionKey?: CompanionCombinationKey | null;
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

export type CryptFullyClearedPayload = {
  floor?: -2;
  runNumber?: number | null;
};

export type FinalDescentUnlockedPayload = {
  runNumber?: number | null;
};

export type CampaignRelicPoolSelectedPayload = {
  worldSeed: string;
  selectedRelicIds: RelicId[];
  totalPoolSize?: number;
};

export type RelicDiscoveredPayload = {
  relicId: RelicId;
  discoveredBy?: string | null;
  runNumber?: number | null;
  roomId?: string | null;
  floor?: 0 | -1 | -2 | null;
  note?: string | null;
  originStoryRevealed?: boolean;
};

export type RelicStoredPayload = {
  relicId: RelicId;
  runNumber?: number | null;
  note?: string | null;
};

export type RelicRecoveredPayload = {
  relicId: RelicId;
  runNumber?: number | null;
  roomId?: string | null;
  floor?: 0 | -1 | -2 | null;
  note?: string | null;
};

export type RelicEquippedToHeroPayload = {
  relicId: RelicId;
  heroId?: string | null;
  runNumber?: number | null;
};

export type RelicEquippedToCompanionPayload = {
  relicId: RelicId;
  companionId: CompanionId;
  runNumber?: number | null;
};

export type RelicTransferredPayload = {
  relicId: RelicId;
  heroId?: string | null;
  companionId?: CompanionId | null;
  toHero?: boolean;
  runNumber?: number | null;
};

export type RelicBondForgedPayload = {
  relicId: RelicId;
  bondedTo?: string | null;
  heroId?: string | null;
  companionId?: CompanionId | null;
  runNumber?: number | null;
};

export type RelicBondScarredPayload = {
  relicId: RelicId;
  runNumber?: number | null;
  note?: string | null;
};

export type RelicLostPayload = {
  relicId: RelicId;
  runNumber?: number | null;
  note?: string | null;
};

export type RelicRunSurvivedPayload = {
  relicIds: RelicId[];
  runNumber?: number | null;
  note?: string | null;
};

export type RelicBossWitnessedPayload = {
  relicIds: RelicId[];
  runNumber?: number | null;
  roomId?: string | null;
  floor?: 0 | -1 | -2 | null;
  note?: string | null;
};

export type ProgressionPayloadByType = {
  PROGRESSION_REWARD_OFFERED: ProgressionRewardOfferedPayload;
  PROGRESSION_REWARD_RESOLVED: ProgressionRewardResolvedPayload;
  HERO_UPGRADE_CHOSEN: HeroUpgradeChosenPayload;
  HERO_STAT_INCREASED: HeroStatIncreasedPayload;
  HERO_LEVEL_GAINED: HeroLevelGainedPayload;
  HERO_UPGRADE_POINTS_GRANTED: HeroUpgradePointsGrantedPayload;
  HERO_EXPERIENCE_GAINED: HeroExperienceGainedPayload;
  HERO_LEGACY_RANK_GAINED: HeroLegacyRankGainedPayload;
  HERO_MASTERY_UNLOCKED: HeroMasteryUnlockedPayload;
  PARTY_DECLARED: PartyDeclaredPayload;
  PARTY_ACTIVE_SIZE_SET: PartyActiveSizeSetPayload;
  PARTY_SLOT_UNLOCKED: PartySlotUnlockedPayload;
  LOWEST_FLOOR_REACHED: LowestFloorReachedPayload;
  FELLOWSHIP_GATE_TESTED: FellowshipGateTestedPayload;
  COMPANION_AVAILABLE: CompanionAvailablePayload;
  COMPANION_RECRUITED: CompanionRecruitedPayload;
  COMPANION_DECLINED: CompanionDeclinedPayload;
  COMPANION_LOST: CompanionLostPayload;
  COMPANION_EXTINCTION_RECORDED: CompanionExtinctionRecordedPayload;
  PROGRESSION_MILESTONE_REACHED: ProgressionMilestoneReachedPayload;
  FULL_PARTY_ASSEMBLED: FullPartyAssembledPayload;
  CAMPAIGN_COMPLETION_BLOCKED: CampaignCompletionBlockedPayload;
  CRYPT_FULLY_CLEARED: CryptFullyClearedPayload;
  FINAL_DESCENT_UNLOCKED: FinalDescentUnlockedPayload;
  CAMPAIGN_RELIC_POOL_SELECTED: CampaignRelicPoolSelectedPayload;
  RELIC_DISCOVERED: RelicDiscoveredPayload;
  RELIC_STORED: RelicStoredPayload;
  RELIC_RECOVERED: RelicRecoveredPayload;
  RELIC_EQUIPPED_TO_HERO: RelicEquippedToHeroPayload;
  RELIC_EQUIPPED_TO_COMPANION: RelicEquippedToCompanionPayload;
  RELIC_TRANSFERRED: RelicTransferredPayload;
  RELIC_BOND_FORGED: RelicBondForgedPayload;
  RELIC_BOND_SCARRED: RelicBondScarredPayload;
  RELIC_LOST: RelicLostPayload;
  RELIC_RUN_SURVIVED: RelicRunSurvivedPayload;
  RELIC_BOSS_WITNESSED: RelicBossWitnessedPayload;
};

export type ProgressionEventDraft<T extends ProgressionEventType = ProgressionEventType> = {
  type: T;
  payload: ProgressionPayloadByType[T];
};

export const PROGRESSION_EVENT_TYPES: readonly ProgressionEventType[] = [
  "PROGRESSION_REWARD_OFFERED",
  "PROGRESSION_REWARD_RESOLVED",
  "HERO_UPGRADE_CHOSEN",
  "HERO_STAT_INCREASED",
  "HERO_LEVEL_GAINED",
  "HERO_UPGRADE_POINTS_GRANTED",
  "HERO_EXPERIENCE_GAINED",
  "HERO_LEGACY_RANK_GAINED",
  "HERO_MASTERY_UNLOCKED",
  "PARTY_DECLARED",
  "PARTY_ACTIVE_SIZE_SET",
  "PARTY_SLOT_UNLOCKED",
  "LOWEST_FLOOR_REACHED",
  "FELLOWSHIP_GATE_TESTED",
  "COMPANION_AVAILABLE",
  "COMPANION_RECRUITED",
  "COMPANION_DECLINED",
  "COMPANION_LOST",
  "COMPANION_EXTINCTION_RECORDED",
  "PROGRESSION_MILESTONE_REACHED",
  "FULL_PARTY_ASSEMBLED",
  "CAMPAIGN_COMPLETION_BLOCKED",
  "CRYPT_FULLY_CLEARED",
  "FINAL_DESCENT_UNLOCKED",
  "CAMPAIGN_RELIC_POOL_SELECTED",
  "RELIC_DISCOVERED",
  "RELIC_STORED",
  "RELIC_RECOVERED",
  "RELIC_EQUIPPED_TO_HERO",
  "RELIC_EQUIPPED_TO_COMPANION",
  "RELIC_TRANSFERRED",
  "RELIC_BOND_FORGED",
  "RELIC_BOND_SCARRED",
  "RELIC_LOST",
  "RELIC_RUN_SURVIVED",
  "RELIC_BOSS_WITNESSED",
] as const;

const PROGRESSION_EVENT_TYPE_SET = new Set<string>(PROGRESSION_EVENT_TYPES);

export function isProgressionEventType(type: string): type is ProgressionEventType {
  return PROGRESSION_EVENT_TYPE_SET.has(type);
}

export function makeProgressionEventDraft<T extends ProgressionEventType>(
  type: T,
  payload: ProgressionPayloadByType[T],
): ProgressionEventDraft<T> {
  return { type, payload };
}
