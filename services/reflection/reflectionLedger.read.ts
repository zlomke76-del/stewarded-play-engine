// ------------------------------------------------------------
// Reflection Ledger — READ MODEL (NON-AUTHORITATIVE)
// This is the ONLY shape Solace is allowed to see.
// ------------------------------------------------------------

export type ReflectionLedgerRead = {
  source: "inspection" | "human_review" | "deployment";
  domain: "code" | "security" | "governance";
  summary: string;
  outcome: "success" | "mixed" | "failure";
  recorded_at: string;
};
