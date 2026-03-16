import type { DiceMode, RollSource } from "../../demoTypes";
import { inferOptionKind } from "../../demoUtils";
import { appendEventToState } from "./demoRuntimeUtils";
import { commitDungeonTraversalBundle } from "./demoRuntimeTraversal";

type HandleRecordArgs = {
  prevState: any;
  payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  };
  playerInput: string;
  selectedOptionDescription: string;
  selectedConnectionId?: string | null;
  location: {
    floorId: string;
    roomId: string;
  };
  currentRoom: any;
  reachableConnections: any[];
  dungeon: any;
  openedDoorIds: string[];
  unlockedDoorIds: string[];
};

type HandleOutcomeOnlyArgs = {
  prevState: any;
  payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  };
  location: {
    floorId: string;
    roomId: string;
  };
};

export function deriveOutcomeSuccess(payload: {
  dice?: { roll?: number; dc?: number } | null;
}) {
  const roll = Number(payload?.dice?.roll);
  const dc = Number(payload?.dice?.dc);

  return Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;
}

function normalizeName(value: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function findLatestCombatWindow(events: any[]) {
  let latestStarted: { index: number; combatId: string } | null = null;
  let latestEndedIndex = -1;

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const type = String(event?.type ?? "");
    const payload = event?.payload ?? {};

    if (type === "COMBAT_STARTED") {
      const combatId = String(payload?.combatId ?? "").trim();
      if (combatId) {
        latestStarted = { index: i, combatId };
      }
    }

    if (type === "COMBAT_ENDED") {
      latestEndedIndex = i;
    }
  }

  if (!latestStarted) return null;
  if (latestEndedIndex > latestStarted.index) return null;

  return latestStarted;
}

function hasStarterWeaponAlreadyBroken(events: any[]) {
  return events.some((event) => {
    if (String(event?.type ?? "") !== "HERO_STARTER_WEAPON_BROKEN") return false;
    return true;
  });
}

function inferIsOpeningThresholdCombat(args: {
  events: any[];
  floorId: string;
  roomId: string;
}) {
  const { events, floorId, roomId } = args;
  const combatWindow = findLatestCombatWindow(events);
  if (!combatWindow) return false;

  const dungeonInitialized = events.some(
    (event) => String(event?.type ?? "") === "DUNGEON_INITIALIZED"
  );
  if (!dungeonInitialized) return false;

  const floorKey = normalizeName(floorId).toLowerCase();
  const roomKey = normalizeName(roomId).toLowerCase();

  const looksLikeFirstRoom =
    floorKey.includes("floor_0") ||
    floorKey.includes("floor0") ||
    roomKey.includes("start") ||
    roomKey.includes("entrance") ||
    roomKey.includes("threshold") ||
    roomKey.includes("room_0") ||
    roomKey.includes("room0");

  return looksLikeFirstRoom;
}

function shouldBreakStarterWeapon(args: {
  prevState: any;
  success: boolean;
  kind: string;
  location: { floorId: string; roomId: string };
}) {
  const { prevState, success, kind, location } = args;
  if (!success) return false;
  if (kind !== "contested") return false;

  const events = Array.isArray(prevState?.events) ? prevState.events : [];
  if (hasStarterWeaponAlreadyBroken(events)) return false;

  return inferIsOpeningThresholdCombat({
    events,
    floorId: location.floorId,
    roomId: location.roomId,
  });
}

function appendOpeningWeaponBreakConsequences(args: {
  nextState: any;
  location: { floorId: string; roomId: string };
  playerInput: string;
  selectedOptionDescription: string;
}) {
  const { nextState, location, playerInput, selectedOptionDescription } = args;

  let next = nextState;

  next = appendEventToState(next, "HERO_STARTER_WEAPON_BROKEN", {
    floorId: location.floorId,
    roomId: location.roomId,
    reason: "opening_threshold_victory",
    sourceText: `${playerInput}\n${selectedOptionDescription}`.trim(),
  });

  next = appendEventToState(next, "HERO_LOADOUT_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    slot: "weapon",
    state: "broken",
    previousItemName: "Starter Weapon",
    nextItemName: "Broken Starter Weapon",
    consequence: "armory_replacement_needed",
  });

  next = appendEventToState(next, "CHRONICLE_NOTE_RECORDED", {
    floorId: location.floorId,
    roomId: location.roomId,
    category: "first_victory",
    text: "The hero survived the first guardian, but the weapon that carried them into the dark did not survive the strike.",
  });

  return next;
}

export function commitResolvedActionToState(args: HandleRecordArgs) {
  const {
    prevState,
    payload,
    playerInput,
    selectedOptionDescription,
    selectedConnectionId,
    location,
    currentRoom,
    reachableConnections,
    dungeon,
    openedDoorIds,
    unlockedDoorIds,
  } = args;

  const combinedText = `${playerInput}\n${selectedOptionDescription}`.trim();
  const kind = inferOptionKind(
    combinedText.length ? combinedText : selectedOptionDescription
  );
  const success = deriveOutcomeSuccess(payload);

  const enrichedOutcome = {
    ...payload,
    meta: {
      ...(payload as any)?.meta,
      optionKind: kind,
      optionDescription: selectedOptionDescription,
      intent: playerInput,
      floorId: location.floorId,
      roomId: location.roomId,
      success,
      selectedConnectionId: selectedConnectionId ?? null,
    },
  };

  let next = appendEventToState(prevState, "OUTCOME", enrichedOutcome as any);

  const pressureDelta =
    kind === "contested"
      ? success
        ? 5
        : 11
      : kind === "risky"
        ? success
          ? 4
          : 9
        : kind === "environmental"
          ? success
            ? 3
            : 7
          : success
            ? 2
            : 5;

  const awarenessDelta =
    kind === "contested"
      ? success
        ? 7
        : 14
      : kind === "risky"
        ? success
          ? 5
          : 11
        : kind === "environmental"
          ? success
            ? 2
            : 6
          : success
            ? 1
            : 4;

  next = appendEventToState(next, "LOCATION_PRESSURE_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    delta: pressureDelta,
  });

  next = appendEventToState(next, "LOCATION_AWARENESS_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    delta: awarenessDelta,
  });

  if (
    shouldBreakStarterWeapon({
      prevState,
      success,
      kind,
      location,
    })
  ) {
    next = appendOpeningWeaponBreakConsequences({
      nextState: next,
      location,
      playerInput,
      selectedOptionDescription,
    });
  }

  next = commitDungeonTraversalBundle({
    prevState: next,
    success,
    selectedText: combinedText,
    selectedConnectionId: selectedConnectionId ?? null,
    currentRoom,
    reachableConnections,
    dungeon,
    floorId: location.floorId,
    roomId: location.roomId,
    openedDoorIds,
    unlockedDoorIds,
  });

  return next;
}

export function commitOutcomeOnlyToState(args: HandleOutcomeOnlyArgs) {
  const { prevState, payload, location } = args;

  const success = deriveOutcomeSuccess(payload);

  const enrichedOutcome = {
    ...payload,
    meta: {
      ...(payload as any)?.meta,
      optionKind: "contested",
      floorId: location.floorId,
      roomId: location.roomId,
      success,
    },
  };

  let next = appendEventToState(prevState, "OUTCOME", enrichedOutcome as any);

  next = appendEventToState(next, "LOCATION_PRESSURE_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    delta: success ? 5 : 11,
  });

  next = appendEventToState(next, "LOCATION_AWARENESS_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    delta: success ? 7 : 14,
  });

  return next;
}
