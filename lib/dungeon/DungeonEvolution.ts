// lib/dungeon/DungeonEvolution.ts
// ------------------------------------------------------------
// Echoes of Fate — Dungeon Evolution (Room/Floor Native)
// ------------------------------------------------------------
// Purpose:
// - Provide a deterministic, read-only dungeon state interpreter
// - Derive local pressure, awareness, danger mood, apex pacing,
//   and environment stress
// - Reuse the strong pattern of the older world-native evolution layer
// - Shift ontology from tile-zones to room/floor locations
//
// Current design alignment:
// - Fixed 3-floor structure: 0 / -1 / -2
// - Supports darkness on Floor -1
// - Supports darkness + cold on Floor -2
// - Supports richer room metadata (puzzles, traps, signature rooms,
//   refuge rooms, fire-source rooms)
// ------------------------------------------------------------

import type { FloorId, RoomId } from "@/lib/dungeon/DungeonEvents";
import type {
  DungeonDefinition,
  DungeonRoom,
  FloorDepth,
} from "@/lib/dungeon/FloorState";
import { getFloorById, getRoomById } from "@/lib/dungeon/FloorState";

export type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
  timestamp?: number;
};

export type DungeonCondition = "Stable" | "Disturbed" | "Unstable" | "Warped";
export type ApexPresence = "None" | "Suspected" | "Present" | "Imminent";

export type EnvironmentStress = {
  darknessPressure: number;
  coldPressure: number;
  refugeAvailable: boolean;
  fireSourceAvailable: boolean;
};

