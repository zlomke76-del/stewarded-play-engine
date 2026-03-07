// lib/world/ExplorationDiscovery.ts

// ------------------------------------------------------------
// ExplorationDiscovery
// ------------------------------------------------------------
// Deterministic dungeon feature discovery for exploration flow.
//
// Purpose:
// - Keep app/demo/page.tsx focused on orchestration.
// - Derive discoverable dungeon truths from tile / zone coordinates.
// - Emit canon event drafts only when a feature is newly discovered.
// - Preserve replay stability: same tile -> same derived feature.
//
// Intended usage:
//   const drafts = deriveDiscoveryEvents({
//     events: next.events,
//     movedTo: to,
//     revealedTiles,
//     mapW: MAP_W,
//     mapH: MAP_H,
//   });
//
//   for (const draft of drafts) {
//     next = recordEvent(next, {
//       id: crypto.randomUUID(),
//       timestamp: Date.now(),
//       actor: "arbiter",
//       type: draft.type,
//       payload: draft.payload as any,
//     });
//   }
//
// Notes:
// - This module does NOT mutate state.
// - This module does NOT create IDs/timestamps.
// - This module only returns event drafts.
// ------------------------------------------------------------

export type XY = { x: number; y: number };

export type DiscoveryEventDraft = {
  type:
    | "DOOR_DISCOVERED"
    | "DOOR_LOCKED"
    | "TRAP_REVEALED"
    | "CACHE_REVEALED"
    | "HAZARD_REVEALED"
    | "PATROL_SIGNS_REVEALED";
  payload: Record<string, unknown>;
};

export type DiscoveryInput = {
  events: readonly any[];
  movedTo?: XY | null;
  revealedTiles: XY[];
  mapW: number;
  mapH: number;
};

type DerivedFeature =
  | {
      kind: "door";
      locked: boolean;
      note?: string;
    }
  | {
      kind: "trap";
      trapType: "pressure_plate" | "wire" | "spike";
      note?: string;
    }
  | {
      kind: "cache";
      cacheType: "supplies" | "coin" | "relic";
      note?: string;
    }
  | {
      kind: "hazard";
      hazardType: "cracked_floor" | "toxic_mist" | "unstable_stone";
      note?: string;
    }
  | {
      kind: "patrol_signs";
      intensity: "faint" | "fresh";
      note?: string;
    };

const ZONE_SIZE_TILES = 4;

function clampInt(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function keyXY(p: XY) {
  return `${p.x},${p.y}`;
}

function zoneIdFromTileXY(x: number, y: number) {
  const zx = Math.floor(x / ZONE_SIZE_TILES);
  const zy = Math.floor(y / ZONE_SIZE_TILES);
  return `${zx},${zy}`;
}

function uniqueTiles(list: XY[]) {
  const seen = new Set<string>();
  const out: XY[] = [];

  for (const tile of list) {
    if (!tile || !Number.isFinite(tile.x) || !Number.isFinite(tile.y)) continue;
    const k = keyXY(tile);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ x: tile.x, y: tile.y });
  }

  return out;
}

function stableHash(input: string) {
  let h = 2166136261;

  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

function tileHash(x: number, y: number, salt: string) {
  return stableHash(`${salt}:${x},${y}`);
}

function isBoundaryTile(x: number, y: number) {
  return x % ZONE_SIZE_TILES === 0 || y % ZONE_SIZE_TILES === 0;
}

function hasFeatureAlreadyRecorded(
  events: readonly any[],
  type: DiscoveryEventDraft["type"],
  at: XY
) {
  const targetKey = keyXY(at);

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (String(e?.type ?? "") !== type) continue;

    const p = e?.payload ?? {};
    const pos =
      p?.at && Number.isFinite(Number(p.at.x)) && Number.isFinite(Number(p.at.y))
        ? { x: Number(p.at.x), y: Number(p.at.y) }
        : null;

    if (!pos) continue;
    if (keyXY(pos) === targetKey) return true;
  }

  return false;
}

function wasTileMarked(events: readonly any[], at: XY, kind?: string) {
  const targetKey = keyXY(at);

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (String(e?.type ?? "") !== "MAP_MARKED") continue;

    const p = e?.payload ?? {};
    const pos =
      p?.at && Number.isFinite(Number(p.at.x)) && Number.isFinite(Number(p.at.y))
        ? { x: Number(p.at.x), y: Number(p.at.y) }
        : null;

    if (!pos) continue;
    if (keyXY(pos) !== targetKey) continue;

    if (!kind) return true;
    if (String(p?.kind ?? "").toLowerCase() === kind.toLowerCase()) return true;
  }

  return false;
}

function deriveDoorFeature(x: number, y: number): DerivedFeature | null {
  if (!isBoundaryTile(x, y)) return null;

  const hash = tileHash(x, y, "door");
  const threshold = hash % 100;

  if (threshold > 18) return null;

  const locked = tileHash(x, y, "lock") % 100 < 44;

  return {
    kind: "door",
    locked,
    note: locked ? "heavy iron lock" : "stone threshold",
  };
}

function deriveTrapFeature(x: number, y: number): DerivedFeature | null {
  const hash = tileHash(x, y, "trap");
  const threshold = hash % 100;

  if (threshold > 8) return null;

  const trapType =
    threshold <= 2 ? "spike" : threshold <= 5 ? "pressure_plate" : "wire";

  return {
    kind: "trap",
    trapType,
    note:
      trapType === "spike"
        ? "narrow slits in the stone"
        : trapType === "pressure_plate"
          ? "subtle weight shift in the floor"
          : "nearly invisible tension line",
  };
}

