// lib/chat/system/scripture.ts

export function buildScripturePolicy(opts: {
  wantsAbrahamic: boolean;
  lastUser: string;
  isFirstTurn: boolean;
}): string {
  const { wantsAbrahamic, lastUser, isFirstTurn } = opts;

  const userAskedForSecular = /\b(secular only|no scripture|strictly secular|no religious)\b/i.test(
    lastUser.toLowerCase()
  );

  const BASE = `
SCRIPTURE POLICY
- VERY short references only — e.g., "Exodus 20", "Matthew 5", "Qur'an 4:135".
- Never quote long passages unless the user explicitly asks.
`.trim();

  if (!wantsAbrahamic || userAskedForSecular) {
    return (
      BASE +
      `
- Abrahamic layer OFF (user requested secular framing).`
    );
  }

  if (isFirstTurn) {
    return (
      BASE +
      `
- First turn: allow ONE gentle anchor reference if relevant.
- After first turn: use scripture sparingly, only when meaningfully helpful.`
    );
  }

  return (
    BASE +
    `
- Use scripture sparingly.
- Only include references when it clearly strengthens moral or emotional clarity.`
  );
}
