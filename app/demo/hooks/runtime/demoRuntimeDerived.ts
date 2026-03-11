import {
  resolveRoomImage,
  resolveTransitionImage,
} from "@/lib/dungeon/DungeonVisualResolver";
import {
  describeRoomEntry,
  describeRoomExits,
  describeRoomFeatures,
  describeRoomSummary,
  type OpeningChronicleSeed,
} from "@/lib/dungeon/DungeonNarration";
import { currentRoomFeatureLite, inferLockState, inferObjective, inferRewardHint, summarizeRoomTitle, toNarrationExits, toNarrationFeatures } from "../../lib/demoNarration";
import type { CombatEncounterContext } from "./demoRuntimeTypes";

export function buildNarrationExits(args: {
  currentRoom: any;
  currentFloorRooms: any[];
  allDungeonRooms: any[];
  connections: any[];
}) {
  return toNarrationExits({
    currentRoom: args.currentRoom,
    currentFloorRooms: args.currentFloorRooms,
    allDungeonRooms: args.allDungeonRooms,
    connections: args.connections,
  });
}

export function buildRoomConnectionsView(args: {
  reachableConnections: any[];
  currentRoom: any;
  currentFloor: any;
  dungeon: any;
}) {
  const { reachableConnections, currentRoom, currentFloor, dungeon } = args;
  const allRooms = dungeon.floors.flatMap((f: any) => f.rooms);

  return reachableConnections.map((connection: any) => {
    const targetRoomId =
      connection.fromRoomId === currentRoom.id
        ? connection.toRoomId
        : connection.fromRoomId;

    const targetFloor =
      dungeon.floors.find((floor: any) =>
        floor.rooms.some((room: any) => room.id === targetRoomId)
      ) ?? null;

    const targetRoom =
      currentFloor.rooms.find((r: any) => r.id === targetRoomId) ??
      allRooms.find((r: any) => r.id === targetRoomId) ??
      null;

    const previewImage =
      connection.type === "stairs"
        ? resolveTransitionImage({
            dungeonSeed: dungeon.seed,
            fromFloorTheme: currentFloor.theme,
            toFloorTheme: targetFloor?.theme ?? currentFloor.theme,
            direction: connection.note === "up" ? "up" : "down",
          })
        : resolveRoomImage({
            dungeonSeed: dungeon.seed,
            floorTheme: targetFloor?.theme ?? currentFloor.theme,
            room: targetRoom,
          });

    return {
      id: connection.id,
      type: connection.type,
      targetRoomId,
      targetLabel: targetRoom?.label ?? targetRoomId,
      targetType: targetRoom?.roomType ?? "unknown",
      locked: connection.locked === true || connection.type === "locked_door",
      note: connection.note ?? null,
      previewImage,
    };
  });
}

export function buildRoomViewModel(args: {
  dungeon: any;
  currentFloor: any;
  currentRoom: any;
  reachableConnections: any[];
  chronicleSeed: OpeningChronicleSeed | null;
  dungeonEvolutionSignals: string[];
}) {
  const {
    dungeon,
    currentFloor,
    currentRoom,
    reachableConnections,
    chronicleSeed,
    dungeonEvolutionSignals,
  } = args;

  const currentFeatures = currentRoomFeatureLite(currentRoom);
  const narrationFeatures = toNarrationFeatures(currentFeatures);

  const narrationExits = buildNarrationExits({
    currentRoom,
    currentFloorRooms: currentFloor.rooms,
    allDungeonRooms: dungeon.floors.flatMap((floor: any) => floor.rooms),
    connections: reachableConnections,
  });

  const currentRoomTitle = summarizeRoomTitle(currentRoom);
  const currentRoomVisualKey = `${currentFloor.id}:${currentRoom.id}`;

  const roomImage = resolveRoomImage({
    dungeonSeed: dungeon.seed,
    floorTheme: currentFloor.theme,
    room: currentRoom,
  });

  const roomNarrative = describeRoomEntry({
    dungeonSeed: dungeon.seed,
    floorTheme: currentFloor.theme,
    roomType: currentRoom.roomType,
    roomLabel: currentRoom.label,
    features: narrationFeatures,
    exits: narrationExits,
    lootHint: currentRoom.lootHint ?? null,
    storyHint: currentRoom.storyHint ?? null,
    chronicle: chronicleSeed,
  });

  const baseFeatureNarrative = describeRoomFeatures({
    dungeonSeed: dungeon.seed,
    floorTheme: currentFloor.theme,
    roomType: currentRoom.roomType,
    roomLabel: currentRoom.label,
    features: narrationFeatures,
    chronicle: chronicleSeed,
  });

  const roomFeatureNarrative =
    dungeonEvolutionSignals.length > 0
      ? [...baseFeatureNarrative, ...dungeonEvolutionSignals].slice(0, 6)
      : baseFeatureNarrative;

  const roomExitNarrative = describeRoomExits({
    dungeonSeed: dungeon.seed,
    roomType: currentRoom.roomType,
    exits: narrationExits,
  });

  const roomSummary = describeRoomSummary({
    dungeonSeed: dungeon.seed,
    floorTheme: currentFloor.theme,
    roomType: currentRoom.roomType,
    roomLabel: currentRoom.label,
    features: narrationFeatures,
    lootHint: currentRoom.lootHint ?? null,
    chronicle: chronicleSeed,
    encounterTheme: currentRoom.encounterSeed?.theme ?? null,
  });

  return {
    currentFeatures,
    narrationFeatures,
    narrationExits,
    currentRoomTitle,
    currentRoomVisualKey,
    roomImage,
    roomNarrative,
    roomFeatureNarrative,
    roomExitNarrative,
    roomSummary,
  };
}

export function buildCombatEncounterContext(args: {
  currentRoom: any;
  reachableConnections: any[];
  playerInput: string;
  selectedOptionDescription: string;
  floorId: string;
  roomId: string;
}): CombatEncounterContext {
  const {
    currentRoom,
    reachableConnections,
    playerInput,
    selectedOptionDescription,
    floorId,
    roomId,
  } = args;

  const roomTheme = currentRoom?.encounterSeed?.theme ?? null;

  const lockState = inferLockState({
    room: currentRoom,
    reachableConnections,
    playerInput,
    selectedOptionDescription,
  });

  const rewardHint = inferRewardHint({
    room: currentRoom,
    playerInput,
    selectedOptionDescription,
  });

  const objective = inferObjective({
    room: currentRoom,
    lockState,
    rewardHint,
  });

  const enemyNames = currentRoom?.encounterSeed?.enemyNames ?? [];
  const firstEnemy = enemyNames[0] ?? null;

  return {
    zoneId: `${floorId}:${roomId}`,
    zoneTheme: roomTheme,
    objective,
    lockState,
    rewardHint,
    keyEnemyName: currentRoom?.encounterSeed?.canCarryKey ? firstEnemy : null,
    relicEnemyName: currentRoom?.encounterSeed?.canCarryRelic ? firstEnemy : null,
    cacheGuardEnemyName: currentRoom?.encounterSeed?.canGuardCache ? firstEnemy : null,
  };
}
