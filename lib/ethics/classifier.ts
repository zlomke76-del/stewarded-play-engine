// lib/ethics/classifier.ts
// Deterministic ethical classification of memory content.

export type EthicalClassification = {
  sensitivity: number;       // 0–5
  emotionalWeight: number;   // 0–5
  requiresReview: boolean;
  category: "identity" | "value" | "insight" | "note" | "restricted";
};

const SENSITIVE_KEYWORDS = [
  "password", "ssn", "social security", "bank", "medical", "diagnosis",
  "trauma", "abuse", "violence", "crime", "address", "phone number",
];

const IDENTITY_PATTERNS = [
  /i am/i,
  /my name is/i,
  /i live/i,
  /i work/i,
  /i prefer/i,
];

const VALUE_PATTERNS = [
  /i believe/i,
  /i stand for/i,
  /my principle/i,
  /i always/i,
  /i never/i,
];

const INSIGHT_PATTERNS = [
  /i realized/i,
  /i learned/i,
  /it occurred to me/i,
  /i understood/i,
  /clarity/i,
];

export function classifyMemory(content: string): EthicalClassification {
  const lower = content.toLowerCase();

  // 1. Sensitivity scoring
  const sensitivityHits = SENSITIVE_KEYWORDS.filter(k => lower.includes(k)).length;
  const sensitivityScore = Math.min(5, sensitivityHits);

  // 2. Emotional weight (simple deterministic heuristic)
  const emotionalWeight =
    /(love|hate|angry|sad|hurt|excited|afraid|terrified|devastated)/i.test(lower)
      ? 3
      : 1;

  // 3. Categorization
  let category: EthicalClassification["category"] = "note";

  if (IDENTITY_PATTERNS.some(r => r.test(content))) category = "identity";
  else if (VALUE_PATTERNS.some(r => r.test(content))) category = "value";
  else if (INSIGHT_PATTERNS.some(r => r.test(content))) category = "insight";

  // 4. Auto-review if too sensitive
  const requiresReview = sensitivityScore >= 4;

  return {
    sensitivity: sensitivityScore,
    emotionalWeight,
    requiresReview,
    category: sensitivityScore >= 5 ? "restricted" : category,
  };
}


