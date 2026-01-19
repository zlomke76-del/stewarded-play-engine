// lib/ethics/retrieval.ts
// Computes importance & ranks memories for recall.

export function computeRecallScore(memory: any) {
  const base = 1;

  return (
    base +
    (memory.importance || 0) +
    (memory.emotional_weight || 0) * 0.5 -
    (memory.sensitivity_score || 0) * 0.3
  );
}

export function rankMemories(rows: any[]) {
  return rows
    .map(r => ({ ...r, _score: computeRecallScore(r) }))
    .sort((a, b) => b._score - a._score);
}