function deriveCacheFeature(x: number, y: number): DerivedFeature | null {
  const hash = tileHash(x, y, "cache");
  const threshold = hash % 100;

  if (threshold > 6) return null;

  const cacheType =
    threshold <= 2 ? "relic" : threshold <= 4 ? "coin" : "supplies";

  return {
    kind: "cache",
    cacheType,
    note:
      cacheType === "relic"
        ? "something old and deliberate was hidden here"
        : cacheType === "coin"
          ? "a concealed purse or stash"
          : "useful provisions were tucked away",
  };
}

function deriveHazardFeature(x: number, y: number): DerivedFeature | null {
  const hash = tileHash(x, y, "hazard");
  const threshold = hash % 100;

  if (threshold > 7) return null;

  const hazardType =
    threshold <= 2
      ? "toxic_mist"
      : threshold <= 5
        ? "cracked_floor"
        : "unstable_stone";

  return {
    kind: "hazard",
    hazardType,
    note:
      hazardType === "toxic_mist"
        ? "a bad vapor lingers low"
        : hazardType === "cracked_floor"
          ? "the stone gives a warning pattern"
          : "the masonry looks ready to shift",
  };
}

function derivePatrolSignsFeature(x: number, y: number): DerivedFeature | null {
  const hash = tileHash(x, y, "patrol");
  const threshold = hash % 100;

  if (threshold > 10) return null;

  return {
    kind: "patrol_signs",
    intensity: threshold <= 4 ? "fresh" : "faint",
    note:
      threshold <= 4
        ? "recent movement is obvious here"
        : "disturbance suggests nearby patrol activity",
  };
}

function deriveFeatureForTile(tile: XY): DerivedFeature | null {
  const x = tile.x;
  const y = tile.y;

  return (
    deriveDoorFeature(x, y) ??
    deriveTrapFeature(x, y) ??
    deriveCacheFeature(x, y) ??
    deriveHazardFeature(x, y) ??
    derivePatrolSignsFeature(x, y) ??
    null
  );
}

function buildDraftForFeature(tile: XY, feature: DerivedFeature): DiscoveryEventDraft[] {
  const zoneId = zoneIdFromTileXY(tile.x, tile.y);

  if (feature.kind === "door") {
    const drafts: DiscoveryEventDraft[] = [
      {
        type: "DOOR_DISCOVERED",
        payload: {
          at: tile,
          zoneId,
          note: feature.note ?? null,
        },
      },
    ];

    if (feature.locked) {
      drafts.push({
        type: "DOOR_LOCKED",
        payload: {
          at: tile,
          zoneId,
          note: feature.note ?? "locked",
        },
      });
    }

    return drafts;
  }

  if (feature.kind === "trap") {
    return [
      {
        type: "TRAP_REVEALED",
        payload: {
          at: tile,
          zoneId,
          trapType: feature.trapType,
          note: feature.note ?? null,
        },
      },
    ];
  }

  if (feature.kind === "cache") {
    return [
      {
        type: "CACHE_REVEALED",
        payload: {
          at: tile,
          zoneId,
          cacheType: feature.cacheType,
          note: feature.note ?? null,
        },
      },
    ];
  }

  if (feature.kind === "hazard") {
    return [
      {
        type: "HAZARD_REVEALED",
        payload: {
          at: tile,
          zoneId,
          hazardType: feature.hazardType,
          note: feature.note ?? null,
        },
      },
    ];
  }

  return [
    {
      type: "PATROL_SIGNS_REVEALED",
      payload: {
        at: tile,
        zoneId,
        intensity: feature.intensity,
        note: feature.note ?? null,
      },
    },
  ];
}

function filterAlreadyKnownDrafts(events: readonly any[], drafts: DiscoveryEventDraft[]) {
  return drafts.filter((draft) => {
    const at =
      draft.payload?.at &&
      Number.isFinite(Number((draft.payload as any).at.x)) &&
      Number.isFinite(Number((draft.payload as any).at.y))
        ? {
            x: Number((draft.payload as any).at.x),
            y: Number((draft.payload as any).at.y),
          }
        : null;

    if (!at) return false;

    if (hasFeatureAlreadyRecorded(events, draft.type, at)) return false;

    if (draft.type === "DOOR_DISCOVERED" || draft.type === "DOOR_LOCKED") {
      if (wasTileMarked(events, at, "door")) return false;
    }

    if (draft.type === "TRAP_REVEALED" || draft.type === "HAZARD_REVEALED") {
      if (wasTileMarked(events, at, "hazard")) return false;
    }

    if (draft.type === "CACHE_REVEALED") {
      if (wasTileMarked(events, at, "cache")) return false;
    }

    return true;
  });
}

export function deriveDiscoveryEvents(input: DiscoveryInput): DiscoveryEventDraft[] {
  const events = Array.isArray(input.events) ? input.events : [];
  const mapW = clampInt(Number(input.mapW), 1, 999);
  const mapH = clampInt(Number(input.mapH), 1, 999);

  const candidateTiles = uniqueTiles([
    ...(input.movedTo ? [input.movedTo] : []),
    ...(Array.isArray(input.revealedTiles) ? input.revealedTiles : []),
  ]).filter((tile) => tile.x >= 0 && tile.y >= 0 && tile.x < mapW && tile.y < mapH);

  const drafts: DiscoveryEventDraft[] = [];

  for (const tile of candidateTiles) {
    const feature = deriveFeatureForTile(tile);
    if (!feature) continue;

    const nextDrafts = buildDraftForFeature(tile, feature);
    const freshDrafts = filterAlreadyKnownDrafts(events, nextDrafts);

    for (const draft of freshDrafts) {
      drafts.push(draft);
    }
  }

  return drafts;
}
