import fs from "fs";
import path from "path";

const SHADOW_REPO_PATH = process.env.SHADOW_REPO_PATH;

if (!SHADOW_REPO_PATH) {
  console.error("SHADOW_REPO_PATH is not defined");
  process.exit(1);
}

const SNAPSHOT_ROOT = path.join(SHADOW_REPO_PATH, ".snapshots");

if (!fs.existsSync(SNAPSHOT_ROOT)) {
  console.log("No snapshots found. Skipping inspection check.");
  process.exit(0);
}

const snapshots = fs
  .readdirSync(SNAPSHOT_ROOT)
  .filter(f => fs.statSync(path.join(SNAPSHOT_ROOT, f)).isDirectory())
  .sort();

if (snapshots.length === 0) {
  console.log("No snapshot directories present.");
  process.exit(0);
}

const latestSnapshot = snapshots[snapshots.length - 1];
const reportPath = path.join(
  SNAPSHOT_ROOT,
  latestSnapshot,
  "inspection-report.json"
);

if (!fs.existsSync(reportPath)) {
  console.log("No inspection report found. Skipping.");
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

console.log("\n=== GOVERNANCE INSPECTION STATUS ===");
console.log("Snapshot:", latestSnapshot);
console.log("Critical:", report.summary.critical);
console.log("Warnings:", report.summary.warn);
console.log("Info:", report.summary.info);

if (report.summary.critical > 0) {
  console.error(
    "\n❌ Build blocked due to CRITICAL inspection findings."
  );
  process.exit(1);
}

console.log("\n✅ No critical findings. Build may proceed.");
process.exit(0);
