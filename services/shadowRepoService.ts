import fs from "fs";
import path from "path";
import ShadowSnapshotDiffService, {
  SnapshotDiff,
} from "./shadowSnapshotDiffService";
import ShadowInspectionService, {
  InspectionReport,
} from "./shadowInspectionService";

// ------------------------------------------------------------
// ADDITIVE — GOVERNANCE LEDGER INSERT
// ------------------------------------------------------------
import { insertReflectionLedgerEntry } from "./governance/insertReflectionLedgerEntry";
import { ReflectionLedgerEntry } from "./reflection/reflectionLedger.types";

/* ------------------------------------------------------------
   Config
------------------------------------------------------------ */

type ShadowRepoConfig = {
  mainRepoPath: string;
  shadowRepoPath: string;
};

/* ------------------------------------------------------------
   Service
------------------------------------------------------------ */

export default class ShadowRepoService {
  private mainRepoPath: string;
  private shadowRepoPath: string;
  private snapshotRoot: string;
  private auditLog: string;

  private diffService: ShadowSnapshotDiffService;
  private inspectionService: ShadowInspectionService;

  constructor(config: ShadowRepoConfig) {
    this.mainRepoPath = path.resolve(config.mainRepoPath);
    this.shadowRepoPath = path.resolve(config.shadowRepoPath);
    this.snapshotRoot = path.join(this.shadowRepoPath, ".snapshots");
    this.auditLog = path.join(this.shadowRepoPath, "shadow-audit.log");

    this.diffService = new ShadowSnapshotDiffService(this.snapshotRoot);
    this.inspectionService = new ShadowInspectionService();
  }

  /* ------------------------------------------------------------
     Inspector registration passthrough
  ------------------------------------------------------------ */

  registerInspector(inspector: Parameters<
    ShadowInspectionService["registerInspector"]
  >[0]) {
    this.inspectionService.registerInspector(inspector);
  }

  /* ------------------------------------------------------------
     Initialization
  ------------------------------------------------------------ */

  async initializeShadowRepo(): Promise<void> {
    if (!fs.existsSync(this.shadowRepoPath)) {
      fs.mkdirSync(this.shadowRepoPath, { recursive: true });
    }

    if (!fs.existsSync(this.snapshotRoot)) {
      fs.mkdirSync(this.snapshotRoot, { recursive: true });
    }
  }

  /* ------------------------------------------------------------
     Sync + inspect
  ------------------------------------------------------------ */

  async syncShadowRepo(): Promise<void> {
    const snapshotId = this.createSnapshot();

    const diff: SnapshotDiff =
      this.diffService.computeDiff(snapshotId);

    try {
      const report: InspectionReport =
        await this.inspectionService.runInspection(diff);

      this.persistInspectionReport(snapshotId, report);

      // --------------------------------------------------------
      // 🔒 GOVERNANCE BOUNDARY — REFLECTION LEDGER INSERT
      // --------------------------------------------------------
      const ledgerEntry: ReflectionLedgerEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source: "governance-pipeline",
        scope: "code-change",

        snapshot: {
          id: snapshotId,
          from: diff.fromSnapshot,
          to: diff.toSnapshot,
        },

        diffSummary: {
          added: diff.added.length,
          modified: diff.modified.length,
          removed: diff.removed.length,
        },

        inspectionSummary: report.summary,
        inspectionFindings: report.findings,

        assistiveSignals: {
          refactorSuggested: report.summary.info > 0,
          suggestionCount: report.summary.info,
        },

        // No human decision at sync time
        invariants: {
          autoPromoted: false,
          autonomyLevel: 0,
        },
      };

      await insertReflectionLedgerEntry({
        entry: ledgerEntry,
        userId: "SYSTEM", // replace with real user when available
        workspaceId: null,
      });

      // --------------------------------------------------------
      // EXISTING AUDIT LOG
      // --------------------------------------------------------
      this.logAudit(
        `Inspection completed: ${report.summary.critical} critical, ${report.summary.warn} warnings`
      );
    } catch (err) {
      this.logAudit(
        `Inspection failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  /* ------------------------------------------------------------
     Snapshot handling
  ------------------------------------------------------------ */

  private createSnapshot(): string {
    const id = new Date().toISOString().replace(/[:.]/g, "-");
    const snapshotPath = path.join(this.snapshotRoot, id);

    fs.mkdirSync(snapshotPath, { recursive: true });

    this.copyDir(this.mainRepoPath, snapshotPath);

    this.logAudit(`Snapshot created: ${id}`);

    return id;
  }

  private copyDir(srcDir: string, destDir: string): void {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else if (entry.isFile()) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /* ------------------------------------------------------------
     Persistence
  ------------------------------------------------------------ */

  private persistInspectionReport(
    snapshotId: string,
    report: InspectionReport
  ): void {
    const outPath = path.join(
      this.snapshotRoot,
      snapshotId,
      "inspection-report.json"
    );

    fs.writeFileSync(
      outPath,
      JSON.stringify(report, null, 2),
      "utf8"
    );
  }

  /* ------------------------------------------------------------
     Audit
  ------------------------------------------------------------ */

  private logAudit(message: string): void {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    try {
      fs.appendFileSync(this.auditLog, line, "utf8");
    } catch (err) {
      console.error("AUDIT LOG FAILURE:", err);
    }
  }
}
