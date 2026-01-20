"use client";

// ------------------------------------------------------------
// FogOfWarPanel
// ------------------------------------------------------------
// Read-only exploration tracker
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

export default function FogOfWarPanel({ events }: Props) {
  const explored = new Set<string>();

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;
    const payload = e.payload as any;
    if (payload.world?.roomId) {
      explored.add(payload.world.roomId);
    }
  }

  return (
    <CardSection title="Fog of War">
      {explored.size === 0 ? (
        <p className="muted">
          No rooms explored yet.
        </p>
      ) : (
        <ul>
          {[...explored].map((room) => (
            <li key={room}>
              Room {room} — Explored
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}
