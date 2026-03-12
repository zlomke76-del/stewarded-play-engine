import type { DungeonConnection, DungeonDefinition, DungeonRoom } from "@/lib/dungeon/FloorState";
import {
  deriveExplorationDiscoveryDrafts,
} from "@/lib/dungeon/ExplorationDiscovery";
import {
  buildRoomExitPayload,
  resolveTraversal,
} from "@/lib/dungeon/DungeonNavigation";
import { appendEventToState } from "./demoRuntimeUtils";

export function inferConnectionChoiceFromText(
  room: DungeonRoom | null,
  connections: DungeonConnection[],
  dungeon: DungeonDefinition,
  floorId: string,
  text: string
): DungeonConnection | null {
  if (!room || connections.length === 0) return null;

  const t = String(text || "").toLowerCase();

  const scored = connections.map((connection) => {
    const floor = dungeon.floors.find((f) => f.id === floorId) ?? null;
    const targetRoomId =
      connection.fromRoomId === room.id ? connection.toRoomId : connection.fromRoomId;
    const targetRoom =
      floor?.rooms.find((r) => r.id === targetRoomId) ?? null;

    let score = 0;

    if (/stairs|descend|down|deeper|lower/i.test(t) && connection.type === "stairs") score += 50;
    if (/up|ascend|retreat/i.test(t) && connection.type === "stairs" && connection.note === "up") score += 50;
    if (/door|open|push|threshold|archway|gate|enter/i.test(t) && (connection.type === "door" || connection.type === "locked_door")) score += 35;
    if (/locked|barred|sealed|key|unlock|force/i.test(t) && connection.type === "locked_door") score += 40;
    if (/secret|hidden/i.test(t) && connection.type === "secret") score += 40;
    if (connection.type === "corridor") score += 10;

    if (targetRoom) {
      const label = `${targetRoom.label} ${targetRoom.roomType}`.toLowerCase();
      if (label.includes("shrine") && /shrine|altar|ritual|pray/i.test(t)) score += 45;
      if (label.includes("crypt") && /crypt|bone|grave|dead/i.test(t)) score += 45;
      if (label.includes("armory") && /armory|weapon|gear|supplies/i.test(t)) score += 40;
      if (label.includes("storage") && /cache|storage|supplies|loot/i.test(t)) score += 40;
      if (label.includes("relic") && /relic|vault|artifact|treasure/i.test(t)) score += 48;
      if (label.includes("boss") && /boss|leader|captain|warlord|priest/i.test(t)) score += 48;
      if (label.includes("beast") && /beast|den|nest|predator/i.test(t)) score += 40;
      if (label.includes("arcane") && /arcane|construct|sentinel|magic/i.test(t)) score += 40;
      if (label.includes("guard") && /guard|watch|post|sentry/i.test(t)) score += 42;
      if (label.includes("entrance") && /entrance|entry|return|back/i.test(t)) score += 42;
    }

    return { connection, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.connection ?? connections[0] ?? null;
}

export function mapStateEventsToPuzzleCanon(events: readonly any[]) {
  const out: any[] = [];

  for (const event of events) {
    const type = String(event?.type ?? "");
    const payload = event?.payload ?? {};

    if (type === "PUZZLE_RESOLVED") {
      const puzzleId = String(payload?.puzzleId ?? "").trim();
      const floorId = String(payload?.floorId ?? "").trim();
      const roomId = String(payload?.roomId ?? "").trim();
      if (!puzzleId || !floorId || !roomId) continue;

      out.push({
        type: "puzzle_resolved",
        puzzleId: puzzleId as any,
        floorId,
        roomId,
        success: Boolean(payload?.success),
        timestamp: Number.isFinite(Number(event?.timestamp)) ? Number(event.timestamp) : undefined,
        details: payload,
      });
      continue;
    }

    if (type === "PUZZLE_REWARD_GRANTED") {
      const effect = payload?.effect ?? {};
      if (effect?.kind === "grant_trait" && effect?.traitId && effect?.label) {
        out.push({
          type: "trait_gained",
          traitId: String(effect.traitId),
          label: String(effect.label),
          details: effect,
        });
      }
      continue;
    }

    if (type === "PUZZLE_CONSEQUENCE_APPLIED") {
      const effect = payload?.effect ?? {};

      if (effect?.kind === "lock_companion_path" && effect?.companionTag) {
        out.push({
          type: "companion_lock",
          companionTag: String(effect.companionTag),
          reason: String(effect.description ?? "Puzzle consequence"),
          details: effect,
        });
        continue;
      }

      if (effect?.kind === "apply_penalty" && effect?.penaltyId && effect?.label) {
        out.push({
          type: "trait_lost",
          traitId: String(effect.penaltyId),
          label: String(effect.label),
          details: effect,
        });
        continue;
      }
    }
  }

  return out;
}

export function commitDungeonTraversalBundle(args: {
  prevState: any;
  success: boolean;
  selectedText: string;
  selectedConnectionId?: string | null;
  currentRoom: any;
  reachableConnections: any[];
  dungeon: any;
  floorId: string;
  roomId: string;
  openedDoorIds: string[];
  unlockedDoorIds: string[];
}) {
  const {
    prevState,
    success,
    selectedText,
    selectedConnectionId,
    currentRoom,
    reachableConnections,
    dungeon,
    floorId,
    roomId,
    openedDoorIds,
    unlockedDoorIds,
  } = args;

  const chosenConnection =
    reachableConnections.find(
      (connection) =>
        String(connection?.id ?? "").trim() === String(selectedConnectionId ?? "").trim()
    ) ??
    inferConnectionChoiceFromText(
      currentRoom,
      reachableConnections,
      dungeon,
      floorId,
      selectedText
    );

  let next = prevState;

  if (!chosenConnection) {
    const discoveryDrafts = deriveExplorationDiscoveryDrafts({
      dungeon,
      events: next.events as any[],
      floorId,
      roomId,
      enteredViaConnectionId: null,
      enteredFromRoomId: null,
    });

    for (const draft of discoveryDrafts) {
      next = appendEventToState(next, draft.type, draft.payload as any);
    }

    return next;
  }

  const resolved = resolveTraversal(dungeon, {
    floorId,
    roomId,
    connectionId: chosenConnection.id,
    openedDoorIds,
    unlockedDoorIds,
  });

  if (!success || !resolved.ok) {
    const discoveryDrafts = deriveExplorationDiscoveryDrafts({
      dungeon,
      events: next.events as any[],
      floorId,
      roomId,
      enteredViaConnectionId: null,
      enteredFromRoomId: null,
    });

    for (const draft of discoveryDrafts) {
      next = appendEventToState(next, draft.type, draft.payload as any);
    }

    return next;
  }

  next = appendEventToState(next, "ROOM_EXITED", buildRoomExitPayload({
    floorId,
    roomId,
    toRoomId: resolved.toRoom.id,
    viaConnectionId: resolved.connection.id,
  }));

  next = appendEventToState(next, "ROOM_ENTERED", {
    floorId: resolved.nextFloorId,
    roomId: resolved.toRoom.id,
    fromRoomId: roomId,
    viaConnectionId: resolved.connection.id,
  } as any);

  if (resolved.connection.doorId && resolved.connection.type === "locked_door") {
    if (!unlockedDoorIds.includes(resolved.connection.doorId)) {
      next = appendEventToState(next, "DOOR_UNLOCKED", {
        floorId,
        roomId,
        doorId: resolved.connection.doorId,
        connectionId: resolved.connection.id,
        method: "force",
      });
    }
  }

  if (resolved.connection.doorId) {
    next = appendEventToState(next, "DOOR_OPENED", {
      floorId,
      roomId,
      doorId: resolved.connection.doorId,
      connectionId: resolved.connection.id,
      revealedRoomId: resolved.toRoom.id,
    });
  }

  if (resolved.usedStairs && resolved.floorChanged) {
    next = appendEventToState(next, "PLAYER_USED_STAIRS", {
      fromFloorId: floorId,
      fromRoomId: roomId,
      toFloorId: resolved.nextFloorId,
      toRoomId: resolved.toRoom.id,
      direction: resolved.connection.note === "up" ? "up" : "down",
    });

    next = appendEventToState(next, "FLOOR_CHANGED", {
      fromFloorId: floorId,
      toFloorId: resolved.nextFloorId,
      fromRoomId: roomId,
      toRoomId: resolved.toRoom.id,
    });
  }

  const discoveryDrafts = deriveExplorationDiscoveryDrafts({
    dungeon,
    events: next.events as any[],
    floorId: resolved.nextFloorId,
    roomId: resolved.toRoom.id,
    enteredViaConnectionId: resolved.connection.id,
    enteredFromRoomId: roomId,
  });

  for (const draft of discoveryDrafts) {
    next = appendEventToState(next, draft.type, draft.payload as any);
  }

  return next;
}
