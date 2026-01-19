// lib/recall-with-time.ts
import "server-only";
import { recallMemoryEvidence } from "./memory-recall";
import { parseTimeIntent } from "./time-intent";
import { applyTimeWindow } from "./apply-time-window";

export async function recallWithTime(params: {
  user_key: string;
  query: string;
}) {
  const intent = parseTimeIntent(params.query);

  const evidence = await recallMemoryEvidence({
  user_key: params.user_key,
});

  return applyTimeWindow(evidence, intent);
}
