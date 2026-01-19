// server/supabase-clients.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// -- Environment variables (all must be defined in Vercel & .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Standard client for the PUBLIC schema.
 * Safe for client or server (anon key).
 */
export const supaPublic = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Client bound directly to the MCA schema (no .schema("mca") call required).
 */
export const supaMca = createClient<Database, "mca">(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Service-role client (PUBLIC) – server-side only, full privileges.
 */
export const supaServicePublic = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Service-role client for the MCA schema – server-side only, full privileges.
 */
export const supaServiceMca = createClient<Database, "mca">(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);
