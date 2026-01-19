// app/lib/openai.ts
import OpenAI from "openai";

let singleton: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (singleton) return singleton;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  singleton = new OpenAI({ apiKey });
  return singleton;
}
