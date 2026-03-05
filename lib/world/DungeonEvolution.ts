// lib/world/DungeonEvolution.ts
// ------------------------------------------------------------
// Dungeon Evolution (READ-ONLY, deterministic)
// ------------------------------------------------------------
// Purpose:
// - Provide a shared, canonical-friendly "dungeon state" layer that multiple
//   systems can reuse (UI panels, encounter logic, ambience, pacing).
//
// Key principle:
// - NO side effects, NO randomness, NO mutation.
// - This module *derives* from existing canon events.
// - If certain events don't exist yet, it degrades gracefully.
//
// Inputs:
// - events: session event log
// - zoneId: current zone (ex: "0,0")
// - nearbyZoneIds: optional adjacency list for "nearby heat" blending
//
// Outputs:
// - condition: broad stability level
// - apex: "dragon-like apex presence" pacing state (none → suspected → present → imminent)
// - signals: short, player-facing foreshadow lines
// - nextTriggerHints: what tends to push the dungeon toward worse states
// - debug: optional diagnostics (safe to show in dev UI)
// ------------------------------------------------------------

export type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
  timestamp?: number;
};

export type DungeonCondition = "Stable" | "Disturbed" | "Unstable" | "Warped";
export type ApexPresence = "None" | "Suspected" | "Present" | "Imminent";

