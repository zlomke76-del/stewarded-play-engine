import { SessionEvent } from "@/lib/session/SessionState";

export function exportCanon(events: readonly SessionEvent[]): string {
  const lines: string[] = [];

  let lastConfirmedChange: string | null = null;

  for (const event of events) {
    if (event.type === "CONFIRMED_CHANGE") {
      lastConfirmedChange =
        typeof event.payload.description === "string"
          ? event.payload.description
          : null;
    }

    if (event.type === "OUTCOME") {
      const outcome =
        typeof event.payload.description === "string"
          ? event.payload.description
          : "";

      if (lastConfirmedChange) {
        lines.push(
          `• DM ruled on "${lastConfirmedChange}": ${outcome}`
        );
      } else {
        lines.push(`• Outcome: ${outcome}`);
      }

      lastConfirmedChange = null;
    }
  }

  return lines.join("\n");
}
