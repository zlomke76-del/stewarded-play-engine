// lib/supabase/edge.ts
import { createServerClient } from "@supabase/ssr";

/**
 * Edge-safe Supabase client for Solace pipelines.
 *
 * - Uses anon key
 * - Does NOT depend on cookies (we key rows by user key explicitly)
 * - Safe for use in edge runtime modules (chat, memory, context loaders)
 */
export function createClientEdge() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {
          // no-op in edge anonymous client
        },
        remove() {
          // no-op in edge anonymous client
        },
      },
    }
  );
}
