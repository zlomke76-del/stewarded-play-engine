// core/newsroom/coach/extract.ts

import pdfParse from "pdf-parse";

/**
 * Fast, dependency-light text extraction for newsroom coaching.
 *
 * - PDFs → pdf-parse
 * - DOCX → best-effort UTF-8 decode (no zip parsing yet)
 * - Fallback → UTF-8 decode
 *
 * This is intentionally conservative to avoid extra build-time deps.
 */
export async function extractTextFromBuffer(
  buf: Buffer,
  filename: string
): Promise<string> {
  const lower = (filename || "").toLowerCase();

  // Prefer proper PDF parsing when available
  if (lower.endsWith(".pdf")) {
    try {
      const data = await pdfParse(buf);
      if (data && typeof data.text === "string") {
        return data.text;
      }
    } catch (err) {
      console.error("[coach/extract] pdf-parse failed:", err);
      // fall through to generic decode
    }
  }

  // For DOCX, we avoid extra zip libs to keep build stable.
  // Many newsroom drafts will still be readable as plain UTF-8 text
  // (or at least give Solace something to work with).
  if (lower.endsWith(".docx")) {
    try {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      return text || "";
    } catch (err) {
      console.error("[coach/extract] docx plain decode failed:", err);
      return "";
    }
  }

  // Generic fallback: try to interpret as UTF-8 text.
  try {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    return text || "";
  } catch (err) {
    console.error("[coach/extract] generic decode failed:", err);
    return "";
  }
}
