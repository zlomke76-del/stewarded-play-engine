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

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function formatResolutionSummary(
  r: SolaceResolution
): string {
  const m = r.mechanical_resolution as any;

  if (
    typeof m.roll === "number" &&
    typeof m.dc === "number" &&
    typeof m.outcome === "string"
  ) {
    return `Resolution: ${m.outcome}`;
  }

  return "Resolution: consequences applied";
}

function formatResolutionMarkdown(
  r: SolaceResolution
): string {
  const m = r.mechanical_resolution as any;

  if (
    typeof m.roll === "number" &&
    typeof m.dc === "number" &&
    typeof m.outcome === "string"
  ) {
    return `**Resolution:** d20 ${m.roll} vs DC ${m.dc} — **${m.outcome}**`;
  }

  return `**Resolution:** consequences applied`;
}

// ------------------------------------------------------------
// Exporters
// ------------------------------------------------------------

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
        formatResolutionSummary(r),
        ...r.aftermath,
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
        formatResolutionMarkdown(r),
        "",
        r.aftermath.map((l) => `- ${l}`).join("\n"),
      ].join("\n");
    })
    .join("\n\n");
}
