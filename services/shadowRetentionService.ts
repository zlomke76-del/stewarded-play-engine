import fs from "fs";
import path from "path";

type RetentionConfig = {
  shadowRepoPath: string;
  maxSnapshots: number;
  dryRun?: boolean;
};

export default class ShadowRetentionService {
  private snapshotRoot: string;
  private reviewRoot: string;
  private auditLog: string;
  private maxSnapshots: number;
  private dryRun: boolean;

  constructor(config: RetentionConfig) {
    this.snapshotRoot = path.join(
      path.resolve(config.shadowRepoPath),
      ".snapshots"
    );
    this.reviewRoot = path.join(
      path.resolve(config.shadowRepoPath),
      ".reviews"
    );
    this.auditLog = path.join(
      path.resolve(config.shadowRepoPath),
      "shadow-audit.log"
    );

    this.maxSnapshots = config.maxSnapshots;
    this.dryRun = config.dryRun ?? true;
  }

  /* ------------------------------------------------------------
     Public API
  ------------------------------------------------------------ */

  enforceRetention(): void {
    if (!fs.existsSync(this.snapshotRoot)) return;

    const snapshots = fs
      .readdirSync(this.snapshotRoot)
      .filter(s =>
        fs.statSync(path.join(this.snapshotRoot, s)).isDirectory()
      )
      .sort();

    if (snapshots.length <= this.maxSnapshots) {
      this.logAudit("Retention check: no pruning required.");
      return;
    }

    const candidates = snapshots.slice(
      0,
      snapshots.length - this.maxSnapshots
    );

    for (const snapshotId of candidates) {
      if (this.hasCriticalFindings(snapshotId)) {
        this.logAudit(
          `Retention skip (critical findings): ${snapshotId}`
        );
        continue;
      }

      this.pruneSnapshot(snapshotId);
    }
  }

  /* ------------------------------------------------------------
     Internal
  ------------------------------------------------------------ */

  private hasCriticalFindings(snapshotId: string): boolean {
    const reportPath = path.join(
      this.snapshotRoot,
      snapshotId,
      "inspection-report.json"
    );

    if (!fs.existsSync(reportPath)) return false;

    try {
      const report = JSON.parse(
        fs.readFileSync(reportPath, "utf8")
      );
      return report.summary?.critical > 0;
    } catch {
      return true; // conservative: treat parse failure as critical
    }
  }

  private pruneSnapshot(snapshotId: string): void {
    const snapshotPath = path.join(this.snapshotRoot, snapshotId);

    if (this.dryRun) {
      this.logAudit(`[DRY-RUN] Prune snapshot: ${snapshotId}`);
      return;
    }

    fs.rmSync(snapshotPath, { recursive: true, force: true });
    this.logAudit(`Pruned snapshot: ${snapshotId}`);
  }

  private logAudit(message: string): void {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    try {
      fs.appendFileSync(this.auditLog, line, "utf8");
    } catch (err) {
      console.error("AUDIT LOG FAILURE:", err);
    }
  }
}
