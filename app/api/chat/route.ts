// ------------------------------------------------------------
// Solace Chat API Route (AUTHORITATIVE)
// Conversation-scoped Working Memory
// Rolling Compaction + Explicit Finalization
// NEXT 16 SAFE — NODE RUNTIME
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// ------------------------------------------------------------
// Context constants
// ------------------------------------------------------------
import {
  FACTS_LIMIT,
  EPISODES_LIMIT,
} from "./modules/context.constants";

// ------------------------------------------------------------
// Core pipelines
// ------------------------------------------------------------
import { assembleContext } from "./modules/assembleContext";
import { runHybridPipeline } from "./modules/hybrid";
import { runNewsroomExecutor } from "./modules/newsroom-executor";
import { writeMemory } from "./modules/memory-writer";
import { generateImage } from "./modules/image-router";
import { requiresEPPE01 } from "@/lib/solace/policies/materials";
import { validateEPPE01 } from "@/lib/solace/validators/eppe";

// ------------------------------------------------------------
// Attachment ingestion (AUTHORITATIVE)
// ------------------------------------------------------------
import { processAttachments } from "@/lib/chat/attachments";

// ------------------------------------------------------------
// Memory lifecycle
// ------------------------------------------------------------
import { runSessionCompaction } from "@/lib/memory/runSessionCompaction";
import { finalizeConversation } from "@/lib/memory/finalizeConversation";

// ------------------------------------------------------------
// Runtime configuration
// ------------------------------------------------------------
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ------------------------------------------------------------
// Compaction thresholds (Founder lane)
// ------------------------------------------------------------
const WM_TURN_TRIGGER = 25;
const WM_CHUNK_SIZE = 12;
const WM_TAIL_PROTECT = 10;

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type WMRow = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
};

type CodeArtifact = {
  type: "code";
  language: string;
  filename?: string;
  content: string;
};

type TextArtifact = {
  type: "text";
  format: "plain" | "markdown";
  title?: string;
  content: string;
};

type AssistantArtifact = CodeArtifact | TextArtifact;


// ------------------------------------------------------------
// Helpers — intent detection
// ------------------------------------------------------------
function isNewsKeywordFallback(message: string): boolean {
  const m = message.toLowerCase().trim();
  return (
    m === "news" ||
    m.includes("what is in the news") ||
    m.includes("what's in the news") ||
    m.includes("news today") ||
    m.includes("today's news") ||
    m.includes("latest news") ||
    m.includes("headlines") ||
    m.includes("current events")
  );
}

