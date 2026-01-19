// app/api/chat/modules/memory-writer.ts
// ------------------------------------------------------------
// Phase A Memory Writer — COOKIE-AWARE, RLS-SAFE
// Explicit Intent Takes Precedence Over Classification
// Classifier = Advisory Only (No Scope Authority)
// ------------------------------------------------------------

import { createServerClient } from "@supabase/ssr";
import { classifyMemoryText } from "@/lib/memory-classifier";

export type MemoryWriteInput = {
  userId: string;
  email: string;
  workspaceId: string | null;
  memoryType: "fact" | "identity";
  source: "explicit" | "founder";
  content: string;
};

export async function writeMemory(
  input: MemoryWriteInput,
  cookieHeader: string
) {
  const {
    userId,
    email,
    workspaceId,
    memoryType,
    source,
    content,
  } = input;

  const startedAt = Date.now();

  // ----------------------------
  // Supabase client (cookie-aware)
  // ----------------------------
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          const m = cookieHeader
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith(name + "="));
          return m ? m.split("=")[1] : undefined;
        },
        set() {},
        remove() {},
      },
    }
  );

  const hasWorkspace = Boolean(workspaceId);
  const isExplicit = source === "explicit";

  // ----------------------------
  // Intent log (authoritative)
  // ----------------------------
  console.log("[MEMORY-WRITE] intent", {
    schema: "memory",
    table: "memories",
    userId,
    memoryType,
    source,
    bytes: content.length,
    hasWorkspace,
  });

  // ----------------------------
  // Classification (advisory only)
  // ----------------------------
  let classification:
    | {
        label: string;
        confidence: number;
        provider: string;
      }
    | null = null;

  const classifyStart = Date.now();

  if (content && content.trim().length >= 5) {
    try {
      const result = await classifyMemoryText(content);
      classification = {
        label: result.label,
        confidence: Number(result.confidence?.toFixed(3)) || 0,
        provider: result.provider,
      };
    } catch (err) {
      console.warn("[MEMORY-CLASSIFIER] FAILED", {
        userId,
        error:
          err instanceof Error ? err.message : "unknown classifier error",
      });
    }
  }

  const classifyDurationMs = Date.now() - classifyStart;

  if (classification) {
    console.log("[MEMORY-CLASSIFIER] result", {
      userId,
      label: classification.label,
      confidence: classification.confidence,
      provider: classification.provider,
      duration_ms: classifyDurationMs,
      advisory: true,
    });
  }

  // --------------------------------------------------
  // FINAL PRECEDENCE RESOLUTION (THIS IS THE FIX)
  // --------------------------------------------------
  //
  // Rule:
  // Explicit user intent + workspace context
  // CANNOT be downgraded by classifier semantics.
  //
  // Classification may annotate, never veto.
  //
  const workspaceEligible =
    isExplicit && hasWorkspace;

  console.log("[MEMORY-WRITE] precedence", {
    userId,
    explicit: isExplicit,
    hasWorkspace,
    classifierLabel: classification?.label ?? null,
    workspaceEligible,
  });

  // ----------------------------
  // Write memory (authoritative)
  // ----------------------------
  const writeStart = Date.now();

  const { error } = await supabase
    .schema("memory")
    .from("memories")
    .insert({
      user_id: userId,
      email,
      workspace_id: workspaceEligible ? workspaceId : null,
      memory_type: memoryType,
      source,
      content,
      // Classification intentionally NOT persisted
      // until taxonomy is finalized.
    });

  const writeDurationMs = Date.now() - writeStart;

  if (error) {
    console.error("[MEMORY-WRITE] FAILED", {
      code: error.code,
      message: error.message,
      hint: error.hint,
      userId,
      memoryType,
      duration_ms: writeDurationMs,
    });
    return;
  }

  // ----------------------------
  // Success instrumentation
  // ----------------------------
  console.log("[MEMORY-WRITE] SUCCESS", {
    userId,
    memoryType,
    workspaceEligible,
    write_duration_ms: writeDurationMs,
    total_duration_ms: Date.now() - startedAt,
    classified: Boolean(classification),
  });
}
