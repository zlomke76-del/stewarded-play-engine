// CLIENT-SAFE RESOLUTION BUILDER
// No process.env
// No Node crypto
// No assertions

import type { LegacyResolutionPayload } from "../types";

export function buildClientResolution(input: {
  legacyPayload: any;
  turn: number;
}) {
  return {
    turn: input.turn,
    description: input.legacyPayload.description,
    dice: input.legacyPayload.dice,
    audit: input.legacyPayload.audit,
    world: input.legacyPayload.world ?? null,
  };
}
