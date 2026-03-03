// lib/combat/CombatState.ts
// ------------------------------------------------------------
// Stewarded Play Engine — Combat Derivation (Grouped Enemies)
// ------------------------------------------------------------
//
// Purpose:
// - Provide a deterministic, replayable combat loop
// - Players roll individually; enemies can roll as groups
// - Turn order is DERIVED (never stored as mutable state)
// - All mutations are represented as append-only events
//
// Notes:
// - This module is PURE (no side effects)
// - UI can use helpers to generate payloads,
//   but canon is committed by recording events.
//
// ------------------------------------------------------------

export type CombatId = string;
export type CombatantId = string;

export type CombatantKind = "player" | "enemy" | "enemy_group";

export type CombatantSpec = {
  id: CombatantId;
  name: string;
  kind: CombatantKind;
  initiativeMod: number; // typically DEX mod
};

export type CombatStartedPayload = {
  combatId: CombatId;
  seed: string; // string seed to support deterministic RNG
  participants: CombatantSpec[];
};

export type InitiativeRolledPayload = {
  combatId: CombatId;
  combatantId: CombatantId;
  natural: number; // 1..20
  modifier: number;
  total: number;
  rngIndex: number; // to prove deterministic roll ordering
};

export type TurnAdvancedPayload = {
  combatId: CombatId;
  round: number; // 1-based
  index: number; // 0-based position in derived initiative order
};

export type CombatEvent =
  | { type: "COMBAT_STARTED"; payload: CombatStartedPayload }
  | { type: "INITIATIVE_ROLLED"; payload: InitiativeRolledPayload }
  | { type: "TURN_ADVANCED"; payload: TurnAdvancedPayload };

export type DerivedInitiativeEntry = {
  combatantId: CombatantId;
  name: string;
  kind: CombatantKind;
  natural: number;
  modifier: number;
  total: number;
};

export type DerivedCombatState = {
  combatId: CombatId;
  seed: string;
  participants: CombatantSpec[];

  // initiative
  initiative: DerivedInitiativeEntry[];
  order: CombatantId[]; // sorted combatants

  // turn pointer (derived from last TURN_ADVANCED or defaults)
  round: number;
  index: number;
  activeCombatantId: CombatantId | null;
};

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(min, Math.min(max, x));
}

// ------------------------------------------------------------
// Deterministic RNG (seed string -> uint32 -> mulberry32)
// ------------------------------------------------------------

