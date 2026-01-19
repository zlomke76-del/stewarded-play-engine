// lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Runtime invariant that also narrows types for TypeScript
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

/**
 * Server-only Supabase admin client.
 * - Uses SERVICE ROLE KEY only
 * - No cookies
 * - No sessions
 * - No SSR helpers
 * - Fail-fast if misconfigured
 */
export function createSupabaseAdmin(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "moral-clarity-ai-admin",
      },
    },
  });
}
