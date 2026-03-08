"use client";

// ------------------------------------------------------------
// DungeonPressurePanel.tsx
// ------------------------------------------------------------
// Advisory-only dungeon pressure + zone inference + awareness meter.
// NO authority, NO mutation, NO automation.
//
// Purpose:
// - Make zone pressure + awareness visible (D&D-friendly)
// - Show nearby heat (adjacent zones)
// - Recommend (never assert) current location/zone
// - Preserve Arbiter authority
//
// Upgrade:
// - Integrates DungeonEvolution (dragon/apex pacing + dungeon condition) as
//   a READ-ONLY, deterministic layer derived from canon events.
// - Environmental Memory now derives from discovery + pressure + patrol +
//   outcome signals instead of only narrow OUTCOME.world fields.
// - Adds advisory zone naming so player-facing location language feels more
//   atmospheric while preserving the mechanical zone id.
// - Adds a tactical recommendation layer that interprets current zone state
//   into a single advisory read without automating play.
// ------------------------------------------------------------

import React, { useMemo } from "react";
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

  // Canonical room (if your canon has it). This panel will respect it as a label,
  // but zone mechanics are derived independently from movement/map.
  currentRoomId?: string;

  events: readonly SessionEvent[];

  // Optional, advisory-only
  parsedCommand?: any;
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

type ZoneCoord = { zx: number; zy: number };
type ZoneId = string;
type XY = { x: number; y: number };

