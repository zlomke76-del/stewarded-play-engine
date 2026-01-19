export type ReflectionPattern = {
  domain: string;               // e.g. "code", "security"
  signal: "risk" | "instability" | "mixed" | "positive";
  confidence: number;           // 0.0 – 1.0 (based on frequency + consistency)
  summary: string;              // human-readable compression
  supportingEvents: number;     // count of contributing ledger entries
  lastObservedAt: string;       // ISO timestamp
};
