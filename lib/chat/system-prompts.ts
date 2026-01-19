// lib/chat/system-prompts.ts
//
// Builds the full Solace system prompt for all modes.
// This file centralizes persona layers, moral architecture,
// contextual injections, scripture policy, and mode-specific overrides.

import { buildScripturePolicy } from "./system/scripture";
import { buildTimeAnchor } from "./system/time";
import { buildNewsModePrompt } from "./system/news-mode";
import { buildNeutralityCheckPrompt } from "./system/neutrality-mode";

export type SystemPromptInput = {
  filters: string[];
  mode: string;
  rolled: Array<{ role: string; content: string }>;
  memorySection: string;
  researchSection: string;
  newsSection: string;
  webSection: string;
  realTimeAssertion: string;
};

export function buildSolaceSystemPrompt(input: SystemPromptInput): {
  system: string;
  identity: string;
} {
  const {
    filters,
    mode,
    rolled,
    memorySection,
    researchSection,
    newsSection,
    webSection,
    realTimeAssertion,
  } = input;

  // Last user message for emotional/moral cue detection.
  const lastUser =
    [...rolled].reverse().find((m) => m.role === "user")?.content || "";

  // -------------------------------------------------------
  // LAYER: Core Solace Identity (baseline across all modes)
  // -------------------------------------------------------
  const BASE_SOLACE_IDENTITY = `
IDENTITY  
You are **Solace** — a steady, principled presence inside Moral Clarity AI.
Your tone is: warm but not sentimental, morally clear but never arrogant,
emotionally intelligent, concise, trustworthy, and grounded.
You listen first, then answer with clarity and calm authority.
`.trim();

  // -------------------------------------------------------
  // LAYER: House Rules (always active)
  // -------------------------------------------------------
  const HOUSE_RULES = `
HOUSE RULES
- Uphold dignity and neutrality; avoid contempt and stereotypes.
- Be kind but candid; moral clarity over relativism.
- Acknowledge uncertainty; never fabricate.
- Medical / legal / financial → advise consulting professionals.
`.trim();

  // -------------------------------------------------------
  // LAYER: Neutral Baseline (non-Abrahamic)
  // -------------------------------------------------------
  const NEUTRAL_MODE = `
NEUTRAL MODE BASELINE
- Concise, structured, impartial.
- Use recognized ethical, moral, and policy frameworks.
- Identify unknowns; never guess.
- Short paragraphs, high signal, no filler.
`.trim();

  // -------------------------------------------------------
  // LAYER: Abrahamic Counsel Layer (if enabled)
  // -------------------------------------------------------
  const wantsAbrahamic =
    filters.includes("abrahamic") || filters.includes("ministry");
  const wantsGuidance = filters.includes("guidance");

  const ABRAHAMIC_LAYER = `
ABRAHAMIC COUNSEL LAYER
- Root counsel in the Abrahamic tradition (Jewish, Christian, Muslim).
- Emphasize stewardship, justice, mercy, truthfulness, responsibility before God.
- Stay non-sectarian; avoid polemics; use inclusive language.
- No long scripture quotations unless explicitly requested.
`.trim();

  // -------------------------------------------------------
  // Guidance Layer
  // -------------------------------------------------------
  const GUIDANCE_LAYER = `
GUIDANCE MODE
- Provide compact: risks, options, tradeoffs, red-team notes.
- When stakes are high, add a small "risk register".
- When asked "what should I do" → offer options, not prescriptions.
`.trim();

  // -------------------------------------------------------
  // Mode Personality Overrides
  // -------------------------------------------------------

  const GENERAL_SOLACE = `
PERSONALITY OVERRIDE — GENERAL SOLACE
- Calm, emotionally intelligent, steady.
- Provide moral clarity without judgment.
- Combine empathy with strategic reasoning.
`.trim();

  const NEWS_ANCHOR_SOLACE = buildNewsModePrompt();

  const NEUTRALITY_SOLACE = buildNeutralityCheckPrompt();

  // -------------------------------------------------------
  // Choose personality for current mode
  // -------------------------------------------------------
  let modePersona = GENERAL_SOLACE;

  if (mode === "News") modePersona = NEWS_ANCHOR_SOLACE;
  if (mode === "NeutralityCheck") modePersona = NEUTRALITY_SOLACE;
  if (mode === "Guidance") modePersona = GENERAL_SOLACE + "\n\n" + GUIDANCE_LAYER;

  // -------------------------------------------------------
  // SCRIPTURE POLICY (dynamic)
  // -------------------------------------------------------
  const SCRIPTURE = buildScripturePolicy({
    wantsAbrahamic,
    lastUser,
    isFirstTurn: rolled.length <= 2,
  });

  // -------------------------------------------------------
  // TIME ANCHOR
  // -------------------------------------------------------
  const TIME = buildTimeAnchor();

  // -------------------------------------------------------
  // Memory, Research, News, Web Context
  // -------------------------------------------------------
  const CONTEXT = `
${memorySection || ""}
${researchSection || ""}
${newsSection || ""}
${webSection || ""}
${realTimeAssertion || ""}
`.trim();

  // -------------------------------------------------------
  // Assemble full prompt
  // -------------------------------------------------------
  const parts: string[] = [];

  parts.push(BASE_SOLACE_IDENTITY);
  parts.push(HOUSE_RULES);
  parts.push(TIME);
  parts.push(NEUTRAL_MODE);

  if (wantsAbrahamic) parts.push(ABRAHAMIC_LAYER);
  parts.push(modePersona);
  parts.push(SCRIPTURE);

  if (CONTEXT.trim().length > 0) parts.push(CONTEXT);

  const system = parts.join("\n\n");

  return { system, identity: "Solace" };
}
