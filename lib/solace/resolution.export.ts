// ------------------------------------------------------------
// Solace Resolution Export
// ------------------------------------------------------------
// Canon → Text / Markdown / JSON
//
// Purpose:
// - Export resolution history for review or sharing
// - Preserve ordering and content
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export function exportResolutionsAsJSON(
  resolutions: SolaceResolution[]
): string {
  return JSON.stringify(resolutions, null, 2);
}

export function exportResolutionsAsText(
  resolutions: SolaceResolution[]
): string {
  return resolutions
    .map((r, i) => {
      return [
        `Turn ${i + 1}`,
        r.opening_signal,
        ...r.situation_frame,
        ...r.process,
        `Resolution: ${r.mechanical_resolution.outcome}`,
        ...r.aftermath,
        r.closure ?? "",
        "",
      ].join("\n");
    })
    .join("\n");
}

export function exportResolutionsAsMarkdown(
  resolutions: SolaceResolution[]
): string {
  return resolutions
    .map((r, i) => {
      return [
        `## Turn ${i + 1}`,
        `**${r.opening_signal}**`,
        "",
        r.situation_frame.map((l) => `> ${l}`).join("\n"),
        "",
        `**Resolution:** d20 ${r.mechanical_resolution.roll} vs DC ${r.mechanical_resolution.dc} — **${r.mechanical_resolution.outcome}**`,
        "",
        r.aftermath.map((l) => `- ${l}`).join("\n"),
        "",
        r.closure ? `_${r.closure}_` : "",
      ].join("\n");
    })
    .join("\n\n");
}
