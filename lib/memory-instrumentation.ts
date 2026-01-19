// lib/memory-instrumentation.ts

export function logMemoryDecision(payload: {
  content: string;
  kind: string;
  confidence: number;
}) {
  console.log("[MEMORY]", {
    kind: payload.kind,
    confidence: payload.confidence,
    chars: payload.content.length,
  });
}
