// lib/dungeon/DungeonVisualResolver.ts
import type { DungeonFloor, DungeonRoom } from "@/lib/dungeon/FloorState";
import type { DungeonFloorTheme, RoomType } from "@/lib/dungeon/RoomTypes";
import {
  getDungeonTrapAssetPath,
  type DungeonTrapId,
} from "@/lib/dungeon/traps/DungeonTrapRegistry";

export type VisualDirection = "up" | "down";

export type ResolveRoomImageArgs = {
  dungeonSeed: string;
  floorTheme: DungeonFloorTheme | string;
  room: DungeonRoom | null;
};

export type ResolveTransitionImageArgs = {
  dungeonSeed: string;
  fromFloorTheme?: DungeonFloorTheme | string | null;
  toFloorTheme?: DungeonFloorTheme | string | null;
  direction: VisualDirection;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slugKey(value: unknown): string {
  return normalizeText(value).toLowerCase().replace(/\s+/g, "_");
}

function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pickDeterministic<T>(seed: string, items: readonly T[], fallback: T): T {
  if (!items.length) return fallback;
  const idx = hash32(seed) % items.length;
  return items[idx] ?? fallback;
}

function isCryptBand(theme: string | null | undefined): boolean {
  const key = slugKey(theme);
  return key === "forgotten_crypt" || key === "crypt" || key.includes("crypt");
}

function buildDeterministicAsset(
  seed: string,
  assets: readonly string[],
  fallback: string
): string {
  return pickDeterministic(seed, assets, fallback);
}

function parseTrapIdFromStoryHint(storyHint: string | null | undefined): DungeonTrapId | null {
  const text = normalizeText(storyHint);
  if (!text) return null;

  const segments = text
    .split("||")
    .map((part) => normalizeText(part))
    .filter(Boolean);

  for (const segment of segments) {
    const fields = segment
      .split("|")
      .map((part) => normalizeText(part))
      .filter(Boolean);

    for (const field of fields) {
      if (!field.startsWith("trap:")) continue;
      const trapId = normalizeText(field.slice("trap:".length));
      if (!trapId) continue;
      return trapId as DungeonTrapId;
    }
  }

  return null;
}

function parseTrapIdFromFeatures(room: DungeonRoom | null): DungeonTrapId | null {
  const features = Array.isArray(room?.features) ? room!.features : [];

  for (const feature of features) {
    const kind = slugKey((feature as { kind?: unknown })?.kind);
    const note = normalizeText((feature as { note?: unknown })?.note);

    if (kind !== "hazard") continue;
    if (!note) continue;
    if (!note.startsWith("trap_")) continue;

    return note as DungeonTrapId;
  }

  return null;
}

function extractTrapIdFromRoom(room: DungeonRoom | null): DungeonTrapId | null {
  return parseTrapIdFromFeatures(room) ?? parseTrapIdFromStoryHint(room?.storyHint);
}

function resolveTrapAssetForRoom(room: DungeonRoom | null): string | null {
  const trapId = extractTrapIdFromRoom(room);
  if (!trapId) return null;
  return getDungeonTrapAssetPath(trapId);
}

const SECRET_PASSAGE_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Secret_Passage/secret_passage_01.png",
  "/assets/V3/Dungeon/Secret_Passage/secret_passage_02.png",
  "/assets/V3/Dungeon/Secret_Passage/secret_passage_03.png",
  "/assets/V3/Dungeon/Secret_Passage/secret_passage_04.png",
  "/assets/V3/Dungeon/Secret_Passage/secret_passage_05.png",
];

const CRYPT_ROOM_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Crypt/crypt_01.png",
];

const ARMORY_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Armory/armory_01.png",
  "/assets/V3/Dungeon/Armory/armory_02.png",
  "/assets/V3/Dungeon/Armory/armory_03.png",
  "/assets/V3/Dungeon/Armory/armory_04.png",
];

const ARCANE_HALL_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Arcane_Hall/arcane_01.png",
  "/assets/V3/Dungeon/Arcane_Hall/arcane_02.png",
  "/assets/V3/Dungeon/Arcane_Hall/arcane_03.png",
  "/assets/V3/Dungeon/Arcane_Hall/arcane_04.png",
];

const BEAST_DEN_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Beast_Den/beast_01.png",
  "/assets/V3/Dungeon/Beast_Den/beast_02.png",
  "/assets/V3/Dungeon/Beast_Den/beast_03.png",
  "/assets/V3/Dungeon/Beast_Den/beast_04.png",
];

const BONE_PIT_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Bone_Pit/bone_01.png",
  "/assets/V3/Dungeon/Bone_Pit/bone_02.png",
  "/assets/V3/Dungeon/Bone_Pit/bone_03.png",
  "/assets/V3/Dungeon/Bone_Pit/bone_04.png",
];

