"use client";

// ------------------------------------------------------------
// MonsterAlertPanel
// ------------------------------------------------------------
// Purpose:
// - Displays canon-confirmed monster alert states
// - No spawning, no AI decisions, no automation
// - Reflects ONLY Arbiter-recorded outcomes
//
// Alert philosophy (Might & Magic style):
// - Noise raises awareness
// - Awareness persists
// - Consequences are delayed, not automatic
// ------------------------------------------------------------

import CardSection from "@/components/layout/CardSection";

type SessionEvent = {
  id: string;
  type: string;
  payload: any;
};

type AlertLevel = "none" | "suspicious" | "alerted";

type Props = {
  events: readonly SessionEvent[];
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function collectAlerts(events: readonly SessionEvent[]) {
  const alerts = new Map<
    string,
    { level: AlertLevel; source?: string }
  >();

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;

    const world = e.payload?.world;
    if (!world?.roomId || !world?.alert) continue;

    const existing = alerts.get(world.roomId);

    // Escalation only — alerts never downgrade automatically
    if (!existing) {
      alerts.set(world.roomId, {
        level: world.alert.level,
        source: world.alert.source,
      });
      continue;
    }

    if (
      existing.level === "suspicious" &&
      world.alert.level === "alerted"
    ) {
      alerts.set(world.roomId, {
        level: "alerted",
        source: world.alert.source,
      });
    }
  }

  return Array.from(alerts.entries());
}

// ------------------------------------------------------------

export default function MonsterAlertPanel({ events }: Props) {
  const alerts = collectAlerts(events);

  return (
    <CardSection title="Monster Alert Status">
      <p className="muted" style={{ marginBottom: 8 }}>
        Monster awareness persists across turns. Nothing spawns
        automatically — the Arbiter decides when alerts matter.
      </p>

      {alerts.length === 0 ? (
        <p className="muted">
          No creatures have been alerted yet.
        </p>
      ) : (
        <ul>
          {alerts.map(([roomId, alert]) => (
            <li key={roomId}>
              <strong>{roomId}</strong>:{" "}
              <span
                style={{
                  color:
                    alert.level === "alerted"
                      ? "#c33"
                      : "#c90",
                }}
              >
                {alert.level.toUpperCase()}
              </span>
              {alert.source && (
                <span className="muted">
                  {" "}
                  (cause: {alert.source})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Typical causes: combat noise, failed traps, forced doors,
        alarms, shouted spells.
      </p>
    </CardSection>
  );
}
