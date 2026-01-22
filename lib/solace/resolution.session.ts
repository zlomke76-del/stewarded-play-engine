// ------------------------------------------------------------
// Solace Resolution Session Binding
// ------------------------------------------------------------
// Browser Session Association
//
// Purpose:
// - Bind a resolution run to a browser session
// - Prevent cross-session mutation
// ------------------------------------------------------------

import type { ResolutionRun } from "./resolution.run";

const SESSION_KEY = "solace_active_run";

export function bindRunToSession(
  run: ResolutionRun
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    SESSION_KEY,
    run.id
  );
}

export function getBoundRunId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function clearBoundRun() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function assertSessionOwnership(
  run: ResolutionRun
) {
  const boundId = getBoundRunId();
  if (boundId && boundId !== run.id) {
    throw new Error(
      "Session violation: run does not belong to this session"
    );
  }
}
