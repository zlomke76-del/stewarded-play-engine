// ------------------------------------------------------------
// checkWanderingMonsters
// ------------------------------------------------------------
// Purpose:
// - Evaluate whether wandering monsters SHOULD be considered
// - No spawning, no encounter resolution
// - Produces advisory signals only
//
// Philosophy:
// Old-school dungeons punish delay and noise.
// Wandering monsters are pressure, not punishment.
// ------------------------------------------------------------

export type AlertLevel = "none" | "suspicious" | "alerted";

export type RoomAlert = {
  roomId: string;
  level: AlertLevel;
};

export type WanderingMonsterSignal = {
  shouldCheck: boolean;
  reason: string;
  severity: "low" | "medium" | "high";
};

// ------------------------------------------------------------
// Core logic
// ------------------------------------------------------------

export function checkWanderingMonsters(params: {
  turn: number;
  alerts: RoomAlert[];
  checkInterval?: number; // default: every 6 turns
}): WanderingMonsterSignal {
  const {
    turn,
    alerts,
    checkInterval = 6,
  } = params;

  // Never check before first interval
  if (turn === 0 || turn % checkInterval !== 0) {
    return {
      shouldCheck: false,
      reason: "No interval reached",
      severity: "low",
    };
  }

  // Determine highest alert level
  let highest: AlertLevel = "none";

  for (const a of alerts) {
    if (a.level === "alerted") {
      highest = "alerted";
      break;
    }
    if (a.level === "suspicious") {
      highest = "suspicious";
    }
  }

  // No alert → soft check only
  if (highest === "none") {
    return {
      shouldCheck: true,
      reason: `Turn ${turn}: routine patrol interval`,
      severity: "low",
    };
  }

  // Suspicious → medium pressure
  if (highest === "suspicious") {
    return {
      shouldCheck: true,
      reason: `Turn ${turn}: noise detected in dungeon`,
      severity: "medium",
    };
  }

  // Alerted → high pressure
  return {
    shouldCheck: true,
    reason: `Turn ${turn}: dungeon fully alerted`,
    severity: "high",
  };
}
