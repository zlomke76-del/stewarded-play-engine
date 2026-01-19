// ------------------------------------------------------------
// Session Compaction Helper
// Deterministic State Extraction (NO UX, NO PERSONA)
// ------------------------------------------------------------

import OpenAI from "openai";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
export type WorkingMemoryItem = {
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
};

export type SessionCompactionResult = {
  conversation_id: string;
  compaction_version: "v1";
  state: {
    goals: string[];
    decisions: string[];
    constraints: string[];
    assumptions: string[];
    open_questions: string[];
    risks: string[];
  };
};

// ------------------------------------------------------------
// OPENAI CLIENT (SERVICE USE ONLY)
// ------------------------------------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ------------------------------------------------------------
// COMPACTION PROMPT (LOCKED CONTRACT)
// ------------------------------------------------------------
const COMPACTION_SYSTEM_PROMPT = `
You are performing SESSION STATE COMPACTION.

Your task is to extract and compress the authoritative state of the current conversation.
This output will be used as durable system memory and must be safe, precise, and non-creative.

STRICT RULES:
- Do NOT invent information.
- Do NOT infer intent beyond what is explicitly stated.
- Do NOT include dialogue, quotes, or conversational phrasing.
- Do NOT include tone, emotion, or style.
- Do NOT speculate or resolve uncertainties.
- If information is unclear or unresolved, place it in open_questions.

You must ONLY extract state that is clearly established in the input.

OUTPUT FORMAT:
Return a single JSON object with the following structure.
Do not include any additional text.

{
  "conversation_id": "{{conversation_id}}",
  "compaction_version": "v1",
  "state": {
    "goals": [],
    "decisions": [],
    "constraints": [],
    "assumptions": [],
    "open_questions": [],
    "risks": []
  }
}

FIELD DEFINITIONS:
- goals: Active objectives the user/system is working toward.
- decisions: Explicit choices or commitments already made and treated as binding.
- constraints: Rules, limitations, or requirements that must not be violated.
- assumptions: Statements currently treated as true but not yet verified.
- open_questions: Unresolved items requiring clarification or future decisions.
- risks: Known fragilities, failure modes, or areas of caution.

QUALITY BAR:
- Be concise but complete.
- Prefer bullet-style phrases over sentences.
- If a category has no valid entries, return an empty array.
- Accuracy is more important than completeness.
`;

// ------------------------------------------------------------
// MAIN HELPER
// ------------------------------------------------------------
export async function runSessionCompaction(
  conversationId: string,
  wmChunk: WorkingMemoryItem[]
): Promise<SessionCompactionResult> {
  if (!conversationId) {
    throw new Error("runSessionCompaction requires conversationId");
  }

  if (!Array.isArray(wmChunk) || wmChunk.length === 0) {
    throw new Error("runSessionCompaction requires non-empty working memory chunk");
  }

  // Serialize WM chunk deterministically
  const serializedWM = wmChunk.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const systemPrompt = COMPACTION_SYSTEM_PROMPT.replace(
    "{{conversation_id}}",
    conversationId
  );

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify({
          conversation_id: conversationId,
          working_memory: serializedWM,
        }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;

  if (!raw) {
    throw new Error("Compaction model returned empty response");
  }

  let parsed: SessionCompactionResult;

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("[COMPACTION PARSE ERROR]", raw);
    throw new Error("Failed to parse compaction JSON");
  }

  // Minimal structural validation
  if (
    parsed.conversation_id !== conversationId ||
    parsed.compaction_version !== "v1" ||
    typeof parsed.state !== "object"
  ) {
    throw new Error("Invalid compaction payload structure");
  }

  return parsed;
}
