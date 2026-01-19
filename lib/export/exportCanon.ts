// ------------------------------------------------------------
// exportCanon.ts
// ------------------------------------------------------------
// Export confirmed narrative canon only
// ------------------------------------------------------------

import { SessionEvent } from "@/lib/session/SessionState";

export function exportCanon(events: readonly SessionEvent[]): string {
  return events
    .filter((e) => e.type === "OUTCOME")
    .map((e) => {
      const description = e.payload?.description;
      if (typeof description === "string") {
        return `- ${description}`;
      }
      return null;
    })
    .filter((v): v is string => Boolean(v))
    .join("\n");
}
