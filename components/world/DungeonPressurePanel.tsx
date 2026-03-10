"use client";

// ------------------------------------------------------------
// DungeonPressurePanel.tsx
// ------------------------------------------------------------
// Advisory-only dungeon pressure + room inference + floor awareness.
// NO authority, NO mutation, NO automation.
//
// Purpose:
// - Make local room pressure + floor awareness visible
// - Show nearby connected-room tension
// - Recommend (never assert) current location / room state
// - Preserve Arbiter authority
//
// Echoes of Fate refactor:
// - Retargeted away from tile-zone inference toward room / floor state
// - Uses currentRoomId as the primary anchor when available
// - Infers nearby rooms from canon events and room id fallback rules
// - Keeps DungeonEvolution as a READ-ONLY deterministic layer
// - Environmental Memory now derives from room-local and nearby-room signals
// - Adds tactical recommendation layer
// - Adds low-rumble SFX on meaningful danger escalation
// ------------------------------------------------------------

import React, { useEffect, useMemo, useRef } from "react";
import { deriveDungeonEvolution } from "@/lib/world/DungeonEvolution";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
};

type Props = {
  turn: number;
  currentRoomId?: string;
  events: readonly SessionEvent[];
  parsedCommand?: any;
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

type RoomId = string;
type FloorId = string;

const DANGER_RUMBLE_SRC = "/assets/audio/sfx_low_rumble_01.mp3";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNum(x: any): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function safeStr(x: any): string | null {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function titleCase(input: string) {
  return String(input)
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function prettyRoomLabel(roomId?: string) {
  const raw = safeStr(roomId);
  if (!raw) return null;

  const canonical = /^floor_(\d+)_room_(\d+)$/i.exec(raw);
  if (canonical) {
    return `Room ${Number(canonical[2])}`;
  }

  return titleCase(raw);
}

function prettyFloorLabel(floorId?: string | null) {
  const raw = safeStr(floorId);
  if (!raw) return null;

  const canonical = /^floor_(\d+)$/i.exec(raw);
  if (!canonical) return titleCase(raw);

  const index = Number(canonical[1]);
  if (!Number.isFinite(index)) return titleCase(raw);

  if (index === 1) return "Surface Threshold";
  if (index === 2) return "Depth 1";
  if (index === 3) return "Depth 2";
  return `Depth ${index - 1}`;
}

function inferFloorIdFromRoomId(roomId?: string | null): FloorId | null {
  const raw = safeStr(roomId);
  if (!raw) return null;

  const m = /^(floor_\d+)_room_\d+$/i.exec(raw);
  return m ? m[1] : null;
}

function parseRoomOrdinal(roomId?: string | null): { floorIndex: number; roomIndex: number } | null {
  const raw = safeStr(roomId);
  if (!raw) return null;

  const m = /^floor_(\d+)_room_(\d+)$/i.exec(raw);
  if (!m) return null;

  const floorIndex = Number(m[1]);
  const roomIndex = Number(m[2]);

  if (!Number.isFinite(floorIndex) || !Number.isFinite(roomIndex)) return null;
  return { floorIndex, roomIndex };
}

function roomDistanceHint(currentRoomId: string, targetRoomId: string): string {
  const a = parseRoomOrdinal(currentRoomId);
  const b = parseRoomOrdinal(targetRoomId);

  if (!a || !b) return "nearby";

  if (a.floorIndex !== b.floorIndex) {
    return b.floorIndex > a.floorIndex ? "deeper" : "above";
  }

  const diff = b.roomIndex - a.roomIndex;
  if (diff === 0) return "here";
  if (Math.abs(diff) === 1) return diff > 0 ? "ahead" : "behind";
  if (diff > 1) return "further ahead";
  return "further behind";
}

function playDangerRumble(volume = 0.42) {
  try {
    const audio = new Audio(DANGER_RUMBLE_SRC);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // fail silently
  }
}

function tierForPressure(p: number): {
  tier: "Quiet" | "Uneasy" | "Alert" | "Hunting" | "Active Threat" | "Crisis";
  rangeLabel: string;
} {
  const x = clamp(Math.round(p), 0, 100);
  if (x <= 10) return { tier: "Quiet", rangeLabel: "0–10" };
  if (x <= 25) return { tier: "Uneasy", rangeLabel: "11–25" };
  if (x <= 45) return { tier: "Alert", rangeLabel: "26–45" };
  if (x <= 70) return { tier: "Hunting", rangeLabel: "46–70" };
  if (x <= 90) return { tier: "Active Threat", rangeLabel: "71–90" };
  return { tier: "Crisis", rangeLabel: "91–100" };
}

function pressureTierRank(tier: ReturnType<typeof tierForPressure>["tier"]): number {
  switch (tier) {
    case "Quiet":
      return 0;
    case "Uneasy":
      return 1;
    case "Alert":
      return 2;
    case "Hunting":
      return 3;
    case "Active Threat":
      return 4;
    case "Crisis":
      return 5;
    default:
      return 0;
  }
}

function statusForAwareness(a: number): {
  label: "Calm" | "Whispers" | "Search" | "Reinforcements" | "Alarm";
  nextHint: string;
} {
  const x = clamp(Math.round(a), 0, 100);
  if (x < 25) return { label: "Calm", nextHint: "Noise and failure will draw attention." };
  if (x < 50) return { label: "Whispers", nextHint: "Minor signs of movement nearby." };
  if (x < 75) return { label: "Search", nextHint: "Patrols begin probing the floor." };
  if (x < 100) return { label: "Reinforcements", nextHint: "A response is likely if disturbances continue." };
  return { label: "Alarm", nextHint: "The dungeon responds." };
}

function awarenessRank(label: ReturnType<typeof statusForAwareness>["label"]): number {
  switch (label) {
    case "Calm":
      return 0;
    case "Whispers":
      return 1;
    case "Search":
      return 2;
    case "Reinforcements":
      return 3;
    case "Alarm":
      return 4;
    default:
      return 0;
  }
}

function extractRoomIdFromPayload(payload: any): RoomId | null {
  return (
    safeStr(payload?.roomId) ??
    safeStr(payload?.currentRoomId) ??
    safeStr(payload?.toRoomId) ??
    safeStr(payload?.fromRoomId) ??
    safeStr(payload?.targetRoomId) ??
    safeStr(payload?.nextRoomId) ??
    safeStr(payload?.at?.roomId) ??
    safeStr(payload?.room?.id) ??
    safeStr(payload?.world?.roomId) ??
    safeStr(payload?.world?.at?.roomId) ??
    null
  );
}

function extractFloorIdFromPayload(payload: any): FloorId | null {
  return (
    safeStr(payload?.floorId) ??
    safeStr(payload?.currentFloorId) ??
    safeStr(payload?.toFloorId) ??
    safeStr(payload?.targetFloorId) ??
    safeStr(payload?.world?.floorId) ??
    inferFloorIdFromRoomId(extractRoomIdFromPayload(payload)) ??
    null
  );
}

// ------------------------------------------------------------
// Canon-derived room / floor inference
// ------------------------------------------------------------

function deriveCurrentRoomId(events: readonly SessionEvent[], explicitCurrentRoomId?: string): RoomId | null {
  if (safeStr(explicitCurrentRoomId)) return explicitCurrentRoomId!;

  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i] as any;

    const direct =
      safeStr(e?.payload?.currentRoomId) ??
      safeStr(e?.payload?.roomId) ??
      safeStr(e?.payload?.toRoomId) ??
      safeStr(e?.payload?.targetRoomId) ??
      safeStr(e?.payload?.world?.roomId);

    if (direct) return direct;

    if (e?.type === "ROOM_ENTERED") {
      const entered = extractRoomIdFromPayload(e?.payload);
      if (entered) return entered;
    }
  }

  return null;
}

function deriveCurrentFloorId(events: readonly SessionEvent[], currentRoomId: string | null): FloorId | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i] as any;
    const floorId = extractFloorIdFromPayload(e?.payload);
    if (floorId) return floorId;
  }

  return inferFloorIdFromRoomId(currentRoomId);
}

