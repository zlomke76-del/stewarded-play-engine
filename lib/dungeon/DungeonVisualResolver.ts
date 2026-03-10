// lib/dungeon/DungeonVisualResolver.ts
import type { DungeonFloor, DungeonRoom } from "@/lib/dungeon/FloorState";
import type { DungeonFloorTheme, RoomType } from "@/lib/dungeon/RoomTypes";

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

function buildDeterministicAsset(seed: string, assets: readonly string[], fallback: string): string {
  return pickDeterministic(seed, assets, fallback);
}

const ROOM_ASSETS: Record<string, readonly string[]> = {
  entrance: ["/assets/V3/Dungeon/Entrance/Main_01.png"],
  corridor: ["/assets/V3/Dungeon/Corridor/Corridor_01.png"],
  guard_post: ["/assets/V3/Dungeon/Guard_Post/Guard_Post_01.png"],
  ruined_outpost_default: ["/assets/V3/Dungeon/Military_Outpost/Military_Outpost_01.png"],
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

  const exactRoomAssets = ROOM_ASSETS[roomType];
  if (exactRoomAssets?.length) {
    return buildDeterministicAsset(seed, exactRoomAssets, exactRoomAssets[0]!);
  }

  if (floorTheme === "ruined_outpost") {
    const themeAssets = ROOM_ASSETS.ruined_outpost_default;
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
  if (key === "wild_depths" || key === "ancient_vault") return "lower";

  return "unknown";
}
