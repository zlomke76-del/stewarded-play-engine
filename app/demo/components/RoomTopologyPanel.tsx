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

function formatTitle(value: string) {
  return value.replaceAll("_", " ");
}

function buildRouteAction(route: RouteView) {
  const target = route.targetLabel;

  if (route.type === "stairs") {
    if (route.note === "up") return `Climb toward ${target}`;
    if (route.note === "down") return `Descend into ${target}`;
    return `Take the stairs to ${target}`;
  }

  if (route.type === "secret") {
    return `Slip into ${target}`;
  }

  if (route.type === "locked_door") {
    return route.locked ? `Face the sealed way to ${target}` : `Pass through to ${target}`;
  }

  if (route.type === "door") {
    return `Pass into ${target}`;
  }

  if (route.type === "corridor") {
    return `Proceed into ${target}`;
  }

  return `Move toward ${target}`;
}

function buildRouteMood(route: RouteView) {
  if (route.type === "stairs") {
    if (route.note === "up") return "A vertical retreat or repositioning point.";
    if (route.note === "down") return "A committed descent into deeper danger.";
    return "A change in depth and pressure.";
  }

  if (route.type === "secret") {
    return "A hidden route that may bypass the expected flow.";
  }

  if (route.type === "locked_door") {
    return route.locked
      ? "A blocked threshold that promises something worth protecting."
      : "A once-barred route now ready to cross.";
  }

  if (route.targetType === "boss_chamber") {
    return "A dangerous approach likely tied to a decisive encounter.";
  }

  if (route.targetType === "treasure_room" || route.targetType === "relic_vault" || route.targetType === "relic_chamber") {
    return "A tempting side route with higher reward pressure.";
  }

  if (route.targetType === "shrine" || route.targetType === "rest_site") {
    return "A quieter route that may offer refuge, ritual, or recovery.";
  }

  if (route.targetType === "trial_chamber" || route.targetType === "ritual_chamber") {
    return "A chamber that suggests judgment, puzzle logic, or consequence.";
  }

  return "A viable path deeper into the dungeon.";
}

function buildRouteMeta(route: RouteView) {
  const parts: string[] = [formatTitle(route.targetType)];

  if (route.locked) parts.push("locked");
  if (route.note && route.note !== "loop") parts.push(route.note);
  if (route.type === "secret") parts.push("hidden route");
  if (route.note === "loop") parts.push("alternate loop");

  return parts.join(" · ");
}

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
    <CardSection title="The Descent">
      <div style={{ display: "grid", gap: 18 }}>
        <div
          key={currentRoomVisualKey}
          style={{
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            gap: 14,
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
                  maxHeight: 380,
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
                    "linear-gradient(to bottom, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.22) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                opacity: 0.58,
                animation: "roomTextIn 320ms ease",
              }}
            >
              Current Chamber
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                lineHeight: 1.15,
                animation: "roomTextIn 360ms ease",
              }}
            >
              {currentRoomTitle}
            </div>

            <div
              className="muted"
              style={{
                lineHeight: 1.72,
                whiteSpace: "pre-line",
                animation: "roomTextIn 420ms ease",
              }}
            >
              {roomNarrative}
            </div>
          </div>

          {roomFeatureNarrative.length > 0 ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  opacity: 0.58,
                }}
              >
                What Stands Out
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {roomFeatureNarrative.map((line, idx) => (
                  <div key={`${idx}-${line}`} style={{ lineHeight: 1.6, opacity: 0.9 }}>
                    • {line}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 17 }}>Paths Forward</div>

          {roomConnectionsView.length === 0 ? (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
              className="muted"
            >
              No routes are currently available from this room.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {roomExitNarrative.length > 0 ? (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      opacity: 0.58,
                    }}
                  >
                    Route Sense
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {roomExitNarrative.map((line, idx) => (
                      <div key={`${idx}-${line}`} style={{ lineHeight: 1.6, opacity: 0.9 }}>
                        • {line}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {roomConnectionsView.map((route, idx) => {
                const actionLabel = buildRouteAction(route);
                const metaLine = buildRouteMeta(route);
                const routeMood = buildRouteMood(route);

                return (
                  <div
                    key={route.id}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: route.locked
                        ? "1px solid rgba(214, 128, 128, 0.18)"
                        : "1px solid rgba(255,255,255,0.08)",
                      background: route.locked
                        ? "linear-gradient(180deg, rgba(140,44,44,0.10), rgba(255,255,255,0.02))"
                        : "rgba(255,255,255,0.03)",
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    {route.previewImage ? (
                      <img
                        src={route.previewImage}
                        alt={route.targetLabel}
                        style={{
                          width: "100%",
                          maxHeight: 150,
                          objectFit: "cover",
                          borderRadius: 10,
                          display: "block",
                        }}
                      />
                    ) : null}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr)",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          border: route.locked
                            ? "1px solid rgba(214, 128, 128, 0.24)"
                            : "1px solid rgba(214, 188, 120, 0.18)",
                          background: route.locked
                            ? "rgba(214, 128, 128, 0.10)"
                            : "rgba(214, 188, 120, 0.08)",
                          fontSize: 14,
                          fontWeight: 900,
                          opacity: 0.9,
                        }}
                      >
                        {idx + 1}
                      </div>

                      <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                        <div style={{ fontWeight: 900, lineHeight: 1.35 }}>{actionLabel}</div>

                        <div
                          style={{
                            fontSize: 12,
                            opacity: 0.68,
                            textTransform: "uppercase",
                            letterSpacing: 0.65,
                          }}
                        >
                          {metaLine}
                        </div>

                        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                          {routeMood}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Known Features</div>
          {currentFeatures.length === 0 ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
              className="muted"
            >
              No special room features have been revealed yet.
            </div>
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
