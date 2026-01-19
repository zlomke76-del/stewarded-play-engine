//--------------------------------------------------------------
// NEWSROOM EXECUTOR — SINGLE PASS (AUTHORITATIVE)
// Strict neutral delivery
//--------------------------------------------------------------

import { callModel } from "./model-router";
import { buildSolaceSystemPrompt } from "@/lib/solace/persona";

// --------------------------------------------------------------
// TYPES
// --------------------------------------------------------------
export type NewsDigestItem = {
  story_title: string;
  outlet: string;
  neutral_summary: string;
  source_url?: string;
  created_at: string;
};

// --------------------------------------------------------------
// SYSTEM PROMPT
// --------------------------------------------------------------
function buildNewsroomPrompt(items: NewsDigestItem[]) {
  const system = buildSolaceSystemPrompt(
    "newsroom",
    `
OUTPUT CONTRACT (MANDATORY):

- Produce EXACTLY three stories.
- Each story must be between 350 and 450 words.
- Narrative prose only.
- One topic per story.
- No opinion, framing, or emotion.
- Each story MUST end with a source link.
- Use ONLY the provided neutral summaries.
`
  );

  const digestBlock = items.slice(0, 3).map(
    (n, i) => `
STORY ${i + 1}
TITLE: ${n.story_title}
OUTLET: ${n.outlet}
SOURCE URL: ${n.source_url ?? "Unavailable"}

NEUTRAL SUMMARY:
${n.neutral_summary}
`
  ).join("\n");

  return `
${system}

------------------------------------------------------------
TODAY'S NEUTRAL NEWS DIGEST
------------------------------------------------------------
${digestBlock}
`;
}

// --------------------------------------------------------------
// EXECUTOR
// --------------------------------------------------------------
export async function runNewsroomExecutor(
  newsDigest: NewsDigestItem[]
): Promise<string> {

  // 🔎 PROOF LINE — EXECUTOR ENTERED
  console.log("[NEWSROOM EXECUTOR ENTERED]", {
    items: newsDigest?.length ?? 0,
  });

  if (!Array.isArray(newsDigest) || newsDigest.length < 3) {
    throw new Error("NEWSROOM_INSUFFICIENT_DIGEST");
  }

  const prompt = buildNewsroomPrompt(newsDigest);
  const response = await callModel("gpt-4.1", prompt);

  return response;
}
