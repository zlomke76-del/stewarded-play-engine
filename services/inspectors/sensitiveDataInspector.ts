import { ShadowInspector, InspectionFinding } from "../shadowInspectionService";
import { SnapshotDiff } from "../shadowSnapshotDiffService";

const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /aws[_-]?access/i,
  /private[_-]?key/i,
];

export const SensitiveDataInspector: ShadowInspector = {
  name: "sensitive-data-inspector",

  inspect(diff: SnapshotDiff): InspectionFinding[] {
    const findings: InspectionFinding[] = [];

    const candidates = [...diff.added, ...diff.modified];

    for (const file of candidates) {
      if (SECRET_PATTERNS.some(p => p.test(file))) {
        findings.push({
          id: "possible-secret-exposure",
          severity: "critical",
          message: "File name suggests possible sensitive data exposure",
          filePaths: [file],
        });
      }
    }

    return findings;
  },
};
