// lib/chat/orchestrator.ts
//
// Central routing and execution engine for Solace chat.
// All Solace modes (General, Guidance, News, Neutrality, Attachments)
// plug into this orchestrator.

import type OpenAI from "openai";
import { getOpenAI } from "@/lib/openai";
import { solaceNonStream, solaceStream } from "./solace-backend";
import { buildSolaceSystemPrompt } from "./system-prompts";
import { processAttachments } from "./attachments";
import { detectMode } from "./router";
import { trimConversation } from "./utils";
import { withTimeout } from "./utils";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 20_000;

export type OrchestratorInput = {
  userId: string | null;
  userName: string | null;
  stream: boolean;
  filters: string[];
  messages: Array<{ role: string; content: string }>;
  attachments?: Array<any>;
  lastMode?: string | null;
  memorySection: string;
  researchSection: string;
  newsSection: string;
  webSection: string;
  realTimeAssertion: string;
};

export type OrchestratorResult =
  | {
      type: "json";
      text: string;
      model: string;
      identity: string;
      mode: string;
      confidence: number;
      filters: string[];
    }
  | {
      type: "stream";
      body: ReadableStream<Uint8Array>;
    };

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorResult> {
  const {
    userId,
    userName,
    stream,
    filters,
    lastMode,
    attachments,
    memorySection,
    researchSection,
    newsSection,
    webSection,
    realTimeAssertion,
  } = input;

  // ---------------------------------------------------------------------
  // Determine mode (General, Guidance, News, Neutrality)
  // ---------------------------------------------------------------------
  const rolled = trimConversation(input.messages);
  const lastUser = [...rolled].reverse().find((m) => m.role === "user")?.content || "";
  const { mode, confidence } = detectMode(lastUser, lastMode);

  // ---------------------------------------------------------------------
  // Handle attachments
  // ---------------------------------------------------------------------
  const attachmentSection = attachments?.length
    ? await processAttachments(attachments)
    : "";

  const rolledWithAttach = attachmentSection
    ? [...rolled, { role: "user", content: attachmentSection }]
    : rolled;

  // ---------------------------------------------------------------------
  // Build the Solace system prompt for this mode
  // ---------------------------------------------------------------------
  const { system, identity } = buildSolaceSystemPrompt({
    filters,
    mode,
    rolled: rolledWithAttach,
    memorySection,
    researchSection,
    newsSection,
    webSection,
    realTimeAssertion,
  });

  // ---------------------------------------------------------------------
  // If Solace API is configured, prefer Solace backend
  // ---------------------------------------------------------------------
  const useSolaceBackend =
    process.env.SOLACE_API_URL && process.env.SOLACE_API_KEY;

  if (useSolaceBackend) {
    if (!stream) {
      try {
        const text = await withTimeout(
          solaceNonStream({
            mode,
            userId,
            userName,
            system,
            messages: rolledWithAttach,
            temperature: 0.2,
          }),
          REQUEST_TIMEOUT_MS
        );

        return {
          type: "json",
          text: text.trim(),
          model: "solace",
          identity,
          mode,
          confidence,
          filters,
        };
      } catch (err) {
        console.error("[orchestrator] Solace backend failed, falling back to OpenAI:", err);
      }
    }

    // streaming path
    try {
      const body = await solaceStream({
        mode,
        userId,
        userName,
        system,
        messages: rolledWithAttach,
        temperature: 0.2,
      });
      return { type: "stream", body };
    } catch (err) {
      console.error("[orchestrator] Solace streaming failed, falling back:", err);
    }
  }

  // ---------------------------------------------------------------------
  // Fallback → OpenAI
  // ---------------------------------------------------------------------
  const openai: OpenAI = await getOpenAI();

  if (!stream) {
    const resp = await withTimeout(
      openai.responses.create({
        model: MODEL,
        input:
          system +
          "\n\n" +
          rolledWithAttach.map((m) => `${m.role}: ${m.content}`).join("\n"),
        max_output_tokens: 800,
        temperature: 0.2,
      }),
      REQUEST_TIMEOUT_MS
    );

    const text = (resp as any).output_text?.trim() || "[No reply]";
    return {
      type: "json",
      text,
      model: MODEL,
      identity,
      mode,
      confidence,
      filters,
    };
  }

  // OpenAI streaming fallback
  const apiKey = process.env.OPENAI_API_KEY || "";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        ...rolledWithAttach.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ],
    }),
  });

  if (!r.ok || !r.body) {
    throw new Error(`OpenAI streaming error: ${r.status}`);
  }

  return { type: "stream", body: r.body };
}
