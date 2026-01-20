"use client";

// ------------------------------------------------------------
// MonsterAlertPanel
// ------------------------------------------------------------
// Tracks dungeon alert levels
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

export default function MonsterAlertPanel({ events }: Props) {
  const alerts = new Map<string, number>();

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;
    const p = e.payload as any;
    const room = p.world?.roomId;
    const noise = p.world?.noise;

    if (room && typeof noise === "number") {
      alerts.set(room, (alerts.get(room) ?? 0) + noise);
    }
  }

  return (
    <CardSection title="Monster Alert Levels">
      {alerts.size === 0 ? (
        <p className="muted">Dungeon is quiet.</p>
      ) : (
        <ul>
          {[...alerts.entries()].map(([room, level]) => (
            <li key={room}>
              Room {room}: Alert {level}
              {level >= 5 && " ⚠️"}
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}