const BOSS_CHAMBER_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Boss_Chamber/boss_01.png",
  "/assets/V3/Dungeon/Boss_Chamber/boss_02.png",
  "/assets/V3/Dungeon/Boss_Chamber/boss_03.png",
  "/assets/V3/Dungeon/Boss_Chamber/boss_04.png",
];

const CRYPT_VAULT_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Crypt_Vault/crypt_01.png",
  "/assets/V3/Dungeon/Crypt_Vault/crypt_02.png",
  "/assets/V3/Dungeon/Crypt_Vault/crypt_03.png",
  "/assets/V3/Dungeon/Crypt_Vault/crypt_04.png",
];

const FORGE_CHAMBER_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Forge_Chamber/forge_01.png",
  "/assets/V3/Dungeon/Forge_Chamber/forge_02.png",
  "/assets/V3/Dungeon/Forge_Chamber/forge_03.png",
  "/assets/V3/Dungeon/Forge_Chamber/forge_04.png",
];

const GATE_HALL_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Gate_Hall/gate_01.png",
  "/assets/V3/Dungeon/Gate_Hall/gate_02.png",
  "/assets/V3/Dungeon/Gate_Hall/gate_03.png",
  "/assets/V3/Dungeon/Gate_Hall/gate_04.png",
];

const OSSUARY_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Ossuary/ossuary_01.png",
  "/assets/V3/Dungeon/Ossuary/ossuary_02.png",
  "/assets/V3/Dungeon/Ossuary/ossuary_03.png",
  "/assets/V3/Dungeon/Ossuary/ossuary_04.png",
];

const RELIC_CHAMBER_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Relic_Chamber/relic_chamber_01.png",
  "/assets/V3/Dungeon/Relic_Chamber/relic_chamber_02.png",
  "/assets/V3/Dungeon/Relic_Chamber/relic_chamber_03.png",
  "/assets/V3/Dungeon/Relic_Chamber/relic_chamber_04.png",
];

const RELIC_VAULT_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Relic_Vault/relic_vault_01.png",
  "/assets/V3/Dungeon/Relic_Vault/relic_vault_02.png",
  "/assets/V3/Dungeon/Relic_Vault/relic_vault_03.png",
  "/assets/V3/Dungeon/Relic_Vault/relic_vault_04.png",
];

const SENTINEL_HALL_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Sentinel_Hall/sentinal_01.png",
  "/assets/V3/Dungeon/Sentinel_Hall/sentinal_02.png",
  "/assets/V3/Dungeon/Sentinel_Hall/sentinal_03.png",
  "/assets/V3/Dungeon/Sentinel_Hall/sentinal_04.png",
];

const TREASURE_ROOM_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Treasure_Room/treasure_01.png",
  "/assets/V3/Dungeon/Treasure_Room/treasure_02.png",
  "/assets/V3/Dungeon/Treasure_Room/treasure_03.png",
  "/assets/V3/Dungeon/Treasure_Room/treasure_04.png",
];

const TRIAL_CHAMBER_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Trial_Chamber/trial_chamber_01.png",
  "/assets/V3/Dungeon/Trial_Chamber/trial_chamber_02.png",
  "/assets/V3/Dungeon/Trial_Chamber/trial_chamber_03.png",
  "/assets/V3/Dungeon/Trial_Chamber/trial_chamber_04.png",
];

