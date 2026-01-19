// ------------------------------------------------------------
// SessionState.ts
// ------------------------------------------------------------
// Stewarded Play Engine
//
// Purpose:
// - Track what IS true in a session
// - Never decide what SHOULD happen
// - Enforce human confirmation structurally
//
// This file is intentionally strict.
// ------------------------------------------------------------

export type SessionId = string;
export type ActorId = string;
export type SceneId = string;
export type EventId = string;

/* ------------------------------------------------------------
   Core Concepts
------------------------------------------------------------ */

/**
 * A SessionEvent is immutable historical fact.
 * Once recorded, it must never be edited or deleted.
 */
export interface SessionEvent {
  id: EventId;
  timestamp: number;
  actor: ActorId | "system";
  type: string;
  payload: Record<string, unknown>;
}

/**
 * PendingChange represents a proposed state mutation
 * that MUST be explicitly confirmed by a human facilitator.
 */
export interface PendingChange {
  id: string;
  description: string;
  proposedBy: "system" | ActorId;
  createdAt: number;
}

/**
 * SessionState is a snapshot derived from events.
 * It does not contain logic for deciding outcomes.
 */
export interface SessionState {
  sessionId: SessionId;
  sceneId: SceneId | null;

  // Canonical event log (append-only)
  events: readonly SessionEvent[];

  // Unconfirmed changes awaiting human approval
  pending: readonly PendingChange[];

  // Arbitrary tags for facilitators (threat, tension, time pressure)
  flags: readonly string[];

  // Session lifecycle
  startedAt: number;
  endedAt: number | null;
}

/* ------------------------------------------------------------
   Creation
------------------------------------------------------------ */

export function createSession(sessionId: SessionId): SessionState {
  return {
    sessionId,
    sceneId: null,
    events: [],
    pending: [],
    flags: [],
    startedAt: Date.now(),
    endedAt: null,
  };
}

/* ------------------------------------------------------------
   Read Operations (Safe)
------------------------------------------------------------ */

export function getEvents(state: SessionState): readonly SessionEvent[] {
  return state.events;
}

export function getPendingChanges(
  state: SessionState
): readonly PendingChange[] {
  return state.pending;
}

/* ------------------------------------------------------------
   Write Operations (Guarded)
------------------------------------------------------------ */

/**
 * Propose a change to the session.
 * This does NOT modify canonical state.
 */
export function proposeChange(
  state: SessionState,
  change: PendingChange
): SessionState {
  return {
    ...state,
    pending: [...state.pending, change],
  };
}

/**
 * Confirm a previously proposed change.
 * MUST be called by a human facilitator.
 */
export function confirmChange(
  state: SessionState,
  changeId: string,
  confirmedBy: ActorId
): SessionState {
  const change = state.pending.find((c) => c.id === changeId);
  if (!change) {
    throw new Error(`Pending change not found: ${changeId}`);
  }

  const event: SessionEvent = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: confirmedBy,
    type: "CONFIRMED_CHANGE",
    payload: {
      description: change.description,
      proposedBy: change.proposedBy,
    },
  };

  return {
    ...state,
    events: [...state.events, event],
    pending: state.pending.filter((c) => c.id !== changeId),
  };
}

/**
 * Record a narrative or mechanical event AFTER confirmation.
 */
export function recordEvent(
  state: SessionState,
  event: SessionEvent
): SessionState {
  return {
    ...state,
    events: [...state.events, event],
  };
}

/* ------------------------------------------------------------
   Scene Control (Explicit)
------------------------------------------------------------ */

export function setScene(
  state: SessionState,
  sceneId: SceneId,
  confirmedBy: ActorId
): SessionState {
  const event: SessionEvent = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: confirmedBy,
    type: "SET_SCENE",
    payload: { sceneId },
  };

  return {
    ...state,
    sceneId,
    events: [...state.events, event],
  };
}

/* ------------------------------------------------------------
   Session Termination
------------------------------------------------------------ */

export function endSession(
  state: SessionState,
  confirmedBy: ActorId
): SessionState {
  if (state.endedAt !== null) {
    return state;
  }

  const event: SessionEvent = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: confirmedBy,
    type: "END_SESSION",
    payload: {},
  };

  return {
    ...state,
    endedAt: Date.now(),
    events: [...state.events, event],
  };
}

/* ------------------------------------------------------------
   HARD BANS (By Design)
------------------------------------------------------------ */
// There is intentionally NO:
// - decideOutcome()
// - resolveAction()
// - evaluateMorality()
// - autoNarrate()
// - mutateStateSilently()
//
// If you feel tempted to add one,
// you are violating the project premise.
// ------------------------------------------------------------
