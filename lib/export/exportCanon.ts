import { SessionEvent } from "@/lib/session/SessionState";

export function exportCanon(events: readonly SessionEvent[]): string {
  const lines: string[] = [];
  const pendingDecisions: string[] = [];

  for (const event of events) {
    if (event.type === "CONFIRMED_CHANGE") {
      const desc = event.payload?.description;
      if (typeof desc === "string") {
        pendingDecisions.push(desc);
      }
    }

    if (event.type === "OUTCOME") {
      const outcome =
        typeof event.payload?.description === "string"
          ? event.payload.description
          : "";

      const decision = pendingDecisions.shift();

      if (decision) {
        lines.push(
          `• DM ruled on "${decision}": ${outcome}`
        );
      } else {
        lines.push(`• Outcome: ${outcome}`);
      }
    }
  }

  return lines.join("\n");
}