const ROOM_ASSETS: Record<string, readonly string[]> = {
  entrance: ["/assets/V3/Dungeon/Entrance/Main_01.png"],

  corridor: ["/assets/V3/Dungeon/Corridor/Corridor_01.png"],

  guard_post: ["/assets/V3/Dungeon/Guard_Post/Guard_Post_01.png"],

  storage: ["/assets/V3/Dungeon/Storage_Room/storage_01.png"],
  storage_room: ["/assets/V3/Dungeon/Storage_Room/storage_01.png"],
  storeroom: ["/assets/V3/Dungeon/Storage_Room/storage_01.png"],

  shrine: ["/assets/V3/Dungeon/Shrine/shrine_01.png"],
  shrine_room: ["/assets/V3/Dungeon/Shrine/shrine_01.png"],
  forgotten_shrine: ["/assets/V3/Dungeon/Shrine/shrine_01.png"],

  barracks: ["/assets/V3/Dungeon/Barracks/barracks_01.png"],
  barracks_room: ["/assets/V3/Dungeon/Barracks/barracks_01.png"],

  breach_chamber: ["/assets/V3/Dungeon/Breach_Chamber/breach_chamber_01.png"],
  breach: ["/assets/V3/Dungeon/Breach_Chamber/breach_chamber_01.png"],
  breach_room: ["/assets/V3/Dungeon/Breach_Chamber/breach_chamber_01.png"],

  watchtower: ["/assets/V3/Dungeon/Watchtower/watchtower_01.png"],
  tower: ["/assets/V3/Dungeon/Watchtower/watchtower_01.png"],

  ritual_chamber: ["/assets/V3/Dungeon/Ritual_Chamber/ritual_chamber_01.png"],
  ritual_room: ["/assets/V3/Dungeon/Ritual_Chamber/ritual_chamber_01.png"],
  ritual_site: ["/assets/V3/Dungeon/Ritual_Chamber/ritual_chamber_01.png"],

  camp: ["/assets/V3/Dungeon/Camp/camp_01.png"],
  rest_site: ["/assets/V3/Dungeon/Camp/camp_01.png"],
  campsite: ["/assets/V3/Dungeon/Camp/camp_01.png"],

  collapsed: ["/assets/V3/Dungeon/Collapsed/collapsed_01.png"],
  collapsed_passage: ["/assets/V3/Dungeon/Collapsed/collapsed_01.png"],
  collapsed_corridor: ["/assets/V3/Dungeon/Collapsed/collapsed_01.png"],

  flooded: ["/assets/V3/Dungeon/Flooded/flooded_01.png"],
  flooded_chamber: ["/assets/V3/Dungeon/Flooded/flooded_01.png"],
  flooded_room: ["/assets/V3/Dungeon/Flooded/flooded_01.png"],
  flooded_passage: ["/assets/V3/Dungeon/Flooded/flooded_01.png"],

  prison: ["/assets/V3/Dungeon/Prison/prison_01.png"],
  cell_block: ["/assets/V3/Dungeon/Prison/prison_01.png"],

  mess_hall: ["/assets/V3/Dungeon/Mess_Hall/mess_hall_01.png"],
  dining_hall: ["/assets/V3/Dungeon/Mess_Hall/mess_hall_01.png"],

  secret_passage: SECRET_PASSAGE_ASSETS,
  hidden_passage: SECRET_PASSAGE_ASSETS,
  secret_corridor: SECRET_PASSAGE_ASSETS,
  hidden_corridor: SECRET_PASSAGE_ASSETS,

  crypt: CRYPT_ROOM_ASSETS,

  crypt_vault: CRYPT_VAULT_ASSETS,
  ossuary: OSSUARY_ASSETS,
  bone_pit: BONE_PIT_ASSETS,
  relic_chamber: RELIC_CHAMBER_ASSETS,
  relic_vault: RELIC_VAULT_ASSETS,

  armory: ARMORY_ASSETS,
  treasure_room: TREASURE_ROOM_ASSETS,
  beast_den: BEAST_DEN_ASSETS,
  arcane_hall: ARCANE_HALL_ASSETS,
  sentinel_hall: SENTINEL_HALL_ASSETS,
  gate_hall: GATE_HALL_ASSETS,
  trial_chamber: TRIAL_CHAMBER_ASSETS,
  forge_chamber: FORGE_CHAMBER_ASSETS,
  boss_chamber: BOSS_CHAMBER_ASSETS,

  tavern: ["/assets/V3/Dungeon/Tavern/tavern_01.png"],

  ruined_outpost_default: ["/assets/V3/Dungeon/Military_Outpost/Military_Outpost_01.png"],
  deep_warrens_default: ["/assets/V3/Dungeon/Collapsed/collapsed_01.png"],
  forgotten_crypt_default: CRYPT_ROOM_ASSETS,

  default: ["/assets/V3/Dungeon/Entrance/Main_01.png"],
};

const STANDARD_STAIRS_UP_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Stairs/up_01.png",
];

const STANDARD_STAIRS_DOWN_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Stairs/down_01.png",
];

const CRYPT_STAIRS_UP_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Crypt/Stairs/up_01.png",
];

const CRYPT_STAIRS_DOWN_ASSETS: readonly string[] = [
  "/assets/V3/Dungeon/Crypt/Stairs/down_01.png",
];

