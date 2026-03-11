// lib/progression/ProgressionEvolution.ts
// ------------------------------------------------------------
// Echoes of Fate — Progression Evolution
// ------------------------------------------------------------
// Purpose:
// - Derive canonical campaign progression state from recorded session events
// - Apply fellowship thresholds, inventory scaling, hero growth, companion loss,
//   and relic history in a deterministic way
//
// Design rules:
// - PURE module: no mutation outside local derived state
// - NO side effects
// - Same inputs -> same outputs
// ------------------------------------------------------------

import {
  CAMPAIGN_RELIC_POOL_SIZE,
  FELLOWSHIP_GATE_RULES,
  HERO_LEVEL_CAP,
  INITIAL_PROGRESSION_STATE,
  LEGACY_RANK_MIN,
  PARTY_SIZE_CAP,
  PARTY_SLOT_TOTAL_BY_ACTIVE_MEMBERS,
  type CompanionId,
  type CompanionCombinationKey,
  type FellowshipGateEvaluation,
  type FellowshipGateId,
  type ProgressionState,
  type RelicCarrierRef,
  type RelicId,
  type RelicMajorEvent,
  type RelicMajorEventType,
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

function asBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item): item is string => !!item);
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
    const count = clamp(Math.trunc(members.length || 1), 1, PARTY_SIZE_CAP);
    return count;
  }

  return 1;
}

function inventorySlotsForPartySize(partySize: number): number {
  const normalized = clamp(Math.trunc(partySize || 1), 1, PARTY_SIZE_CAP);
  return PARTY_SLOT_TOTAL_BY_ACTIVE_MEMBERS[normalized] ?? PARTY_SLOT_TOTAL_BY_ACTIVE_MEMBERS[1];
}

function evaluateFellowshipGate(
  gateId: FellowshipGateId,
  partySize: number,
): FellowshipGateEvaluation {
  const normalizedPartySize = clamp(Math.trunc(partySize || 0), 0, PARTY_SIZE_CAP);
  const rule = FELLOWSHIP_GATE_RULES[gateId];
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
    gateId,
    allowed,
    partySize: normalizedPartySize,
    minimumPartySize: rule.minimumPartySize,
    exactPartySize: rule.exactPartySize,
    shortfall,
    reason,
  };
}

function createRelicCarrierRef(ref: {
  kind: RelicCarrierRef["kind"];
  id: string;
}): RelicCarrierRef {
  return {
    kind: ref.kind,
    id: ref.id as RelicCarrierRef["id"],
  };
}

function ensureRelicHistory(state: ProgressionState, relicId: RelicId) {
  if (state.relics.history[relicId]) return state.relics.history[relicId];

  state.relics.history[relicId] = {
    discoveredBy: null,
    discoveredAtRun: null,
    originStoryRevealed: false,
    currentCarrier: createRelicCarrierRef({ kind: "LOST", id: "lost" }),
    carriers: [],
    bondedTo: null,
    bondState: "UNBONDED",
    bondedAtRun: null,
    runsSurvived: 0,
    witnessedDeaths: 0,
    bossesWitnessed: 0,
    majorEvents: [],
  };

  return state.relics.history[relicId];
}

function pushRelicMajorEvent(
  state: ProgressionState,
  relicId: RelicId,
  event: RelicMajorEvent,
) {
  const history = ensureRelicHistory(state, relicId);
  history.majorEvents.push(event);

  if (history.majorEvents.length > 20) {
    history.majorEvents = history.majorEvents.slice(-20);
  }
}

function setRelicCarrier(
  state: ProgressionState,
  relicId: RelicId,
  carrier: RelicCarrierRef,
) {
  const history = ensureRelicHistory(state, relicId);
  history.currentCarrier = carrier;

  if ((carrier.kind === "HERO" || carrier.kind === "COMPANION") && carrier.id !== "storage" && carrier.id !== "lost") {
    if (!history.carriers.includes(carrier.id)) {
      history.carriers.push(carrier.id);
    }

    if (history.carriers.length > 10) {
      history.carriers = history.carriers.slice(-10);
    }
  }
}

