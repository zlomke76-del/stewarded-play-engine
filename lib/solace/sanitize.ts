// lib/solace/sanitize.ts
export function sanitizeForModel(input: string): string {
  if (!input) return "";

  // ONLY ASCII cleanup — no trimming, no slicing, no collapsing.
  return input
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .split("")
    .map((c) => (c.charCodeAt(0) > 255 ? "?" : c))
    .join("");
}
