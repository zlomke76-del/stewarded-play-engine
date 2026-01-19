//--------------------------------------------------------------
// MODEL ROUTER — RESPONSES API (STRICT STRING MODE)
//--------------------------------------------------------------

import OpenAI from "openai";
import { sanitizeForModel } from "@/lib/solace/sanitize";

// -------------------------------------------------------------
// CLIENT
// -------------------------------------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

//--------------------------------------------------------------
// callModel(model, promptString)
// - ALWAYS returns a string
// - NEVER streams
// - RELIES ON PLATFORM DEFAULT TIMEOUTS
//--------------------------------------------------------------
export async function callModel(
  model: string,
  prompt: string
): Promise<string> {
  const clean = sanitizeForModel(String(prompt || ""));

  try {
    const res = await client.responses.create({
      model,
      input: clean, // STRICT STRING MODE
    });

    // Responses API guarantees string | null
    if (typeof res.output_text === "string") {
      return res.output_text;
    }

    return "";
  } catch (err) {
    console.error("[MODEL ROUTER ERROR]", err);
    return "[Model error]";
  }
}