function removeRelicFromAllContainers(state: ProgressionState, relicId: RelicId) {
  state.relics.equippedByHero = removeValue(state.relics.equippedByHero, relicId);

  for (const companionId of Object.keys(state.relics.equippedByCompanion)) {
    state.relics.equippedByCompanion[companionId] = removeValue(
      state.relics.equippedByCompanion[companionId] ?? [],
      relicId,
    );
  }

  state.relics.storedRelics = removeValue(state.relics.storedRelics, relicId);
  state.relics.carriedRelics = removeValue(state.relics.carriedRelics, relicId);
  state.relics.lostRelics = removeValue(state.relics.lostRelics, relicId);
}

function moveRelicToHero(state: ProgressionState, relicId: RelicId, heroId: string) {
  removeRelicFromAllContainers(state, relicId);
  uniquePush(state.relics.equippedByHero, relicId);
  setRelicCarrier(state, relicId, createRelicCarrierRef({ kind: "HERO", id: heroId }));
}

function moveRelicToCompanion(
  state: ProgressionState,
  relicId: RelicId,
  companionId: CompanionId,
) {
  removeRelicFromAllContainers(state, relicId);

  if (!state.relics.equippedByCompanion[companionId]) {
    state.relics.equippedByCompanion[companionId] = [];
  }

  uniquePush(state.relics.equippedByCompanion[companionId], relicId);
  setRelicCarrier(
    state,
    relicId,
    createRelicCarrierRef({ kind: "COMPANION", id: companionId }),
  );
}

function moveRelicToStorage(state: ProgressionState, relicId: RelicId) {
  removeRelicFromAllContainers(state, relicId);
  uniquePush(state.relics.storedRelics, relicId);
  setRelicCarrier(state, relicId, createRelicCarrierRef({ kind: "STORAGE", id: "storage" }));
}

function moveRelicToCarried(state: ProgressionState, relicId: RelicId) {
  removeRelicFromAllContainers(state, relicId);
  uniquePush(state.relics.carriedRelics, relicId);
  setRelicCarrier(state, relicId, createRelicCarrierRef({ kind: "HERO", id: "hero" }));
}

function moveRelicToLost(state: ProgressionState, relicId: RelicId) {
  removeRelicFromAllContainers(state, relicId);
  uniquePush(state.relics.lostRelics, relicId);
  setRelicCarrier(state, relicId, createRelicCarrierRef({ kind: "LOST", id: "lost" }));
}

function inferRunNumber(events: readonly SessionEvent[]): number {
  let maxRun = 0;

  for (const event of events) {
    const runNumber = asInt(event?.payload?.runNumber);
    if (runNumber != null) {
      maxRun = Math.max(maxRun, runNumber);
    }
  }

  return maxRun;
}

function updateDerivedPartyState(state: ProgressionState) {
  const livingMembers = clamp(state.party.activeSlots, 1, PARTY_SIZE_CAP);
  state.party.livingMembers = livingMembers;
  state.party.fallenMembers = state.companions.lost.length;
  state.party.unlockedSlots = clamp(
    Math.max(state.party.unlockedSlots, state.party.activeSlots),
    1,
    state.party.maxSlots,
  );

  if (state.party.activeSlots >= state.party.maxSlots) {
    state.campaign.fullFellowshipAssembled = true;
  }
}

function updateDerivedInventoryState(state: ProgressionState) {
  const totalSlots = inventorySlotsForPartySize(state.party.activeSlots);
  const usedSlots = state.relics.carriedRelics.length;
  const freeSlots = Math.max(0, totalSlots - usedSlots);

  state.inventory.totalSlots = totalSlots;
  state.inventory.usedSlots = usedSlots;
  state.inventory.freeSlots = freeSlots;
}

function updateDerivedCampaignState(state: ProgressionState) {
  state.campaign.completionBlocked =
    state.campaign.completionRequiresFullFellowship &&
    !state.campaign.fullFellowshipAssembled;

  if (
    evaluateFellowshipGate("FINAL_DESCENT", state.party.activeSlots).allowed &&
    state.campaign.cryptFullyCleared
  ) {
    state.campaign.finalDescentUnlocked = true;
  } else if (!state.campaign.cryptFullyCleared) {
    state.campaign.finalDescentUnlocked = false;
  }
}

