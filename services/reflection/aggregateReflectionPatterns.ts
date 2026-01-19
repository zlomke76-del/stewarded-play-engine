// ------------------------------------------------------------
// Reflection Pattern Aggregation
// Canonical, Non-Normative Compression
//------------------------------------------------------------

import { ReflectionLedgerEntry } from "./reflectionLedger.types";

export type ReflectionPattern = {
  scope: ReflectionLedgerEntry["scope"];
  source: string;
  count: number;
  descriptors: string[];
};

export function aggregateReflectionPatterns(
  ledger: ReflectionLedgerEntry[]
): ReflectionPattern[] {
  const index: Record<string, ReflectionPattern> = {};

  for (const entry of ledger) {
    const key = `${entry.scope}::${entry.source}`;

    if (!index[key]) {
      index[key] = {
        scope: entry.scope,
        source: entry.source,
        count: 0,
        descriptors: [],
      };
    }

    index[key].count += 1;

    // --------------------------------------------------------
    // NON-NORMATIVE DESCRIPTOR
    // Reflection entries are structural, not narrative.
    // We derive a safe descriptor without assuming schema.
    // --------------------------------------------------------
    index[key].descriptors.push(
      `snapshot=${entry.snapshot ?? "n/a"} @ ${entry.timestamp}`
    );
  }

  return Object.values(index);
}