function looksLikeCode(text: string): boolean {
  return (
    text.includes("```") ||
    /function\s+\w+\s*\(/.test(text) ||
    /=>/.test(text) ||
    /const\s+\w+/.test(text) ||
    /;\s*$/.test(text)
  );
}

function isImageRequest(message: string): boolean {
  const m = message.trim().toLowerCase();
  if (looksLikeCode(message)) return false;

  return (
    /^generate (an )?image\b/.test(m) ||
    /^create (an )?image\b/.test(m) ||
    /^draw\b/.test(m) ||
    /^make (an )?(image|picture)\b/.test(m) ||
    /\b(image|picture) of\b/.test(m)
  );
}

function isExplicitSendApproval(message?: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase().trim();
  return (
    m === "send" ||
    m === "send it" ||
    m === "yes" ||
    m === "yes send" ||
    m === "approve" ||
    m === "go ahead"
  );
}

/**
 * AUTHORITATIVE — Code Artifact Extraction
 *
 * Splits assistant output into:
 * - structured code artifact (for UI copy / formatting)
 * - residual explanatory text (if any)
 *
 * Guarantees:
 * - No execution
 * - No markdown dependency
 * - UI-safe separation
 */
function extractCodeArtifact(
  text: string
): null | {
  artifact: {
    type: "code";
    language: string;
    content: string;
  };
  residualText: string | null;
} {
  if (!text || typeof text !== "string") return null;

  // --------------------------------------------------
  // FENCED CODE BLOCK ```lang ... ```
  // --------------------------------------------------
  const fenced = text.match(/```([\w+-]*)\n([\s\S]*?)```/m);

  if (fenced) {
    const before = text.slice(0, fenced.index).trim();
    const after = text
      .slice((fenced.index ?? 0) + fenced[0].length)
      .trim();

    const residual = [before, after].filter(Boolean).join("\n\n");

    return {
      artifact: {
        type: "code",
        language: fenced[1] || "text",
        content: fenced[2].trim(),
      },
      residualText: residual.length ? residual : null,
    };
  }

  // --------------------------------------------------
  // HEURISTIC CODE (no fences, still code)
  // --------------------------------------------------
  if (looksLikeCode(text)) {
    return {
      artifact: {
        type: "code",
        language: "text",
        content: text.trim(),
      },
      residualText: null,
    };
  }

  return null;
}

// ------------------------------------------------------------
// ADDITIVE — EXECUTOR DIRECTIVE (same-turn authority)
// ------------------------------------------------------------
function isExecutorDirective(text?: string): boolean {
  if (!text) return false;
  return /execute outbound sms|proceed with immediate outbound sms/i.test(text);
}

// ------------------------------------------------------------
// TERMINAL APPROVAL (TAAT)
// ------------------------------------------------------------
function isTerminalApproval(message?: string): boolean {
  if (!message) return false;
  return /finalize the decision and proceed/i.test(message);
}

function terminalApprovalResponse(): string {
  return [
    "Acknowledged.",
    "",
    "- The decision has been finalized.",
    "- No execution has occurred.",
    "- No tools, APIs, or integrations are available.",
    "",
    "There is nothing further to state.",
  ].join("\n");
}

// ------------------------------------------------------------
// PHANTOM EXECUTION LANGUAGE SCRUBBER (HARD GUARD)
// ------------------------------------------------------------
function scrubPhantomExecutionLanguage(text: string): string {
  if (!text) return text;

  const patterns = [
    /\bexecut(e|ing|ed)\b[^.]*\./gi,
    /\bproceed(ing|ed)?\b[^.]*\./gi,
    /\binitiat(e|ing|ed)\b[^.]*\./gi,
    /\blaunch(ing|ed)?\b[^.]*\./gi,
    /\btrigger(ing|ed)?\b[^.]*\./gi,
    /\brun(ning|ran)?\b[^.]*\./gi,
    /\bperform(ing|ed)?\b[^.]*\./gi,
    /\ballocat(e|ing|ed)\b[^.]*\./gi,
    /\binternal execution[^.]*\./gi,
    /\btask allocation[^.]*\./gi,
    /\bworkflow has started[^.]*\./gi,
    /\boperation underway[^.]*\./gi,
    /\bi will (now )?(execute|proceed|initiate)[^.]*\./gi,
  ];

  let out = text;
  for (const p of patterns) {
    out = out.replace(p, "");
  }

  return out.trim();
}

function assertNoPhantomLanguage(text: string): string {
  const forbidden = /(execut|proceed|initiat|launch|trigger|allocat|perform|run)\b/i;
  if (forbidden.test(text)) {
    return "I can reason, explain, and advise — but no actions or executions occur.";
  }
  return text;
}


// ------------------------------------------------------------
// ROLLING COMPACTION (NON-BLOCKING)
// ------------------------------------------------------------
async function maybeRunRollingCompaction(params: {
  supabaseAdmin: any;
  conversationId: string;
  userId: string;
}) {
  const { supabaseAdmin, conversationId, userId } = params;

  const wmRes = await supabaseAdmin
    .schema("memory")
    .from("working_memory")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const wm: WMRow[] = (wmRes.data ?? []) as WMRow[];

  if (wm.length <= WM_TURN_TRIGGER) return;

  const safeLimit = Math.max(0, wm.length - WM_TAIL_PROTECT);
  const chunk = wm.slice(0, Math.min(WM_CHUNK_SIZE, safeLimit));
  if (!chunk.length) return;

  try {
    const compaction = await runSessionCompaction(conversationId, chunk);

    await supabaseAdmin
      .schema("memory")
      .from("memories")
      .insert({
        user_id: userId,
        email: "system",
        workspace_id: null,
        memory_type: "session_compaction",
        source: "system",
        content: JSON.stringify(compaction),
        conversation_id: conversationId,
        confidence: 1.0,
      } as any);

    await supabaseAdmin
      .schema("memory")
      .from("working_memory")
      .delete()
      .in("id", chunk.map((c) => c.id));
  } catch (err) {
    console.error("[WM-COMPACTION] failed", err);
  }
}

// ------------------------------------------------------------
// POST handler (AUTHORITATIVE)
// ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("[CHAT BODY]", {
      hasAttachments: Array.isArray(body.attachments),
      attachmentCount: body.attachments?.length,
      keys: Object.keys(body ?? {}),
    });

    const {
      message,
      canonicalUserKey,
      userKey,
      workspaceId,
      conversationId,
      newsMode = false,
      newsLanguage,
      ministryMode = false,
      founderMode = false,
      modeHint = "",
      newsDigest,
    } = body ?? {};

    const finalUserKey = canonicalUserKey ?? userKey;

    // --------------------------------------------------------
    // EXPLICIT EPPE COMMAND (HARD GATE — LOCAL ONLY)
    // --------------------------------------------------------
    const isEPPECommand =
      typeof message === "string" &&
      message.trim().toLowerCase().startsWith("/eppe");

    const normalizedMessage =
      isEPPECommand && typeof message === "string"
        ? message.replace(/^\/eppe\s*/i, "").trim()
        : message;