function grantHeroExperience(state: ProgressionState, amount: number, runNumber: number | null) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  state.hero.experience = Math.max(0, state.hero.experience + Math.trunc(amount));

  while (state.hero.level < HERO_LEVEL_CAP) {
    const needed = xpRequiredForNextLevel(state.hero.level);
    if (state.hero.experience < needed) break;

    state.hero.experience -= needed;
    state.hero.level += 1;
    state.hero.upgradePoints += 1;

    if (state.hero.level >= HERO_LEVEL_CAP) {
      state.hero.level = HERO_LEVEL_CAP;
      state.hero.masteryUnlocked = true;

      if (state.hero.level30ReachedAtRun == null) {
        state.hero.level30ReachedAtRun = runNumber;
      }

      break;
    }
  }

  if (state.hero.level >= HERO_LEVEL_CAP) {
    state.hero.level = HERO_LEVEL_CAP;
    state.hero.masteryUnlocked = true;
  }
}

function xpRequiredForNextLevel(level: number): number {
  const normalized = clamp(Math.trunc(level || 1), 1, HERO_LEVEL_CAP);
  return 100 * normalized * normalized;
}

function deriveStateFromEvents(events: readonly SessionEvent[]): ProgressionState {
  const activePartySize = deriveActivePartySize(events);
  const currentRunNumber = inferRunNumber(events);

  const state: ProgressionState = {
    hero: {
      level: INITIAL_PROGRESSION_STATE.hero.level,
      experience: INITIAL_PROGRESSION_STATE.hero.experience,
      legacyRank: INITIAL_PROGRESSION_STATE.hero.legacyRank,
      upgradePoints: INITIAL_PROGRESSION_STATE.hero.upgradePoints,
      upgrades: [...INITIAL_PROGRESSION_STATE.hero.upgrades],
      masteryUnlocked: INITIAL_PROGRESSION_STATE.hero.masteryUnlocked,
      level30ReachedAtRun: INITIAL_PROGRESSION_STATE.hero.level30ReachedAtRun,
    },

    party: {
      unlockedSlots: INITIAL_PROGRESSION_STATE.party.unlockedSlots,
      activeSlots: activePartySize,
      maxSlots: INITIAL_PROGRESSION_STATE.party.maxSlots,
      livingMembers: INITIAL_PROGRESSION_STATE.party.livingMembers,
      fallenMembers: INITIAL_PROGRESSION_STATE.party.fallenMembers,
      lowestFloorReached: INITIAL_PROGRESSION_STATE.party.lowestFloorReached,
    },

    companions: {
      recruited: [...INITIAL_PROGRESSION_STATE.companions.recruited],
      available: [...INITIAL_PROGRESSION_STATE.companions.available],
      declined: [...INITIAL_PROGRESSION_STATE.companions.declined],
      lost: [...INITIAL_PROGRESSION_STATE.companions.lost],
      extinctCombinations: [...INITIAL_PROGRESSION_STATE.companions.extinctCombinations],
    },

    campaign: {
      milestonesReached: [...INITIAL_PROGRESSION_STATE.campaign.milestonesReached],
      fullFellowshipAssembled: INITIAL_PROGRESSION_STATE.campaign.fullFellowshipAssembled,
      completionRequiresFullFellowship:
        INITIAL_PROGRESSION_STATE.campaign.completionRequiresFullFellowship,
      completionBlocked: INITIAL_PROGRESSION_STATE.campaign.completionBlocked,
      cryptFullyCleared: INITIAL_PROGRESSION_STATE.campaign.cryptFullyCleared,
      finalDescentUnlocked: INITIAL_PROGRESSION_STATE.campaign.finalDescentUnlocked,
    },

    relics: {
      equippedByHero: [...INITIAL_PROGRESSION_STATE.relics.equippedByHero],
      equippedByCompanion: { ...INITIAL_PROGRESSION_STATE.relics.equippedByCompanion },
      storedRelics: [...INITIAL_PROGRESSION_STATE.relics.storedRelics],
      carriedRelics: [...INITIAL_PROGRESSION_STATE.relics.carriedRelics],
      lostRelics: [...INITIAL_PROGRESSION_STATE.relics.lostRelics],
      activePool: [...INITIAL_PROGRESSION_STATE.relics.activePool],
      history: { ...INITIAL_PROGRESSION_STATE.relics.history },
    },

    relicPool: {
      worldSeed: INITIAL_PROGRESSION_STATE.relicPool.worldSeed,
      selectedRelicIds: [...INITIAL_PROGRESSION_STATE.relicPool.selectedRelicIds],
      totalPoolSize: INITIAL_PROGRESSION_STATE.relicPool.totalPoolSize,
      activePoolSize: INITIAL_PROGRESSION_STATE.relicPool.activePoolSize,
    },

    inventory: {
      totalSlots: INITIAL_PROGRESSION_STATE.inventory.totalSlots,
      usedSlots: INITIAL_PROGRESSION_STATE.inventory.usedSlots,
      freeSlots: INITIAL_PROGRESSION_STATE.inventory.freeSlots,
    },

    offeredReward: INITIAL_PROGRESSION_STATE.offeredReward,
  };

  for (const event of events) {
    if (!event?.type || !isProgressionEventType(event.type)) continue;

    const payload = event.payload ?? {};

    switch (event.type) {
      case "PROGRESSION_REWARD_OFFERED": {
        const rewardId = asString(payload.rewardId);
        const options = asStringArray(payload.options);

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

        if (upgradeId && state.hero.upgradePoints > 0) {
          state.hero.upgradePoints -= 1;
        }
        break;
      }

      case "HERO_LEVEL_GAINED": {
        const level = asInt(payload.level);

        if (level !== null) {
          state.hero.level = clamp(level, 1, HERO_LEVEL_CAP);
        } else {
          state.hero.level = clamp(state.hero.level + 1, 1, HERO_LEVEL_CAP);
        }

        if (state.hero.level >= HERO_LEVEL_CAP) {
          state.hero.masteryUnlocked = true;

          if (state.hero.level30ReachedAtRun == null) {
            state.hero.level30ReachedAtRun = currentRunNumber || null;
          }
        }
        break;
      }

      case "HERO_UPGRADE_POINTS_GRANTED": {
        const points = asInt(payload.points);
        state.hero.upgradePoints = Math.max(0, state.hero.upgradePoints + (points ?? 0));
        break;
      }

      case "HERO_EXPERIENCE_GAINED": {
        const amount = asInt(payload.amount);
        grantHeroExperience(state, amount ?? 0, asInt(payload.runNumber) ?? currentRunNumber);
        break;
      }

      case "HERO_LEGACY_RANK_GAINED": {
        const amount = asInt(payload.amount) ?? 1;
        state.hero.legacyRank = Math.max(LEGACY_RANK_MIN, state.hero.legacyRank + amount);
        break;
      }

      case "HERO_MASTERY_UNLOCKED": {
        state.hero.masteryUnlocked = true;
        break;
      }

      case "PARTY_SLOT_UNLOCKED": {
        const slots = asInt(payload.slots) ?? 0;
        state.party.unlockedSlots = clamp(
          state.party.unlockedSlots + slots,
          1,
          state.party.maxSlots,
        );
        break;
      }

      case "PARTY_DECLARED": {
        const members = Array.isArray(payload.members) ? payload.members : [];
        state.party.activeSlots = clamp(Math.trunc(members.length || 1), 1, state.party.maxSlots);
        break;
      }

      case "PARTY_ACTIVE_SIZE_SET": {
        const activeSlots = asInt(payload.activeSlots);
        if (activeSlots != null) {
          state.party.activeSlots = clamp(activeSlots, 1, state.party.maxSlots);
        }
        break;
      }

      case "LOWEST_FLOOR_REACHED": {
        const floor = asInt(payload.floor);
        if (floor === 0 || floor === -1 || floor === -2) {
          if (floor < state.party.lowestFloorReached) {
            state.party.lowestFloorReached = floor;
          }
        }
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

        if (state.party.activeSlots < state.party.maxSlots) {
          state.party.activeSlots += 1;
        }

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
        const combinationKey =
          asString(payload.combinationKey) ??
          asString(payload.speciesClassGenderKey) ??
          asString(payload.extinctionKey);

        if (!companionId) break;

        uniquePush(state.companions.lost, companionId);
        state.companions.available = removeValue(state.companions.available, companionId);
        state.companions.recruited = removeValue(state.companions.recruited, companionId);

        uniquePush(state.companions.extinctCombinations, combinationKey);

        state.party.activeSlots = clamp(state.party.activeSlots - 1, 1, state.party.maxSlots);

        const equipped = state.relics.equippedByCompanion[companionId] ?? [];
        for (const relicId of equipped) {
          const history = ensureRelicHistory(state, relicId);
          history.witnessedDeaths += 1;

          if (history.bondedTo === companionId) {
            history.bondState = "SCARRED";
          }

          pushRelicMajorEvent(state, relicId, {
            type: "CARRIER_FELL",
            runNumber: asInt(payload.runNumber) ?? currentRunNumber,
            roomId: asString(payload.roomId),
            floor:
              (asInt(payload.floor) as 0 | -1 | -2 | null) ??
              null,
            note: companionId,
            timestamp: event.timestamp ?? null,
          });

          moveRelicToCarried(state, relicId);
        }

        delete state.relics.equippedByCompanion[companionId];
        break;
      }

      case "COMPANION_EXTINCTION_RECORDED": {
        const combinationKey =
          asString(payload.combinationKey) ??
          asString(payload.speciesClassGenderKey) ??
          asString(payload.extinctionKey);

        uniquePush(state.companions.extinctCombinations, combinationKey);
        break;
      }

      case "PROGRESSION_MILESTONE_REACHED": {
        const milestoneId = asString(payload.milestoneId);
        uniquePush(state.campaign.milestonesReached, milestoneId);
        break;
      }

      case "FULL_PARTY_ASSEMBLED": {
        state.campaign.fullFellowshipAssembled = true;
        state.party.activeSlots = state.party.maxSlots;
        break;
      }

      case "CAMPAIGN_COMPLETION_BLOCKED": {
        state.campaign.completionBlocked = true;
        break;
      }

      case "CRYPT_FULLY_CLEARED": {
        state.campaign.cryptFullyCleared = true;
        break;
      }

      case "FINAL_DESCENT_UNLOCKED": {
        state.campaign.finalDescentUnlocked = true;
        break;
      }

      case "CAMPAIGN_RELIC_POOL_SELECTED": {
        const worldSeed = asString(payload.worldSeed);
        const selectedRelicIds = asStringArray(payload.selectedRelicIds);
        const totalPoolSize = asInt(payload.totalPoolSize);

        state.relicPool.worldSeed = worldSeed;
        state.relicPool.selectedRelicIds = selectedRelicIds;
        state.relicPool.totalPoolSize =
          totalPoolSize ?? state.relicPool.selectedRelicIds.length;
        state.relicPool.activePoolSize = CAMPAIGN_RELIC_POOL_SIZE;
        state.relics.activePool = [...selectedRelicIds];
        break;
      }

      case "RELIC_DISCOVERED": {
        const relicId = asString(payload.relicId);
        if (!relicId) break;

        const history = ensureRelicHistory(state, relicId);
        const discoveredBy = asString(payload.discoveredBy) ?? "hero";

        if (history.discoveredBy == null) {
          history.discoveredBy = discoveredBy;
        }

        if (history.discoveredAtRun == null) {
          history.discoveredAtRun = asInt(payload.runNumber) ?? currentRunNumber;
        }

        history.originStoryRevealed =
          asBool(payload.originStoryRevealed) ?? history.originStoryRevealed;

        pushRelicMajorEvent(state, relicId, {
          type: "DISCOVERED",
          runNumber: asInt(payload.runNumber) ?? currentRunNumber,
          roomId: asString(payload.roomId),
          floor:
            (asInt(payload.floor) as 0 | -1 | -2 | null) ??
            null,
          note: asString(payload.note),
          timestamp: event.timestamp ?? null,
        });

        moveRelicToCarried(state, relicId);
        break;
      }

      case "RELIC_STORED": {
        const relicId = asString(payload.relicId);
        if (!relicId) break;

        moveRelicToStorage(state, relicId);

        pushRelicMajorEvent(state, relicId, {
          type: "STORED",
          runNumber: asInt(payload.runNumber) ?? currentRunNumber,
          note: asString(payload.note),
          timestamp: event.timestamp ?? null,
        });
        break;
      }

      case "RELIC_RECOVERED": {
        const relicId = asString(payload.relicId);
        if (!relicId) break;

        moveRelicToCarried(state, relicId);

        pushRelicMajorEvent(state, relicId, {
          type: "RECOVERED",
          runNumber: asInt(payload.runNumber) ?? currentRunNumber,
          roomId: asString(payload.roomId),
          floor:
            (asInt(payload.floor) as 0 | -1 | -2 | null) ??
            null,
          note: asString(payload.note),
          timestamp: event.timestamp ?? null,
        });
        break;
      }

      case "RELIC_EQUIPPED_TO_HERO": {
        const relicId = asString(payload.relicId);
        const heroId = asString(payload.heroId) ?? "hero";
        if (!relicId) break;

        moveRelicToHero(state, relicId, heroId);

        pushRelicMajorEvent(state, relicId, {
          type: "EQUIPPED",
          runNumber: asInt(payload.runNumber) ?? currentRunNumber,
          note: heroId,
          timestamp: event.timestamp ?? null,
        });
        break;
      }

      case "RELIC_EQUIPPED_TO_COMPANION": {
        const relicId = asString(payload.relicId);
        const companionId = asString(payload.companionId);
        if (!relicId || !companionId) break;

        moveRelicToCompanion(state, relicId, companionId);

        pushRelicMajorEvent(state, relicId, {
          type: "EQUIPPED",
          runNumber: asInt(payload.runNumber) ?? currentRunNumber,
          note: companionId,
          timestamp: event.timestamp ?? null,
        });
        break;
      }

      case "RELIC_TRANSFERRED": {
        const relicId = asString(payload.relicId);
        const toHero = asBool(payload.toHero) ?? false;
        const heroId = asString(payload.heroId) ?? "hero";
        const companionId = asString(payload.companionId);

        if (!relicId) break;

        if (toHero || !companionId) {
          moveRelicToHero(state, relicId, heroId);
        } else {
          moveRelicToCompanion(state, relicId, companionId);
        }

        pushRelicMajorEvent(state, relicId, {
          type: "TRANSFERRED",
          runNumber: asInt(payload.runNumber) ?? currentRunNumber,
          note: toHero ? heroId : companionId,
          timestamp: event.timestamp ?? null,
        });
        break;
      }

      case "RELIC_BOND_FORGED": {
        const relicId = asString(payload.relicId);
        const bondedTo =
          asString(payload.bondedTo) ??
          asString(payload.heroId) ??
          asString(payload.companionId);

        if (!relicId || !bondedTo) break;

        const history = ensureRelicHistory(state, relicId);
        history.bondedTo = bondedTo;
        history.bondState = "BONDED";
        history.bondedAtRun = asInt(payload.runNumber) ?? currentRunNumber;

        pushRelicMajorEvent(state, relicId, {
          type: "BOND_FORGED",
          runNumber: history.bondedAtRun,
          note: bondedTo,
          timestamp: event.timestamp ?? null,
        });
        break;
      }

      case "RELIC_BOND_SCARRED": {
        const relicId = asString(payload.relicId);
        if (!relicId) break;

        const history = ensureRelicHistory(state, relicId);
        history.bondState = "SCARRED";

        pushRelicMajorEvent(state, relicId, {
          type: "BOND_SCARRED",
          runNumber: asInt(payload.runNumber) ?? currentRunNumber,
          note: asString(payload.note),
          timestamp: event.timestamp ?? null,
        });
        break;
      }

      case "RELIC_LOST": {
        const relicId = asString(payload.relicId);
        if (!relicId) break;

        moveRelicToLost(state, relicId);

        pushRelicMajorEvent(state, relicId, {
          type: "RUN_COMPLETED",
          runNumber: asInt(payload.runNumber) ?? currentRunNumber,
          note: asString(payload.note) ?? "lost",
          timestamp: event.timestamp ?? null,
        });
        break;
      }

      case "RELIC_RUN_SURVIVED": {
        const relicIds = asStringArray(payload.relicIds);
        for (const relicId of relicIds) {
          const history = ensureRelicHistory(state, relicId);
          history.runsSurvived += 1;

          pushRelicMajorEvent(state, relicId, {
            type: "RUN_COMPLETED",
            runNumber: asInt(payload.runNumber) ?? currentRunNumber,
            note: asString(payload.note),
            timestamp: event.timestamp ?? null,
          });
        }
        break;
      }

      case "RELIC_BOSS_WITNESSED": {
        const relicIds = asStringArray(payload.relicIds);
        for (const relicId of relicIds) {
          const history = ensureRelicHistory(state, relicId);
          history.bossesWitnessed += 1;

          pushRelicMajorEvent(state, relicId, {
            type: "BOSS_DEFEATED",
            runNumber: asInt(payload.runNumber) ?? currentRunNumber,
            roomId: asString(payload.roomId),
            floor:
              (asInt(payload.floor) as 0 | -1 | -2 | null) ??
              null,
            note: asString(payload.note),
            timestamp: event.timestamp ?? null,
          });
        }
        break;
      }

      case "HERO_STAT_INCREASED":
      default:
        break;
    }
  }

  updateDerivedPartyState(state);
  updateDerivedInventoryState(state);
  updateDerivedCampaignState(state);

  return state;
}

