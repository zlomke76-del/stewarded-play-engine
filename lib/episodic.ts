// lib/episodic.ts
import "server-only";
import OpenAI from "openai";

export type EpisodicSignal = {
  summary: string;
  emotional_state?: string;
  dominant_topics: string[];
  decision_points: string[];
  open_loops: string[];
  episodic_type: string;
};

export async function summarizeEpisode(
  messages: { role: string; content: string }[]
): Promise<EpisodicSignal> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const convo = messages.map(m => `${m.role}: ${m.content}`).join("\n");

  const prompt = `
Summarize this conversation into a high-density episodic insight.
Return strict JSON:

{
  "summary": "...",
  "emotional_state": "...",
  "dominant_topics": [],
  "decision_points": [],
  "open_loops": [],
  "episodic_type": "Technical | Strategic | Emotional | Moral"
}

Conversation:
${convo}
`;

  const resp = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    max_output_tokens: 500,
    temperature: 0.2,
  });

  return JSON.parse((resp as any).output_text);
}
