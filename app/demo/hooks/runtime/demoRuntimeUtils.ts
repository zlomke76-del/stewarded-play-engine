import { recordEvent, type SessionState } from "@/lib/session/SessionState";

export function safeInt(n: unknown, fallback: number, lo: number, hi: number) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : fallback;
  return Math.max(lo, Math.min(hi, x));
}

export function appendEventToState(prev: SessionState, type: string, payload: any): SessionState {
  return recordEvent(prev, {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: "arbiter",
    type,
    payload,
  });
}

export function hasDungeonInitialized(events: readonly any[]) {
  return events.some((e) => e?.type === "DUNGEON_INITIALIZED");
}