function hash32(s: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function d20(rng: () => number) {
  return 1 + Math.floor(rng() * 20);
}

// ------------------------------------------------------------
// Event extraction helpers (works with your SessionEvent style)
// ------------------------------------------------------------

type GenericSessionEvent = {
  type: string;
  payload: Record<string, unknown>;
};

function asCombatEvent(e: GenericSessionEvent): CombatEvent | null {
  if (e.type === "COMBAT_STARTED") {
    const p = e.payload as unknown as CombatStartedPayload;
    if (!p?.combatId || !p?.seed || !Array.isArray(p.participants)) return null;
    return { type: "COMBAT_STARTED", payload: p };
  }

  if (e.type === "INITIATIVE_ROLLED") {
    const p = e.payload as unknown as InitiativeRolledPayload;
    if (!p?.combatId || !p?.combatantId) return null;
    return { type: "INITIATIVE_ROLLED", payload: p };
  }

  if (e.type === "TURN_ADVANCED") {
    const p = e.payload as unknown as TurnAdvancedPayload;
    if (!p?.combatId) return null;
    return { type: "TURN_ADVANCED", payload: p };
  }

  return null;
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

export function findLatestCombatId(
  sessionEvents: readonly GenericSessionEvent[]
): CombatId | null {
  for (let i = sessionEvents.length - 1; i >= 0; i--) {
    const ce = asCombatEvent(sessionEvents[i] as GenericSessionEvent);
    if (ce?.type === "COMBAT_STARTED") return ce.payload.combatId;
  }
  return null;
}

/**
 * Derive combat state for a given combatId from an append-only event log.
 * Never mutates; never stores pointers in state.
 */
export function deriveCombatState(
  combatId: CombatId,
  sessionEvents: readonly GenericSessionEvent[]
): DerivedCombatState | null {
  // Find the COMBAT_STARTED payload for this combatId
  let started: CombatStartedPayload | null = null;

  for (const e of sessionEvents) {
    const ce = asCombatEvent(e as GenericSessionEvent);
    if (!ce) continue;
    if (ce.type === "COMBAT_STARTED" && ce.payload.combatId === combatId) {
      started = ce.payload;
      break;
    }
  }

  if (!started) return null;

  // Gather initiative rolls
  const initById = new Map<CombatantId, InitiativeRolledPayload>();

  for (const e of sessionEvents) {
    const ce = asCombatEvent(e as GenericSessionEvent);
    if (!ce) continue;
    if (ce.type !== "INITIATIVE_ROLLED") continue;
    if (ce.payload.combatId !== combatId) continue;

    // last roll wins (append-only allows overrides if you ever need them)
    initById.set(ce.payload.combatantId, ce.payload);
  }

  const initiative: DerivedInitiativeEntry[] = started.participants
    .map((c) => {
      const r = initById.get(c.id);
      if (!r) return null;
      return {
        combatantId: c.id,
        name: c.name,
        kind: c.kind,
        natural: clampInt(r.natural, 1, 20),
        modifier: Math.trunc(r.modifier ?? 0),
        total: Math.trunc(r.total ?? 0),
      } as DerivedInitiativeEntry;
    })
    .filter(Boolean) as DerivedInitiativeEntry[];

  // Derive order:
  // - If not all participants have initiative yet, keep participant order stable.
  // - If all have rolls, sort by total desc, tie-breaker by natural desc,
  //   then by name for stability.
  const allRolled = started.participants.every((p) => initById.has(p.id));

  let order: CombatantId[];
  if (!allRolled) {
    order = started.participants.map((p) => p.id);
  } else {
    const entries: Array<DerivedInitiativeEntry & { _nameKey: string }> =
      started.participants.map((p) => {
        const r = initById.get(p.id)!;
        return {
          combatantId: p.id,
          name: p.name,
          kind: p.kind,
          natural: clampInt(r.natural, 1, 20),
          modifier: Math.trunc(r.modifier ?? 0),
          total: Math.trunc(r.total ?? 0),
          _nameKey: (p.name ?? "").toLowerCase(),
        };
      });

    entries.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.natural !== a.natural) return b.natural - a.natural;
      return a._nameKey.localeCompare(b._nameKey);
    });

    order = entries.map((e) => e.combatantId);
  }

  // Turn pointer from last TURN_ADVANCED
  let round = 1;
  let index = 0;

  for (const e of sessionEvents) {
    const ce = asCombatEvent(e as GenericSessionEvent);
    if (!ce) continue;
    if (ce.type !== "TURN_ADVANCED") continue;
    if (ce.payload.combatId !== combatId) continue;

    round = clampInt(ce.payload.round, 1, 10_000);
    index = clampInt(ce.payload.index, 0, 10_000);
  }

  if (order.length === 0) {
    return {
      combatId,
      seed: started.seed,
      participants: started.participants,
      initiative,
      order,
      round,
      index,
      activeCombatantId: null,
    };
  }

  // If index exceeds order (e.g., order changed), clamp
  const safeIndex = clampInt(index, 0, order.length - 1);
  const activeCombatantId = order[safeIndex] ?? null;

  return {
    combatId,
    seed: started.seed,
    participants: started.participants,
    initiative,
    order,
    round,
    index: safeIndex,
    activeCombatantId,
  };
}

/**
 * Generate deterministic initiative payloads for the participants using combat seed.
 * This does NOT write anything—UI can commit them as events.
 */
export function generateDeterministicInitiativeRolls(
  started: CombatStartedPayload
): InitiativeRolledPayload[] {
  const rng = mulberry32(hash32(started.seed));
  let rngIndex = 0;

  return started.participants.map((p) => {
    rngIndex += 1;
    const natural = d20(rng);
    const modifier = Math.trunc(p.initiativeMod ?? 0);
    const total = natural + modifier;

    return {
      combatId: started.combatId,
      combatantId: p.id,
      natural,
      modifier,
      total,
      rngIndex,
    };
  });
}

/**
 * Given a derived combat state, compute the NEXT turn pointer.
 * You still commit it via a TURN_ADVANCED event.
 */
export function nextTurnPointer(derived: DerivedCombatState): TurnAdvancedPayload {
  const n = derived.order.length;
  if (n <= 0) {
    return { combatId: derived.combatId, round: derived.round, index: derived.index };
  }

  const nextIndex = derived.index + 1;
  if (nextIndex < n) {
    return { combatId: derived.combatId, round: derived.round, index: nextIndex };
  }

  return { combatId: derived.combatId, round: derived.round + 1, index: 0 };
}

export function formatCombatantLabel(
  c: CombatantSpec
): string {
  if (c.kind === "enemy_group") return `${c.name} (Group)`;
  if (c.kind === "enemy") return `${c.name}`;
  return `${c.name}`;
}
