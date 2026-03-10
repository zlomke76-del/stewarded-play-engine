import {
  type OpeningChronicleSeed,
  type NarrationExit,
  type NarrationFeature,
} from "@/lib/dungeon/DungeonNarration";
import type { DungeonConnection, DungeonRoom } from "@/lib/dungeon/FloorState";
import type { RoomFeatureKind } from "@/lib/dungeon/RoomTypes";
import type { InitialTable } from "../demoTypes";

export type RoomFeatureLite = {
  kind: RoomFeatureKind;
  note: string | null;
};

export type PressureTier = "low" | "medium" | "high";

export function inferPressureTier(outcomesCount: number): PressureTier {
  if (outcomesCount <= 1) return "low";
  if (outcomesCount <= 5) return "medium";
  return "high";
}

export function summarizeRoomTitle(room: DungeonRoom | null) {
  if (!room) return "Unknown Chamber";
  return `${room.label}`;
}

export function normalizeNarrationText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeNarrationText(item))
    .filter(Boolean);
}

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const normalized = normalizeNarrationText(value);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

export function extractOpeningChronicleSeed(initialTable: InitialTable | null): OpeningChronicleSeed | null {
  if (!initialTable) return null;

  const raw = initialTable as Record<string, unknown>;

  const openingFrame =
    normalizeNarrationText(raw.openingFrame) ||
    normalizeNarrationText(raw.introFrame) ||
    normalizeNarrationText(raw.frame) ||
    normalizeNarrationText(raw.location) ||
    normalizeNarrationText(raw.openingText);

  const locationTraits = uniqueStrings([
    ...toStringArray(raw.locationTraits),
    ...toStringArray(raw.locationTags),
    ...toStringArray(raw.atmosphereTags),
    ...toStringArray(raw.environmentTags),
  ]);

  const oddities = uniqueStrings([
    ...toStringArray(raw.oddities),
    ...toStringArray(raw.strangeDetails),
    ...toStringArray(raw.anomalies),
  ]);

  const factionNames = uniqueStrings([
    ...toStringArray(raw.factionNames),
    ...toStringArray(raw.factions),
  ]);

  const factionDesires = uniqueStrings([
    ...toStringArray(raw.factionDesires),
    ...toStringArray(raw.factionGoals),
    ...toStringArray(raw.desires),
  ]);

  const factionPressures = uniqueStrings([
    ...toStringArray(raw.factionPressures),
    ...toStringArray(raw.pressures),
    ...toStringArray(raw.activeThreats),
  ]);

  const dormantHook =
    normalizeNarrationText(raw.dormantHook) ||
    normalizeNarrationText(raw.hook) ||
    normalizeNarrationText(raw.mysteryHook) ||
    normalizeNarrationText(raw.recurringHook);

  if (
    !openingFrame &&
    locationTraits.length === 0 &&
    oddities.length === 0 &&
    factionNames.length === 0 &&
    factionDesires.length === 0 &&
    factionPressures.length === 0 &&
    !dormantHook
  ) {
    return null;
  }

  return {
    openingFrame,
    locationTraits,
    oddities,
    factionNames,
    factionDesires,
    factionPressures,
    dormantHook,
  };
}

export function currentRoomFeatureLite(room: DungeonRoom | null): RoomFeatureLite[] {
  if (!room) return [];
  return room.features.map((f) => ({
    kind: f.kind,
    note: f.note ?? null,
  }));
}

export function toNarrationFeatures(features: RoomFeatureLite[]): NarrationFeature[] {
  return features.map((feature) => ({
    kind: feature.kind,
    note: feature.note,
  }));
}

export function toNarrationExits(args: {
  currentRoom: DungeonRoom | null;
  currentFloorRooms: DungeonRoom[];
  allDungeonRooms: DungeonRoom[];
  connections: DungeonConnection[];
}): NarrationExit[] {
  const { currentRoom, currentFloorRooms, allDungeonRooms, connections } = args;
  if (!currentRoom) return [];

  return connections.map((connection) => {
    const targetRoomId =
      connection.fromRoomId === currentRoom.id ? connection.toRoomId : connection.fromRoomId;

    const targetRoom =
      currentFloorRooms.find((room) => room.id === targetRoomId) ??
      allDungeonRooms.find((room) => room.id === targetRoomId) ??
      null;

    return {
      type: connection.type,
      targetLabel: targetRoom?.label ?? targetRoomId,
      locked: connection.locked === true || connection.type === "locked_door",
      note: connection.note ?? null,
    };
  });
}

export function inferLockState(args: {
  room: DungeonRoom | null;
  reachableConnections: DungeonConnection[];
  playerInput: string;
  selectedOptionDescription: string;
}) {
  const text = `${args.playerInput} ${args.selectedOptionDescription}`.toLowerCase();

  if (args.reachableConnections.some((c) => c.type === "locked_door" || c.locked)) {
    return "locked";
  }

  if (/open|breached|unlocked/i.test(text)) return "open";
  if (/door|threshold|gate|sealed/i.test(text)) return "door-present";

  if (args.room?.features.some((f) => f.kind === "locked_door")) return "locked";
  if (args.room?.features.some((f) => f.kind === "door")) return "door-present";

  return null;
}

export function inferRewardHint(args: {
  room: DungeonRoom | null;
  playerInput: string;
  selectedOptionDescription: string;
}) {
  const roomLoot = args.room?.lootHint ?? null;
  if (roomLoot === "supplies") return "cache";
  if (roomLoot === "treasure") return "treasure";
  if (roomLoot === "relic") return "relic";

  const text = `${args.playerInput} ${args.selectedOptionDescription}`.toLowerCase();
  if (/cache|supplies|stash|provisions/i.test(text)) return "cache";
  if (/treasure|chest|loot|coin/i.test(text)) return "treasure";
  if (/key/i.test(text)) return "key";
  if (/relic|artifact|altar/i.test(text)) return "relic";

  return null;
}

export function inferObjective(args: {
  room: DungeonRoom | null;
  lockState: string | null;
  rewardHint: string | null;
}) {
  if (args.lockState === "locked") {
    return "Break access deeper into the dungeon by clearing or opening the sealed route.";
  }

  if (args.rewardHint === "cache") {
    return "Secure the supplies before pressure hardens around the room.";
  }

  if (args.rewardHint === "treasure") {
    return "Clear the chamber and claim the treasure before the dungeon reacts.";
  }

  if (args.rewardHint === "relic") {
    return "Seize the relic and survive the room's answer to that theft.";
  }

  switch (args.room?.roomType) {
    case "guard_post":
      return "Break control of the route and move deeper.";
    case "shrine":
    case "ritual_chamber":
      return "Disrupt the sacred geometry before it stabilizes.";
    case "crypt":
    case "bone_pit":
      return "Push through the dead and secure the passage.";
    case "beast_den":
      return "Clear the predators holding the route.";
    case "arcane_hall":
    case "sentinel_hall":
      return "Disable the chamber's controlled defenses.";
    case "relic_vault":
      return "Crack the guardians of the vault.";
    case "boss_chamber":
      return "Survive the apex encounter and take the room.";
    default:
      return null;
  }
}
