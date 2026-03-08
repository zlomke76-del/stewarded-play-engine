// ------------------------------------------------------------
// WorldDirector
// ------------------------------------------------------------
// Observes canon events and injects world reactions.
// Deterministic rule engine — no randomness required.
// ------------------------------------------------------------

export type CanonEvent = {
  id: string;
  timestamp: number;
  type: string;
  payload?: any;
};

export type DirectorEventDraft = {
  type: string;
  payload?: any;
};

export type DirectorContext = {
  mapW: number;
  mapH: number;
};

function countEvents(events: readonly CanonEvent[], type: string) {
  return events.filter((e) => e.type === type).length;
}

function latestZone(events: readonly CanonEvent[]) {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === "OUTCOME" && e.payload?.meta?.zoneId) {
      return e.payload.meta.zoneId;
    }
  }
  return null;
}

// ------------------------------------------------------------
// Rule: Zone Pressure Escalation
// ------------------------------------------------------------

function pressureEscalation(events: readonly CanonEvent[]): DirectorEventDraft[] {
  const drafts: DirectorEventDraft[] = [];

  const pressureEvents = events.filter((e) => e.type === "ZONE_PRESSURE_CHANGED");

  if (pressureEvents.length === 0) return drafts;

  const zoneTotals: Record<string, number> = {};

  for (const e of pressureEvents) {
    const zone = String(e.payload?.zoneId ?? "");
    const delta = Number(e.payload?.delta ?? 0);

    if (!zone) continue;

    zoneTotals[zone] = (zoneTotals[zone] ?? 0) + delta;
  }

  for (const zoneId of Object.keys(zoneTotals)) {
    const pressure = zoneTotals[zoneId];

    if (pressure >= 70) {
      drafts.push({
        type: "DIRECTOR_AMBUSH_TRIGGERED",
        payload: { zoneId },
      });
    }
  }

  return drafts;
}

// ------------------------------------------------------------
// Rule: Goblin Captain Deployment
// ------------------------------------------------------------

function goblinCommandResponse(events: readonly CanonEvent[]): DirectorEventDraft[] {
  const drafts: DirectorEventDraft[] = [];

  const goblinKills = events.filter(
    (e) =>
      e.type === "ENEMY_DEFEATED" &&
      String(e.payload?.enemyType ?? "").toLowerCase().includes("goblin")
  ).length;

  const captainAlreadySpawned = events.some(
    (e) => e.type === "DIRECTOR_GOBLIN_CAPTAIN_DEPLOYED"
  );

  if (goblinKills >= 3 && !captainAlreadySpawned) {
    const zoneId = latestZone(events);

    drafts.push({
      type: "DIRECTOR_GOBLIN_CAPTAIN_DEPLOYED",
      payload: {
        zoneId,
      },
    });
  }

  return drafts;
}

// ------------------------------------------------------------
// Rule: Boss Awakening
// ------------------------------------------------------------

function relicAwakening(events: readonly CanonEvent[]): DirectorEventDraft[] {
  const drafts: DirectorEventDraft[] = [];

  const relicFound = events.some((e) => e.type === "RELIC_RECOVERED");
  const bossAwakened = events.some((e) => e.type === "DIRECTOR_BOSS_AWAKENED");

  if (relicFound && !bossAwakened) {
    drafts.push({
      type: "DIRECTOR_BOSS_AWAKENED",
      payload: {
        boss: "Ancient Warden",
      },
    });
  }

  return drafts;
}

// ------------------------------------------------------------
// Rule: Zone Secured
// ------------------------------------------------------------

function zoneCleared(events: readonly CanonEvent[]): DirectorEventDraft[] {
  const drafts: DirectorEventDraft[] = [];

  const enemiesDefeated = countEvents(events, "ENEMY_DEFEATED");

  const zone = latestZone(events);

  if (!zone) return drafts;

  if (enemiesDefeated >= 5) {
    drafts.push({
      type: "ZONE_SECURED",
      payload: { zoneId: zone },
    });
  }

  return drafts;
}

// ------------------------------------------------------------
// Main Director Engine
// ------------------------------------------------------------

export function runWorldDirector(
  events: readonly CanonEvent[],
  ctx: DirectorContext
): DirectorEventDraft[] {
  const drafts: DirectorEventDraft[] = [];

  drafts.push(...pressureEscalation(events));
  drafts.push(...goblinCommandResponse(events));
  drafts.push(...relicAwakening(events));
  drafts.push(...zoneCleared(events));

  return drafts;
}
