// auditLogAdapter.ts
// ------------------------------------------------------------
// Append-Only Audit Log Adapter v1.0
// Write-once DecisionTrace persistence with hash chaining
// No reads beyond verification
// ------------------------------------------------------------

import { createHash } from "crypto";
import { appendFileSync, readFileSync, existsSync } from "fs";
import { DecisionTrace } from "./decisionTrace";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type AuditLogEntry = {
  index: number;
  timestamp: string; // RFC3339
  decision_id: string;
  trace_hash: string;
  prev_hash: string;
  entry_hash: string;
};

/* ------------------------------------------------------------
   Configuration
------------------------------------------------------------ */

const LOG_PATH = "./decision_audit.log";

/* ------------------------------------------------------------
   Hash utilities
------------------------------------------------------------ */

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function canonicalizeTrace(trace: DecisionTrace): string {
  return JSON.stringify(trace);
}

/* ------------------------------------------------------------
   Append-only write
------------------------------------------------------------ */

export function appendDecisionTrace(trace: DecisionTrace): void {
  const timestamp = new Date().toISOString();
  const tracePayload = canonicalizeTrace(trace);
  const traceHash = sha256(tracePayload);

  let prevHash = "GENESIS";
  let index = 0;

  if (existsSync(LOG_PATH)) {
    const lines = readFileSync(LOG_PATH, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);

    if (lines.length > 0) {
      const last: AuditLogEntry = JSON.parse(lines[lines.length - 1]);
      prevHash = last.entry_hash;
      index = last.index + 1;
    }
  }

  const entryBase = {
    index,
    timestamp,
    decision_id: trace.decision_id,
    trace_hash: traceHash,
    prev_hash: prevHash,
  };

  const entryHash = sha256(JSON.stringify(entryBase));

  const entry: AuditLogEntry = {
    ...entryBase,
    entry_hash: entryHash,
  };

  appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n", {
    encoding: "utf8",
    flag: "a",
  });
}

/* ------------------------------------------------------------
   Verification (read-only, integrity check only)
------------------------------------------------------------ */

export function verifyAuditLog(): boolean {
  if (!existsSync(LOG_PATH)) return true;

  const lines = readFileSync(LOG_PATH, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);

  let expectedPrevHash = "GENESIS";

  for (let i = 0; i < lines.length; i++) {
    const entry: AuditLogEntry = JSON.parse(lines[i]);

    const base = {
      index: entry.index,
      timestamp: entry.timestamp,
      decision_id: entry.decision_id,
      trace_hash: entry.trace_hash,
      prev_hash: entry.prev_hash,
    };

    const recomputedHash = sha256(JSON.stringify(base));

    if (entry.prev_hash !== expectedPrevHash) {
      return false;
    }

    if (entry.entry_hash !== recomputedHash) {
      return false;
    }

    expectedPrevHash = entry.entry_hash;
  }

  return true;
}