function buildRoomAdjacency(events: readonly SessionEvent[]): Map<RoomId, Set<RoomId>> {
  const graph = new Map<RoomId, Set<RoomId>>();

  function link(a?: string | null, b?: string | null) {
    const ra = safeStr(a);
    const rb = safeStr(b);
    if (!ra || !rb || ra === rb) return;

    if (!graph.has(ra)) graph.set(ra, new Set());
    if (!graph.has(rb)) graph.set(rb, new Set());

    graph.get(ra)!.add(rb);
    graph.get(rb)!.add(ra);
  }

  for (const e of events as any[]) {
    const payload = e?.payload ?? {};

    link(payload?.fromRoomId, payload?.toRoomId);
    link(payload?.roomAId, payload?.roomBId);
    link(payload?.currentRoomId, payload?.nextRoomId);
    link(payload?.currentRoomId, payload?.targetRoomId);
    link(payload?.from?.roomId, payload?.to?.roomId);
    link(payload?.world?.fromRoomId, payload?.world?.toRoomId);

    if (e?.type === "ROOM_ENTERED") {
      link(payload?.fromRoomId, payload?.roomId);
    }
  }

  return graph;
}

function inferNearbyRooms(
  currentRoomId: string | null,
  currentFloorId: string | null,
  adjacency: Map<RoomId, Set<RoomId>>
): RoomId[] {
  if (!currentRoomId) return [];

  const direct = Array.from(adjacency.get(currentRoomId) ?? []);
  if (direct.length > 0) return direct;

  const parsed = parseRoomOrdinal(currentRoomId);
  if (!parsed) return [];

  const candidates: RoomId[] = [];
  const before = `floor_${parsed.floorIndex}_room_${parsed.roomIndex - 1}`;
  const after = `floor_${parsed.floorIndex}_room_${parsed.roomIndex + 1}`;

  if (parsed.roomIndex > 1) candidates.push(before);
  candidates.push(after);

  return candidates.filter((roomId) => inferFloorIdFromRoomId(roomId) === currentFloorId);
}

// ------------------------------------------------------------
// Pressure + awareness derivation
// ------------------------------------------------------------

type RoomPressureState = {
  byRoom: Map<RoomId, number>;
  estimated: boolean;
};

function deriveRoomPressure(events: readonly SessionEvent[]): RoomPressureState {
  const byRoom = new Map<RoomId, number>();
  let sawCanonical = false;

  for (const e of events as any[]) {
    if (e?.type !== "ROOM_PRESSURE_CHANGED" && e?.type !== "ZONE_PRESSURE_CHANGED") continue;

    const roomId = extractRoomIdFromPayload(e?.payload);
    const delta = safeNum(e?.payload?.delta);

    if (!roomId || delta === null) continue;

    sawCanonical = true;
    const prev = byRoom.get(roomId) ?? 0;
    byRoom.set(roomId, clamp(prev + delta, 0, 100));
  }

  if (sawCanonical) {
    return { byRoom, estimated: false };
  }

  for (const e of events as any[]) {
    const roomId = extractRoomIdFromPayload(e?.payload);
    if (!roomId) continue;

    let delta = 0;

    switch (e?.type) {
      case "COMBAT_STARTED":
        delta = 14;
        break;
      case "COMBAT_ENDED":
        delta = 6;
        break;
      case "HAZARD_REVEALED":
      case "TRAP_TRIGGERED":
        delta = 12;
        break;
      case "DOOR_LOCKED":
        delta = 5;
        break;
      case "PATROL_SIGNS_REVEALED":
        delta = 8;
        break;
      case "ZONE_RESPONSE_TRIGGERED":
      case "ROOM_RESPONSE_TRIGGERED":
        delta = 16;
        break;
      case "CACHE_REVEALED":
      case "ALTAR_REVEALED":
      case "STAIRS_REVEALED":
        delta = 3;
        break;
      case "OUTCOME": {
        const world = e?.payload?.world;
        if (world?.trap) delta += world.trap.state === "disarmed" ? -4 : 10;
        if (world?.lock) delta += 4;
        break;
      }
      default:
        break;
    }

    if (delta === 0) continue;
    const prev = byRoom.get(roomId) ?? 0;
    byRoom.set(roomId, clamp(prev + delta, 0, 100));
  }

  return { byRoom, estimated: true };
}

type FloorAwarenessState = {
  byFloor: Map<FloorId, number>;
  estimated: boolean;
};