// --------------------------------------------------------
// DEMO SAFE — EXECUTION PROFILE
// --------------------------------------------------------
const executionProfile =
  finalUserKey === "webflow-guest" ? "demo" : "studio";

// --------------------------------------------------------
// OPTION B2 — DEMO SENTINEL + SESSION WM
// --------------------------------------------------------
const DEMO_USER_ID = "demo-session";
const allowSessionWM = executionProfile === "demo";

// --------------------------------------------------------
// CANONICAL WORKSPACE RESOLUTION
// --------------------------------------------------------
const resolvedWorkspaceId =
  workspaceId ??
  process.env.MCA_WORKSPACE_ID ??
  "global_news";

// --------------------------------------------------------
// ADMIN CLIENT (SINGLE AUTHORITATIVE DECLARATION)
// --------------------------------------------------------
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// --------------------------------------------------------
// AUTHORITATIVE CONVERSATION RESOLUTION (FIXED)
// Demo mode is SESSION-SCOPED per user
// --------------------------------------------------------
let resolvedConversationId: string | null = null;

if (executionProfile === "demo") {
  // Session-scoped demo conversation (per user/session)
  resolvedConversationId = conversationId ?? finalUserKey;
} else {
  resolvedConversationId = conversationId ?? null;

  if (!resolvedConversationId && finalUserKey) {
    const { data, error } = await supabaseAdmin
      .schema("memory")
      .from("conversations")
      .insert({
        user_id: finalUserKey,
        workspace_id: resolvedWorkspaceId,
        source: "chat_bootstrap",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error("Failed to bootstrap conversation");
    }

    resolvedConversationId = data.id;
  }
}

// --------------------------------------------------------
// INVARIANT CHECK (NON-NEGOTIABLE)
// --------------------------------------------------------
if (!finalUserKey || !resolvedConversationId) {
  throw new Error("userKey and conversationId are required");
}

// --------------------------------------------------------
// SSR AUTH CONTEXT (MUST PRECEDE authUserId)
// --------------------------------------------------------
const cookieStore: ReadonlyRequestCookies = await cookies();

const supabaseSSR = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  }
);

const {
  data: { user },
} = await supabaseSSR.auth.getUser();

// --------------------------------------------------------
// AUTH USER RESOLUTION (NOW SAFE)
// --------------------------------------------------------
const authUserId =
  executionProfile === "demo"
    ? DEMO_USER_ID
    : user?.id ?? finalUserKey;

// --------------------------------------------------------
// DEMO MODE — SESSION WM READ (10 TURN CAP)
// --------------------------------------------------------
let sessionWM: Array<{ role: "user" | "assistant"; content: string }> = [];

