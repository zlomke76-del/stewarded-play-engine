// ------------------------------------------------------------
// propagateMonsterAlert
// ------------------------------------------------------------
// Purpose:
// - Escalate monster alert levels across adjacent rooms
// - No spawning, no timing, no automation
// - Called ONLY when Arbiter decides noise should propagate
//
// Design rules:
// - Alerts escalate but never downgrade
// - Only explored / linked rooms are affected
// - Unexplored rooms remain unknown
// ------------------------------------------------------------

export type AlertLevel = "none" | "suspicious" | "alerted";

export type RoomAlert = {
  roomId: string;
  level: AlertLevel;
  source?: string;
};

export type RoomGraph = {
  [roomId: string]: string[]; // adjacency list
};

// ------------------------------------------------------------
// Escalation logic
// ------------------------------------------------------------

function escalate(level: AlertLevel): AlertLevel {
  if (level === "none") return "suspicious";
  if (level === "suspicious") return "alerted";
  return "alerted";
}

// ------------------------------------------------------------
// Core propagation
// ------------------------------------------------------------

export function propagateMonsterAlert(
  origin: RoomAlert,
  graph: RoomGraph,
  existing: Map<string, RoomAlert>
): Map<string, RoomAlert> {
  const updated = new Map(existing);

  const neighbors = graph[origin.roomId] ?? [];

  for (const neighbor of neighbors) {
    const prev = updated.get(neighbor);

    const nextLevel = escalate(
      prev?.level ?? "none"
    );

    // Do not downgrade or overwrite higher alerts
    if (prev && prev.level === "alerted") continue;

    updated.set(neighbor, {
      roomId: neighbor,
      level: nextLevel,
      source: `noise from ${origin.roomId}`,
    });
  }

  return updated;
}