export function deriveProgressionEvolution(args: {
  events: readonly SessionEvent[];
}): ProgressionState {
  return deriveStateFromEvents(args.events);
}

export function deriveFellowshipGateEvaluations(args: {
  state: ProgressionState;
}): Record<FellowshipGateId, FellowshipGateEvaluation> {
  return {
    GROUND_EXPLORATION: evaluateFellowshipGate(
      "GROUND_EXPLORATION",
      args.state.party.activeSlots,
    ),
    DESCENT_TO_MINUS_1: evaluateFellowshipGate(
      "DESCENT_TO_MINUS_1",
      args.state.party.activeSlots,
    ),
    DESCENT_TO_MINUS_2: evaluateFellowshipGate(
      "DESCENT_TO_MINUS_2",
      args.state.party.activeSlots,
    ),
    CRYPT_COMPLETION: evaluateFellowshipGate(
      "CRYPT_COMPLETION",
      args.state.party.activeSlots,
    ),
    FINAL_DESCENT: evaluateFellowshipGate(
      "FINAL_DESCENT",
      args.state.party.activeSlots,
    ),
  };
}

export function canDescendToMinus1(state: ProgressionState): boolean {
  return evaluateFellowshipGate("DESCENT_TO_MINUS_1", state.party.activeSlots).allowed;
}

export function canDescendToMinus2(state: ProgressionState): boolean {
  return evaluateFellowshipGate("DESCENT_TO_MINUS_2", state.party.activeSlots).allowed;
}

export function canCompleteCrypt(state: ProgressionState): boolean {
  return evaluateFellowshipGate("CRYPT_COMPLETION", state.party.activeSlots).allowed;
}

export function canOpenFinalDescent(state: ProgressionState): boolean {
  return (
    evaluateFellowshipGate("FINAL_DESCENT", state.party.activeSlots).allowed &&
    state.campaign.cryptFullyCleared
  );
}

export function isExtinctCompanionCombination(
  state: ProgressionState,
  combinationKey: CompanionCombinationKey,
): boolean {
  return state.companions.extinctCombinations.includes(combinationKey);
}