if (executionProfile === "demo" && resolvedConversationId) {
  const { data: wmRows } = await supabaseAdmin
    .schema("memory")
    .from("working_memory")
    .select("role, content, created_at")
    .eq("conversation_id", resolvedConversationId)
    .eq("user_id", DEMO_USER_ID)
    .order("created_at", { ascending: false })
    .limit(10);

  if (Array.isArray(wmRows) && wmRows.length > 0) {
    sessionWM = wmRows
      .reverse()
      .map((r) => ({
        role: r.role as "user" | "assistant",
        content: r.content,
      }));
  }
}

// --------------------------------------------------------
// Persist user message
// --------------------------------------------------------
if ((authUserId || allowSessionWM) && message) {
  await supabaseAdmin
    .schema("memory")
    .from("working_memory")
    .insert({
      conversation_id: resolvedConversationId,
      user_id: authUserId,
      workspace_id: resolvedWorkspaceId,
      role: "user",
      content: message,
    });
}

// --------------------------------------------------------
// CONTEXT ASSEMBLY
// --------------------------------------------------------
const context = await assembleContext(
  finalUserKey,
  resolvedWorkspaceId,
  normalizedMessage ?? "",
  {
    sessionId: resolvedConversationId,
    sessionStartedAt: new Date().toISOString(),
    executionProfile,
  }
);

    // --------------------------------------------------------
// ATTACHMENTS — AUTHORITATIVE CONTEXT INJECTION (FIXED)
// --------------------------------------------------------
let attachmentDigest = "";
let hasImageAttachments = false;

if (Array.isArray(body.attachments) && body.attachments.length > 0) {
  attachmentDigest = await processAttachments(
    body.attachments.map((a: any) => ({
      name: a.name,
      url: a.url,
      type: a.mime,
    }))
  );

  hasImageAttachments = body.attachments.some(
    (a: any) => typeof a.mime === "string" && a.mime.startsWith("image/")
  );

  (context as any).attachments = body.attachments.map((a: any) => ({
    name: a.name,
    mime: a.mime,
    url: a.url,
    size: a.size,
  }));

  // ------------------------------------------------------
  // IMPLICIT VISION CONSENT (UPLOAD = CONSENT)
  // ------------------------------------------------------
  if (hasImageAttachments) {
    (context as any).visionConsent = true;
  }
}

// --------------------------------------------------------
// DEMO SAFE — IMAGE BLOCK
// --------------------------------------------------------
if (executionProfile === "demo" && isImageRequest(message)) {
  const demoResponse = "I’m here in demo mode. Ask me anything.";

  return NextResponse.json({
    ok: true,
    conversationId: resolvedConversationId,
    response: demoResponse,
    messages: [{ role: "assistant", content: demoResponse }],
  });
}

// --------------------------------------------------------
// TERMINAL APPROVAL
// --------------------------------------------------------
if (isTerminalApproval(message)) {
  const terminalResponse = terminalApprovalResponse();

  if (authUserId || allowSessionWM) {
    await supabaseAdmin
      .schema("memory")
      .from("working_memory")
      .insert({
        conversation_id: resolvedConversationId,
        user_id: authUserId ?? finalUserKey,
        workspace_id: resolvedWorkspaceId,
        role: "assistant",
        content: terminalResponse,
      });
  }

  return NextResponse.json({
    ok: true,
    conversationId: resolvedConversationId,
    response: terminalResponse,
    messages: [{ role: "assistant", content: terminalResponse }],
  });
}

// --------------------------------------------------------
// IMAGE GENERATION REQUEST (NOT ANALYSIS)
// --------------------------------------------------------
if (message && isImageRequest(message)) {
  const imageUrl = await generateImage(message);
  const imageHtml = `<img src="${imageUrl}" style="max-width:100%;border-radius:12px;" />`;

  if (authUserId || allowSessionWM) {
    await supabaseAdmin
      .schema("memory")
      .from("working_memory")
      .insert({
        conversation_id: resolvedConversationId,
        user_id: authUserId,
        workspace_id: resolvedWorkspaceId,
        role: "assistant",
        content: imageHtml,
      });
  }

  return NextResponse.json({
    ok: true,
    conversationId: resolvedConversationId,
    response: imageHtml,
    messages: [{ role: "assistant", content: imageHtml }],
  });
}

