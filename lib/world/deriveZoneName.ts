// ------------------------------------------------------------
// deriveZoneName
// ------------------------------------------------------------
// Pure derived naming layer for dungeon zones.
// Converts mechanical zone coordinates into atmospheric names
// based on canon discovery + pressure signals.
//
// IMPORTANT:
// - Does not mutate world state
// - Does not store names
// - Fully derived from SessionState.events
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";

type XY = { x: number; y: number };

function eventInZone(e: SessionEvent, zx: number, zy: number) {
  const p: any = e.payload ?? {};

  const pos: XY | undefined =
    p?.position ??
    p?.at ??
    p?.tile ??
    p?.from ??
    p?.to ??
    undefined;

  if (!pos) return false;

  const ex = Math.floor(pos.x / 5);
  const ey = Math.floor(pos.y / 5);

  return ex === zx && ey === zy;
}

export function deriveZoneName(
  events: readonly SessionEvent[],
  zx: number,
  zy: number
) {
  const zoneEvents = events.filter((e) => eventInZone(e, zx, zy));

  let hasDoor = false;
  let hasLock = false;
  let hasHazard = false;
  let hasCache = false;
  let hasAltar = false;
  let hasStairs = false;
  let hasPatrol = false;

  zoneEvents.forEach((e) => {
    switch (e.type) {
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
    }
  });

  // priority naming logic

  if (hasAltar) return "Shrine Approach";
  if (hasStairs) return "Descending Passage";
  if (hasCache) return "Forgotten Cache";
  if (hasLock) return "The Locked Passage";
  if (hasDoor) return "Stone Doorway";
  if (hasHazard) return "Danger Corridor";
  if (hasPatrol) return "Hunter's Hall";

  return "Silent Hall";
}
