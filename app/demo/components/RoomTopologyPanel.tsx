"use client";

import CardSection from "@/components/layout/CardSection";
import type { RoomFeatureLite } from "../lib/demoNarration";

type RouteView = {
  id: string;
  type: string;
  targetRoomId: string;
  targetLabel: string;
  targetType: string;
  locked: boolean;
  note: string | null;
  previewImage: string | null;
};

type Props = {
  currentRoomVisualKey: string;
  currentRoomTitle: string;
  roomImage: string | null;
  roomNarrative: string;
  roomFeatureNarrative: string[];
  roomExitNarrative: string[];
  roomConnectionsView: RouteView[];
  currentFeatures: RoomFeatureLite[];
};

export default function RoomTopologyPanel(props: Props) {
  const {
    currentRoomVisualKey,
    currentRoomTitle,
    roomImage,
    roomNarrative,
    roomFeatureNarrative,
    roomExitNarrative,
    roomConnectionsView,
    currentFeatures,
  } = props;

  return (
    <CardSection title="Dungeon Topology (Room Graph View)">
      <div style={{ display: "grid", gap: 16 }}>
        <div
          key={currentRoomVisualKey}
          style={{
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            gap: 12,
            animation: "roomFadeIn 320ms ease",
          }}
        >
          {roomImage ? (
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 12,
              }}
            >
              <img
                src={roomImage}
                alt={currentRoomTitle}
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: 12,
                  display: "block",
                  animation: "roomImageIn 420ms ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.18) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          ) : null}

          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              animation: "roomTextIn 360ms ease",
            }}
          >
            {currentRoomTitle}
          </div>

          <div
            className="muted"
            style={{
              marginTop: 8,
              lineHeight: 1.7,
              whiteSpace: "pre-line",
              animation: "roomTextIn 420ms ease",
            }}
          >
            {roomNarrative}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>What Stands Out</div>
          {roomFeatureNarrative.length === 0 ? (
            <div className="muted">Nothing distinct has been resolved about the room yet.</div>
          ) : (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {roomFeatureNarrative.map((line, idx) => (
                  <li key={`${idx}-${line}`} style={{ marginBottom: 6, lineHeight: 1.55 }}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Exits & Routes</div>
          {roomConnectionsView.length === 0 ? (
            <div className="muted">No routes are currently available from this room.</div>
          ) : (
            <>
              {roomExitNarrative.length > 0 && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {roomExitNarrative.map((line, idx) => (
                      <li key={`${idx}-${line}`} style={{ marginBottom: 6, lineHeight: 1.55 }}>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {roomConnectionsView.map((route) => (
                <div
                  key={route.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  {route.previewImage ? (
                    <img
                      src={route.previewImage}
                      alt={route.targetLabel}
                      style={{
                        width: "100%",
                        maxHeight: 140,
                        objectFit: "cover",
                        borderRadius: 10,
                        display: "block",
                      }}
                    />
                  ) : null}

                  <div style={{ fontWeight: 800 }}>{route.targetLabel}</div>

                  <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                    {route.type.replaceAll("_", " ")} · {route.targetType.replaceAll("_", " ")}
                    {route.locked ? " · locked" : ""}
                    {route.note ? ` · ${route.note}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Known Features</div>
          {currentFeatures.length === 0 ? (
            <div className="muted">No special room features have been revealed yet.</div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {currentFeatures.map((feature, idx) => (
                <span
                  key={`${feature.kind}-${idx}`}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    fontSize: 12,
                  }}
                >
                  {feature.kind.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </CardSection>
  );
}