// ------------------------------------------------------------
// EXPORT INTENT DETECTION (AUTHORITATIVE)
// ------------------------------------------------------------
function detectsExportIntent(text?: string): null | {
  format: "docx" | "pdf" | "csv";
  filename?: string;
} {
  if (!text) return null;

  const lower = text.toLowerCase();

  if (lower.includes("[export:docx]")) return { format: "docx" };
  if (lower.includes("[export:pdf]")) return { format: "pdf" };
  if (lower.includes("[export:csv]")) return { format: "csv" };

  return null;
}

// --------------------------------------------------------
// NEWSROOM
// --------------------------------------------------------
const wantsNews =
  newsMode === true ||
  (typeof message === "string" && isNewsKeywordFallback(message));

if (wantsNews) {
  const { data: digestRows, error } = await supabaseAdmin
    .from("solace_news_digest_view")
    .select(
      "story_title, outlet, neutral_summary, story_url, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw new Error("NEWSROOM_DIGEST_FETCH_FAILED");

  const newsroomResponse = await runNewsroomExecutor(digestRows ?? []);

  await supabaseAdmin
    .schema("memory")
    .from("working_memory")
    .insert({
      conversation_id: resolvedConversationId,
      user_id: finalUserKey,
      workspace_id: resolvedWorkspaceId,
      role: "assistant",
      content: newsroomResponse,
    });

  return NextResponse.json({
    ok: true,
    conversationId: resolvedConversationId,
    response: newsroomResponse,
    messages: [{ role: "assistant", content: newsroomResponse }],
  });
}

// --------------------------------------------------------
// EPPE IMPLICIT USE REJECTION
// --------------------------------------------------------
if (!isEPPECommand && requiresEPPE01(normalizedMessage)) {
  const rejection =
    "EPPE-01 evaluations require explicit invocation using the `/eppe` command.";

  await supabaseAdmin
    .schema("memory")
    .from("working_memory")
    .insert({
      conversation_id: resolvedConversationId,
      user_id: authUserId,
      workspace_id: resolvedWorkspaceId,
      role: "assistant",
      content: rejection,
    });

  return NextResponse.json({
    ok: true,
    conversationId: resolvedConversationId,
    response: rejection,
    messages: [{ role: "assistant", content: rejection }],
  });
}

// --------------------------------------------------------
// HYBRID MESSAGE (ATTACHMENTS + VISION AUTH)
// --------------------------------------------------------
const visionInstruction =
  (context as any).visionConsent
    ? "The user has provided image attachments. You are authorized to analyze and describe their contents directly."
    : "";

const hybridUserMessage =
  `${visionInstruction}\n\n${
    attachmentDigest && attachmentDigest.length > 0
      ? `${normalizedMessage ?? ""}\n\n${attachmentDigest}`
      : normalizedMessage ?? ""
  }`;

// --------------------------------------------------------
// HYBRID PIPELINE
// --------------------------------------------------------
const result = await runHybridPipeline({
  userMessage: hybridUserMessage,
  context,
  ministryMode,
  founderMode,
  modeHint,
});

const rawResponse =
  typeof result?.finalAnswer === "string" && result.finalAnswer.length > 0
    ? result.finalAnswer
    : "I’m here and ready to continue.";

// --------------------------------------------------------
// EXPORT INTERCEPT (AUTHORITATIVE)
// --------------------------------------------------------
const exportIntent = detectsExportIntent(rawResponse);

if (exportIntent) {
  const exportRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/exports`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: exportIntent.format,
        filename: exportIntent.filename,
        content: rawResponse,
        workspaceId: resolvedWorkspaceId,
      }),
    }
  );

  const exportJson = await exportRes.json();

  if (exportJson?.ok && exportJson.export?.url) {
    const downloadResponse =
      `Your file is ready.\n\n` +
      `[Download ${exportIntent.filename}](${exportJson.export.url})`;

    if (authUserId || allowSessionWM) {
      await supabaseAdmin
        .schema("memory")
        .from("working_memory")
        .insert({
          conversation_id: resolvedConversationId,
          user_id: authUserId,
          workspace_id: resolvedWorkspaceId,
          role: "assistant",
          content: downloadResponse,
        });
    }

    return NextResponse.json({
      ok: true,
      conversationId: resolvedConversationId,
      response: downloadResponse,
      messages: [{ role: "assistant", content: downloadResponse }],
    });
  }
}

// --------------------------------------------------------
// EPPE-01 VALIDATION (COMMAND ONLY)
// --------------------------------------------------------
let gatedResponse: any = rawResponse;

if (isEPPECommand) {
  let parsed: any;

  try {
    parsed =
      typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;
  } catch {
    return NextResponse.json({
      ok: false,
      conversationId: resolvedConversationId,
      response:
        "EPPE-01 output must be valid JSON conforming to the evaluation schema.",
      messages: [
        {
          role: "assistant",
          content:
            "EPPE-01 enforcement: invalid or malformed JSON output.",
        },
      ],
    });
  }

  const { valid, errors } = validateEPPE01(parsed);

  if (!valid) {
    return NextResponse.json({
      ok: false,
      conversationId: resolvedConversationId,
      response:
        "This evaluation does not meet EPPE-01 requirements and cannot be finalized.",
      messages: [
        {
          role: "assistant",
          content: `EPPE-01 validation failed:\n${errors
            ?.map(
              (e: any) => `- ${e.instancePath || "(root)"} ${e.message}`
            )
            .join("\n")}`,
        },
      ],
    });
  }

  gatedResponse = JSON.stringify(parsed, null, 2);
}

// --------------------------------------------------------
// ARTIFACT PASSTHROUGH (TEXT)
// --------------------------------------------------------
if (
  gatedResponse &&
  typeof gatedResponse === "object" &&
  gatedResponse.artifact?.type === "text"
) {
  const artifact = gatedResponse.artifact;

  const safeContent = assertNoPhantomLanguage(
    scrubPhantomExecutionLanguage(artifact.content)
  );

  return NextResponse.json({
    ok: true,
    conversationId: resolvedConversationId,
    messages: [
      {
        role: "assistant",
        content: null,
        artifact: {
          ...artifact,
          content: safeContent,
        },
      },
    ],
  });
}

// --------------------------------------------------------
// SAFETY SCRUB
// --------------------------------------------------------
const scrubbed = scrubPhantomExecutionLanguage(gatedResponse);
const safeResponse = assertNoPhantomLanguage(scrubbed);

// --------------------------------------------------------
// CODE ARTIFACT EXTRACTION (AUTHORITATIVE)
// --------------------------------------------------------
const codeArtifactResult = extractCodeArtifact(safeResponse);

if (codeArtifactResult) {
  const { artifact, residualText } = codeArtifactResult;

  if (authUserId || allowSessionWM) {
    await supabaseAdmin
      .schema("memory")
      .from("working_memory")
      .insert({
        conversation_id: resolvedConversationId,
        user_id: authUserId,
        workspace_id: resolvedWorkspaceId,
        role: "assistant",
        content: residualText || "",
      });
  }

  return NextResponse.json({
    ok: true,
    conversationId: resolvedConversationId,
    messages: [
      ...(residualText
        ? [{ role: "assistant", content: residualText }]
        : []),
      {
        role: "assistant",
        artifact,
      },
    ],
  });
}


// --------------------------------------------------------
// PERSIST ASSISTANT MESSAGE (STRING PATH)
// --------------------------------------------------------
if (authUserId || allowSessionWM) {
  await supabaseAdmin
    .schema("memory")
    .from("working_memory")
    .insert({
      conversation_id: resolvedConversationId,
      user_id: authUserId,
      workspace_id: resolvedWorkspaceId,
      role: "assistant",
      content: safeResponse,
    });
}

return NextResponse.json({
  ok: true,
  conversationId: resolvedConversationId,
  response: safeResponse,
  messages: [{ role: "assistant", content: safeResponse }],
});

} catch (err: any) {
  console.error("[CHAT ROUTE ERROR]", err?.message);

  return NextResponse.json({
    ok: false,
    response: "An internal error occurred. I’m still here.",
    messages: [
      {
        role: "assistant",
        content: "An internal error occurred. I’m still here.",
      },
    ],
  });
}
}
