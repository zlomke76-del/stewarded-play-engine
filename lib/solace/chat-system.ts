// lib/solace/chat-system.ts

import { buildSolaceSystemPrompt, type SolaceDomain } from "@/lib/solace/persona";

const SOLACE_NAME = "Solace";

/* ========= GUIDELINES / HOUSE RULES / RESPONSE FORMAT ========= */

const HOUSE_RULES = `HOUSE RULES
- You are ${SOLACE_NAME}, a steady, compassionate presence. Warmth without sentimentality; conviction without ego.
- Always uphold human dignity; avoid contempt or stereotyping.
- Be kind but candid; moral clarity over relativism.
- If stakes are medical, legal, or financial, suggest qualified professionals.
- If the user requests "secular framing," omit religious references.`;

const GUIDELINE_NEUTRAL = `NEUTRAL MODE BASELINE
- Be clear, structured, impartial.
- Use recognized moral, legal, policy, and practical frameworks when relevant.
- Identify uncertainty; avoid speculation.
- Short paragraphs; no fluff.`;

const GUIDELINE_ABRAHAMIC = `ABRAHAMIC COUNSEL LAYER
- Root counsel in God across the Abrahamic tradition (Torah/Tanakh, New Testament, Qur'an).
- Emphasize dignity, stewardship, mercy, justice, truthfulness, responsibility before God.
- No sectarian polemics or proselytizing; use inclusive language.
- Avoid detailed legal rulings unless asked; recommend local clergy/scholars when appropriate.`;

const GUIDELINE_GUIDANCE = `GUIDANCE ADD-ON
- Brief red-team for high-stakes.
- Offer a compact risk register and options matrix when asked.
- Provide an actionable checklist when steps are requested.`;

const RESPONSE_FORMAT = `RESPONSE FORMAT
- Default: a single "Brief Answer" (2–5 sentences).
- Add "Rationale" / "Next Steps" only if asked.
- If a MEMORY PACK is present, prefer it over general disclaimers. On prompts like "What do you remember about me?", list the relevant memory items succinctly.`;

/* scripture policy */
function scripturePolicyText(opts: {
  wantsAbrahamic: boolean;
  forceFirstTurnSeeding: boolean;
  userAskedForSecular: boolean;
}) {
  const base = `SCRIPTURE POLICY
- Very short references only (e.g., "Exodus 20", "Matthew 5", "Qur'an 4:135"); no long quotes by default.
- Weave 1–2 references inline only when relevant.
`;

  if (!opts.wantsAbrahamic || opts.userAskedForSecular)
    return base + `- Abrahamic references DISABLED due to secular framing/inactive layer.`;

  if (opts.forceFirstTurnSeeding)
    return base + `- FIRST TURN ONLY: allow ONE gentle anchor reference; later only when clearly helpful.`;

  return base + `- Include references only when clearly helpful or requested.`;
}

function isFirstRealTurn(messages: Array<{ role: string; content: string }>) {
  const userCount = messages.filter((m) => m.role?.toLowerCase() === "user").length;
  const assistantCount = messages.filter((m) => m.role?.toLowerCase() === "assistant").length;
  return userCount <= 1 || messages.length < 3 || assistantCount === 0;
}

function hasEmotionalOrMoralCue(text: string) {
  const t = (text || "").toLowerCase();
  const emo = [
    "hope", "lost", "afraid", "fear", "anxious", "grief",
    "sad", "sorrow", "depressed", "stress", "overwhelmed",
    "lonely", "comfort", "forgive", "forgiveness", "guilt",
    "shame", "purpose", "meaning"
  ];
  const moral = [
    "right", "wrong", "unfair", "injustice", "justice",
    "truth", "honest", "dishonest", "integrity",
    "mercy", "compassion", "courage"
  ];
  const hit = (arr: string[]) => arr.some((w) => t.includes(w));
  return hit(emo) || hit(moral);
}

export function buildChatSystemPrompt(opts: {
  filters: string[];
  userWantsSecular: boolean;
  messages: Array<{ role: string; content: string }>;
  memorySection?: string;
  newsSection?: string;
  webSection?: string;
  researchSection?: string;
  hasNewsContext?: boolean;
  hasWebContext?: boolean;
  hasResearchContext?: boolean;
  governorExtras?: string; // <-- added safely
}) {
  const {
    filters,
    userWantsSecular,
    messages,
    memorySection = "",
    newsSection = "",
    webSection = "",
    researchSection = "",
    hasNewsContext = false,
    hasWebContext = false,
    hasResearchContext = false,
    governorExtras = ""
  } = opts;

  const wantsAbrahamic = filters.includes("abrahamic") || filters.includes("ministry");
  const wantsGuidance = filters.includes("guidance");

  const lastUserText =
    [...messages].reverse().find((m) => m.role?.toLowerCase() === "user")?.content ?? "";
  const firstTurn = isFirstRealTurn(messages);
  const forceFirstTurnSeeding =
    wantsAbrahamic && !userWantsSecular && firstTurn && hasEmotionalOrMoralCue(lastUserText);

  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  const year = iso.slice(0, 4);

  const TIME_ANCHOR = `TIME AND CONTEXT
- Today's date is ${iso} (YYYY-MM-DD). Treat this as "now".
- If the user asks for the current year, answer with ${year}.
- If information depends on events after your training cutoff AND no WEB CONTEXT or RESEARCH CONTEXT or NEWS CONTEXT is provided, explicitly say that you do not have up-to-date information and DO NOT guess.
- When WEB CONTEXT, RESEARCH CONTEXT, or NEWS CONTEXT is present, rely on it for post-cutoff events.
- Never state that the current year is earlier than ${year}.`;

  const extrasParts: string[] = [];

  extrasParts.push(
    `IDENTITY AND HOUSE RULES\n${HOUSE_RULES}`,
    TIME_ANCHOR,
    GUIDELINE_NEUTRAL,
    RESPONSE_FORMAT,
    scripturePolicyText({
      wantsAbrahamic,
      forceFirstTurnSeeding,
      userAskedForSecular: userWantsSecular
    })
  );

  if (wantsAbrahamic && !userWantsSecular) extrasParts.push(GUIDELINE_ABRAHAMIC);
  if (wantsGuidance) extrasParts.push(GUIDELINE_GUIDANCE);

  const extras = extrasParts.join("\n\n");

  const domain: SolaceDomain =
    wantsAbrahamic && !userWantsSecular
      ? "ministry"
      : wantsGuidance
      ? "guidance"
      : "core";

  const base = buildSolaceSystemPrompt(domain, extras);

  // Governor Directions (silent — never spoken to user)
  const governorBlock = governorExtras
    ? `\n\nGOVERNOR_DIRECTIONS_INTERNAL\n${governorExtras}`
    : "";

  const webAssertion =
    hasWebContext || hasResearchContext || hasNewsContext
      ? `\n\nREAL-TIME CONTEXT\n- You DO have recent context from WEB, RESEARCH, or NEWS. Do NOT say you cannot access the internet. Synthesize using provided context only.`
      : "";

  const system =
    base +
    memorySection +
    newsSection +
    webSection +
    researchSection +
    webAssertion +
    governorBlock;

  return {
    system,
    wantsAbrahamic,
    forceFirstTurnSeeding
  };
}
