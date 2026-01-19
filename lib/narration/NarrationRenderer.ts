// ------------------------------------------------------------
// NarrationRenderer.ts
// ------------------------------------------------------------
// Stewarded Play Engine
//
// Purpose:
// - Render narration from CONFIRMED session events only
// - Provide tone and clarity without authority
// - Never decide or advance state
//
// This module is output-only by design.
// ------------------------------------------------------------

import { SessionEvent } from "@/lib/session/SessionState";

/* ------------------------------------------------------------
   Narration Input / Output
------------------------------------------------------------ */

export interface NarrationOptions {
  tone?: "neutral" | "tense" | "quiet" | "dramatic";
  sensoryLevel?: "minimal" | "standard";
}

/**
 * RenderedNarration is plain text intended for display or reading.
 * It carries no authority and no implications beyond description.
 */
export interface RenderedNarration {
  eventId: string;
  text: string;
}

/* ------------------------------------------------------------
   Renderer Entry Point
------------------------------------------------------------ */

/**
 * renderNarration
 *
 * Accepts ONLY a confirmed SessionEvent.
 * Produces descriptive narration with no causal power.
 */
export function renderNarration(
  event: SessionEvent,
  options: NarrationOptions = {}
): RenderedNarration {
  const tone = options.tone ?? "neutral";
  const sensory = options.sensoryLevel ?? "standard";

  const text = describeEvent(event, tone, sensory);

  return {
    eventId: event.id,
    text,
  };
}

/* ------------------------------------------------------------
   Event Description (Strict Mapping)
------------------------------------------------------------ */

function describeEvent(
  event: SessionEvent,
  tone: NarrationOptions["tone"],
  sensory: NarrationOptions["sensoryLevel"]
): string {
  switch (event.type) {
    case "SET_SCENE":
      return sceneDescription(event, tone);

    case "CONFIRMED_CHANGE":
      return changeDescription(event, tone);

    case "END_SESSION":
      return endDescription(tone);

    default:
      return genericDescription(event, sensory);
  }
}

/* ------------------------------------------------------------
   Description Helpers
------------------------------------------------------------ */

function sceneDescription(
  event: SessionEvent,
  tone: NarrationOptions["tone"]
): string {
  const sceneId = (event.payload as any)?.sceneId;

  if (!sceneId) {
    return "The scene shifts.";
  }

  switch (tone) {
    case "tense":
      return `Attention tightens as the focus moves to ${sceneId}.`;
    case "quiet":
      return `The moment settles into ${sceneId}.`;
    case "dramatic":
      return `All eyes turn as events draw the group into ${sceneId}.`;
    default:
      return `The scene is now ${sceneId}.`;
  }
}

function changeDescription(
  event: SessionEvent,
  tone: NarrationOptions["tone"]
): string {
  const desc = (event.payload as any)?.description;

  if (!desc) {
    return "A decision is confirmed.";
  }

  switch (tone) {
    case "tense":
      return `The decision lands heavily: ${desc}.`;
    case "quiet":
      return `The choice is made: ${desc}.`;
    case "dramatic":
      return `The moment crystallizes: ${desc}.`;
    default:
      return `Confirmed: ${desc}.`;
  }
}

function endDescription(
  tone: NarrationOptions["tone"]
): string {
  switch (tone) {
    case "dramatic":
      return "The story closes, leaving its marks behind.";
    case "quiet":
      return "The session comes gently to a close.";
    default:
      return "The session ends.";
  }
}

function genericDescription(
  event: SessionEvent,
  sensory: NarrationOptions["sensoryLevel"]
): string {
  if (sensory === "minimal") {
    return "An event occurs.";
  }

  return `An event is recorded: ${event.type}.`;
}

/* ------------------------------------------------------------
   HARD BANS (By Design)
------------------------------------------------------------ */
// This module MUST NOT:
// - read pending changes
// - infer intent or outcome
// - alter session state
// - narrate hypothetical futures
// - speak without a confirmed event
//
// If narration ever leads action,
// authority has been violated.
// ------------------------------------------------------------
