import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generates an image and returns a browser-safe URL
 */
export async function generateImage(prompt: string): Promise<string> {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    quality: "high",
    background: "opaque",
  });

  const b64 = result.data?.[0]?.b64_json;

  if (!b64) {
    console.error("[IMAGE GEN FAILED]", {
      reason: "missing_base64",
      hasDataArray: Array.isArray(result.data),
      dataLength: result.data?.length ?? 0,
    });

    throw new Error("Image generation failed: no base64 payload returned");
  }

  // ✅ AUTHORITATIVE SUCCESS SIGNAL
  console.log("[IMAGE GEN OK]", {
    base64Length: b64.length,
    approxBytes: Math.round(b64.length * 0.75),
  });

  return `data:image/png;base64,${b64}`;
}
