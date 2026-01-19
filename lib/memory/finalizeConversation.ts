// ------------------------------------------------------------
// Conversation Finalization Pipeline (AUTHORITATIVE)
// Idempotent · Safe · Auditable
// ------------------------------------------------------------

import { createServerClient } from "@supabase/ssr";
import { runSessionCompaction } from "./runSessionCompaction";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type FinalizationReason = "explicit" | "timeout" | "superseded";

type WMRow = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
};

// ------------------------------------------------------------
// FINALIZATION ENTRYPOINT
// ------------------------------------------------------------
export async function finalizeConversation(params: {
  supabaseService: ReturnType<typeof createServerClient>;
  conversationId: string;
  userId: string;
  reason: FinalizationReason;
}) {
  const { supabaseService, conversationId, userId, reason } = params;

  // ----------------------------------------------------------
  // Check if already finalized (idempotent)
  // ----------------------------------------------------------
  const existing = await supabaseService
    .schema("memory")
    .from("memories")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("memory_type", "decision")
    .eq("content", "conversation_finalized")
    .limit(1)
    .maybeSingle();

  if (existing?.data) {
    console.log("[FINALIZE] already finalized", { conversationId });
    return;
  }

  console.log("[FINALIZE] starting", { conversationId, reason });

  // ----------------------------------------------------------
  // Load remaining working memory
  // ----------------------------------------------------------
  const wmRes = await supabaseService
    .schema("memory")
    .from("working_memory")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const wm: WMRow[] = (wmRes.data ?? []) as WMRow[];

  // ----------------------------------------------------------
  // Final compaction (if anything remains)
  // ----------------------------------------------------------
  if (wm.length > 0) {
    const compaction = await runSessionCompaction(conversationId, wm);

    await supabaseService.schema("memory").from("memories").insert({
      user_id: userId,
      email: "system",
      workspace_id: null,
      memory_type: "session_compaction",
      source: "system",
      content: JSON.stringify(compaction),
      conversation_id: conversationId,
      confidence: 1.0,
      metadata: {
        terminal: true,
        reason,
      },
    });

    const ids: string[] = wm.map((m: WMRow) => m.id);

    await supabaseService
      .schema("memory")
      .from("working_memory")
      .delete()
      .in("id", ids);

    console.log("[FINALIZE] final WM compacted", {
      conversationId,
      deleted: ids.length,
    });
  }

  // ----------------------------------------------------------
  // Write finalization marker
  // ----------------------------------------------------------
  await supabaseService.schema("memory").from("memories").insert({
    user_id: userId,
    email: "system",
    workspace_id: null,
    memory_type: "decision",
    source: "system",
    content: "conversation_finalized",
    conversation_id: conversationId,
    confidence: 1.0,
    metadata: {
      reason,
      finalized_at: new Date().toISOString(),
    },
  });

  console.log("[FINALIZE] completed", { conversationId, reason });
}
