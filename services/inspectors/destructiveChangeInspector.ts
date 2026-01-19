import { ShadowInspector, InspectionFinding } from "../shadowInspectionService";
import { SnapshotDiff } from "../shadowSnapshotDiffService";

export const DestructiveChangeInspector: ShadowInspector = {
  name: "destructive-change-inspector",

  inspect(diff: SnapshotDiff): InspectionFinding[] {
    const findings: InspectionFinding[] = [];

    for (const file of diff.removed) {
      findings.push({
        id: "file-removed",
        severity: "info",
        message: "File was removed",
        filePaths: [file],
      });
    }

    return findings;
  },
};
