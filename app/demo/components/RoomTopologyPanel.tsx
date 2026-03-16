"use client";

import { useMemo } from "react";
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
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
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
    return route.locked
      ? `Face the sealed way to ${target}`
      : `Pass through to ${target}`;
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

  if (
    route.targetType === "treasure_room" ||
    route.targetType === "relic_vault" ||
    route.targetType === "relic_chamber"
  ) {
    return "A tempting side route with higher reward pressure.";
  }

  if (route.targetType === "shrine" || route.targetType === "rest_site") {
    return "A quieter route that may offer refuge, ritual, or recovery.";
  }

  if (
    route.targetType === "trial_chamber" ||
    route.targetType === "ritual_chamber"
  ) {
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

function buildImmediateRead(currentRoomTitle: string, roomNarrative: string) {
  const lines = String(roomNarrative ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 0) {
    return lines[0];
  }

  return `You stand within ${currentRoomTitle}.`;
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
    selectedRouteId,
    onSelectRoute,
  } = props;

  const selectedRoute = useMemo(() => {
    return (
      roomConnectionsView.find((route) => route.id === selectedRouteId) ??
      roomConnectionsView[0] ??
      null
    );
  }, [roomConnectionsView, selectedRouteId]);

  const immediateRead = useMemo(() => {
    return buildImmediateRead(currentRoomTitle, roomNarrative);
  }, [currentRoomTitle, roomNarrative]);

  const selectedRouteAction = selectedRoute
    ? buildRouteAction(selectedRoute)
    : null;

  const selectedRouteMeta = selectedRoute
    ? buildRouteMeta(selectedRoute)
    : null;

  const selectedRouteMood = selectedRoute
    ? buildRouteMood(selectedRoute)
    : null;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        key={currentRoomVisualKey}
        style={{
          padding: 14,
          borderRadius: 18,
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
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.16)",
            }}
          >
            <img
              src={roomImage}
              alt={currentRoomTitle}
              style={{
                width: "100%",
                height: 250,
                objectFit: "cover",
                objectPosition: "center center",
                display: "block",
                animation: "roomImageIn 420ms ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: 8,
            animation: "roomTextIn 360ms ease",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              opacity: 0.58,
            }}
          >
            Current Chamber
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              lineHeight: 1.1,
              color: "rgba(245,236,216,0.98)",
            }}
          >
            {currentRoomTitle}
          </div>

          <div
            style={{
              lineHeight: 1.68,
              color: "rgba(232,235,242,0.86)",
              fontSize: 14,
              maxWidth: 860,
            }}
          >
            {immediateRead}
          </div>

          {currentFeatures.length > 0 ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 2,
              }}
            >
              {currentFeatures.map((feature, idx) => (
                <span
                  key={`${feature.kind}-${idx}`}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    fontSize: 11,
                    color: "rgba(239,241,245,0.86)",
                    textTransform: "uppercase",
                    letterSpacing: 0.45,
                  }}
                >
                  {feature.kind.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 18,
          border: "1px solid rgba(214,188,120,0.12)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.03))",
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              opacity: 0.58,
            }}
          >
            What do you do?
          </div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>
            Choose the route that deserves attention.
          </div>
        </div>

        {roomConnectionsView.length === 0 ? (
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            No routes are currently available from this room.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gap: 8 }}>
              {roomConnectionsView.map((route, idx) => {
                const selected = route.id === selectedRoute?.id;
                const actionLabel = buildRouteAction(route);
                const metaLine = buildRouteMeta(route);

                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => onSelectRoute(route.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: selected
                        ? "1px solid rgba(214,188,120,0.28)"
                        : route.locked
                          ? "1px solid rgba(214, 128, 128, 0.18)"
                          : "1px solid rgba(255,255,255,0.08)",
                      background: selected
                        ? "linear-gradient(180deg, rgba(214,188,120,0.10), rgba(255,255,255,0.03))"
                        : route.locked
                          ? "linear-gradient(180deg, rgba(140,44,44,0.10), rgba(255,255,255,0.02))"
                          : "rgba(255,255,255,0.03)",
                      color: "inherit",
                      cursor: "pointer",
                      boxShadow: selected
                        ? "0 10px 24px rgba(0,0,0,0.14)"
                        : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px minmax(0, 1fr)",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          border: selected
                            ? "1px solid rgba(214,188,120,0.34)"
                            : "1px solid rgba(255,255,255,0.12)",
                          background: selected
                            ? "rgba(214,188,120,0.10)"
                            : "rgba(255,255,255,0.04)",
                          fontSize: 12,
                          fontWeight: 900,
                          opacity: 0.92,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>

                      <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 900,
                            lineHeight: 1.35,
                            color: "rgba(245,236,216,0.97)",
                          }}
                        >
                          {actionLabel}
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            opacity: 0.66,
                            textTransform: "uppercase",
                            letterSpacing: 0.65,
                          }}
                        >
                          {metaLine}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedRoute ? (
              <div
                style={{
                  padding: "12px 13px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    opacity: 0.58,
                  }}
                >
                  Selected Route
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      lineHeight: 1.2,
                      color: "rgba(245,236,216,0.97)",
                    }}
                  >
                    {selectedRouteAction}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.68,
                      textTransform: "uppercase",
                      letterSpacing: 0.7,
                    }}
                  >
                    {selectedRouteMeta}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "rgba(228,232,240,0.82)",
                    }}
                  >
                    {selectedRouteMood}
                  </div>
                </div>

                {selectedRoute.previewImage ? (
                  <details
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      overflow: "hidden",
                    }}
                  >
                    <summary
                      style={{
                        cursor: "pointer",
                        padding: "11px 12px",
                        fontSize: 11,
                        letterSpacing: 0.7,
                        textTransform: "uppercase",
                        opacity: 0.6,
                      }}
                    >
                      Route Preview
                    </summary>

                    <div style={{ padding: "0 12px 12px" }}>
                      <img
                        src={selectedRoute.previewImage}
                        alt={selectedRoute.targetLabel}
                        style={{
                          width: "100%",
                          height: 132,
                          objectFit: "cover",
                          borderRadius: 10,
                          display: "block",
                        }}
                      />
                    </div>
                  </details>
                ) : null}

                {roomExitNarrative.length > 0 ? (
                  <details
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      overflow: "hidden",
                    }}
                  >
                    <summary
                      style={{
                        cursor: "pointer",
                        padding: "11px 12px",
                        fontSize: 11,
                        letterSpacing: 0.7,
                        textTransform: "uppercase",
                        opacity: 0.6,
                      }}
                    >
                      Route Sense
                    </summary>

                    <div
                      style={{
                        padding: "0 12px 12px",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      {roomExitNarrative.map((line, idx) => (
                        <div
                          key={`${idx}-${line}`}
                          style={{ lineHeight: 1.6, opacity: 0.9 }}
                        >
                          • {line}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>

      <details
        style={{
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          overflow: "hidden",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            padding: "12px 14px",
            fontSize: 11,
            letterSpacing: 0.75,
            textTransform: "uppercase",
            opacity: 0.64,
          }}
        >
          Chamber Details
        </summary>

        <div
          style={{
            padding: "0 14px 14px",
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              lineHeight: 1.72,
              whiteSpace: "pre-line",
              color: "rgba(232,235,242,0.84)",
            }}
          >
            {roomNarrative}
          </div>

          {roomFeatureNarrative.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.75,
                  textTransform: "uppercase",
                  opacity: 0.58,
                }}
              >
                Notable Details
              </div>

              {roomFeatureNarrative.map((line, idx) => (
                <div key={`${idx}-${line}`} style={{ lineHeight: 1.6, opacity: 0.9 }}>
                  • {line}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}
