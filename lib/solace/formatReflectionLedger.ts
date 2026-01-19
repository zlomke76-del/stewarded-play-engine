// ------------------------------------------------------------
// Reflection Ledger Formatter (Demo-Safe)
// ------------------------------------------------------------

// NOTE:
// In the stewarded-play-engine demo, we intentionally do NOT
// depend on Solace’s institutional reflection ledger.
// This local type preserves formatting behavior without
// importing removed governance infrastructure.

// ------------------------------------------------------------

export type ReflectionLedgerEntry = {
  id: string;
  createdAt: number;
  source: string;
  summary: string;
};

// ------------------------------------------------------------
// FORMATTER (AUTHORITATIVE FOR DEMO)
// ------------------------------------------------------------

export function formatReflectionLedger(
  entries: readonly ReflectionLedgerEntry[]
): string {
  if (entries.length === 0) {
    return "No reflections recorded.";
  }

  return entries
    .map((e, i) => {
      const date = new Date(e.createdAt).toLocaleString();
      return `${i + 1}. [${date}] (${e.source}) ${e.summary}`;
    })
    .join("\n");
}
