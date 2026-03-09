// lib/dungeon/DungeonEvolution.ts
// ------------------------------------------------------------
// Echoes of Fate — Dungeon Evolution (Room/Floor Native)
// ------------------------------------------------------------
// Purpose:
// - Provide a deterministic, read-only dungeon state interpreter
// - Derive local pressure, awareness, danger mood, and apex pacing
// - Reuse the strong pattern of the older world-native evolution layer
// - Shift ontology from tile-zones to room/floor locations
// ------------------------------------------------------------

import type {
  FloorId,
  RoomId,
} from "@/lib/dungeon/DungeonEvents";

export type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
  timestamp?: number;
};

export type DungeonCondition = "Stable" | "Disturbed" | "Unstable" | "Warped";
export type ApexPresence = "None" | "Suspected" | "Present" | "Imminent";

export type DungeonEvolution = {
  condition: DungeonCondition;
  apex: ApexPresence;
  signals: string[];
  nextTriggerHints: string[];
  debug: {
    floorId: string;
    roomId: string;
    roomPressure: number;
    roomAwareness: number;
    nearbyPressureMax: number;
    nearbyAwarenessMax: number;
    recentLoudEvents: number;
    recentFailures: number;
    recentViolence: number;
    outcomesInRoom: number;
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

  const kindWeight =
    optionKind === "contested"
      ? 3
      : optionKind === "risky"
      ? 2
      : optionKind === "environmental"
      ? 1
      : 0;

  const failWeight = success === false ? 3 : 0;
  const violenceWeight = violence ? 2 : 0;
  const loudness = kindWeight + failWeight + violenceWeight;

  return {
    floorId,
    roomId,
    optionKind,
    success,
    violence,
    loudness,
  };
}

function countRecentSignals(
  events: readonly SessionEvent[],
  floorId: string,
  roomId: string
) {
  const recent = lastN(events, 30);
  let recentLoudEvents = 0;
  let recentFailures = 0;
  let recentViolence = 0;
  let outcomesInRoom = 0;

  for (const e of recent) {
    const o = classifyOutcome(e);
    if (!o) continue;
    if (o.floorId !== floorId || o.roomId !== roomId) continue;

    outcomesInRoom += 1;
    if (o.loudness >= 4) recentLoudEvents += 1;
    if (o.success === false) recentFailures += 1;
    if (o.violence) recentViolence += 1;
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

function buildNextTriggerHints(): string[] {
  return [
    "Repeated loud actions raise attention quickly, especially when they fail.",
    "Violence hardens a room faster than cautious exploration does.",
    "Lingering in a hot room invites escalation even without moving deeper.",
    "If the dungeon feels apex-touched, conserve resources and reduce noise.",
  ];
}

export function deriveDungeonEvolution(args: {
  events: readonly SessionEvent[];
  floorId: FloorId;
  roomId: RoomId;
  nearbyRoomIds?: readonly RoomId[];
}): DungeonEvolution {
  const {
    events,
    floorId,
    roomId,
    nearbyRoomIds = [],
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

  const score =
    roomPressure * 0.45 +
    roomAwareness * 0.45 +
    clamp(recentLoudEvents, 0, 6) * 3 +
    clamp(recentFailures, 0, 6) * 2 +
    clamp(recentViolence, 0, 6) * 2 +
    Math.max(nearbyPressureMax, nearbyAwarenessMax) * 0.1;

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
  });

  return {
    condition,
    apex,
    signals,
    nextTriggerHints: buildNextTriggerHints(),
    debug: {
      floorId,
      roomId,
      roomPressure: Math.round(roomPressure),
      roomAwareness: Math.round(roomAwareness),
      nearbyPressureMax: Math.round(nearbyPressureMax),
      nearbyAwarenessMax: Math.round(nearbyAwarenessMax),
      recentLoudEvents,
      recentFailures,
      recentViolence,
      outcomesInRoom,
      score: normalizedScore,
    },
  };
}
