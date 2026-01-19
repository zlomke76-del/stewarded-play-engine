// ------------------------------------------------------------
// Reflection — Delegated Ledger Insert (NON-AUTHORITATIVE)
// This file MUST NOT write to Supabase directly.
// All writes are delegated to governance authority.
// ------------------------------------------------------------

import { ReflectionLedgerEntry } from "@/services/reflection/reflectionLedger.types";
import { insertReflectionLedgerEntry as insertGovernanceReflectionLedgerEntry } from "@/services/governance/insertReflectionLedgerEntry";

type InsertReflectionArgs = {
  entry: ReflectionLedgerEntry;
  userId: string;
  workspaceId: string | null;
};

/**
 * Delegated insert.
 *
 * This function exists only to preserve call-site compatibility.
 * It MUST NOT:
 *  - create a Supabase client
 *  - touch schemas directly
 *  - bypass governance authority
 */
export async function insertReflectionLedgerEntry(
  args: InsertReflectionArgs
): Promise<void> {
  const { entry, userId, workspaceId } = args;

  await insertGovernanceReflectionLedgerEntry({
    entry,
    userId,
    workspaceId,
  });
}