function deriveFloorAwareness(
  events: readonly SessionEvent[],
  roomPressure: RoomPressureState
): FloorAwarenessState {
  const byFloor = new Map<FloorId, number>();
  let sawCanonical = false;

  for (const e of events as any[]) {
    if (
      e?.type !== "FLOOR_AWARENESS_CHANGED" &&
      e?.type !== "ROOM_AWARENESS_CHANGED" &&
      e?.type !== "ZONE_AWARENESS_CHANGED" &&
      e?.type !== "ZONE_RESPONSE_TRIGGERED" &&
      e?.type !== "ROOM_RESPONSE_TRIGGERED"
    ) {
      continue;
    }

    const floorId = extractFloorIdFromPayload(e?.payload);
    if (!floorId) continue;

    if (e?.type === "ZONE_RESPONSE_TRIGGERED" || e?.type === "ROOM_RESPONSE_TRIGGERED") {
      sawCanonical = true;
      const resetTo = safeNum(e?.payload?.resetTo);
      byFloor.set(floorId, clamp(resetTo ?? 40, 0, 100));
      continue;
    }

    const delta = safeNum(e?.payload?.delta);
    if (delta === null) continue;

    sawCanonical = true;
    const prev = byFloor.get(floorId) ?? 0;
    byFloor.set(floorId, clamp(prev + delta, 0, 100));
  }

  if (sawCanonical) return { byFloor, estimated: false };

  const rollup = new Map<FloorId, number[]>();

  for (const [roomId, p] of roomPressure.byRoom.entries()) {
    const floorId = inferFloorIdFromRoomId(roomId);
    if (!floorId) continue;
    const list = rollup.get(floorId) ?? [];
    list.push(p);
    rollup.set(floorId, list);
  }

  const estimated = new Map<FloorId, number>();
  for (const [floorId, values] of rollup.entries()) {
    const max = values.length ? Math.max(...values) : 0;
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    estimated.set(floorId, clamp(Math.round(max * 0.6 + avg * 0.5), 0, 100));
  }

  return { byFloor: estimated, estimated: true };
}

// ------------------------------------------------------------
// Advisory location inference
// ------------------------------------------------------------

function recommendLocation(parsedCommand?: any): { label: string; reason: string } {
  const text = parsedCommand?.rawInput?.toLowerCase?.() ?? "";

  if (
    text.includes("open door") ||
    text.includes("enter") ||
    text.includes("hallway") ||
    text.includes("passage")
  ) {
    return {
      label: "Stone Hallway",
      reason: "Door or entry language implies movement into an interior passage.",
    };
  }

  if (text.includes("descend") || text.includes("stairs")) {
    return {
      label: "Descending Passage",
      reason: "Descent language suggests a transition point deeper into the dungeon.",
    };
  }

  return {
    label: "Dungeon Threshold",
    reason: "No room-confirming signal detected; default staging location.",
  };
}

// ------------------------------------------------------------
// Advisory room naming
// ------------------------------------------------------------

function deriveRoomTitle(args: {
  events: readonly SessionEvent[];
  currentRoomId: RoomId | null;
  currentPressure: number;
  floorAwareness: number;
}): string {
  const { events, currentRoomId, currentPressure, floorAwareness } = args;
  if (!currentRoomId) return "Unknown Chamber";

  let hasDoor = false;
  let hasLock = false;
  let hasHazard = false;
  let hasCache = false;
  let hasAltar = false;
  let hasStairs = false;
  let hasPatrol = false;
  let hasCombat = false;

  for (const e of events as any[]) {
    const roomId = extractRoomIdFromPayload(e?.payload);
    if (roomId !== currentRoomId) continue;

    switch (e?.type) {
      case "DOOR_DISCOVERED":
        hasDoor = true;
        break;
      case "DOOR_LOCKED":
        hasLock = true;
        break;
      case "HAZARD_REVEALED":
      case "TRAP_TRIGGERED":
        hasHazard = true;
        break;
      case "CACHE_REVEALED":
        hasCache = true;
        break;
      case "ALTAR_REVEALED":
        hasAltar = true;
        break;
      case "STAIRS_REVEALED":
        hasStairs = true;
        break;
      case "PATROL_SIGNS_REVEALED":
        hasPatrol = true;
        break;
      case "COMBAT_STARTED":
      case "COMBAT_ENDED":
        hasCombat = true;
        break;
      case "OUTCOME": {
        const world = e?.payload?.world;
        if (world?.lock) hasLock = true;
        if (world?.trap) hasHazard = true;
        break;
      }
      default:
        break;
    }
  }

  if (hasAltar && hasStairs) return "Shrine Descent";
  if (hasAltar) return "Ritual Chamber";
  if (hasStairs) return "Descending Passage";
  if (hasCache && hasLock) return "Sealed Store";
  if (hasCache) return "Forgotten Cache";
  if (hasLock) return "Locked Approach";
  if (hasHazard && hasCombat) return "Blooded Chamber";
  if (hasHazard) return "Danger Room";
  if (hasPatrol && floorAwareness >= 45) return "Hunting Hall";
  if (hasPatrol) return "Watch Room";
  if (hasDoor) return "Stone Threshold";
  if (hasCombat) return "Clash Site";
  if (currentPressure >= 70) return "Crisis Chamber";
  if (floorAwareness >= 75) return "Alarmed Passage";
  if (currentPressure >= 40 || floorAwareness >= 45) return "Uneasy Hall";
  return prettyRoomLabel(currentRoomId) ?? "Silent Hall";
}

// ------------------------------------------------------------
// Environmental Memory derivation
// ------------------------------------------------------------

type MemorySection = {
  title: string;
  items: string[];
  emptyLabel?: string;
};

type EnvironmentalMemory = {
  sections: MemorySection[];
  counts: {
    threats: number;
    obstacles: number;
    opportunities: number;
    nearbySignals: number;
    recentChanges: number;
  };
  flags: {
    hasLockedPath: boolean;
    hasHazard: boolean;
    hasOpportunity: boolean;
    hasPatrolRisk: boolean;
    hasRecentShift: boolean;
  };
};

function pushUnique(map: Map<string, string>, key: string, value: string) {
  if (!map.has(key)) map.set(key, value);
}

