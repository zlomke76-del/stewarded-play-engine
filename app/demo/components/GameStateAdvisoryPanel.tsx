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

export default function GameStateAdvisoryPanel(props: Props) {
  const {
    currentRoomTitle,
    currentFloorLabel,
    floorId,
    roomId,
    dungeonEvolution,
    roomSummary,
  } = props;

  return (
    <CardSection title="Dungeon State (Room/Floor Advisory)">
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{currentRoomTitle}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {currentFloorLabel} · {floorId} / {roomId}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            Condition: {dungeonEvolution.condition} · Apex: {dungeonEvolution.apex}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.6 }}>
            Room pressure {dungeonEvolution.debug.roomPressure} · Room awareness{" "}
            {dungeonEvolution.debug.roomAwareness} · Nearby pressure{" "}
            {dungeonEvolution.debug.nearbyPressureMax}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Current Read</div>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
            {roomSummary}
          </div>
        </div>

        {dungeonEvolution.signals.length > 0 && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Signals</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dungeonEvolution.signals.map((signal, idx) => (
                <li key={`${idx}-${signal}`} style={{ marginBottom: 5, lineHeight: 1.5 }}>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="muted" style={{ fontSize: 12 }}>
          Advisory only — canon remains governed by recorded events.
        </div>
      </div>
    </CardSection>
  );
}