export function resolveRoomImage(args: ResolveRoomImageArgs): string {
  const room = args.room;
  const floorTheme = slugKey(args.floorTheme);
  const roomType = slugKey(room?.roomType ?? "") as RoomType | string;
  const roomId = normalizeText(room?.id ?? "unknown-room");
  const roomLabel = normalizeText((room?.label ?? roomType) || "room");
  const seed = `${args.dungeonSeed}:${floorTheme}:${roomType}:${roomId}:${roomLabel}:room-image`;

  const trapAsset = resolveTrapAssetForRoom(room);
  if (trapAsset) {
    return trapAsset;
  }

  const exactRoomAssets = ROOM_ASSETS[roomType];
  if (exactRoomAssets?.length) {
    return buildDeterministicAsset(seed, exactRoomAssets, exactRoomAssets[0]!);
  }

  const roomIdAssets = ROOM_ASSETS[slugKey(room?.id ?? "")];
  if (roomIdAssets?.length) {
    return buildDeterministicAsset(seed, roomIdAssets, roomIdAssets[0]!);
  }

  const roomLabelAssets = ROOM_ASSETS[slugKey(room?.label ?? "")];
  if (roomLabelAssets?.length) {
    return buildDeterministicAsset(seed, roomLabelAssets, roomLabelAssets[0]!);
  }

  if (floorTheme === "ruined_outpost") {
    const themeAssets = ROOM_ASSETS.ruined_outpost_default;
    return buildDeterministicAsset(seed, themeAssets, themeAssets[0]!);
  }

  if (floorTheme === "deep_warrens") {
    const themeAssets = ROOM_ASSETS.deep_warrens_default;
    return buildDeterministicAsset(seed, themeAssets, themeAssets[0]!);
  }

  if (floorTheme === "forgotten_crypt") {
    const themeAssets = ROOM_ASSETS.forgotten_crypt_default;
    return buildDeterministicAsset(seed, themeAssets, themeAssets[0]!);
  }

  const fallbackAssets = ROOM_ASSETS.default;
  return buildDeterministicAsset(seed, fallbackAssets, fallbackAssets[0]!);
}

export function resolveFloorBackdropImage(args: {
  dungeonSeed: string;
  floor: DungeonFloor | null;
}): string {
  const floorTheme = slugKey(args.floor?.theme ?? "");
  const floorId = normalizeText(args.floor?.id ?? "unknown-floor");
  const seed = `${args.dungeonSeed}:${floorTheme}:${floorId}:floor-backdrop`;

  if (floorTheme === "ruined_outpost") {
    const assets = ROOM_ASSETS.ruined_outpost_default;
    return buildDeterministicAsset(seed, assets, assets[0]!);
  }

  if (floorTheme === "deep_warrens") {
    const assets = ROOM_ASSETS.deep_warrens_default;
    return buildDeterministicAsset(seed, assets, assets[0]!);
  }

  if (floorTheme === "forgotten_crypt") {
    const assets = ROOM_ASSETS.forgotten_crypt_default;
    return buildDeterministicAsset(seed, assets, assets[0]!);
  }

  const fallbackAssets = ROOM_ASSETS.default;
  return buildDeterministicAsset(seed, fallbackAssets, fallbackAssets[0]!);
}

export function resolveTransitionImage(args: ResolveTransitionImageArgs): string {
  const fromTheme = slugKey(args.fromFloorTheme);
  const toTheme = slugKey(args.toFloorTheme);
  const direction = args.direction;
  const destinationIsCrypt = isCryptBand(toTheme);
  const seed = `${args.dungeonSeed}:${fromTheme}:${toTheme}:${direction}:transition-image`;

  if (destinationIsCrypt) {
    const assets = direction === "up" ? CRYPT_STAIRS_UP_ASSETS : CRYPT_STAIRS_DOWN_ASSETS;
    return buildDeterministicAsset(seed, assets, assets[0]!);
  }

  const assets = direction === "up" ? STANDARD_STAIRS_UP_ASSETS : STANDARD_STAIRS_DOWN_ASSETS;
  return buildDeterministicAsset(seed, assets, assets[0]!);
}

export function resolveStairImageForRoom(args: {
  dungeonSeed: string;
  currentFloorTheme?: DungeonFloorTheme | string | null;
  targetFloorTheme?: DungeonFloorTheme | string | null;
  connectionNote?: string | null;
}): string {
  const note = slugKey(args.connectionNote);
  const direction: VisualDirection = note === "up" ? "up" : "down";

  return resolveTransitionImage({
    dungeonSeed: args.dungeonSeed,
    fromFloorTheme: args.currentFloorTheme,
    toFloorTheme: args.targetFloorTheme,
    direction,
  });
}

export function inferVisualBand(
  theme: DungeonFloorTheme | string | null | undefined
): "main" | "down" | "lower" | "crypt" | "unknown" {
  const key = slugKey(theme);

  if (isCryptBand(key)) return "crypt";
  if (key === "ruined_outpost") return "main";
  if (key === "cult_temple" || key === "arcane_forge") return "down";
  if (key === "wild_depths" || key === "ancient_vault" || key === "deep_warrens") {
    return "lower";
  }

  return "unknown";
}