function deriveEnvironmentalMemory(args: {
  events: readonly SessionEvent[];
  currentRoomId: RoomId | null;
  nearbyRoomIds: RoomId[];
  currentPressure: number;
  floorAwareness: number;
  nearbyMaxPressure: number;
}): EnvironmentalMemory {
  const { events, currentRoomId, nearbyRoomIds, currentPressure, floorAwareness, nearbyMaxPressure } = args;

  const localThreats = new Map<string, string>();
  const localObstacles = new Map<string, string>();
  const localOpportunities = new Map<string, string>();
  const nearbySignals = new Map<string, string>();
  const recentChanges = new Map<string, string>();

  const nearbySet = new Set(nearbyRoomIds);

  let localHazardCount = 0;
  let localLockedDoorCount = 0;
  let localDoorCount = 0;
  let localCacheCount = 0;
  let localAltarCount = 0;
  let localStairsCount = 0;
  let localPatrolSignsCount = 0;
  let localCombatStarted = 0;
  let localCombatEnded = 0;

  let nearbyPatrolSigns = 0;
  let nearbyHazards = 0;
  let nearbyLockedDoors = 0;

  let latestPressureDelta: number | null = null;
  let latestAwarenessDelta: number | null = null;

  const recentEventLines: string[] = [];

  for (const e of events as any[]) {
    const roomId = extractRoomIdFromPayload(e?.payload);
    const floorId = extractFloorIdFromPayload(e?.payload);

    const isLocal = !!currentRoomId && roomId === currentRoomId;
    const isNearby = !!roomId && nearbySet.has(roomId);

    switch (e?.type) {
      case "DOOR_DISCOVERED": {
        if (isLocal) {
          localDoorCount += 1;
          pushUnique(localObstacles, "door-discovered", "A discovered door offers a possible route forward.");
        } else if (isNearby && currentRoomId && roomId) {
          pushUnique(
            nearbySignals,
            `door-discovered-${roomId}`,
            `A newly found passage opens ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("A hidden or obscured doorway was discovered.");
        break;
      }

      case "DOOR_LOCKED": {
        if (isLocal) {
          localLockedDoorCount += 1;
          pushUnique(localObstacles, "door-locked", "A locked passage is preventing immediate progress.");
        } else if (isNearby && currentRoomId && roomId) {
          nearbyLockedDoors += 1;
          pushUnique(
            nearbySignals,
            `door-locked-${roomId}`,
            `A locked route blocks the way ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("Iron locks were found securing a door.");
        break;
      }

      case "HAZARD_REVEALED":
      case "TRAP_TRIGGERED": {
        if (isLocal) {
          localHazardCount += 1;
          pushUnique(localThreats, "hazard-local", "A revealed hazard makes this room unsafe.");
        } else if (isNearby && currentRoomId && roomId) {
          nearbyHazards += 1;
          pushUnique(
            nearbySignals,
            `hazard-${roomId}`,
            `Dangerous terrain or a trap is known ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("A hidden danger was revealed.");
        break;
      }

      case "CACHE_REVEALED": {
        if (isLocal) {
          localCacheCount += 1;
          pushUnique(localOpportunities, "cache-local", "A discovered cache may reward a careful return.");
        } else if (isNearby && currentRoomId && roomId) {
          pushUnique(
            nearbySignals,
            `cache-${roomId}`,
            `Useful supplies may be reachable ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("A useful cache was identified.");
        break;
      }

      case "ALTAR_REVEALED": {
        if (isLocal) {
          localAltarCount += 1;
          pushUnique(localOpportunities, "altar-local", "An altar or sacred point may offer a ritual advantage.");
        } else if (isNearby && currentRoomId && roomId) {
          pushUnique(
            nearbySignals,
            `altar-${roomId}`,
            `A place of ritual significance lies ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("A ritual site was brought to light.");
        break;
      }

      case "STAIRS_REVEALED": {
        if (isLocal) {
          localStairsCount += 1;
          pushUnique(localOpportunities, "stairs-local", "A stairway offers a deeper route through the dungeon.");
        } else if (isNearby && currentRoomId && roomId) {
          pushUnique(
            nearbySignals,
            `stairs-${roomId}`,
            `A route deeper into the dungeon lies ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("A transition point deeper into the dungeon was revealed.");
        break;
      }

      case "PATROL_SIGNS_REVEALED": {
        if (isLocal) {
          localPatrolSignsCount += 1;
          pushUnique(localThreats, "patrol-local", "Enemy movement has been detected nearby.");
        } else if (isNearby && currentRoomId && roomId) {
          nearbyPatrolSigns += 1;
          pushUnique(
            nearbySignals,
            `patrol-${roomId}`,
            `Patrol signs suggest enemy movement ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("Signs of patrol traffic were discovered.");
        break;
      }

      case "COMBAT_STARTED": {
        if (isLocal) {
          localCombatStarted += 1;
          pushUnique(localThreats, "combat-started", "Violence has already broken out in this room.");
        } else if (isNearby && currentRoomId && roomId) {
          pushUnique(
            nearbySignals,
            `combat-started-${roomId}`,
            `Conflict has flared ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("Combat erupted nearby.");
        break;
      }

      case "COMBAT_ENDED": {
        if (isLocal) {
          localCombatEnded += 1;
          pushUnique(localThreats, "combat-ended", "The aftermath of recent combat lingers here.");
        } else if (isNearby && currentRoomId && roomId) {
          pushUnique(
            nearbySignals,
            `combat-ended-${roomId}`,
            `The signs of recent violence lie ${roomDistanceHint(currentRoomId, roomId)}.`
          );
        }
        recentEventLines.push("A clash recently ended.");
        break;
      }

      case "ROOM_PRESSURE_CHANGED":
      case "ZONE_PRESSURE_CHANGED": {
        if (roomId === currentRoomId) {
          const delta = safeNum(e?.payload?.delta);
          if (delta !== null) latestPressureDelta = delta;
        }
        break;
      }

      case "FLOOR_AWARENESS_CHANGED":
      case "ROOM_AWARENESS_CHANGED":
      case "ZONE_AWARENESS_CHANGED": {
        const delta = safeNum(e?.payload?.delta);
        if (delta === null) break;

        const localFloorId = currentRoomId ? inferFloorIdFromRoomId(currentRoomId) : null;
        if (floorId && floorId === localFloorId) {
          latestAwarenessDelta = delta;
        }
        break;
      }

      case "ZONE_RESPONSE_TRIGGERED":
      case "ROOM_RESPONSE_TRIGGERED": {
        if (isLocal) {
          pushUnique(localThreats, "room-response", "The dungeon has already mounted a response to disturbance here.");
          recentEventLines.push("The dungeon responded to the party's activity.");
        }
        break;
      }

      case "OUTCOME": {
        const world = e?.payload?.world;
        if (!world) break;

        const outcomeRoomId =
          safeStr(world?.roomId) ??
          safeStr(world?.at?.roomId) ??
          roomId;

        const outcomeIsLocal = !!currentRoomId && outcomeRoomId === currentRoomId;
        const outcomeIsNearby = !!outcomeRoomId && nearbySet.has(outcomeRoomId);

        if (world?.lock) {
          const state = safeStr(world.lock.state) ?? "changed";
          const keyId = safeStr(world.lock.keyId);
          const line = `A door here is ${state}${keyId ? ` (key: ${keyId})` : ""}.`;

          if (outcomeIsLocal) {
            pushUnique(localObstacles, `outcome-lock-${state}-${keyId ?? "none"}`, line);
          } else if (outcomeIsNearby && currentRoomId && outcomeRoomId) {
            pushUnique(
              nearbySignals,
              `outcome-lock-${outcomeRoomId}-${state}-${keyId ?? "none"}`,
              `A manipulated door lies ${roomDistanceHint(currentRoomId, outcomeRoomId)}.`
            );
          }
        }

        if (world?.trap) {
          const state = safeStr(world.trap.state) ?? "present";
          const line =
            state === "disarmed"
              ? "A trap here has been disarmed, but the area remains suspicious."
              : `A trap here is ${state}.`;

          if (outcomeIsLocal) {
            if (state === "disarmed") {
              pushUnique(localOpportunities, `outcome-trap-${state}`, line);
            } else {
              pushUnique(localThreats, `outcome-trap-${state}`, line);
            }
          } else if (outcomeIsNearby && currentRoomId && outcomeRoomId) {
            pushUnique(
              nearbySignals,
              `outcome-trap-${outcomeRoomId}-${state}`,
              `Trap activity is known ${roomDistanceHint(currentRoomId, outcomeRoomId)}.`
            );
          }
        }

        break;
      }

      default:
        break;
    }
  }

  if (localHazardCount > 1) {
    pushUnique(localThreats, "hazard-count", `Multiple hazards have been identified in this room (${localHazardCount}).`);
  }

  if (localLockedDoorCount > 1) {
    pushUnique(localObstacles, "locked-door-count", `More than one locked barrier is slowing progress here (${localLockedDoorCount}).`);
  }

  if (localDoorCount > 1 && localLockedDoorCount === 0) {
    pushUnique(localObstacles, "door-count", `Several potential routes have been revealed in this room (${localDoorCount}).`);
  }

  if (localCacheCount > 1) {
    pushUnique(localOpportunities, "cache-count", `More than one useful cache has been identified nearby (${localCacheCount}).`);
  }

  if (localAltarCount > 0 && localStairsCount > 0) {
    pushUnique(localOpportunities, "altar-stairs-combo", "This area holds both ritual significance and a path onward.");
  }

  if (localPatrolSignsCount > 1) {
    pushUnique(localThreats, "patrol-count", `Repeated patrol traces suggest organized enemy activity (${localPatrolSignsCount}).`);
  }

  if (localCombatStarted > 0 && localCombatEnded === 0) {
    pushUnique(localThreats, "combat-ongoing-memory", "This room has already drawn blood and may not settle quickly.");
  }

  if (localCombatEnded > 0) {
    pushUnique(localThreats, "combat-aftermath", "The aftermath of violence may still attract attention.");
  }

  if (currentPressure >= 70) {
    pushUnique(localThreats, "pressure-high", "Pressure in this room is severe; the dungeon is actively pushing back.");
  } else if (currentPressure >= 40) {
    pushUnique(localThreats, "pressure-rising", "Pressure is building in this room.");
  }

  if (floorAwareness >= 75) {
    pushUnique(localThreats, "awareness-high", "This floor is close to open alarm.");
  } else if (floorAwareness >= 45) {
    pushUnique(localThreats, "awareness-mid", "Enemy awareness is elevated and probing behavior is likely.");
  }

  if (nearbyMaxPressure >= 70) {
    pushUnique(nearbySignals, "nearby-pressure-high", "A connected room is under extreme pressure.");
  } else if (nearbyMaxPressure >= 40) {
    pushUnique(nearbySignals, "nearby-pressure-mid", "Tension is rising in a connected room.");
  }

  if (nearbyPatrolSigns > 1) {
    pushUnique(nearbySignals, "nearby-patrol-count", "Multiple nearby patrol indicators suggest the dungeon is moving pieces around.");
  }

  if (nearbyHazards > 1) {
    pushUnique(nearbySignals, "nearby-hazard-count", "Several dangers have been identified in connected rooms.");
  }

  if (nearbyLockedDoors > 1) {
    pushUnique(nearbySignals, "nearby-locked-count", "Nearby routes appear heavily controlled or sealed.");
  }

  if (latestPressureDelta !== null) {
    if (latestPressureDelta > 0) {
      pushUnique(recentChanges, "pressure-up", `Room pressure recently increased by ${latestPressureDelta}.`);
    } else if (latestPressureDelta < 0) {
      pushUnique(recentChanges, "pressure-down", `Room pressure recently eased by ${Math.abs(latestPressureDelta)}.`);
    }
  }

  if (latestAwarenessDelta !== null) {
    if (latestAwarenessDelta > 0) {
      pushUnique(recentChanges, "awareness-up", `Floor awareness recently rose by ${latestAwarenessDelta}.`);
    } else if (latestAwarenessDelta < 0) {
      pushUnique(recentChanges, "awareness-down", `Floor awareness recently fell by ${Math.abs(latestAwarenessDelta)}.`);
    }
  }

  for (const line of recentEventLines.slice(-3)) {
    pushUnique(recentChanges, `recent-${line}`, line);
  }

  const threatItems = Array.from(localThreats.values());
  const obstacleItems = Array.from(localObstacles.values());
  const opportunityItems = Array.from(localOpportunities.values());
  const nearbyItems = Array.from(nearbySignals.values());
  const recentItems = Array.from(recentChanges.values());

  const sections: MemorySection[] = [
    {
      title: "Threats",
      items: threatItems,
      emptyLabel: "No immediate local threats have been clearly established.",
    },
    {
      title: "Obstacles",
      items: obstacleItems,
      emptyLabel: "No persistent local obstacles are known.",
    },
    {
      title: "Opportunities",
      items: opportunityItems,
      emptyLabel: "No clear opportunities have been revealed here yet.",
    },
    {
      title: "Nearby Signals",
      items: nearbyItems,
      emptyLabel: "No significant nearby signals are known.",
    },
    {
      title: "Recent Changes",
      items: recentItems,
      emptyLabel: "No notable recent changes have been recorded.",
    },
  ];

  return {
    sections,
    counts: {
      threats: threatItems.length,
      obstacles: obstacleItems.length,
      opportunities: opportunityItems.length,
      nearbySignals: nearbyItems.length,
      recentChanges: recentItems.length,
    },
    flags: {
      hasLockedPath: obstacleItems.some((x) => /locked|barrier|sealed|door/i.test(x)),
      hasHazard: threatItems.some((x) => /hazard|trap|unsafe|danger/i.test(x)),
      hasOpportunity: opportunityItems.length > 0,
      hasPatrolRisk:
        threatItems.some((x) => /enemy movement|awareness|alarm|probing/i.test(x)) ||
        nearbyItems.some((x) => /patrol|pressure|tension/i.test(x)),
      hasRecentShift: recentItems.length > 0,
    },
  };
}

// ------------------------------------------------------------
// Tactical recommendation
// ------------------------------------------------------------

type TacticalRecommendation = {
  priority: "opportunity" | "warning" | "blocker" | "guidance";
  headline: string;
  reason: string;
};

function deriveTacticalRecommendation(args: {
  currentPressure: number;
  floorAwareness: number;
  nearbyMaxPressure: number;
  memory: EnvironmentalMemory;
  roomTitle: string;
  evolution: { apex: string; condition: string; signals: string[] };
}): TacticalRecommendation {
  const { currentPressure, floorAwareness, nearbyMaxPressure, memory, roomTitle, evolution } = args;

  const highPressure = currentPressure >= 70;
  const highAwareness = floorAwareness >= 75;
  const midAwareness = floorAwareness >= 45;
  const nearbyHot = nearbyMaxPressure >= 60;

  if (memory.flags.hasLockedPath && (midAwareness || nearbyHot)) {
    return {
      priority: "blocker",
      headline: "Progress is constrained by a locked route.",
      reason: `A known path in ${roomTitle} remains sealed, and nearby pressure suggests delaying could invite a stronger response.`,
    };
  }

  if (memory.flags.hasHazard && highPressure) {
    return {
      priority: "warning",
      headline: "This room is becoming dangerous to linger in.",
      reason: `A known hazard is active in ${roomTitle}, and the current pressure level suggests the dungeon is already pushing back.`,
    };
  }

  if (highAwareness) {
    return {
      priority: "warning",
      headline: "Enemy attention is close to open alarm.",
      reason: `The floor is no longer quiet. Further noise or failed actions in ${roomTitle} are likely to draw a sharper response.`,
    };
  }

  if (memory.flags.hasOpportunity && !highPressure && floorAwareness < 50) {
    return {
      priority: "opportunity",
      headline: "This is a strong moment to exploit a known opportunity.",
      reason: `Something useful has already been identified in ${roomTitle}, and enemy attention has not yet fully hardened around it.`,
    };
  }

  if (memory.flags.hasPatrolRisk && floorAwareness < 75) {
    return {
      priority: "warning",
      headline: "Patrol activity makes caution more valuable than speed.",
      reason: `Signs of movement or rising tension suggest the dungeon is shifting around this room, even if it has not yet reached full alarm.`,
    };
  }

  if (nearbyHot) {
    return {
      priority: "guidance",
      headline: "A connected room is carrying the greater tension.",
      reason: `Pressure nearby is higher than it is here, which may shape the safest route or the next point of escalation.`,
    };
  }

  if (evolution.condition === "Warped" || evolution.condition === "Unstable") {
    return {
      priority: "guidance",
      headline: "The dungeon's broader condition is worsening.",
      reason: `Even if ${roomTitle} is momentarily stable, the surrounding system feels more hostile and may not stay quiet for long.`,
    };
  }

  if (memory.flags.hasRecentShift) {
    return {
      priority: "guidance",
      headline: "Recent changes matter more than the stillness suggests.",
      reason: `This room has shifted recently, so the last few discoveries or disturbances should guide the next move more than habit should.`,
    };
  }

  return {
    priority: "guidance",
    headline: "The best move is to stay deliberate.",
    reason: `${roomTitle} is not yet forcing an immediate answer, but the dungeon remains reactive to careless noise, delay, and pressure.`,
  };
}

// ------------------------------------------------------------
// Visual components
// ------------------------------------------------------------

function RingGauge({
  value,
  title,
  subtitle,
  footnote,
  pulse,
}: {
  value: number;
  title: string;
  subtitle?: string;
  footnote?: string;
  pulse?: "none" | "breathe" | "heartbeat";
}) {
  const v = clamp(value, 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  const pulseAnim =
    pulse === "heartbeat"
      ? "rg-heartbeat 1.25s ease-in-out infinite"
      : pulse === "breathe"
        ? "rg-breathe 2.4s ease-in-out infinite"
        : undefined;

  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
      <div style={{ width: 132, height: 132, position: "relative" }}>
        <svg viewBox="0 0 120 120" width="132" height="132" style={{ display: "block" }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="10"
            style={{ filter: "blur(0.6px)" }}
          />
          <g style={{ transformOrigin: "60px 60px", transform: "rotate(-90deg)" }}>
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="rgba(220,220,255,0.85)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              style={{ animation: pulseAnim }}
            />
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 10,
          }}
        >
          <div style={{ fontWeight: 900, letterSpacing: 0.6, fontSize: 13, opacity: 0.95 }}>
            {title.toUpperCase()}
          </div>
          {subtitle ? <div style={{ marginTop: 4, fontSize: 12, opacity: 0.82 }}>{subtitle}</div> : null}
          {footnote ? <div style={{ marginTop: 6, fontSize: 11, opacity: 0.65 }}>{footnote}</div> : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes rg-breathe {
          0% {
            stroke: rgba(220, 220, 255, 0.72);
            filter: drop-shadow(0 0 0px rgba(220, 220, 255, 0));
          }
          50% {
            stroke: rgba(240, 240, 255, 0.92);
            filter: drop-shadow(0 0 6px rgba(240, 240, 255, 0.18));
          }
          100% {
            stroke: rgba(220, 220, 255, 0.72);
            filter: drop-shadow(0 0 0px rgba(240, 240, 255, 0));
          }
        }

        @keyframes rg-heartbeat {
          0% {
            stroke: rgba(220, 220, 255, 0.75);
            filter: drop-shadow(0 0 0px rgba(240, 240, 255, 0));
          }
          18% {
            stroke: rgba(255, 245, 245, 0.92);
            filter: drop-shadow(0 0 8px rgba(255, 210, 210, 0.18));
          }
          34% {
            stroke: rgba(220, 220, 255, 0.78);
            filter: drop-shadow(0 0 2px rgba(240, 240, 255, 0.08));
          }
          52% {
            stroke: rgba(255, 245, 245, 0.92);
            filter: drop-shadow(0 0 10px rgba(255, 210, 210, 0.22));
          }
          100% {
            stroke: rgba(220, 220, 255, 0.75);
            filter: drop-shadow(0 0 0px rgba(240, 240, 255, 0));
          }
        }
      `}</style>
    </div>
  );
}

function MeterBar({
  value,
  ticks = [25, 50, 75, 100],
  label,
  sublabel,
}: {
  value: number;
  ticks?: number[];
  label: string;
  sublabel?: string;
}) {
  const v = clamp(value, 0, 100);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{v}</div>
      </div>

      <div
        style={{
          position: "relative",
          height: 12,
          borderRadius: 999,
          background: "rgba(255,255,255,0.10)",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            background: "rgba(220,220,255,0.75)",
          }}
        />
        {ticks.map((t) => (
          <div
            key={t}
            style={{
              position: "absolute",
              left: `${t}%`,
              top: -2,
              width: 1,
              height: 16,
              background: "rgba(255,255,255,0.18)",
            }}
          />
        ))}
      </div>

      {sublabel ? <div style={{ fontSize: 12, opacity: 0.78 }}>{sublabel}</div> : null}
    </div>
  );
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function DungeonPressurePanel({ turn, currentRoomId, events, parsedCommand }: Props) {
  const resolvedRoomId = useMemo(() => deriveCurrentRoomId(events, currentRoomId), [events, currentRoomId]);
  const currentFloorId = useMemo(() => deriveCurrentFloorId(events, resolvedRoomId), [events, resolvedRoomId]);

  const adjacency = useMemo(() => buildRoomAdjacency(events), [events]);
  const nearbyRooms = useMemo(
    () => inferNearbyRooms(resolvedRoomId, currentFloorId, adjacency),
    [resolvedRoomId, currentFloorId, adjacency]
  );

  const roomPressure = useMemo(() => deriveRoomPressure(events), [events]);
  const floorAwareness = useMemo(() => deriveFloorAwareness(events, roomPressure), [events, roomPressure]);

  const currentPressure = resolvedRoomId ? roomPressure.byRoom.get(resolvedRoomId) ?? 0 : 0;
  const currentAwareness = currentFloorId ? floorAwareness.byFloor.get(currentFloorId) ?? 0 : 0;

  const tier = tierForPressure(currentPressure);
  const awarenessStatus = statusForAwareness(currentAwareness);

  const nearbyMaxPressure = useMemo(() => {
    let m = 0;
    for (const roomId of nearbyRooms) {
      m = Math.max(m, roomPressure.byRoom.get(roomId) ?? 0);
    }
    return m;
  }, [nearbyRooms, roomPressure]);

  const nearbyTier = tierForPressure(nearbyMaxPressure);

  const roomTitle = useMemo(
    () =>
      deriveRoomTitle({
        events,
        currentRoomId: resolvedRoomId,
        currentPressure,
        floorAwareness: currentAwareness,
      }),
    [events, resolvedRoomId, currentPressure, currentAwareness]
  );

  const location = useMemo(() => {
    if (resolvedRoomId) {
      return {
        title: prettyRoomLabel(resolvedRoomId) ?? resolvedRoomId,
        subtitle: `${prettyFloorLabel(currentFloorId) ?? currentFloorId ?? "Unknown Floor"}${
          currentFloorId ? ` · ${currentFloorId}` : ""
        }`,
        canonical: true,
        reason: "Confirmed by recorded canon or current room state.",
      };
    }

    const rec = recommendLocation(parsedCommand);
    return {
      title: rec.label,
      subtitle: prettyFloorLabel(currentFloorId) ?? "Unknown Floor",
      canonical: false,
      reason: rec.reason,
    };
  }, [resolvedRoomId, currentFloorId, parsedCommand]);

  const environmentalMemory = useMemo(
    () =>
      deriveEnvironmentalMemory({
        events,
        currentRoomId: resolvedRoomId,
        nearbyRoomIds: nearbyRooms,
        currentPressure,
        floorAwareness: currentAwareness,
        nearbyMaxPressure,
      }),
    [events, resolvedRoomId, nearbyRooms, currentPressure, currentAwareness, nearbyMaxPressure]
  );

  const pressurePulse: "none" | "breathe" | "heartbeat" =
    currentPressure >= 70 ? "heartbeat" : currentPressure >= 25 ? "breathe" : "none";

  const evolution = useMemo(() => {
    return deriveDungeonEvolution({
      events: events as any,
      zoneId: resolvedRoomId ?? currentFloorId ?? "unknown-room",
      nearbyZoneIds: nearbyRooms,
    });
  }, [events, resolvedRoomId, currentFloorId, nearbyRooms]);

  const tacticalRecommendation = useMemo(
    () =>
      deriveTacticalRecommendation({
        currentPressure,
        floorAwareness: currentAwareness,
        nearbyMaxPressure,
        memory: environmentalMemory,
        roomTitle: location.title,
        evolution,
      }),
    [currentPressure, currentAwareness, nearbyMaxPressure, environmentalMemory, location.title, evolution]
  );

  const tacticalAccent: React.CSSProperties =
    tacticalRecommendation.priority === "blocker"
      ? {
          border: "1px solid rgba(255,196,118,0.20)",
          background: "linear-gradient(180deg, rgba(255,196,118,0.10), rgba(255,255,255,0.03))",
        }
      : tacticalRecommendation.priority === "warning"
        ? {
            border: "1px solid rgba(220,120,120,0.18)",
            background: "linear-gradient(180deg, rgba(220,120,120,0.10), rgba(255,255,255,0.03))",
          }
        : tacticalRecommendation.priority === "opportunity"
          ? {
              border: "1px solid rgba(120,190,140,0.18)",
              background: "linear-gradient(180deg, rgba(120,190,140,0.10), rgba(255,255,255,0.03))",
            }
          : {
              border: "1px solid rgba(120,170,255,0.18)",
              background: "linear-gradient(180deg, rgba(120,170,255,0.08), rgba(255,255,255,0.03))",
            };

  const hasMountedRef = useRef(false);
  const lastDangerSnapshotRef = useRef<{
    pressureTierRank: number;
    awarenessRank: number;
    nearbyTierRank: number;
    tacticalPriority: TacticalRecommendation["priority"];
    evolutionCondition: string;
  } | null>(null);

  useEffect(() => {
    const currentSnapshot = {
      pressureTierRank: pressureTierRank(tier.tier),
      awarenessRank: awarenessRank(awarenessStatus.label),
      nearbyTierRank: pressureTierRank(nearbyTier.tier),
      tacticalPriority: tacticalRecommendation.priority,
      evolutionCondition: evolution.condition,
    };

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      lastDangerSnapshotRef.current = currentSnapshot;
      return;
    }

    const prev = lastDangerSnapshotRef.current;
    lastDangerSnapshotRef.current = currentSnapshot;
    if (!prev) return;

    const pressureEscalated = currentSnapshot.pressureTierRank > prev.pressureTierRank;
    const awarenessEscalated = currentSnapshot.awarenessRank > prev.awarenessRank;
    const nearbyEscalated = currentSnapshot.nearbyTierRank > prev.nearbyTierRank;

    const tacticalEscalated =
      (prev.tacticalPriority === "guidance" &&
        (currentSnapshot.tacticalPriority === "warning" || currentSnapshot.tacticalPriority === "blocker")) ||
      (prev.tacticalPriority === "opportunity" &&
        (currentSnapshot.tacticalPriority === "warning" || currentSnapshot.tacticalPriority === "blocker")) ||
      (prev.tacticalPriority === "warning" && currentSnapshot.tacticalPriority === "blocker");

    const evolutionEscalated =
      prev.evolutionCondition !== currentSnapshot.evolutionCondition &&
      (currentSnapshot.evolutionCondition === "Unstable" || currentSnapshot.evolutionCondition === "Warped");

    if (pressureEscalated || awarenessEscalated || nearbyEscalated || tacticalEscalated || evolutionEscalated) {
      playDangerRumble();
    }
  }, [tier.tier, awarenessStatus.label, nearbyTier.tier, tacticalRecommendation.priority, evolution.condition]);

  const advisoryNotes = useMemo(() => {
    const notes: string[] = [];

    if (roomPressure.estimated) {
      notes.push("Room pressure is not yet canonical; it is being estimated from local events.");
    }
    if (floorAwareness.estimated) {
      notes.push("Floor awareness is estimated from room pressure because no explicit floor awareness events were detected.");
    }

    notes.push("Advisory only — Arbiter determines all outcomes.");
    return notes;
  }, [roomPressure.estimated, floorAwareness.estimated]);

  return (
    <section
      className="card"
      style={{
        borderLeft: "4px solid rgba(255,255,255,0.18)",
        background: "rgba(17,17,17,0.92)",
      }}
    >
      <h3 style={{ marginBottom: 10 }}>🧭 Dungeon State (Advisory)</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "160px 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        <RingGauge
          value={currentPressure}
          title={tier.tier}
          subtitle={`Room Pressure: ${Math.round(currentPressure)}`}
          footnote={`Range ${tier.rangeLabel}`}
          pulse={pressurePulse}
        />

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>📍 {location.title}</div>

            <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{location.subtitle}</div>

            <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{location.reason}</div>

            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              Read: {roomTitle}
              {resolvedRoomId ? ` · ${resolvedRoomId}` : ""}
            </div>

            {nearbyRooms.length ? (
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                Nearby rooms: {nearbyRooms.slice(0, 4).map((roomId) => prettyRoomLabel(roomId) ?? roomId).join(", ")}
              </div>
            ) : null}
          </div>

          <div
            style={{
              ...tacticalAccent,
              padding: 12,
              borderRadius: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.66 }}>
              Tactical Read
            </div>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{tacticalRecommendation.headline}</div>
            <div style={{ fontSize: 12, opacity: 0.82, lineHeight: 1.55 }}>{tacticalRecommendation.reason}</div>
          </div>

          <MeterBar
            value={currentAwareness}
            label={`Floor Attention — ${awarenessStatus.label}`}
            sublabel={awarenessStatus.nextHint}
          />

          <MeterBar
            value={nearbyMaxPressure}
            label={`Nearby Tension — ${nearbyTier.tier}`}
            sublabel={`Max connected-room pressure: ${Math.round(nearbyMaxPressure)}${roomPressure.estimated ? " (derived)" : ""}`}
          />

          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900 }}>
                🐉 Apex Presence: <span style={{ opacity: 0.92 }}>{evolution.apex}</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.78 }}>
                Condition: <strong>{evolution.condition}</strong>
              </div>
            </div>

            {evolution.signals.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {evolution.signals.slice(0, 4).map((s, i) => (
                  <li key={i} style={{ fontSize: 12, opacity: 0.86, marginBottom: 4 }}>
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.72 }}>No significant dungeon signals detected yet.</div>
            )}

            <div style={{ fontSize: 11, opacity: 0.62 }}>
              Advisory pacing only — this does not spawn enemies or force encounters.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, opacity: 0.78 }}>
            <span>
              <strong>Turn:</strong> {turn}
            </span>
            <span>
              <strong>Tier:</strong> {tier.tier}
            </span>
            <span>
              <strong>Awareness:</strong> {awarenessStatus.label}
            </span>
            {currentFloorId ? (
              <span>
                <strong>Floor:</strong> {prettyFloorLabel(currentFloorId) ?? currentFloorId}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <hr style={{ opacity: 0.2, margin: "14px 0" }} />

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>🧱 Environmental Memory</div>

        {environmentalMemory.sections.map((section) => (
          <div
            key={section.title}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.92, marginBottom: 6 }}>{section.title}</div>

            {section.items.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.62 }}>{section.emptyLabel ?? "No notable state detected."}</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {section.items.map((n, i) => (
                  <li key={`${section.title}-${i}`} style={{ fontSize: 12, opacity: 0.86, marginBottom: 4 }}>
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div style={{ display: "grid", gap: 4, marginTop: 2 }}>
          {advisoryNotes.map((n, i) => (
            <div key={i} style={{ fontSize: 11, opacity: 0.62 }}>
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
