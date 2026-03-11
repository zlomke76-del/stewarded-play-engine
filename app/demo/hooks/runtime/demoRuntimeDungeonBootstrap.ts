import { deriveExplorationDiscoveryDrafts } from "@/lib/dungeon/ExplorationDiscovery";
import { appendEventToState } from "./demoRuntimeUtils";

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

  return next;
}
