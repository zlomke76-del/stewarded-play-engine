import fs from "fs";
import path from "path";
import ShadowSnapshotDiffService from "./shadowSnapshotDiffService";

/* ------------------------------------------------------------
   Config (AUTHORITATIVE)
------------------------------------------------------------ */

const SHADOW_REPO_PATH = process.env.SHADOW_REPO_PATH;

if (!SHADOW_REPO_PATH) {
  throw new Error("SHADOW_REPO_PATH must be defined");
}

// From this point forward, TS knows this is a string
const SHADOW_REPO_ROOT: string = SHADOW_REPO_PATH;

/* ------------------------------------------------------------
   CLI
------------------------------------------------------------ */

export async function runShadowReviewCli(args: {
  snapshotId: string;
}) {
  const { snapshotId } = args;

  const snapshotRoot = path.join(
    path.resolve(SHADOW_REPO_ROOT),
    ".snapshots"
  );

  const snapshotPath = path.join(snapshotRoot, snapshotId);

  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const diffService = new ShadowSnapshotDiffService(snapshotRoot);

  // AUTHORITATIVE diff computation
  const diff = diffService.computeDiff(snapshotId);

  console.log("\n=== SNAPSHOT REVIEW ===");
  console.log("From:", diff.fromSnapshot);
  console.log("To:", diff.toSnapshot);

  console.log("\n=== DIFF SUMMARY ===");
  console.log("Added:", diff.added.length);
  console.log("Modified:", diff.modified.length);
  console.log("Removed:", diff.removed.length);

  if (diff.added.length) {
    console.log("\n--- Added Files ---");
    diff.added.forEach(f => console.log(" +", f));
  }

  if (diff.modified.length) {
    console.log("\n--- Modified Files ---");
    diff.modified.forEach(f => console.log(" ~", f));
  }

  if (diff.removed.length) {
    console.log("\n--- Removed Files ---");
    diff.removed.forEach(f => console.log(" -", f));
  }

  console.log("\nReview complete.\n");
}
