// ------------------------------------------------------------
// Solace Context Assembler
// Authoritative Read Path
//------------------------------------------------------------

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  FACTS_LIMIT,
  EPISODES_LIMIT,
  RESEARCH_CONTEXT_LIMIT,
} from "./context.constants";

// ------------------------------------------------------------
// ADDITIVE — REFLECTION LEDGER READ MODEL (NON-AUTHORITATIVE)
// ------------------------------------------------------------
import { ReflectionLedgerRead } from "@/services/reflection/reflectionLedger.read";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
export type WorkingMemoryItem = {
  id?: string;
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
};

export type SolaceContextBundle = {
  persona: string;

  executionProfile?: "studio" | "demo";

  memoryPack: {
    facts: any[];
    episodic: any[];
    autobiography: any[];
    sessionCompaction?: any | null;
    sessionState?: any | null;
  };

  reflectionLedger?: ReflectionLedgerRead[];

  workingMemory: {
    active: boolean;
    items: WorkingMemoryItem[];
    disclaimer?: string;
  };

  researchContext: any[];
  authorities: any[];
  newsDigest: any[];
  didResearch: boolean;

  workspace?: {
    id: string | null;
    mode?: string | null;
    policy?: Record<string, any> | null;
  };

  rolodex?: any[];
};

// ------------------------------------------------------------
// SESSION ENVELOPE
// ------------------------------------------------------------
type ContextSessionEnvelope = {
  sessionId: string;
  sessionStartedAt: string;
  executionProfile?: "studio" | "demo";
  sessionWM?: WorkingMemoryItem[]; // ← EXPLICIT BRIDGE
};

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------
const DEMO_USER_ID = "demo-session";
const DEMO_WM_LIMIT = 10;

// ------------------------------------------------------------
// MAIN ASSEMBLER
// ------------------------------------------------------------
export async function assembleContext(
  canonicalUserKey: string,
  workspaceId: string | null,
  userMessage: string,
  session?: ContextSessionEnvelope
): Promise<SolaceContextBundle> {
  const conversationId = session?.sessionId ?? null;
  const executionProfile = session?.executionProfile ?? "studio";

  const cookieStore = await cookies();

  // ----------------------------------------------------------
  // USER-SCOPED CLIENT
  // ----------------------------------------------------------
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  // ----------------------------------------------------------
  // ADMIN CLIENT
  // ----------------------------------------------------------
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  const isDemo = executionProfile === "demo";
  const effectiveUserId = user?.id ?? (isDemo ? DEMO_USER_ID : null);

  // ----------------------------------------------------------
  // DEMO MODE — SESSION-INJECTED WM ONLY (NO DB READ)
  // ----------------------------------------------------------
  if (!user && isDemo) {
    const injectedSessionWM = Array.isArray(session?.sessionWM)
      ? session!.sessionWM.slice(-DEMO_WM_LIMIT)
      : [];

    return {
      persona: "Solace",
      executionProfile,
      memoryPack: {
        facts: [],
        episodic: [],
        autobiography: [],
        sessionCompaction: null,
        sessionState: null,
      },
      reflectionLedger: [],
      workingMemory: {
        active: injectedSessionWM.length > 0,
        items: injectedSessionWM,
        disclaimer:
          "Working memory is session-scoped, non-authoritative, and used only for conversational continuity.",
      },
      researchContext: [],
      authorities: [],
      newsDigest: [],
      didResearch: false,
      rolodex: [],
    };
  }

  // ----------------------------------------------------------
  // FACTUAL MEMORY (AUTHORITATIVE)
  // ----------------------------------------------------------
  const factsRes = await supabaseAdmin
    .schema("memory")
    .from("memories")
    .select("content")
    .eq("user_id", effectiveUserId)
    .eq("memory_type", "fact")
    .order("created_at", { ascending: false })
    .limit(FACTS_LIMIT);

  const factualMemories = Array.isArray(factsRes.data)
    ? factsRes.data.map((m) => m.content)
    : [];

  // ----------------------------------------------------------
  // WORKING MEMORY (READ-ONLY CONTINUITY CONTEXT)
  // ----------------------------------------------------------
  let workingMemoryItems: WorkingMemoryItem[] = [];

  if (conversationId) {
    const wmRes = await supabaseAdmin
      .schema("memory")
      .from("working_memory")
      .select("id, role, content, created_at")
      .eq("user_id", effectiveUserId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(isDemo ? DEMO_WM_LIMIT : 50);

    workingMemoryItems = Array.isArray(wmRes.data) ? wmRes.data : [];
  }

  // ----------------------------------------------------------
  // REFLECTION LEDGER (READ PROJECTION — NON-AUTHORITATIVE)
  // ----------------------------------------------------------
  const reflectionRes = await supabaseAdmin
    .schema("governance")
    .from("reflection_ledger")
    .select("source, domain, summary, outcome, recorded_at")
    .eq("user_id", effectiveUserId)
    .order("recorded_at", { ascending: false })
    .limit(5);

  const reflectionLedger: ReflectionLedgerRead[] = Array.isArray(
    reflectionRes.data
  )
    ? reflectionRes.data
    : [];

  // ----------------------------------------------------------
  // RESEARCH CONTEXT
  // ----------------------------------------------------------
  const hubbleRes = await supabaseAdmin
    .schema("research")
    .from("hubble_ingest_v1")
    .select("*")
    .order("timestamp_utc", { ascending: false })
    .limit(RESEARCH_CONTEXT_LIMIT);

  const researchItems = Array.isArray(hubbleRes.data)
    ? hubbleRes.data
    : [];

  // ----------------------------------------------------------
  // RETURN CONTEXT BUNDLE
  // ----------------------------------------------------------
  return {
    persona: "Solace",
    executionProfile,
    memoryPack: {
      facts: factualMemories,
      episodic: [],
      autobiography: [],
      sessionCompaction: null,
      sessionState: null,
    },
    reflectionLedger,
    workingMemory: {
      active: workingMemoryItems.length > 0,
      items: workingMemoryItems,
      disclaimer:
        "Working memory is a read-only continuity aid. It does not override facts, rules, or governance constraints.",
    },
    researchContext: researchItems,
    authorities: [],
    newsDigest: [],
    didResearch: researchItems.length > 0,
    rolodex: [],
  };
}
