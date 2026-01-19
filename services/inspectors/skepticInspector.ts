import { ShadowInspector, InspectionFinding } from "../shadowInspectionService";
import { SnapshotDiff } from "../shadowSnapshotDiffService";

export const SkepticInspector: ShadowInspector = {
  name: "skeptic-inspector",

  inspect(diff: SnapshotDiff): InspectionFinding[] {
    const findings: InspectionFinding[] = [];

    const riskyTouchCount = diff.modified.length + diff.removed.length;

    if (riskyTouchCount > 0) {
      findings.push({
        id: "skeptic-assessment",
        severity: "warn",
        message:
          "Modified or removed files introduce uncertainty; review intent and coverage carefully.",
        filePaths: [...diff.modified, ...diff.removed],
      });
    } else {
      findings.push({
        id: "skeptic-assessment",
        severity: "info",
        message: "No file removals or risky modifications detected.",
      });
    }

    return findings;
  },
};
