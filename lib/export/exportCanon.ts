export function exportCanon(events: SessionEvent[]): string {
  return events
    .filter(e => e.type === "outcome")
    .map(e => `- ${e.text}`)
    .join("\n");
}