export type DungeonEvolution = {
  condition: DungeonCondition;
  apex: ApexPresence;
  signals: string[];
  nextTriggerHints: string[];
  environment: EnvironmentStress;
  debug: {
    floorId: string;
    roomId: string;
    floorDepth: FloorDepth | null;
    roomPressure: number;
    roomAwareness: number;
    nearbyPressureMax: number;
    nearbyAwarenessMax: number;
    recentLoudEvents: number;
    recentFailures: number;
    recentViolence: number;
    outcomesInRoom: number;
    darknessPressure: number;
    coldPressure: number;
    refugeAvailable: boolean;
    fireSourceAvailable: boolean;
    score: number;
  };
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function safeNum(x: unknown): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function safeStr(x: unknown): string | null {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function lastN<T>(arr: readonly T[], n: number) {
  if (n <= 0) return [];
  return arr.slice(Math.max(0, arr.length - n));
}

type LocationKey = `${FloorId}::${RoomId}`;

function makeLocationKey(floorId: string, roomId: string): LocationKey {
  return `${floorId}::${roomId}`;
}

function parseLocationPayload(payload: any): { floorId: string; roomId: string } | null {
  const floorId = safeStr(payload?.floorId);
  const roomId = safeStr(payload?.roomId);
  if (!floorId || !roomId) return null;
  return { floorId, roomId };
}

function aggregateLocationPressure(events: readonly SessionEvent[]) {
  const byLocation = new Map<LocationKey, number>();
  let sawCanonical = false;

  for (const e of events) {
    if (e?.type !== "LOCATION_PRESSURE_CHANGED") continue;
    const loc = parseLocationPayload(e?.payload);
    const delta = safeNum(e?.payload?.delta);
    if (!loc || delta === null) continue;

    sawCanonical = true;
    const key = makeLocationKey(loc.floorId, loc.roomId);
    const prev = byLocation.get(key) ?? 0;
    byLocation.set(key, clamp(prev + delta, 0, 100));
  }

  return { byLocation, sawCanonical };
}

function aggregateLocationAwareness(events: readonly SessionEvent[]) {
  const byLocation = new Map<LocationKey, number>();
  let sawCanonical = false;

  for (const e of events) {
    if (e?.type === "LOCATION_AWARENESS_CHANGED") {
      const loc = parseLocationPayload(e?.payload);
      const delta = safeNum(e?.payload?.delta);
      if (!loc || delta === null) continue;

      sawCanonical = true;
      const key = makeLocationKey(loc.floorId, loc.roomId);
      const prev = byLocation.get(key) ?? 0;
      byLocation.set(key, clamp(prev + delta, 0, 100));
      continue;
    }

    if (e?.type === "LOCATION_RESPONSE_TRIGGERED") {
      const loc = parseLocationPayload(e?.payload);
      if (!loc) continue;

      sawCanonical = true;
      const resetTo = safeNum(e?.payload?.resetTo);
      const key = makeLocationKey(loc.floorId, loc.roomId);
      byLocation.set(key, clamp(resetTo ?? 40, 0, 100));
      continue;
    }
  }

  return { byLocation, sawCanonical };
}

function classifyOutcome(e: SessionEvent) {
  if (e?.type !== "OUTCOME") return null;

  const meta = e?.payload?.meta ?? {};
  const floorId = safeStr(meta?.floorId);
  const roomId = safeStr(meta?.roomId);

  const optionKind =
    typeof meta?.optionKind === "string" ? String(meta.optionKind) : null;
  const success = typeof meta?.success === "boolean" ? meta.success : null;

  const intent = typeof meta?.intent === "string" ? meta.intent : "";
  const opt =
    typeof meta?.optionDescription === "string" ? meta.optionDescription : "";
  const text = `${intent}\n${opt}`.toLowerCase();

  const violence =
    text.includes("attack") ||
    text.includes("shoot") ||
    text.includes("stab") ||
    text.includes("slash") ||
    text.includes("kill") ||
    text.includes("fireball") ||
    text.includes("cast") ||
    text.includes("strike") ||
    text.includes("charge") ||
    text.includes("smash");

  const loud =
    text.includes("shout") ||
    text.includes("roar") ||
    text.includes("slam") ||
    text.includes("explode") ||
    text.includes("blast") ||
    text.includes("thunder") ||
    text.includes("crash") ||
    text.includes("break") ||
    text.includes("force") ||
    text.includes("kick");

  const optionKindWeight =
    optionKind === "contested"
      ? 3
      : optionKind === "risky"
      ? 2
      : optionKind === "environmental"
      ? 1
      : 0;

  const failWeight = success === false ? 3 : 0;
  const violenceWeight = violence ? 2 : 0;
  const loudWeight = loud ? 2 : 0;
  const loudness = optionKindWeight + failWeight + violenceWeight + loudWeight;

  return {
    floorId,
    roomId,
    optionKind,
    success,
    violence,
    loudness,
  };
}

function classifyDirectSignal(e: SessionEvent) {
  const payload = e?.payload ?? {};
  const floorId = safeStr(payload?.floorId);
  const roomId = safeStr(payload?.roomId);
  if (!floorId || !roomId) return null;

  switch (e?.type) {
    case "TRAP_TRIGGERED":
      return {
        floorId,
        roomId,
        loud: 2,
        failure: 1,
        violence: 0,
      };
    case "COMBAT_STARTED":
      return {
        floorId,
        roomId,
        loud: 2,
        failure: 0,
        violence: 2,
      };
    case "COMBAT_ENDED":
      return {
        floorId,
        roomId,
        loud: 1,
        failure: 0,
        violence: 1,
      };
    case "DOOR_FORCED":
      return {
        floorId,
        roomId,
        loud: 2,
        failure: 0,
        violence: 1,
      };
    case "PUZZLE_FAILED":
      return {
        floorId,
        roomId,
        loud: 1,
        failure: 2,
        violence: 0,
      };
    case "PUZZLE_SOLVED":
      return {
        floorId,
        roomId,
        loud: 0,
        failure: 0,
        violence: 0,
      };
    default:
      return null;
  }
}

function countRecentSignals(
  events: readonly SessionEvent[],
  floorId: string,
  roomId: string
) {
  const recent = lastN(events, 40);
  let recentLoudEvents = 0;
  let recentFailures = 0;
  let recentViolence = 0;
  let outcomesInRoom = 0;

  for (const e of recent) {
    const outcome = classifyOutcome(e);
    if (outcome && outcome.floorId === floorId && outcome.roomId === roomId) {
      outcomesInRoom += 1;
      if (outcome.loudness >= 4) recentLoudEvents += 1;
      if (outcome.success === false) recentFailures += 1;
      if (outcome.violence) recentViolence += 1;
      continue;
    }

    const signal = classifyDirectSignal(e);
    if (signal && signal.floorId === floorId && signal.roomId === roomId) {
      if (signal.loud > 0) recentLoudEvents += signal.loud;
      if (signal.failure > 0) recentFailures += signal.failure;
      if (signal.violence > 0) recentViolence += signal.violence;
    }
  }

  return {
    recentLoudEvents,
    recentFailures,
    recentViolence,
    outcomesInRoom,
  };
}

function conditionFromScore(score: number): DungeonCondition {
  const s = clamp(Math.round(score), 0, 100);
  if (s < 25) return "Stable";
  if (s < 50) return "Disturbed";
  if (s < 75) return "Unstable";
  return "Warped";
}

function apexFromScore(
  score: number,
  awareness: number,
  pressure: number
): ApexPresence {
  const s = clamp(Math.round(score), 0, 100);
  const a = clamp(Math.round(awareness), 0, 100);
  const p = clamp(Math.round(pressure), 0, 100);

  if (s < 45) return "None";
  if (s < 65) return "Suspected";
  if (s < 85) return "Present";
  if (a >= 75 || p >= 75) return "Imminent";
  return "Present";
}

function deriveEnvironmentStress(args: {
  dungeon?: DungeonDefinition;
  floorId: FloorId;
  roomId: RoomId;
}): {
  floorDepth: FloorDepth | null;
  room: DungeonRoom | null;
  darknessPressure: number;
  coldPressure: number;
  refugeAvailable: boolean;
  fireSourceAvailable: boolean;
} {
  const { dungeon, floorId, roomId } = args;
  if (!dungeon) {
    return {
      floorDepth: null,
      room: null,
      darknessPressure: 0,
      coldPressure: 0,
      refugeAvailable: false,
      fireSourceAvailable: false,
    };
  }

  const floor = getFloorById(dungeon, floorId);
  const room = getRoomById(dungeon, floorId, roomId);

  if (!floor || !room) {
    return {
      floorDepth: null,
      room: null,
      darknessPressure: 0,
      coldPressure: 0,
      refugeAvailable: false,
      fireSourceAvailable: false,
    };
  }

  const environment = room.environment ?? {
    pressure: floor.environmentPressure,
    requiresTorchlight: floor.requiresTorchlight,
    requiresWarmth: floor.requiresWarmth,
    isRefuge: false,
    hasFireSource: false,
  };

  const darknessPressure = environment.requiresTorchlight ? 20 : 0;
  const coldPressure = environment.requiresWarmth ? 20 : 0;

  return {
    floorDepth: floor.depth,
    room,
    darknessPressure,
    coldPressure,
    refugeAvailable: environment.isRefuge === true,
    fireSourceAvailable: environment.hasFireSource === true,
  };
}

function buildSignals(input: {
  condition: DungeonCondition;
  apex: ApexPresence;
  pressure: number;
  awareness: number;
  nearbyPressure: number;
  nearbyAwareness: number;
  recentLoudEvents: number;
  recentFailures: number;
  recentViolence: number;
  darknessPressure: number;
  coldPressure: number;
  refugeAvailable: boolean;
  fireSourceAvailable: boolean;
  floorDepth: FloorDepth | null;
  room: DungeonRoom | null;
}): string[] {
  const {
    condition,
    apex,
    pressure,
    awareness,
    nearbyPressure,
    nearbyAwareness,
    recentLoudEvents,
    recentFailures,
    recentViolence,
    darknessPressure,
    coldPressure,
    refugeAvailable,
    fireSourceAvailable,
    floorDepth,
    room,
  } = input;

  const out: string[] = [];

  if (condition === "Stable") {
    out.push("The room still holds. Every sound feels larger because so little answers it.");
  }
  if (condition === "Disturbed") {
    out.push("Something in this place has started listening back.");
  }
  if (condition === "Unstable") {
    out.push("The chamber feels reactive. Small disturbances seem to matter too much.");
  }
  if (condition === "Warped") {
    out.push("The place feels hostile now, as if the dungeon itself is leaning into the room.");
  }

  if (pressure >= 45) {
    out.push("Heat is building here. Patience is running thin.");
  }
  if (awareness >= 50) {
    out.push("This location is being watched. Routes and rhythms are no longer private.");
  }
  if (nearbyPressure >= 50 || nearbyAwareness >= 50) {
    out.push("Nearby rooms are hot. Trouble is close even if it is not yet inside this chamber.");
  }

  if (recentLoudEvents >= 2) {
    out.push("Noise has started to echo as information.");
  }
  if (recentFailures >= 2) {
    out.push("Mistakes are accumulating. The dungeon is beginning to predict you.");
  }
  if (recentViolence >= 2) {
    out.push("Violence has left a pattern behind.");
  }

  if (darknessPressure > 0) {
    out.push("Darkness thickens the room. Without light, caution costs less than confidence.");
  }
  if (coldPressure > 0) {
    out.push("The cold here is active, not passive. Lingering feels expensive.");
  }
  if (refugeAvailable) {
    out.push("This place offers a moment of shelter, if you are disciplined enough to use it.");
  }
  if (fireSourceAvailable && floorDepth === -2) {
    out.push("A workable heat source matters here. Fire is not comfort — it is survival.");
  }

  if (room?.puzzleId) {
    out.push("The room carries a deliberate pattern. It feels designed to test rather than merely obstruct.");
  }
  if (room?.trapId) {
    out.push("The space punishes carelessness. Something here was meant to catch the unwary.");
  }
  if (room?.isSignature) {
    out.push("This chamber has more narrative weight than the others around it.");
  }

  if (apex === "Suspected") {
    out.push("There are signs of something larger moving through the dungeon's logic.");
  }
  if (apex === "Present") {
    out.push("A greater presence seems to be shaping the pace of events nearby.");
  }
  if (apex === "Imminent") {
    out.push("The air tightens. If an apex force is near, it is no longer far.");
  }

  const seen = new Set<string>();
  return out.filter((line) => (seen.has(line) ? false : (seen.add(line), true)));
}

function buildNextTriggerHints(input: {
  floorDepth: FloorDepth | null;
  darknessPressure: number;
  coldPressure: number;
  refugeAvailable: boolean;
}): string[] {
  const out = [
    "Repeated loud actions raise attention quickly, especially when they fail.",
    "Violence hardens a room faster than cautious exploration does.",
    "Lingering in a hot room invites escalation even without moving deeper.",
    "If the dungeon feels apex-touched, conserve resources and reduce noise.",
  ];

  if (input.darknessPressure > 0) {
    out.push("Dark floors reward preparation. Entering blind turns ordinary rooms into risk multipliers.");
  }

  if (input.coldPressure > 0) {
    out.push("Deep cold punishes delay. Preserve warmth or route through rooms that can sustain it.");
  }

  if (input.refugeAvailable) {
    out.push("Refuge rooms are strongest when used deliberately before escalation, not after collapse.");
  }

  return out;
}

export function deriveDungeonEvolution(args: {
  events: readonly SessionEvent[];
  floorId: FloorId;
  roomId: RoomId;
  nearbyRoomIds?: readonly RoomId[];
  dungeon?: DungeonDefinition;
}): DungeonEvolution {
  const {
    events,
    floorId,
    roomId,
    nearbyRoomIds = [],
    dungeon,
  } = args;

  const pressureAgg = aggregateLocationPressure(events);
  const awarenessAgg = aggregateLocationAwareness(events);

  const currentKey = makeLocationKey(floorId, roomId);

  const roomPressure = pressureAgg.byLocation.get(currentKey) ?? 0;
  const roomAwareness = awarenessAgg.byLocation.get(currentKey) ?? 0;

  let nearbyPressureMax = 0;
  let nearbyAwarenessMax = 0;

  for (const nearbyRoomId of nearbyRoomIds) {
    const key = makeLocationKey(floorId, nearbyRoomId);
    nearbyPressureMax = Math.max(
      nearbyPressureMax,
      pressureAgg.byLocation.get(key) ?? 0
    );
    nearbyAwarenessMax = Math.max(
      nearbyAwarenessMax,
      awarenessAgg.byLocation.get(key) ?? 0
    );
  }

  const {
    recentLoudEvents,
    recentFailures,
    recentViolence,
    outcomesInRoom,
  } = countRecentSignals(events, floorId, roomId);

  const {
    floorDepth,
    room,
    darknessPressure,
    coldPressure,
    refugeAvailable,
    fireSourceAvailable,
  } = deriveEnvironmentStress({
    dungeon,
    floorId,
    roomId,
  });

  const refugeModifier = refugeAvailable ? -8 : 0;
  const fireSourceModifier = fireSourceAvailable ? -5 : 0;

  const score =
    roomPressure * 0.4 +
    roomAwareness * 0.4 +
    clamp(recentLoudEvents, 0, 8) * 3 +
    clamp(recentFailures, 0, 8) * 2 +
    clamp(recentViolence, 0, 8) * 2 +
    Math.max(nearbyPressureMax, nearbyAwarenessMax) * 0.12 +
    darknessPressure * 0.35 +
    coldPressure * 0.4 +
    refugeModifier +
    fireSourceModifier;

  const normalizedScore = clamp(Math.round(score), 0, 100);
  const condition = conditionFromScore(normalizedScore);
  const apex = apexFromScore(normalizedScore, roomAwareness, roomPressure);

  const signals = buildSignals({
    condition,
    apex,
    pressure: roomPressure,
    awareness: roomAwareness,
    nearbyPressure: nearbyPressureMax,
    nearbyAwareness: nearbyAwarenessMax,
    recentLoudEvents,
    recentFailures,
    recentViolence,
    darknessPressure,
    coldPressure,
    refugeAvailable,
    fireSourceAvailable,
    floorDepth,
    room,
  });

  return {
    condition,
    apex,
    signals,
    nextTriggerHints: buildNextTriggerHints({
      floorDepth,
      darknessPressure,
      coldPressure,
      refugeAvailable,
    }),
    environment: {
      darknessPressure,
      coldPressure,
      refugeAvailable,
      fireSourceAvailable,
    },
    debug: {
      floorId,
      roomId,
      floorDepth,
      roomPressure: Math.round(roomPressure),
      roomAwareness: Math.round(roomAwareness),
      nearbyPressureMax: Math.round(nearbyPressureMax),
      nearbyAwarenessMax: Math.round(nearbyAwarenessMax),
      recentLoudEvents,
      recentFailures,
      recentViolence,
      outcomesInRoom,
      darknessPressure,
      coldPressure,
      refugeAvailable,
      fireSourceAvailable,
      score: normalizedScore,
    },
  };
}
