// lib/chat/router.ts

import { routeMode } from '@/core/mode-router';

export type ModeRoute = ReturnType<typeof routeMode>;

/**
 * Thin wrapper around the existing core mode router so the chat
 * orchestrator can stay decoupled from app/api details.
 *
 * We accept either:
 *   - detectMode(lastUser, lastModeHeader: string | null)
 *   - detectMode(lastUser, { lastMode: string | null })
 *
 * and normalize both into the shape routeMode expects.
 */
export function detectMode(lastUser: string, lastModeOrOpts?: any): ModeRoute {
  const text = (lastUser || '').trim();

  let lastMode: string | null = null;

  if (typeof lastModeOrOpts === 'string') {
    lastMode = lastModeOrOpts || null;
  } else if (lastModeOrOpts && typeof lastModeOrOpts === 'object') {
    lastMode = lastModeOrOpts.lastMode ?? null;
  }

  return routeMode(text, { lastMode: lastMode as any });
}
