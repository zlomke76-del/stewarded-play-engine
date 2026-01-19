import { ShadowInspector, InspectionFinding } from "../shadowInspectionService";
import { SnapshotDiff } from "../shadowSnapshotDiffService";

export const OptimistInspector: ShadowInspector = {
  name: "optimist-inspector",

  inspect(diff: SnapshotDiff): InspectionFinding[] {
    const findings: InspectionFinding[] = [];

    const totalChanges =
      diff.added.length + diff.modified.length + diff.removed.length;

    findings.push({
      id: "optimist-assessment",
      severity: "info",
      message:
        totalChanges === 0
          ? "No substantive changes detected; system state remains stable."
          : "Changes appear localized and potentially incremental.",
    });

    return findings;
  },
};
