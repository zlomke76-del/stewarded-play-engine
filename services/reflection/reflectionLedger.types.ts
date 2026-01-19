// ------------------------------------------------------------
// Reflection Ledger — AUTHORITATIVE SCHEMA
// Read-only, append-only governance outcomes
// ------------------------------------------------------------

export type ReflectionLedgerEntry = {
  id: string;                     // UUID
  timestamp: string;              // ISO 8601
  source: "governance-pipeline";  // fixed, non-user

  scope: "code-change";

  snapshot: {
    id: string;
    from: string;
    to: string;
  };

  diffSummary: {
    added: number;
    modified: number;
    removed: number;
  };

  inspectionSummary: {
    critical: number;
    warn: number;
    info: number;
  };

  inspectionFindings: Array<{
    inspector: string;
    id: string;
    severity: "info" | "warn" | "critical";
    message: string;
    filePaths?: string[];
  }>;

  assistiveSignals?: {
    refactorSuggested: boolean;
    suggestionCount?: number;
  };

  humanDisposition?: {
    decision: "approved" | "rejected" | "reverted" | "deferred";
    decidedBy: string;
    decidedAt: string;
    rationale?: string;
  };

  invariants: {
    autoPromoted: boolean;
    autonomyLevel: number; // 0 = none
  };
};
