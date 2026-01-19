import { SnapshotDiff } from "./shadowSnapshotDiffService";

/* ------------------------------------------------------------
   Inspection types
------------------------------------------------------------ */

export type InspectionSeverity = "info" | "warn" | "critical";

export type InspectionFinding = {
  id: string;
  severity: InspectionSeverity;
  message: string;
  filePaths?: string[];
  inspector?: string;
};

export type InspectionReportFinding = {
  id: string;
  severity: InspectionSeverity;
  message: string;
  inspector: string;
  filePaths?: string[];
};

export type InspectionReport = {
  inspectedAt: string;
  fromSnapshot: string;
  toSnapshot: string;
  summary: {
    info: number;
    warn: number;
    critical: number;
  };
  findings: InspectionReportFinding[];
};

/* ------------------------------------------------------------
   Inspector interface (SYNC OR ASYNC)
------------------------------------------------------------ */

export interface ShadowInspector {
  name: string;
  inspect(
    diff: SnapshotDiff
  ): InspectionFinding[] | Promise<InspectionFinding[]>;
}

/* ------------------------------------------------------------
   Inspection engine
------------------------------------------------------------ */

export default class ShadowInspectionService {
  private inspectors: ShadowInspector[] = [];

  registerInspector(inspector: ShadowInspector): void {
    this.inspectors.push(inspector);
  }

  async runInspection(diff: SnapshotDiff): Promise<InspectionReport> {
    const findings: InspectionReportFinding[] = [];

    for (const inspector of this.inspectors) {
      try {
        const result = await inspector.inspect(diff);

        for (const finding of result) {
          findings.push({
            id: finding.id,
            severity: finding.severity,
            message: finding.message,
            filePaths: finding.filePaths,
            inspector: inspector.name,
          });
        }
      } catch (err) {
        findings.push({
          id: "inspector-error",
          severity: "warn",
          message:
            `Inspector "${inspector.name}" failed: ` +
            (err instanceof Error ? err.message : String(err)),
          inspector: inspector.name,
        });
      }
    }

    const summary = {
      info: findings.filter(f => f.severity === "info").length,
      warn: findings.filter(f => f.severity === "warn").length,
      critical: findings.filter(f => f.severity === "critical").length,
    };

    return {
      inspectedAt: new Date().toISOString(),
      fromSnapshot: diff.fromSnapshot,
      toSnapshot: diff.toSnapshot,
      summary,
      findings,
    };
  }
}
