"use client";

import CardSection from "@/components/layout/CardSection";

type Props = {
  currentRoomTitle: string;
  currentFloorLabel: string;
  floorId: string;
  roomId: string;
  dungeonEvolution: {
    condition: string;
    apex: string;
    signals: string[];
    debug: {
      roomPressure: number;
      roomAwareness: number;
      nearbyPressureMax: number;
    };
  };
  roomSummary: string;
};

function normalizeCondition(condition: string) {
  const value = String(condition || "").trim().toLowerCase();

  if (!value) {
    return "The chamber offers no clear read yet.";
  }

  if (value.includes("stable")) {
    return "The air lies still.";
  }

  if (value.includes("tense")) {
    return "Tension gathers in the stone.";
  }

  if (value.includes("warning")) {
    return "Something in the chamber resists your presence.";
  }

  if (value.includes("danger")) {
    return "The chamber leans toward violence.";
  }

  if (value.includes("hostile")) {
    return "The dungeon does not welcome you here.";
  }

  return `${condition}.`;
}

function normalizeApex(apex: string) {
  const value = String(apex || "").trim().toLowerCase();

  if (!value || value === "none" || value === "no apex") {
    return "No presence stirs.";
  }

  return `A stronger presence gathers: ${apex}.`;
}

export default function GameStateAdvisoryPanel(props: Props) {
  const {
    currentRoomTitle,
    currentFloorLabel,
    floorId,
    roomId,
    dungeonEvolution,
    roomSummary,
  } = props;

  const chamberRead = normalizeCondition(dungeonEvolution.condition);
  const apexRead = normalizeApex(dungeonEvolution.apex);

  return (
    <CardSection title="The Chamber">
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 5 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              lineHeight: 1.05,
              color: "rgba(245,236,216,0.98)",
            }}
          >
            {currentRoomTitle}
          </div>
          <div
            className="muted"
            style={{
              fontSize: 12,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            {currentFloorLabel}
          </div>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(214,188,120,0.14)",
            background:
              "linear-gradient(180deg, rgba(214,188,120,0.08), rgba(255,255,255,0.02))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              fontWeight: 800,
              color: "rgba(214,188,120,0.82)",
            }}
          >
            Threshold Read
          </div>
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.5,
              color: "rgba(245,236,216,0.96)",
              fontWeight: 700,
            }}
          >
            {chamberRead}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "rgba(228,232,240,0.82)",
            }}
          >
            {apexRead}
          </div>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              fontWeight: 800,
              color: "rgba(245,236,216,0.92)",
            }}
          >
            Current Read
          </div>
          <div
            className="muted"
            style={{
              fontSize: 14,
              lineHeight: 1.75,
              color: "rgba(228,232,240,0.84)",
            }}
          >
            {roomSummary}
          </div>
        </div>

        {dungeonEvolution.signals.length > 0 && (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.9,
                textTransform: "uppercase",
                fontWeight: 800,
                color: "rgba(245,236,216,0.92)",
              }}
            >
              Signs
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                display: "grid",
                gap: 6,
              }}
            >
              {dungeonEvolution.signals.map((signal, idx) => (
                <li
                  key={`${idx}-${signal}`}
                  style={{
                    lineHeight: 1.6,
                    color: "rgba(233,236,243,0.88)",
                  }}
                >
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        <details
          style={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: "10px 12px",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontWeight: 800,
              color: "rgba(214,188,120,0.80)",
              listStyle: "none",
            }}
          >
            Supporting Systems
          </summary>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.6,
                color: "rgba(228,232,240,0.70)",
              }}
            >
              {currentFloorLabel} · {floorId} / {roomId}
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  opacity: 0.65,
                }}
              >
                Chamber Telemetry
              </div>

              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "rgba(228,232,240,0.78)",
                }}
              >
                Condition: {dungeonEvolution.condition} · Apex: {dungeonEvolution.apex}
              </div>

              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "rgba(228,232,240,0.78)",
                }}
              >
                Room pressure {dungeonEvolution.debug.roomPressure} · Room awareness{" "}
                {dungeonEvolution.debug.roomAwareness} · Nearby pressure{" "}
                {dungeonEvolution.debug.nearbyPressureMax}
              </div>
            </div>
          </div>
        </details>

        <div
          className="muted"
          style={{
            fontSize: 12,
            color: "rgba(228,232,240,0.62)",
          }}
        >
          The Chronicle records consequence. This reading only frames what the chamber
          presently reveals.
        </div>
      </div>
    </CardSection>
  );
}
