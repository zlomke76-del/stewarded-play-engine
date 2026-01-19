import { ShadowInspector, InspectionFinding } from "../shadowInspectionService";
import { SnapshotDiff } from "../shadowSnapshotDiffService";

const HIGH_RISK_PATHS = [
  "middleware",
  "proxy",
  "auth",
  "security",
  "permissions",
  "roles",
  "env",
  "config",
];

export const HighRiskSurfaceInspector: ShadowInspector = {
  name: "high-risk-surface-inspector",

  inspect(diff: SnapshotDiff): InspectionFinding[] {
    const findings: InspectionFinding[] = [];

    const touched = [...diff.modified, ...diff.added];

    for (const file of touched) {
      if (HIGH_RISK_PATHS.some(p => file.toLowerCase().includes(p))) {
        findings.push({
          id: "high-risk-surface-change",
          severity: "warn",
          message: "Change touches high-risk system surface",
          filePaths: [file],
        });
      }
    }

    return findings;
  },
};