export type DungeonEvolution = {
  condition: DungeonCondition;
  apex: ApexPresence;
  signals: string[];
  nextTriggerHints: string[];
  debug: {
    zonePressure: number;
    zoneAwareness: number;
    nearbyPressureMax: number;
    nearbyAwarenessMax: number;
    recentLoudEvents: number;
    recentFailures: number;
    recentViolence: number;
    outcomesInZone: number;
    score: number; // 0..100
  };
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function safeNum(x: any): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function isZoneId(x: any): x is string {
  return typeof x === "string" && /^\-?\d+,\-?\d+$/.test(x.trim());
}

function lastN<T>(arr: readonly T[], n: number) {
  if (n <= 0) return [];
  return arr.slice(Math.max(0, arr.length - n));
}

// ------------------------------------------------------------
// Aggregate canonical pressure/awareness (same semantics as the panel)
// ------------------------------------------------------------

function aggregateZonePressure(events: readonly SessionEvent[]) {
  const byZone = new Map<string, number>();
  let saw = false;

  for (const e of events) {
    if (e?.type !== "ZONE_PRESSURE_CHANGED") continue;
    const zoneId = isZoneId(e?.payload?.zoneId) ? String(e.payload.zoneId) : null;
    const delta = safeNum(e?.payload?.delta);
    if (!zoneId || delta === null) continue;

    saw = true;
    const prev = byZone.get(zoneId) ?? 0;
    byZone.set(zoneId, clamp(prev + delta, 0, 100));
  }

  return { byZone, sawCanonical: saw };
}

function aggregateZoneAwareness(events: readonly SessionEvent[]) {
  const byZone = new Map<string, number>();
  let saw = false;

  for (const e of events) {
    if (e?.type === "ZONE_AWARENESS_CHANGED") {
      const zoneId = isZoneId(e?.payload?.zoneId) ? String(e.payload.zoneId) : null;
      const delta = safeNum(e?.payload?.delta);
      if (!zoneId || delta === null) continue;

      saw = true;
      const prev = byZone.get(zoneId) ?? 0;
      byZone.set(zoneId, clamp(prev + delta, 0, 100));
      continue;
    }

    if (e?.type === "ZONE_RESPONSE_TRIGGERED") {
      const zoneId = isZoneId(e?.payload?.zoneId) ? String(e.payload.zoneId) : null;
      if (!zoneId) continue;

      saw = true;
      const resetTo = safeNum(e?.payload?.resetTo);
      byZone.set(zoneId, clamp(resetTo ?? 40, 0, 100));
      continue;
    }
  }

  return { byZone, sawCanonical: saw };
}

// ------------------------------------------------------------
// “Loudness” + “violence” heuristics from canon events (optional)
// ------------------------------------------------------------

function classifyOutcome(e: SessionEvent) {
  if (e?.type !== "OUTCOME") return null;

  const meta = e?.payload?.meta ?? {};
  const zoneId = isZoneId(meta?.zoneId) ? String(meta.zoneId) : null;

  const optionKind =
    typeof meta?.optionKind === "string" ? String(meta.optionKind) : null; // "safe" | "environmental" | "risky" | "contested"
  const success = typeof meta?.success === "boolean" ? meta.success : null;

  const intent = typeof meta?.intent === "string" ? meta.intent : "";
  const opt = typeof meta?.optionDescription === "string" ? meta.optionDescription : "";
  const text = `${intent}\n${opt}`.toLowerCase();

  // Violence signal (not perfect; deterministic)
  const violence =
    text.includes("attack") ||
    text.includes("shoot") ||
    text.includes("stab") ||
    text.includes("slash") ||
    text.includes("kill") ||
    text.includes("fireball") ||
    text.includes("cast") ||
    text.includes("strike");

  // Loudness model: contested/risky + failure tend to be “noisier”
  const kindWeight =
    optionKind === "contested" ? 3 : optionKind === "risky" ? 2 : optionKind === "environmental" ? 1 : 0;
  const failWeight = success === false ? 3 : 0;
  const violenceWeight = violence ? 2 : 0;

  const loudness = kindWeight + failWeight + violenceWeight; // 0..8-ish

  return { zoneId, optionKind, success, violence, loudness };
}

function countRecentSignals(events: readonly SessionEvent[], zoneId: string) {
  const recent = lastN(events, 30); // window (tunable)
  let recentLoudEvents = 0;
  let recentFailures = 0;
  let recentViolence = 0;
  let outcomesInZone = 0;

  for (const e of recent) {
    const o = classifyOutcome(e);
    if (!o) continue;
    if (!o.zoneId || o.zoneId !== zoneId) continue;

    outcomesInZone++;
    if (o.loudness >= 4) recentLoudEvents++;
    if (o.success === false) recentFailures++;
    if (o.violence) recentViolence++;
  }

  return { recentLoudEvents, recentFailures, recentViolence, outcomesInZone };
}

// ------------------------------------------------------------
// Main derive
// ------------------------------------------------------------

function conditionFromScore(score: number): DungeonCondition {
  const s = clamp(Math.round(score), 0, 100);
  if (s < 25) return "Stable";
  if (s < 50) return "Disturbed";
  if (s < 75) return "Unstable";
  return "Warped";
}

function apexFromScore(score: number, awareness: number, pressure: number): ApexPresence {
  // “Apex presence” should be rare AND telegraphed.
  // We require both:
  // - high combined score
  // - and either awareness or pressure to be meaningfully high
  const s = clamp(Math.round(score), 0, 100);
  const a = clamp(Math.round(awareness), 0, 100);
  const p = clamp(Math.round(pressure), 0, 100);

  if (s < 45) return "None";
  if (s < 65) return "Suspected";
  if (s < 85) return "Present";
  // Imminent requires serious heat
  if (a >= 75 || p >= 75) return "Imminent";
  return "Present";
}

function buildSignals(input: {
  condition: DungeonCondition;
  apex: ApexPresence;
  pressure: number;
  awareness: number;
  nearbyPressure: number;
  nearbyAwareness: number;
  recentLoudEvents: number;
  recentFailures: number;
  recentViolence: number;
}): string[] {
  const {
    condition,
    apex,
    pressure,
    awareness,
    nearbyPressure,
    nearbyAwareness,
    recentLoudEvents,
    recentFailures,
    recentViolence,
  } = input;

  const out: string[] = [];

  // Condition flavor (kept short; meant to be read mid-play)
  if (condition === "Stable") out.push("The air is still. Your footsteps feel loud in the quiet.");
  if (condition === "Disturbed") out.push("You sense movement at the edge of hearing—something is awake.");
  if (condition === "Unstable") out.push("The dungeon feels reactive. Small sounds travel too far.");
  if (condition === "Warped") out.push("The dungeon feels hostile—like it is leaning toward you.");

  // Pressure/Awareness cues
  if (pressure >= 45) out.push("Heat builds in this zone. Patience is thinning.");
  if (awareness >= 50) out.push("Eyes are on the area. Routes are being checked.");
  if (nearbyPressure >= 50 || nearbyAwareness >= 50) out.push("Nearby zones are hot—trouble is close.");

  // Recent behavior cues
  if (recentLoudEvents >= 2) out.push("Echoes repeat in the stone. Someone heard that.");
  if (recentFailures >= 2) out.push("Mistakes stack. The dungeon starts predicting you.");
  if (recentViolence >= 2) out.push("The scent of violence lingers. Predators notice patterns.");

  // Apex pacing (dragon-like) – telegraph first, then escalate
  if (apex === "Suspected") out.push("You notice signs of a larger presence—scratches, heat, unnatural silence.");
  if (apex === "Present") out.push("A shadow of something immense seems to pass through the dungeon’s rhythms.");
  if (apex === "Imminent") out.push("The air tightens. If something apex is here… it is close.");

  // De-dup (preserve order)
  const seen = new Set<string>();
  return out.filter((s) => (seen.has(s) ? false : (seen.add(s), true)));
}

function buildNextTriggerHints(): string[] {
  // Keep stable, evergreen, player-facing
  return [
    "Repeated loud actions raise attention quickly (failed or contested moves especially).",
    "Violence escalates pressure faster than stealth or careful exploration.",
    "Staying in a hot zone too long invites escalation—repositioning can matter.",
    "If the dungeon feels ‘apex-touched’, conserve resources and reduce noise.",
  ];
}

// Public API
export function deriveDungeonEvolution(args: {
  events: readonly SessionEvent[];
  zoneId: string;
  nearbyZoneIds?: readonly string[];
}): DungeonEvolution {
  const { events, zoneId, nearbyZoneIds = [] } = args;

  const pressureAgg = aggregateZonePressure(events);
  const awarenessAgg = aggregateZoneAwareness(events);

  const zonePressure = pressureAgg.byZone.get(zoneId) ?? 0;
  const zoneAwareness = awarenessAgg.byZone.get(zoneId) ?? 0;

  let nearbyPressureMax = 0;
  let nearbyAwarenessMax = 0;

  for (const z of nearbyZoneIds) {
    nearbyPressureMax = Math.max(nearbyPressureMax, pressureAgg.byZone.get(z) ?? 0);
    nearbyAwarenessMax = Math.max(nearbyAwarenessMax, awarenessAgg.byZone.get(z) ?? 0);
  }

  const { recentLoudEvents, recentFailures, recentViolence, outcomesInZone } = countRecentSignals(events, zoneId);

  // Score: pressure/awareness are primary; recent behavior adds acceleration
  // Tuned to feel “earned” and not jumpy.
  const score =
    zonePressure * 0.45 +
    zoneAwareness * 0.45 +
    clamp(recentLoudEvents, 0, 6) * 3 +
    clamp(recentFailures, 0, 6) * 2 +
    clamp(recentViolence, 0, 6) * 2 +
    Math.max(nearbyPressureMax, nearbyAwarenessMax) * 0.10;

  const normalizedScore = clamp(Math.round(score), 0, 100);
  const condition = conditionFromScore(normalizedScore);
  const apex = apexFromScore(normalizedScore, zoneAwareness, zonePressure);

  const signals = buildSignals({
    condition,
    apex,
    pressure: zonePressure,
    awareness: zoneAwareness,
    nearbyPressure: nearbyPressureMax,
    nearbyAwareness: nearbyAwarenessMax,
    recentLoudEvents,
    recentFailures,
    recentViolence,
  });

  return {
    condition,
    apex,
    signals,
    nextTriggerHints: buildNextTriggerHints(),
    debug: {
      zonePressure: Math.round(zonePressure),
      zoneAwareness: Math.round(zoneAwareness),
      nearbyPressureMax: Math.round(nearbyPressureMax),
      nearbyAwarenessMax: Math.round(nearbyAwarenessMax),
      recentLoudEvents,
      recentFailures,
      recentViolence,
      outcomesInZone,
      score: normalizedScore,
    },
  };
}
