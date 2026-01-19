// app/api/admin/crypto-selftest/route.ts
//------------------------------------------------------------
// Admin-only crypto self-test
// Verifies workspace-scoped AES-GCM encryption round-trip
//------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  encryptIfNeeded,
  decryptIfPossible,
} from "@/lib/crypto-workspace";

// NOTE: This route is for internal validation only.
// It assumes SUPABASE_SERVICE_ROLE_KEY is available.

export async function GET() {
  const supa = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Use a deterministic test workspace ID
  const workspaceId = "00000000-0000-0000-0000-000000000001";

  try {
    // Round-trip test
    const secret = "hello-world";

    const enc = await encryptIfNeeded(
      supa as any,
      workspaceId,
      secret
    );

    const dec = await decryptIfPossible(
      supa as any,
      workspaceId,
      enc.storedContent
    );

    return NextResponse.json({
      ok: true,
      encrypted: enc.isEncrypted,
      decryptedMatches: dec.plaintext === secret,
      plaintext: dec.plaintext,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
