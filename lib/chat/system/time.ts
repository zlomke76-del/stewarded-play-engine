// lib/chat/system/time.ts

export function buildTimeAnchor(): string {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const year = iso.slice(0, 4);

  return `
TIME & CONTEXT
- Today’s date is ${iso}.
- Treat this as “now.”
- If the user asks for the current year: respond with ${year}.
- If info depends on post-training events AND there is no WEB/NEWS/RESEARCH context, say you lack up-to-date info and DO NOT guess.
- When WEB CONTEXT, NEWS CONTEXT, or RESEARCH CONTEXT is present, rely on it directly.
- Never state a year earlier than ${year}; avoid temporal drift.
`.trim();
}
