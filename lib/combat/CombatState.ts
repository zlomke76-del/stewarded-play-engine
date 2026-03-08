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
// Upgrades in this pass:
// - COMBAT_ENDED is now part of derivation
// - Defeated / downed combatants are removed from active turn order
// - Turn pointer is normalized against surviving combatants
// - Initiative remains fully inspectable, but order reflects living actors
//
// Notes:
// - This module is PURE (no side effects)
// - UI can use helpers to generate payloads,
//   but canon is committed by recording events.
// - We treat COMBATANT_DOWNED as the canonical “out of fight” signal.
//   COMBATANT_DAMAGED alone does not remove a combatant unless a matching
//   COMBATANT_DOWNED event exists.
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

export type CombatEndedPayload = {
  combatId: CombatId;
};

export type CombatEvent =
  | { type: "COMBAT_STARTED"; payload: CombatStartedPayload }
  | { type: "INITIATIVE_ROLLED"; payload: InitiativeRolledPayload }
  | { type: "TURN_ADVANCED"; payload: TurnAdvancedPayload }
  | { type: "COMBAT_ENDED"; payload: CombatEndedPayload };

export type DerivedInitiativeEntry = {
  combatantId: CombatantId;
  name: string;
  kind: CombatantKind;
  natural: number;
  modifier: number;
  total: number;
  defeated: boolean;
};

export type DerivedCombatState = {
  combatId: CombatId;
  seed: string;
  participants: CombatantSpec[];

  // initiative
  initiative: DerivedInitiativeEntry[];
  order: CombatantId[]; // sorted surviving combatants only
  fullOrder: CombatantId[]; // sorted all combatants, including defeated
  defeatedCombatantIds: CombatantId[];

  // turn pointer (derived from last TURN_ADVANCED or defaults)
  round: number;
  index: number;
  activeCombatantId: CombatantId | null;

  // combat lifecycle
  ended: boolean;
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

  if (e.type === "COMBAT_ENDED") {
    const p = e.payload as unknown as CombatEndedPayload;
    if (!p?.combatId) return null;
    return { type: "COMBAT_ENDED", payload: p };
  }

  return null;
}

function isCombatantDowned(
  combatId: CombatId,
  combatantId: CombatantId,
  sessionEvents: readonly GenericSessionEvent[]
): boolean {
  let downed = false;

  for (const e of sessionEvents) {
    const type = String(e?.type ?? "");
    const payload = (e?.payload ?? {}) as Record<string, unknown>;

    if (String(payload?.combatId ?? "") !== String(combatId)) continue;

    if (type === "COMBATANT_DOWNED") {
      if (String(payload?.combatantId ?? "") === String(combatantId)) {
        downed = true;
      }
      continue;
    }

    if (type === "COMBATANT_REVIVED") {
      if (String(payload?.combatantId ?? "") === String(combatantId)) {
        downed = false;
      }
      continue;
    }

    if (type === "COMBATANT_RESTORED") {
      if (String(payload?.combatantId ?? "") === String(combatantId)) {
        downed = false;
      }
      continue;
    }

    if (type === "COMBATANT_HEALED") {
      if (String(payload?.targetCombatantId ?? "") === String(combatantId)) {
        const amount = Number(payload?.amount ?? 0);
        if (Number.isFinite(amount) && amount > 0) {
          downed = false;
        }
      }
      continue;
    }
  }

  return downed;
}

function compareInitiative(
  a: DerivedInitiativeEntry & { _nameKey: string },
  b: DerivedInitiativeEntry & { _nameKey: string }
) {
  if (b.total !== a.total) return b.total - a.total;
  if (b.natural !== a.natural) return b.natural - a.natural;
  return a._nameKey.localeCompare(b._nameKey);
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

  let ended = false;
  for (const e of sessionEvents) {
    const ce = asCombatEvent(e as GenericSessionEvent);
    if (!ce) continue;
    if (ce.type === "COMBAT_ENDED" && ce.payload.combatId === combatId) {
      ended = true;
    }
  }

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

  const defeatedSet = new Set<CombatantId>(
    started.participants
      .filter((p) => isCombatantDowned(combatId, p.id, sessionEvents))
      .map((p) => p.id)
  );

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
        defeated: defeatedSet.has(c.id),
      } as DerivedInitiativeEntry;
    })
    .filter(Boolean) as DerivedInitiativeEntry[];

  // Derive full order:
  // - If not all participants have initiative yet, keep participant order stable.
  // - If all have rolls, sort by total desc, tie-breaker by natural desc,
  //   then by name for stability.
  const allRolled = started.participants.every((p) => initById.has(p.id));

  let fullOrder: CombatantId[];
  if (!allRolled) {
    fullOrder = started.participants.map((p) => p.id);
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
          defeated: defeatedSet.has(p.id),
          _nameKey: (p.name ?? "").toLowerCase(),
        };
      });

    entries.sort(compareInitiative);
    fullOrder = entries.map((e) => e.combatantId);
  }

  const order = fullOrder.filter((id) => !defeatedSet.has(id));

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

  if (ended || order.length === 0) {
    return {
      combatId,
      seed: started.seed,
      participants: started.participants,
      initiative,
      order,
      fullOrder,
      defeatedCombatantIds: Array.from(defeatedSet),
      round,
      index: 0,
      activeCombatantId: null,
      ended,
    };
  }

  // If living order changed because somebody died, normalize index.
  // We preserve intent by wrapping within surviving combatants.
  const safeIndex = ((index % order.length) + order.length) % order.length;
  const activeCombatantId = order[safeIndex] ?? null;

  return {
    combatId,
    seed: started.seed,
    participants: started.participants,
    initiative,
    order,
    fullOrder,
    defeatedCombatantIds: Array.from(defeatedSet),
    round,
    index: safeIndex,
    activeCombatantId,
    ended,
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
    return { combatId: derived.combatId, round: derived.round, index: 0 };
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
