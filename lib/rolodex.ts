// lib/rolodex.ts
// Phase 5 — Relational Memory Access

import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function getUpcomingMarkers(params: {
  user_id: string;
  daysAhead?: number;
}) {
  const days = params.daysAhead ?? 30;

  const { data } = await supabase
    .from("memory_temporal_markers")
    .select(`
      *,
      memory_people ( name, relationship, sensitivity )
    `)
    .eq("user_id", params.user_id)
    .gte("marker_date", new Date().toISOString())
    .lte(
      "marker_date",
      new Date(Date.now() + days * 86400000).toISOString()
    );

  return data ?? [];
}
