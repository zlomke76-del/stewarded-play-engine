// lib/context-engine.ts
// Phase 4 — Context Awareness Engine
// Rule: Context informs action; context never acts.

import "server-only";
import { createClient } from "@supabase/supabase-js";

export type ContextSignal =
  | "neutral"
  | "recent_activity"
  | "historical_reference"
  | "solemn_day"
  | "relationship_sensitive"
  | "project_active"
  | "high_emotional_weight";

export type ContextSnapshot = {
  now: string;
  signals: ContextSignal[];
  notes: string[];
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * Build a context snapshot for the current moment.
 * No behavior, no decisions — descriptive only.
 */
export async function buildContextSnapshot({
  user_id,
  workspace_id = null,
}: {
  user_id: string;
  workspace_id?: string | null;
}): Promise<ContextSnapshot> {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  const signals: ContextSignal[] = [];
  const notes: string[] = [];

  // --------------------------------------------------
  // 1. Temporal markers (anniversaries, solemn days)
  // --------------------------------------------------

  const { data: markers } = await supabase
    .from("temporal_markers")
    .select("*")
    .eq("user_id", user_id)
    .eq("marker_date", todayISO);

  if (markers && markers.length > 0) {
    signals.push("solemn_day");
    markers.forEach((m) =>
      notes.push(`Temporal marker active: ${m.marker_type}`)
    );
  }

  // --------------------------------------------------
  // 2. Recent memory activity (last 7 days)
  // --------------------------------------------------

  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentMemories } = await supabase
    .from("user_memories")
    .select("id, kind")
    .eq("user_key", user_id)
    .gte("created_at", since);

  if (recentMemories && recentMemories.length > 0) {
    signals.push("recent_activity");
    notes.push(`Recent memory activity (${recentMemories.length})`);
  }

  // --------------------------------------------------
  // 3. Relationship-sensitive entities
  // --------------------------------------------------

  const { data: relationships } = await supabase
    .from("relationships")
    .select("entity_name, sensitivity")
    .eq("user_id", user_id)
    .gte("sensitivity", 3);

  if (relationships && relationships.length > 0) {
    signals.push("relationship_sensitive");
    notes.push(`Sensitive relationships present`);
  }

  // --------------------------------------------------
  // 4. Active project context (workspace scoped)
  // --------------------------------------------------

  if (workspace_id) {
    const { data: projectMemories } = await supabase
      .from("user_memories")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("kind", "project")
      .gte("created_at", since);

    if (projectMemories && projectMemories.length > 0) {
      signals.push("project_active");
      notes.push(`Active project context detected`);
    }
  }

  // --------------------------------------------------
  // Default state
  // --------------------------------------------------

  if (signals.length === 0) {
    signals.push("neutral");
    notes.push("No contextual modifiers detected");
  }

  return {
    now: now.toISOString(),
    signals,
    notes,
  };
}
