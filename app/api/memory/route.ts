// ------------------------------------------------------------
// Memory Create Route (POST)
// Explicit memory only · Cookie auth · RLS enforced
// AUTHORITATIVE WRITE PATH — memory.memories
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

/* ------------------------------------------------------------
   Supabase (schema-bound to memory)
------------------------------------------------------------ */
async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "memory" },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/* ------------------------------------------------------------
   Allowed explicit memory types
------------------------------------------------------------ */
const ALLOWED_MEMORY_TYPES = new Set([
  "fact",
  "episodic",
  "autobiographical",
]);

/* ------------------------------------------------------------
   POST /api/memory
   Explicit, human-authored memory only
------------------------------------------------------------ */
export async function POST(req: Request) {
  const supabase = await getSupabase();

  /* ----------------------------------------------------------
     Auth (authoritative)
  ---------------------------------------------------------- */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  if (!user.email) {
    return NextResponse.json(
      { ok: false, error: "authenticated user missing email" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------------
     Parse JSON
  ---------------------------------------------------------- */
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const { workspace_id, memory_type, content } = body ?? {};

  /* ----------------------------------------------------------
     Validation
  ---------------------------------------------------------- */
  if (!workspace_id || typeof workspace_id !== "string") {
    return NextResponse.json(
      { ok: false, error: "workspace_id is required" },
      { status: 400 }
    );
  }

  if (!memory_type || !ALLOWED_MEMORY_TYPES.has(memory_type)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid memory_type. Allowed: fact, episodic, autobiographical",
      },
      { status: 400 }
    );
  }

  if (
    content === undefined ||
    content === null ||
    (typeof content === "string" && !content.trim())
  ) {
    return NextResponse.json(
      { ok: false, error: "content is required" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------------
     Canonical defaults for explicit human memory
     (governance-enforced fields)
  ---------------------------------------------------------- */
  const memoryRecord = {
    user_id: user.id,                 // must equal auth.uid()
    email: user.email,                // NOT NULL
    workspace_id,                     // nullable in schema, required by route
    memory_type,
    source: "explicit",               // NOT NULL
    content,

    // Governance weights (NOT NULL)
    confidence: 1.0,
    sensitivity: 1,
    emotional_weight: 1,

    // Metadata (NOT NULL)
    metadata: {},

    // Optional lifecycle flags
    is_active: true,
  };

  /* ----------------------------------------------------------
     Insert explicit memory
  ---------------------------------------------------------- */
  const { data, error } = await supabase
    .from("memories")
    .insert(memoryRecord)
    .select()
    .single();

  if (error) {
    console.error("insert.memory error", error);
    return NextResponse.json(
      {
        ok: false,
        stage: "insert.memory",
        error: error.message,
      },
      { status: 403 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
