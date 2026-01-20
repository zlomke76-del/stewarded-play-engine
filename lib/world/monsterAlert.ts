// ------------------------------------------------------------
// monsterAlert
// ------------------------------------------------------------
// Purpose:
// - Track alert levels per room
// - Propagate noise/alerts through adjacent rooms
// - Mutate world state explicitly (advisory)
//
// Governance:
// - No monsters spawned
// - No combat resolved
// - Arbiter decides consequences
// ------------------------------------------------------------

export type RoomId = string;

export type AlertLevel =
  | "calm"
  | "suspicious"
  | "alerted"
  | "hostile";

export type RoomAlertState = {
  roomId: RoomId;
  alert: AlertLevel;
  lastUpdatedTurn: number;
};

export type DungeonGraph = {
  rooms: Record<
    RoomId,
    {
      id: RoomId;
      exits: RoomId[];
    }
  >;
};

export type AlertPropagationResult = {
  mutated: RoomAlertState[];
  explanation: string;
};

// ------------------------------------------------------------
// Alert escalation rules (explicit & readable)
// ------------------------------------------------------------

function escalateAlert(
  current: AlertLevel
): AlertLevel {
  switch (current) {
    case "calm":
      return "suspicious";
    case "suspicious":
      return "alerted";
    case "alerted":
      return "hostile";
    case "hostile":
      return "hostile";
  }
}

// ------------------------------------------------------------
// Propagate alert through dungeon graph
// ------------------------------------------------------------

export function propagateMonsterAlert(params: {
  graph: DungeonGraph;
  originRoom: RoomId;
  depth: number;
  turn: number;
  existingAlerts: Record<RoomId, RoomAlertState>;
}): AlertPropagationResult {
  const {
    graph,
    originRoom,
    depth,
    turn,
    existingAlerts,
  } = params;

  const visited = new Set<RoomId>();
  const queue: {
    room: RoomId;
    distance: number;
  }[] = [];

  const mutations: RoomAlertState[] = [];

  visited.add(originRoom);
  queue.push({ room: originRoom, distance: 0 });

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const { room, distance } = current;
    if (distance > depth) continue;

    const prev =
      existingAlerts[room]?.alert ?? "calm";
    const next = escalateAlert(prev);

    // Only mutate if escalation occurs
    if (next !== prev) {
      mutations.push({
        roomId: room,
        alert: next,
        lastUpdatedTurn: turn,
      });
    }

    const node = graph.rooms[room];
    if (!node) continue;

    for (const nextRoom of node.exits) {
      if (!visited.has(nextRoom)) {
        visited.add(nextRoom);
        queue.push({
          room: nextRoom,
          distance: distance + 1,
        });
      }
    }
  }

  return {
    mutated: mutations,
    explanation: `Noise in ${originRoom} propagated alerts up to ${depth} rooms away.`,
  };
}
