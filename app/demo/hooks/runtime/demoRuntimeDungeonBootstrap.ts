import { deriveExplorationDiscoveryDrafts } from "@/lib/dungeon/ExplorationDiscovery";
import {
  type CombatStartedPayload,
  type CombatantSpec,
  generateDeterministicInitiativeRolls,
} from "@/lib/combat/CombatState";
import {
  getEnemyDefinitionByName,
  type EnemyEncounterTheme,
} from "@/lib/game/EnemyDatabase";
import { deriveLatestParty } from "./demoRuntimeParty";
import { appendEventToState } from "./demoRuntimeUtils";

function normalizeName(value: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeClassKey(value?: string) {
  return String(value ?? "").trim().toLowerCase();
}

function inferOpeningEnemyName(args: {
  floorTheme?: string | null;
  roomType?: string | null;
  partyClassName?: string | null;
}) {
  const floorTheme = String(args.floorTheme ?? "").toLowerCase();
  const roomType = String(args.roomType ?? "").toLowerCase();
  const classKey = normalizeClassKey(args.partyClassName ?? "");

  if (floorTheme.includes("crypt") || floorTheme.includes("undead")) {
    return "Skeleton Warrior";
  }

  if (floorTheme.includes("arcane") || roomType.includes("arcane")) {
    return "Arcane Sentinel";
  }

  if (floorTheme.includes("beast") || roomType.includes("den")) {
    return "Wolf";
  }

  if (classKey === "mage" || classKey === "wizard" || classKey === "sorcerer" || classKey === "warlock") {
    return "Bandit Warrior";
  }

  return "Skeleton Warrior";
}

function inferEnemyInitMod(enemyName: string) {
  const enemy = getEnemyDefinitionByName(enemyName);
  if (!enemy) return 1;

  const role = String(enemy.role ?? "").toLowerCase();

  if (role === "archer" || role === "assassin" || role === "skirmisher") return 3;
  if (role === "caster" || role === "controller" || role === "support") return 2;
  if (role === "soldier" || role === "guardian") return 1;
  if (role === "beast") return 2;

  return 1;
}

function buildOpeningEncounterContext(args: {
  zoneId: string;
  zoneTheme?: string | null;
  enemyName: string;
}) {
  return {
    zoneId: args.zoneId,
    zoneTheme: (args.zoneTheme ?? null) as EnemyEncounterTheme | null,
    objective: "Survive the threshold and defeat the first guardian of the descent.",
    lockState: "Threshold sealed",
    rewardHint: "First victory · path to the corridor",
    keyEnemyName: args.enemyName,
    relicEnemyName: null,
    cacheGuardEnemyName: null,
  };
}

function buildSeededOpeningCombat(args: {
  dungeonSeed: string;
  floorId: string;
  roomId: string;
  floorTheme?: string | null;
  roomType?: string | null;
  partyMembers: Array<{
    id: string;
    name?: string;
    className?: string;
    initiativeMod?: number;
  }>;
}) {
  const { dungeonSeed, floorId, roomId, floorTheme, roomType, partyMembers } = args;

  if (!partyMembers.length) return null;

  const firstMember = partyMembers[0];
  const enemyName = inferOpeningEnemyName({
    floorTheme,
    roomType,
    partyClassName: firstMember?.className ?? null,
  });

  const enemy = getEnemyDefinitionByName(enemyName);
  if (!enemy) return null;

  const combatId = crypto.randomUUID();
  const seed = `${dungeonSeed}::opening_guardian::${floorId}::${roomId}`;

  const participants: CombatantSpec[] = [];

  for (const member of partyMembers.slice(0, 6)) {
    const playerId = normalizeName(member.id || "player_1") || "player_1";
    const playerName = normalizeName(member.name || "") || "Player 1";

    participants.push({
      id: playerId,
      name: playerName,
      kind: "player",
      initiativeMod: Math.trunc(Number(member.initiativeMod ?? 0)),
    });
  }

  participants.push({
    id: `enemy_${enemy.slug}_1`,
    name: enemy.name,
    kind: "enemy_group",
    initiativeMod: inferEnemyInitMod(enemy.name),
  });

  const started: CombatStartedPayload = {
    combatId,
    seed,
    participants,
  };

  const initiativeRolls = generateDeterministicInitiativeRolls(started);
  const encounterContext = buildOpeningEncounterContext({
    zoneId: `${floorId}:${roomId}`,
    zoneTheme: floorTheme ?? null,
    enemyName: enemy.name,
  });

  return {
    started,
    initiativeRolls,
    openingTurn: {
      combatId,
      round: 1,
      index: 0,
    },
    encounterContext,
  };
}

export function bootstrapDungeonState(args: {
  prev: any;
  dungeon: any;
}) {
  const { prev, dungeon } = args;

  let next = prev;

  next = appendEventToState(next, "DUNGEON_INITIALIZED", {
    dungeonId: dungeon.dungeonId,
    seed: dungeon.seed,
    floorIds: dungeon.floors.map((f: any) => f.id),
    startFloorId: dungeon.startFloorId,
    startRoomId: dungeon.startRoomId,
  });

  for (const floor of dungeon.floors) {
    next = appendEventToState(next, "FLOOR_INITIALIZED", {
      dungeonId: dungeon.dungeonId,
      floorId: floor.id,
      floorIndex: floor.floorIndex,
      theme: floor.theme,
      startRoomId: floor.startRoomId,
    });
  }

  const drafts = deriveExplorationDiscoveryDrafts({
    dungeon,
    events: next.events as any[],
    floorId: dungeon.startFloorId,
    roomId: dungeon.startRoomId,
    enteredViaConnectionId: null,
    enteredFromRoomId: null,
  });

  for (const draft of drafts) {
    next = appendEventToState(next, draft.type, draft.payload as any);
  }

  const latestParty = deriveLatestParty(next.events as any[]) ?? null;
  const partyMembers = Array.isArray(latestParty?.members) ? latestParty.members : [];

  const startFloor =
    dungeon.floors.find((floor: any) => floor.id === dungeon.startFloorId) ?? dungeon.floors[0] ?? null;

  const startRoom =
    startFloor?.rooms?.find((room: any) => room.id === dungeon.startRoomId) ??
    startFloor?.rooms?.[0] ??
    null;

  const openingCombat = buildSeededOpeningCombat({
    dungeonSeed: String(dungeon.seed ?? dungeon.dungeonId ?? "echoes"),
    floorId: String(dungeon.startFloorId ?? startFloor?.id ?? "floor_0"),
    roomId: String(dungeon.startRoomId ?? startRoom?.id ?? "room_0"),
    floorTheme: String(startFloor?.theme ?? ""),
    roomType: String(startRoom?.type ?? ""),
    partyMembers: partyMembers.map((member: any, index: number) => ({
      id: String(member?.id ?? `player_${index + 1}`),
      name: String(member?.name ?? `Player ${index + 1}`),
      className: String(member?.className ?? "Warrior"),
      initiativeMod: Number(member?.initiativeMod ?? 0),
    })),
  });

  if (openingCombat) {
    next = appendEventToState(next, "COMBAT_STARTED", {
      ...openingCombat.started,
      encounterContext: openingCombat.encounterContext,
    });

    for (const roll of openingCombat.initiativeRolls) {
      next = appendEventToState(next, "INITIATIVE_ROLLED", roll as any);
    }

    next = appendEventToState(next, "TURN_ADVANCED", openingCombat.openingTurn as any);
  }

  return next;
}
