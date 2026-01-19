const FORBIDDEN_PHRASES = [
  "approved before",
  "was allowed previously",
  "has been safe in the past",
  "worked before so",
  "no issues previously",
  "historically safe",
  "previously approved",
];

export function detectReflectionMisuse(output: string): {
  violated: boolean;
  matches: string[];
} {
  const lowered = output.toLowerCase();
  const matches = FORBIDDEN_PHRASES.filter(p =>
    lowered.includes(p)
  );

  return {
    violated: matches.length > 0,
    matches,
  };
}
