// ------------------------------------------------------------
// Solace Resolution Run Export
// ------------------------------------------------------------
// Full-Run Export Bundles
//
// Purpose:
// - Export a complete run in multiple formats
// - Preserve canonical ordering and content
// ------------------------------------------------------------

import type { ResolutionRun } from "./resolution.run";
import {
  exportResolutionsAsJSON,
  exportResolutionsAsMarkdown,
  exportResolutionsAsText,
} from "./resolution.export";

export interface RunExportBundle {
  runId: string;
  startedAt: number;
  endedAt?: number;
  isComplete: boolean;
  formats: {
    json: string;
    markdown: string;
    text: string;
  };
}

export function exportRun(
  run: ResolutionRun
): RunExportBundle {
  return {
    runId: run.id,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    isComplete: run.isComplete,
    formats: {
      json: exportResolutionsAsJSON(
        run.resolutions
      ),
      markdown: exportResolutionsAsMarkdown(
        run.resolutions
      ),
      text: exportResolutionsAsText(
        run.resolutions
      ),
    },
  };
}
