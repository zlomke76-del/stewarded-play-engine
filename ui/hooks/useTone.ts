import { toneFor } from "@/core/mode-router";

export function useTone(mode: "Neutral"|"Guidance"|"Ministry") {
  const t = toneFor(mode);
  return {
    temperature: t.temperature,
    sentenceMin: t.avgSentence[0],
    sentenceMax: t.avgSentence[1],
  };
}

