import { ShadowInspector, InspectionFinding } from "../shadowInspectionService";
import { SnapshotDiff } from "../shadowSnapshotDiffService";

export const ArbiterInspector: ShadowInspector = {
  name: "arbiter-inspector",

  inspect(diff: SnapshotDiff): InspectionFinding[] {
    const findings: InspectionFinding[] = [];

    const changeMagnitude =
      diff.added.length +
      diff.modified.length +
      diff.removed.length;

    let assessment: string;

    if (changeMagnitude === 0) {
      assessment = "No effective change; no action required.";
    } else if (changeMagnitude < 5) {
      assessment =
        "Small, bounded change set. Human review recommended but low urgency.";
    } else {
      assessment =
        "Substantial change set detected. Human review strongly recommended.";
    }

    findings.push({
      id: "arbiter-synthesis",
      severity: "info",
      message: assessment,
    });

    return findings;
  },
};
