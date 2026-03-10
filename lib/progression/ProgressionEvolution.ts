// lib/progression/ProgressionEvolution.ts
// ------------------------------------------------------------
// Echoes of Fate — Progression Evolution
// ------------------------------------------------------------

import {
  INITIAL_PROGRESSION_STATE,
  type ProgressionState,
} from "@/lib/progression/ProgressionTypes";
import { isProgressionEventType } from "@/lib/progression/ProgressionEvents";

export type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
  timestamp?: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}

function uniquePush(list: string[], value: string | null) {
  if (!value) return;
  if (!list.includes(value)) list.push(value);
}

function removeValue(list: string[], value: string | null) {
  if (!value) return list;
  return list.filter((item) => item !== value);
}

function deriveActivePartySize(events: readonly SessionEvent[]): number {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e?.type !== "PARTY_DECLARED") continue;

    const members = Array.isArray(e?.payload?.members) ? e.payload.members : [];
    const count = clamp(Math.trunc(members.length || 1), 1, 6);
    return count;
  }

  return 1;
}

function deriveStateFromEvents(events: readonly SessionEvent[]): ProgressionState {
  const state: ProgressionState = {
    hero: {
      level: INITIAL_PROGRESSION_STATE.hero.level,
      upgradePoints: INITIAL_PROGRESSION_STATE.hero.upgradePoints,
      upgrades: [...INITIAL_PROGRESSION_STATE.hero.upgrades],
    },

    party: {
      unlockedSlots: INITIAL_PROGRESSION_STATE.party.unlockedSlots,
      activeSlots: deriveActivePartySize(events),
      maxSlots: INITIAL_PROGRESSION_STATE.party.maxSlots,
    },

    companions: {
      recruited: [...INITIAL_PROGRESSION_STATE.companions.recruited],
      available: [...INITIAL_PROGRESSION_STATE.companions.available],
      declined: [...INITIAL_PROGRESSION_STATE.companions.declined],
      lost: [...INITIAL_PROGRESSION_STATE.companions.lost],
    },

    campaign: {
      milestonesReached: [...INITIAL_PROGRESSION_STATE.campaign.milestonesReached],
      fullFellowshipAssembled: INITIAL_PROGRESSION_STATE.campaign.fullFellowshipAssembled,
      completionRequiresFullFellowship:
        INITIAL_PROGRESSION_STATE.campaign.completionRequiresFullFellowship,
      completionBlocked: INITIAL_PROGRESSION_STATE.campaign.completionBlocked,
    },

    offeredReward: INITIAL_PROGRESSION_STATE.offeredReward,
  };

  for (const event of events) {
    if (!event?.type || !isProgressionEventType(event.type)) continue;

    const payload = event.payload ?? {};

    switch (event.type) {
      case "PROGRESSION_REWARD_OFFERED": {
        const rewardId = asString(payload.rewardId);
        const options = Array.isArray(payload.options)
          ? payload.options
              .map((v: unknown) => asString(v))
              .filter((v: string | null): v is string => !!v)
          : [];

        if (!rewardId) break;

        state.offeredReward = {
          rewardId,
          options,
          offeredAtEventId: event.id ?? null,
          offeredAtTimestamp: typeof event.timestamp === "number" ? event.timestamp : null,
        };
        break;
      }

      case "PROGRESSION_REWARD_RESOLVED": {
        const rewardId = asString(payload.rewardId);
        if (state.offeredReward && rewardId && state.offeredReward.rewardId === rewardId) {
          state.offeredReward = null;
        }
        break;
      }

      case "HERO_UPGRADE_CHOSEN": {
        const upgradeId = asString(payload.upgradeId);
        uniquePush(state.hero.upgrades, upgradeId);
        break;
      }

      case "HERO_LEVEL_GAINED": {
        const level = asInt(payload.level);
        if (level !== null) {
          state.hero.level = Math.max(1, level);
        } else {
          state.hero.level += 1;
        }
        break;
      }

      case "HERO_UPGRADE_POINTS_GRANTED": {
        const points = asInt(payload.points);
        state.hero.upgradePoints = Math.max(
          0,
          state.hero.upgradePoints + (points ?? 0)
        );
        break;
      }

      case "PARTY_SLOT_UNLOCKED": {
        const slots = asInt(payload.slots);
        state.party.unlockedSlots = clamp(
          state.party.unlockedSlots + (slots ?? 0),
          1,
          state.party.maxSlots
        );
        break;
      }

      case "COMPANION_AVAILABLE": {
        const companionId = asString(payload.companionId);
        uniquePush(state.companions.available, companionId);
        break;
      }

      case "COMPANION_RECRUITED": {
        const companionId = asString(payload.companionId);
        if (!companionId) break;

        uniquePush(state.companions.recruited, companionId);
        state.companions.available = removeValue(state.companions.available, companionId);
        state.companions.declined = removeValue(state.companions.declined, companionId);
        state.companions.lost = removeValue(state.companions.lost, companionId);
        break;
      }

      case "COMPANION_DECLINED": {
        const companionId = asString(payload.companionId);
        if (!companionId) break;

        uniquePush(state.companions.declined, companionId);
        state.companions.available = removeValue(state.companions.available, companionId);
        break;
      }

      case "COMPANION_LOST": {
        const companionId = asString(payload.companionId);
        if (!companionId) break;

        uniquePush(state.companions.lost, companionId);
        state.companions.available = removeValue(state.companions.available, companionId);
        state.companions.recruited = removeValue(state.companions.recruited, companionId);
        break;
      }

      case "PROGRESSION_MILESTONE_REACHED": {
        const milestoneId = asString(payload.milestoneId);
        uniquePush(state.campaign.milestonesReached, milestoneId);
        break;
      }

      case "FULL_PARTY_ASSEMBLED": {
        state.campaign.fullFellowshipAssembled = true;
        break;
      }

      case "CAMPAIGN_COMPLETION_BLOCKED": {
        state.campaign.completionBlocked = true;
        break;
      }

      case "HERO_STAT_INCREASED":
      default:
        break;
    }
  }

  state.party.activeSlots = clamp(
    Math.max(state.party.activeSlots, 1),
    1,
    state.party.maxSlots
  );

  if (state.party.activeSlots > state.party.unlockedSlots) {
    state.party.unlockedSlots = state.party.activeSlots;
  }

  if (state.party.activeSlots >= state.party.maxSlots) {
    state.campaign.fullFellowshipAssembled = true;
  }

  state.campaign.completionBlocked =
    state.campaign.completionRequiresFullFellowship &&
    !state.campaign.fullFellowshipAssembled;

  return state;
}

export function deriveProgressionEvolution(args: {
  events: readonly SessionEvent[];
}): ProgressionState {
  return deriveStateFromEvents(args.events);
}