const ZONE_SIZE_TILES = 4;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNum(x: any): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function safeStr(x: any): string | null {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function parseZoneId(zoneId: string): ZoneCoord | null {
  const m = /^(\-?\d+),(\-?\d+)$/.exec(zoneId.trim());
  if (!m) return null;
  const zx = Number(m[1]);
  const zy = Number(m[2]);
  if (!Number.isFinite(zx) || !Number.isFinite(zy)) return null;
  return { zx, zy };
}

function makeZoneId(zx: number, zy: number): ZoneId {
  return `${zx},${zy}`;
}

function zoneFromTileXY(x: number, y: number, zoneSize = ZONE_SIZE_TILES): ZoneId {
  const zx = Math.floor(x / zoneSize);
  const zy = Math.floor(y / zoneSize);
  return makeZoneId(zx, zy);
}

function adjacentZones(zoneId: ZoneId): ZoneId[] {
  const c = parseZoneId(zoneId);
  if (!c) return [];
  const { zx, zy } = c;
  return [
    makeZoneId(zx, zy - 1), // N
    makeZoneId(zx, zy + 1), // S
    makeZoneId(zx - 1, zy), // W
    makeZoneId(zx + 1, zy), // E
  ];
}

function formatDir(dx: number, dy: number): string {
  if (dx === 0 && dy < 0) return "north";
  if (dx === 0 && dy > 0) return "south";
  if (dx < 0 && dy === 0) return "west";
  if (dx > 0 && dy === 0) return "east";
  if (dx < 0 && dy < 0) return "northwest";
  if (dx > 0 && dy < 0) return "northeast";
  if (dx < 0 && dy > 0) return "southwest";
  if (dx > 0 && dy > 0) return "southeast";
  return "nearby";
}

function relativeDirection(fromZoneId: ZoneId, targetZoneId: ZoneId): string {
  const a = parseZoneId(fromZoneId);
  const b = parseZoneId(targetZoneId);
  if (!a || !b) return "nearby";

  const dx = b.zx - a.zx;
  const dy = b.zy - a.zy;
  return formatDir(dx, dy);
}

function tileToZoneIdFromPayload(payload: any): ZoneId | null {
  const zoneId = safeStr(payload?.zoneId);
  if (zoneId) return zoneId;

  const x =
    safeNum(payload?.x) ??
    safeNum(payload?.at?.x) ??
    safeNum(payload?.tile?.x) ??
    safeNum(payload?.to?.x);
  const y =
    safeNum(payload?.y) ??
    safeNum(payload?.at?.y) ??
    safeNum(payload?.tile?.y) ??
    safeNum(payload?.to?.y);

  if (x === null || y === null) return null;
  return zoneFromTileXY(x, y, ZONE_SIZE_TILES);
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

function statusForAwareness(a: number): {
  label: "Calm" | "Whispers" | "Search" | "Reinforcements" | "Alarm";
  nextHint: string;
} {
  const x = clamp(Math.round(a), 0, 100);
  if (x < 25) return { label: "Calm", nextHint: "Noise and failure will draw attention." };
  if (x < 50) return { label: "Whispers", nextHint: "Minor signs of movement nearby." };
  if (x < 75) return { label: "Search", nextHint: "Patrols begin probing the area." };
  if (x < 100) return { label: "Reinforcements", nextHint: "A response is likely if disturbances continue." };
  return { label: "Alarm", nextHint: "The dungeon responds." };
}

// ------------------------------------------------------------
// Canon-derived position + zone inference
// ------------------------------------------------------------

function derivePlayerPosition(events: readonly SessionEvent[]): XY | null {
  let last: XY | null = null;
  for (const e of events as any[]) {
    if (e?.type !== "PLAYER_MOVED") continue;
    const to = e?.payload?.to;
    const x = safeNum(to?.x);
    const y = safeNum(to?.y);
    if (x === null || y === null) continue;
    last = { x, y };
  }
  return last;
}

// ------------------------------------------------------------
// Pressure + awareness derivation (preferred: canonical events)
// ------------------------------------------------------------

type ZonePressureState = {
  byZone: Map<ZoneId, number>;
  estimated: boolean;
};

function deriveZonePressure(events: readonly SessionEvent[]): ZonePressureState {
  const byZone = new Map<ZoneId, number>();
  let sawCanonical = false;

  for (const e of events as any[]) {
    if (e?.type !== "ZONE_PRESSURE_CHANGED") continue;
    const zoneId = typeof e?.payload?.zoneId === "string" ? e.payload.zoneId : null;
    const delta = safeNum(e?.payload?.delta);
    if (!zoneId || delta === null) continue;

    sawCanonical = true;
    const prev = byZone.get(zoneId) ?? 0;
    byZone.set(zoneId, clamp(prev + delta, 0, 100));
  }

  return { byZone, estimated: !sawCanonical };
}

type ZoneAwarenessState = {
  byZone: Map<ZoneId, number>;
  estimated: boolean;
};

function deriveZoneAwareness(events: readonly SessionEvent[], pressure: ZonePressureState): ZoneAwarenessState {
  const byZone = new Map<ZoneId, number>();
  let sawCanonical = false;

  for (const e of events as any[]) {
    if (e?.type === "ZONE_AWARENESS_CHANGED") {
      const zoneId = typeof e?.payload?.zoneId === "string" ? e.payload.zoneId : null;
      const delta = safeNum(e?.payload?.delta);
      if (!zoneId || delta === null) continue;

      sawCanonical = true;
      const prev = byZone.get(zoneId) ?? 0;
      byZone.set(zoneId, clamp(prev + delta, 0, 100));
      continue;
    }

    if (e?.type === "ZONE_RESPONSE_TRIGGERED") {
      const zoneId = typeof e?.payload?.zoneId === "string" ? e.payload.zoneId : null;
      if (!zoneId) continue;

      sawCanonical = true;
      const resetTo = safeNum(e?.payload?.resetTo);
      byZone.set(zoneId, clamp(resetTo ?? 40, 0, 100));
      continue;
    }
  }

  if (sawCanonical) return { byZone, estimated: false };

  const estimatedMap = new Map<ZoneId, number>();
  for (const [zoneId, p] of pressure.byZone.entries()) {
    estimatedMap.set(zoneId, clamp(Math.round(p * 1.15), 0, 100));
  }
  return { byZone: estimatedMap, estimated: true };
}

// ------------------------------------------------------------
// Advisory location inference (only used if no movement & no canon)
// ------------------------------------------------------------

function recommendLocation(parsedCommand?: any): { label: string; reason: string } {
  const text = parsedCommand?.rawInput?.toLowerCase?.() ?? "";

  if (text.includes("open door") || text.includes("enter") || text.includes("hallway") || text.includes("passage")) {
    return {
      label: "Stone Hallway",
      reason: "Door/entry language implies movement into an interior passage.",
    };
  }

  return {
    label: "Dungeon Entrance",
    reason: "No movement signal detected; default staging location.",
  };
}

// ------------------------------------------------------------
// Advisory zone naming
// ------------------------------------------------------------

function deriveZoneTitle(args: {
  events: readonly SessionEvent[];
  currentZoneId: ZoneId;
  currentPressure: number;
  currentAwareness: number;
}): string {
  const { events, currentZoneId, currentPressure, currentAwareness } = args;

  let hasDoor = false;
  let hasLock = false;
  let hasHazard = false;
  let hasCache = false;
  let hasAltar = false;
  let hasStairs = false;
  let hasPatrol = false;
  let hasCombat = false;

  for (const e of events as any[]) {
    const zoneId =
      safeStr(e?.payload?.zoneId) ??
      tileToZoneIdFromPayload(e?.payload) ??
      (e?.type === "PLAYER_MOVED"
        ? (() => {
            const x = safeNum(e?.payload?.to?.x);
            const y = safeNum(e?.payload?.to?.y);
            return x !== null && y !== null ? zoneFromTileXY(x, y, ZONE_SIZE_TILES) : null;
          })()
        : null);

    if (zoneId !== currentZoneId) continue;

    switch (e?.type) {
      case "DOOR_DISCOVERED":
        hasDoor = true;
        break;
      case "DOOR_LOCKED":
        hasLock = true;
        break;
      case "HAZARD_REVEALED":
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
        if (!world) break;
        const outcomeZoneId =
          safeStr(world?.zoneId) ??
          tileToZoneIdFromPayload(world) ??
          tileToZoneIdFromPayload(world?.at);
        if (outcomeZoneId !== currentZoneId) break;
        if (world?.lock) hasLock = true;
        if (world?.trap) hasHazard = true;
        break;
      }
      default:
        break;
    }
  }

  if (hasAltar && hasStairs) return "Shrine Descent";
  if (hasAltar) return "Shrine Approach";
  if (hasStairs) return "Descending Passage";
  if (hasCache) return "Forgotten Cache";
  if (hasLock) return "The Locked Passage";
  if (hasHazard && hasCombat) return "Blooded Corridor";
  if (hasHazard) return "Danger Corridor";
  if (hasPatrol && currentAwareness >= 45) return "Hunting Hall";
  if (hasPatrol) return "Watch Corridor";
  if (hasDoor) return "Stone Doorway";
  if (hasCombat) return "Clash Site";
  if (currentPressure >= 70) return "Crisis Hall";
  if (currentAwareness >= 75) return "Alarmed Passage";
  if (currentPressure >= 40 || currentAwareness >= 45) return "Uneasy Hall";
  return "Silent Hall";
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
  currentZoneId: ZoneId;
  adjacentZoneIds: ZoneId[];
  currentRoomId?: string;
  currentPressure: number;
  currentAwareness: number;
  nearbyMaxPressure: number;
}): EnvironmentalMemory {
  const {
    events,
    currentZoneId,
    adjacentZoneIds,
    currentPressure,
    currentAwareness,
    nearbyMaxPressure,
  } = args;

  const localThreats = new Map<string, string>();
  const localObstacles = new Map<string, string>();
  const localOpportunities = new Map<string, string>();
  const nearbySignals = new Map<string, string>();
  const recentChanges = new Map<string, string>();

  const adjacentSet = new Set(adjacentZoneIds);

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
    const zoneId =
      safeStr(e?.payload?.zoneId) ??
      tileToZoneIdFromPayload(e?.payload) ??
      (e?.type === "PLAYER_MOVED"
        ? (() => {
            const x = safeNum(e?.payload?.to?.x);
            const y = safeNum(e?.payload?.to?.y);
            return x !== null && y !== null ? zoneFromTileXY(x, y, ZONE_SIZE_TILES) : null;
          })()
        : null);

    const isLocal = zoneId === currentZoneId;
    const isNearby = !!zoneId && adjacentSet.has(zoneId);

    switch (e?.type) {
      case "DOOR_DISCOVERED": {
        if (isLocal) {
          localDoorCount += 1;
          pushUnique(localObstacles, "door-discovered", "A discovered door offers a possible route forward.");
        } else if (isNearby && zoneId) {
          pushUnique(
            nearbySignals,
            `door-discovered-${zoneId}`,
            `A newly found passage opens ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("A hidden or obscured doorway was discovered.");
        break;
      }

      case "DOOR_LOCKED": {
        if (isLocal) {
          localLockedDoorCount += 1;
          pushUnique(localObstacles, "door-locked", "A locked passage is preventing immediate progress.");
        } else if (isNearby && zoneId) {
          nearbyLockedDoors += 1;
          pushUnique(
            nearbySignals,
            `door-locked-${zoneId}`,
            `A locked route seals the way ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("Iron locks were found securing a door.");
        break;
      }

      case "HAZARD_REVEALED": {
        if (isLocal) {
          localHazardCount += 1;
          pushUnique(localThreats, "hazard-local", "A revealed hazard makes this zone unsafe.");
        } else if (isNearby && zoneId) {
          nearbyHazards += 1;
          pushUnique(
            nearbySignals,
            `hazard-${zoneId}`,
            `Dangerous terrain or a trap is known ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("A hidden danger was revealed.");
        break;
      }

      case "CACHE_REVEALED": {
        if (isLocal) {
          localCacheCount += 1;
          pushUnique(localOpportunities, "cache-local", "A discovered cache may reward a careful return.");
        } else if (isNearby && zoneId) {
          pushUnique(
            nearbySignals,
            `cache-${zoneId}`,
            `Valuable supplies may be reachable ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("A useful cache was identified.");
        break;
      }

      case "ALTAR_REVEALED": {
        if (isLocal) {
          localAltarCount += 1;
          pushUnique(localOpportunities, "altar-local", "An altar or sacred point may offer a ritual advantage.");
        } else if (isNearby && zoneId) {
          pushUnique(
            nearbySignals,
            `altar-${zoneId}`,
            `A place of ritual significance lies ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("A ritual site was brought to light.");
        break;
      }

      case "STAIRS_REVEALED": {
        if (isLocal) {
          localStairsCount += 1;
          pushUnique(localOpportunities, "stairs-local", "A stairway offers a deeper route through the dungeon.");
        } else if (isNearby && zoneId) {
          pushUnique(
            nearbySignals,
            `stairs-${zoneId}`,
            `A route deeper into the dungeon lies ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("A transition point deeper into the dungeon was revealed.");
        break;
      }

      case "PATROL_SIGNS_REVEALED": {
        if (isLocal) {
          localPatrolSignsCount += 1;
          pushUnique(localThreats, "patrol-local", "Enemy movement has been detected nearby.");
        } else if (isNearby && zoneId) {
          nearbyPatrolSigns += 1;
          pushUnique(
            nearbySignals,
            `patrol-${zoneId}`,
            `Patrol signs suggest enemy movement ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("Signs of patrol traffic were discovered.");
        break;
      }

      case "COMBAT_STARTED": {
        if (isLocal) {
          localCombatStarted += 1;
          pushUnique(localThreats, "combat-started", "Violence has already broken out in this zone.");
        } else if (isNearby && zoneId) {
          pushUnique(
            nearbySignals,
            `combat-started-${zoneId}`,
            `Conflict has flared ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("Combat erupted nearby.");
        break;
      }

      case "COMBAT_ENDED": {
        if (isLocal) {
          localCombatEnded += 1;
          pushUnique(localThreats, "combat-ended", "The aftermath of recent combat lingers here.");
        } else if (isNearby && zoneId) {
          pushUnique(
            nearbySignals,
            `combat-ended-${zoneId}`,
            `The signs of recent violence lie ${relativeDirection(currentZoneId, zoneId)}.`
          );
        }
        recentEventLines.push("A clash recently ended.");
        break;
      }

      case "ZONE_PRESSURE_CHANGED": {
        const eventZoneId = safeStr(e?.payload?.zoneId);
        const delta = safeNum(e?.payload?.delta);
        if (eventZoneId === currentZoneId && delta !== null) {
          latestPressureDelta = delta;
        }
        break;
      }

      case "ZONE_AWARENESS_CHANGED": {
        const eventZoneId = safeStr(e?.payload?.zoneId);
        const delta = safeNum(e?.payload?.delta);
        if (eventZoneId === currentZoneId && delta !== null) {
          latestAwarenessDelta = delta;
        }
        break;
      }

      case "ZONE_RESPONSE_TRIGGERED": {
        const eventZoneId = safeStr(e?.payload?.zoneId);
        if (eventZoneId === currentZoneId) {
          pushUnique(localThreats, "zone-response", "The zone has already mounted a response to disturbance.");
          recentEventLines.push("The dungeon responded to the party's activity.");
        }
        break;
      }

      case "OUTCOME": {
        const world = e?.payload?.world;
        if (!world) break;

        const outcomeZoneId =
          safeStr(world?.zoneId) ??
          tileToZoneIdFromPayload(world) ??
          tileToZoneIdFromPayload(world?.at) ??
          zoneId;

        const outcomeIsLocal = outcomeZoneId === currentZoneId;
        const outcomeIsNearby = !!outcomeZoneId && adjacentSet.has(outcomeZoneId);

        if (world?.lock) {
          const state = safeStr(world.lock.state) ?? "changed";
          const keyId = safeStr(world.lock.keyId);
          const line = `A door here is ${state}${keyId ? ` (key: ${keyId})` : ""}.`;

          if (outcomeIsLocal) {
            pushUnique(localObstacles, `outcome-lock-${state}-${keyId ?? "none"}`, line);
          } else if (outcomeIsNearby && outcomeZoneId) {
            pushUnique(
              nearbySignals,
              `outcome-lock-${outcomeZoneId}-${state}-${keyId ?? "none"}`,
              `A manipulated door lies ${relativeDirection(currentZoneId, outcomeZoneId)}.`
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
          } else if (outcomeIsNearby && outcomeZoneId) {
            pushUnique(
              nearbySignals,
              `outcome-trap-${outcomeZoneId}-${state}`,
              `Trap activity is known ${relativeDirection(currentZoneId, outcomeZoneId)}.`
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
    pushUnique(localThreats, "hazard-count", `Multiple hazards have been identified in this zone (${localHazardCount}).`);
  }

  if (localLockedDoorCount > 1) {
    pushUnique(localObstacles, "locked-door-count", `More than one locked barrier is slowing progress here (${localLockedDoorCount}).`);
  }

  if (localDoorCount > 1 && localLockedDoorCount === 0) {
    pushUnique(localObstacles, "door-count", `Several potential routes have been revealed in this zone (${localDoorCount}).`);
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
    pushUnique(localThreats, "combat-ongoing-memory", "This zone has already drawn blood and may not settle quickly.");
  }

  if (localCombatEnded > 0) {
    pushUnique(localThreats, "combat-aftermath", "The aftermath of violence may still attract attention.");
  }

  if (currentPressure >= 70) {
    pushUnique(localThreats, "pressure-high", "Pressure in this zone is severe; the dungeon is actively pushing back.");
  } else if (currentPressure >= 40) {
    pushUnique(localThreats, "pressure-rising", "Pressure is building in this zone.");
  }

  if (currentAwareness >= 75) {
    pushUnique(localThreats, "awareness-high", "The area is close to open alarm.");
  } else if (currentAwareness >= 45) {
    pushUnique(localThreats, "awareness-mid", "Enemy awareness is elevated and probing behavior is likely.");
  }

  if (nearbyMaxPressure >= 70) {
    pushUnique(nearbySignals, "nearby-pressure-high", "A neighboring zone is under extreme pressure.");
  } else if (nearbyMaxPressure >= 40) {
    pushUnique(nearbySignals, "nearby-pressure-mid", "Tension is rising in an adjacent zone.");
  }

  if (nearbyPatrolSigns > 1) {
    pushUnique(nearbySignals, "nearby-patrol-count", "Multiple adjacent patrol indicators suggest the dungeon is moving pieces around.");
  }

  if (nearbyHazards > 1) {
    pushUnique(nearbySignals, "nearby-hazard-count", "Several dangers have been identified in neighboring zones.");
  }

  if (nearbyLockedDoors > 1) {
    pushUnique(nearbySignals, "nearby-locked-count", "Adjacent routes appear heavily controlled or sealed.");
  }

  if (latestPressureDelta !== null) {
    if (latestPressureDelta > 0) {
      pushUnique(recentChanges, "pressure-up", `Zone pressure recently increased by ${latestPressureDelta}.`);
    } else if (latestPressureDelta < 0) {
      pushUnique(recentChanges, "pressure-down", `Zone pressure recently eased by ${Math.abs(latestPressureDelta)}.`);
    }
  }

  if (latestAwarenessDelta !== null) {
    if (latestAwarenessDelta > 0) {
      pushUnique(recentChanges, "awareness-up", `Enemy awareness recently rose by ${latestAwarenessDelta}.`);
    } else if (latestAwarenessDelta < 0) {
      pushUnique(recentChanges, "awareness-down", `Enemy awareness recently fell by ${Math.abs(latestAwarenessDelta)}.`);
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
      hasPatrolRisk: threatItems.some((x) => /enemy movement|awareness|alarm|probing/i.test(x)) || nearbyItems.some((x) => /patrol|pressure|tension/i.test(x)),
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
  currentAwareness: number;
  nearbyMaxPressure: number;
  memory: EnvironmentalMemory;
  zoneTitle: string;
  evolution: { apex: string; condition: string; signals: string[] };
}): TacticalRecommendation {
  const { currentPressure, currentAwareness, nearbyMaxPressure, memory, zoneTitle, evolution } = args;

  const highPressure = currentPressure >= 70;
  const highAwareness = currentAwareness >= 75;
  const midAwareness = currentAwareness >= 45;
  const nearbyHot = nearbyMaxPressure >= 60;

  if (memory.flags.hasLockedPath && (midAwareness || nearbyHot)) {
    return {
      priority: "blocker",
      headline: "Progress is constrained by a locked route.",
      reason: `A known path in ${zoneTitle} remains sealed, and nearby pressure suggests delaying could invite a stronger response.`,
    };
  }

  if (memory.flags.hasHazard && highPressure) {
    return {
      priority: "warning",
      headline: "This zone is becoming dangerous to linger in.",
      reason: `A known hazard is active in ${zoneTitle}, and the current pressure level suggests the dungeon is already pushing back.`,
    };
  }

  if (highAwareness) {
    return {
      priority: "warning",
      headline: "Enemy attention is close to open alarm.",
      reason: `The area is no longer quiet. Further noise or failed actions in ${zoneTitle} are likely to draw a sharper response.`,
    };
  }

  if (memory.flags.hasOpportunity && !highPressure && currentAwareness < 50) {
    return {
      priority: "opportunity",
      headline: "This is a strong moment to exploit a known opportunity.",
      reason: `Something useful has already been identified in ${zoneTitle}, and enemy attention has not yet fully hardened around it.`,
    };
  }

  if (memory.flags.hasPatrolRisk && currentAwareness < 75) {
    return {
      priority: "warning",
      headline: "Patrol activity makes caution more valuable than speed.",
      reason: `Signs of movement or rising tension suggest the dungeon is shifting around this zone, even if it has not yet reached full alarm.`,
    };
  }

  if (nearbyHot) {
    return {
      priority: "guidance",
      headline: "A neighboring zone is carrying the greater tension.",
      reason: `Pressure nearby is higher than it is here, which may shape the safest route or the next point of escalation.`,
    };
  }

  if (evolution.condition === "Dire" || evolution.condition === "Hostile") {
    return {
      priority: "guidance",
      headline: "The dungeon's broader condition is worsening.",
      reason: `Even if ${zoneTitle} is momentarily stable, the surrounding system feels more hostile and may not stay quiet for long.`,
    };
  }

  if (memory.flags.hasRecentShift) {
    return {
      priority: "guidance",
      headline: "Recent changes matter more than the stillness suggests.",
      reason: `This zone has shifted recently, so the last few discoveries or disturbances should guide the next move more than habit should.`,
    };
  }

  return {
    priority: "guidance",
    headline: "The best move is to stay deliberate.",
    reason: `${zoneTitle} is not yet forcing an immediate answer, but the dungeon remains reactive to careless noise, delay, and pressure.`,
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
  const playerPos = useMemo(() => derivePlayerPosition(events), [events]);

  const zoneId = useMemo<ZoneId>(() => {
    if (playerPos) return zoneFromTileXY(playerPos.x, playerPos.y, ZONE_SIZE_TILES);
    return makeZoneId(0, 0);
  }, [playerPos]);

  const adjacent = useMemo(() => adjacentZones(zoneId), [zoneId]);

  const zonePressure = useMemo(() => deriveZonePressure(events), [events]);
  const zoneAwareness = useMemo(() => deriveZoneAwareness(events, zonePressure), [events, zonePressure]);

  const currentPressure = zonePressure.byZone.get(zoneId) ?? 0;
  const currentAwareness = zoneAwareness.byZone.get(zoneId) ?? 0;

  const tier = tierForPressure(currentPressure);
  const awarenessStatus = statusForAwareness(currentAwareness);

  const nearbyMaxPressure = useMemo(() => {
    let m = 0;
    for (const z of adjacent) m = Math.max(m, zonePressure.byZone.get(z) ?? 0);
    return m;
  }, [adjacent, zonePressure]);

  const nearbyTier = tierForPressure(nearbyMaxPressure);

  const zoneTitle = useMemo(
    () =>
      deriveZoneTitle({
        events,
        currentZoneId: zoneId,
        currentPressure,
        currentAwareness,
      }),
    [events, zoneId, currentPressure, currentAwareness]
  );

  const location = useMemo(() => {
    if (currentRoomId) {
      return {
        title: currentRoomId,
        subtitle: `Zone ${zoneId}`,
        canonical: true,
        reason: "Confirmed by recorded canon.",
      };
    }

    if (playerPos) {
      return {
        title: zoneTitle,
        subtitle: `Zone ${zoneId}`,
        canonical: false,
        reason: "Derived from player movement and local dungeon signals.",
      };
    }

    const rec = recommendLocation(parsedCommand);
    return {
      title: rec.label,
      subtitle: `Zone ${zoneId}`,
      canonical: false,
      reason: rec.reason,
    };
  }, [currentRoomId, parsedCommand, playerPos, zoneId, zoneTitle]);

  const environmentalMemory = useMemo(
    () =>
      deriveEnvironmentalMemory({
        events,
        currentZoneId: zoneId,
        adjacentZoneIds: adjacent,
        currentRoomId: location.canonical ? location.title : undefined,
        currentPressure,
        currentAwareness,
        nearbyMaxPressure,
      }),
    [events, zoneId, adjacent, location, currentPressure, currentAwareness, nearbyMaxPressure]
  );

  const pressurePulse: "none" | "breathe" | "heartbeat" =
    currentPressure >= 70 ? "heartbeat" : currentPressure >= 25 ? "breathe" : "none";

  const evolution = useMemo(() => {
    return deriveDungeonEvolution({
      events: events as any,
      zoneId,
      nearbyZoneIds: adjacent,
    });
  }, [events, zoneId, adjacent]);

  const tacticalRecommendation = useMemo(
    () =>
      deriveTacticalRecommendation({
        currentPressure,
        currentAwareness,
        nearbyMaxPressure,
        memory: environmentalMemory,
        zoneTitle: location.title,
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

  const advisoryNotes = useMemo(() => {
    const notes: string[] = [];

    if (zonePressure.estimated) {
      notes.push("Pressure is not yet canonical (no ZONE_PRESSURE_CHANGED events detected).");
    }
    if (zoneAwareness.estimated) {
      notes.push("Awareness is estimated from pressure (no explicit awareness events detected).");
    }

    notes.push("Advisory only — Arbiter determines all outcomes.");
    return notes;
  }, [zonePressure.estimated, zoneAwareness.estimated]);

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
          subtitle={`Zone Pressure: ${Math.round(currentPressure)}`}
          footnote={`Range ${tier.rangeLabel}`}
          pulse={pressurePulse}
        />

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              📍 {location.title}
            </div>

            <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
              {location.subtitle}
            </div>

            <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{location.reason}</div>

            {playerPos ? (
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                Tile: ({playerPos.x}, {playerPos.y})
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
            label={`Enemy Attention — ${awarenessStatus.label}`}
            sublabel={awarenessStatus.nextHint}
          />

          <MeterBar
            value={nearbyMaxPressure}
            label={`Tension Nearby — ${nearbyTier.tier}`}
            sublabel={`Max adjacent zone pressure: ${Math.round(nearbyMaxPressure)} (derived)`}
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
