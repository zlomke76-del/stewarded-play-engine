// ------------------------------------------------------------
// patrolRoutes
// ------------------------------------------------------------
// Purpose:
// - Represent dungeon rooms as a graph
// - Traverse adjacent rooms for patrol movement
// - Support alert propagation & patrol reach
//
// Governance:
// - Advisory only
// - No monster creation
// - No automatic state mutation
// - Arbiter always decides outcomes
// ------------------------------------------------------------

export type RoomId = string;

export type RoomNode = {
  id: RoomId;
  exits: RoomId[]; // adjacent rooms
};

export type DungeonGraph = {
  rooms: Record<RoomId, RoomNode>;
};

export type PatrolTraversal = {
  origin: RoomId;
  reachable: RoomId[];
  depth: number;
};

// ------------------------------------------------------------
// Graph traversal (BFS)
// ------------------------------------------------------------

export function traverseRooms(params: {
  graph: DungeonGraph;
  start: RoomId;
  maxDepth: number;
}): PatrolTraversal {
  const { graph, start, maxDepth } = params;

  const visited = new Set<RoomId>();
  const queue: { room: RoomId; depth: number }[] = [];

  visited.add(start);
  queue.push({ room: start, depth: 0 });

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const { room, depth } = current;
    if (depth >= maxDepth) continue;

    const node = graph.rooms[room];
    if (!node) continue;

    for (const next of node.exits) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ room: next, depth: depth + 1 });
      }
    }
  }

  return {
    origin: start,
    reachable: Array.from(visited).filter(
      (r) => r !== start
    ),
    depth: maxDepth,
  };
}

// ------------------------------------------------------------
// Patrol suggestion helper
// ------------------------------------------------------------

export function suggestPatrolMovement(params: {
  graph: DungeonGraph;
  patrolRoom: RoomId;
  alertDepth: number; // how far noise/alerts travel
}): {
  suggestedRooms: RoomId[];
  explanation: string;
} {
  const traversal = traverseRooms({
    graph: params.graph,
    start: params.patrolRoom,
    maxDepth: params.alertDepth,
  });

  return {
    suggestedRooms: traversal.reachable,
    explanation: `Patrols from ${params.patrolRoom} could reach ${traversal.reachable.length} rooms within ${params.alertDepth} steps.`,
  };
}
