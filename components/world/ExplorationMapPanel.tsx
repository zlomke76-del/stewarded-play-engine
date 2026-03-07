"use client";

// ------------------------------------------------------------
// ExplorationMapPanel (READ-ONLY)
// ------------------------------------------------------------
// Event-sourced fog-of-war visualization.
// - Derives position + discovered tiles + marks purely from events
// - NO controls here (movement/reveal/mark are drafted+committed via resolution)
// ------------------------------------------------------------

import { useMemo } from "react";
import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type XY = { x: number; y: number };

export type MapMarkKind = "door" | "stairs" | "altar" | "cache" | "hazard";

type PlayerMovedPayload = { from: XY; to: XY };
type MapRevealedPayload = { tiles: XY[] };
type MapMarkedPayload = { at: XY; kind: MapMarkKind; note?: string | null };

type MapMark = {
  at: XY;
  kind: MapMarkKind;
  note?: string | null;
  eventId: string;
  timestamp: number;
};

type Props = {
  events: readonly SessionEvent[];
  mapW?: number;
  mapH?: number;
};

function keyXY(p: XY) {
  return `${p.x},${p.y}`;
}

function withinBounds(p: XY, w: number, h: number) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

/* ------------------------------------------------------------
   Asset routing (your uploads live in /public/assets/v1/*)
------------------------------------------------------------ */

const ASSET_BASE = "/assets/v1";

function assetForPlayer(): { src: string; label: string } {
  return { src: `${ASSET_BASE}/player_rogue.png`, label: "Player" };
}

function assetForMark(kind: MapMarkKind): { src: string; label: string } | null {
  switch (kind) {
    case "door":
      return { src: `${ASSET_BASE}/map_door.png`, label: "Door" };
    case "stairs":
      return { src: `${ASSET_BASE}/map_stairs.png`, label: "Stairs" };
    case "altar":
      return { src: `${ASSET_BASE}/map_altar.png`, label: "Altar" };
    case "cache":
      return { src: `${ASSET_BASE}/map_treasure.png`, label: "Cache" };
    case "hazard":
      return { src: `${ASSET_BASE}/map_danger.png`, label: "Hazard" };
    default:
      return null;
  }
}

function isXY(value: any): value is XY {
  return value && typeof value.x === "number" && typeof value.y === "number";
}

function createMark(
  at: XY,
  kind: MapMarkKind,
  e: any,
  note?: string | null
): MapMark {
  return {
    at: { x: at.x, y: at.y },
    kind,
    note: typeof note === "string" && note.trim() ? note.trim() : null,
    eventId: String(e?.id ?? ""),
    timestamp: Number(e?.timestamp ?? Date.now()),
  };
}

function deriveMapState(events: readonly SessionEvent[], w: number, h: number) {
  // Deterministic start: middle of the grid
  let position: XY = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
  const discovered = new Set<string>();
  const marksByTile = new Map<string, MapMark>();

  discovered.add(keyXY(position));

  for (const e of events as any[]) {
    if (e?.type === "PLAYER_MOVED") {
      const p = e.payload as PlayerMovedPayload;
      if (p?.to && withinBounds(p.to, w, h)) {
        position = { x: p.to.x, y: p.to.y };
        discovered.add(keyXY(position));
      }
    }

    if (e?.type === "MAP_REVEALED") {
      const p = e.payload as MapRevealedPayload;
      const tiles = Array.isArray(p?.tiles) ? p.tiles : [];
      for (const t of tiles) {
        if (t && withinBounds(t, w, h)) discovered.add(keyXY(t));
      }
    }

    if (e?.type === "MAP_MARKED") {
      const p = e.payload as MapMarkedPayload;
      if (!p?.at || typeof p.at.x !== "number" || typeof p.at.y !== "number") continue;
      if (!withinBounds(p.at, w, h)) continue;

      const kind = p.kind as MapMarkKind;
      if (!kind) continue;

      const k = keyXY(p.at);
      marksByTile.set(k, createMark(p.at, kind, e, p.note));
      discovered.add(k);
      continue;
    }

    if (e?.type === "DOOR_DISCOVERED" || e?.type === "DOOR_LOCKED") {
      const p = e?.payload ?? {};
      const at = p?.at;

      if (!isXY(at) || !withinBounds(at, w, h)) continue;

      const k = keyXY(at);
      const note =
        e.type === "DOOR_LOCKED"
          ? typeof p?.note === "string" && p.note.trim()
            ? p.note
            : "locked"
          : typeof p?.note === "string"
            ? p.note
            : null;

      marksByTile.set(k, createMark(at, "door", e, note));
      discovered.add(k);
      continue;
    }

    if (e?.type === "HAZARD_REVEALED") {
      const p = e?.payload ?? {};
      const at = p?.at;

      if (!isXY(at) || !withinBounds(at, w, h)) continue;

      const k = keyXY(at);
      const note =
        typeof p?.hazardType === "string" && p.hazardType.trim()
          ? p.hazardType
          : typeof p?.note === "string"
            ? p.note
            : null;

      marksByTile.set(k, createMark(at, "hazard", e, note));
      discovered.add(k);
      continue;
    }

    if (e?.type === "CACHE_REVEALED") {
      const p = e?.payload ?? {};
      const at = p?.at;

      if (!isXY(at) || !withinBounds(at, w, h)) continue;

      const k = keyXY(at);
      const note =
        typeof p?.cacheType === "string" && p.cacheType.trim()
          ? p.cacheType
          : typeof p?.note === "string"
            ? p.note
            : null;

      marksByTile.set(k, createMark(at, "cache", e, note));
      discovered.add(k);
      continue;
    }

    if (e?.type === "ALTAR_REVEALED") {
      const p = e?.payload ?? {};
      const at = p?.at;

      if (!isXY(at) || !withinBounds(at, w, h)) continue;

      const k = keyXY(at);
      const note = typeof p?.note === "string" ? p.note : null;

      marksByTile.set(k, createMark(at, "altar", e, note));
      discovered.add(k);
      continue;
    }

    if (e?.type === "STAIRS_REVEALED") {
      const p = e?.payload ?? {};
      const at = p?.at;

      if (!isXY(at) || !withinBounds(at, w, h)) continue;

      const k = keyXY(at);
      const note = typeof p?.note === "string" ? p.note : null;

      marksByTile.set(k, createMark(at, "stairs", e, note));
      discovered.add(k);
      continue;
    }

    if (e?.type === "PATROL_SIGNS_REVEALED") {
      const p = e?.payload ?? {};
      const at = p?.at;

      if (!isXY(at) || !withinBounds(at, w, h)) continue;

      const k = keyXY(at);
      const note =
        typeof p?.note === "string" && p.note.trim()
          ? p.note
          : "patrol signs";

      marksByTile.set(k, createMark(at, "hazard", e, note));
      discovered.add(k);
      continue;
    }
  }

  const marks = Array.from(marksByTile.values());
  return { position, discovered, marksByTile, marks };
}

function LegendChip({ label, swatch }: { label: string; swatch: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {swatch}
      <span className="muted" style={{ fontSize: 12 }}>
        {label}
      </span>
    </span>
  );
}

function IconImg({
  src,
  alt,
  size,
  style,
}: {
  src: string;
  alt: string;
  size: number;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        imageRendering: "auto",
        userSelect: "none",
        ...style,
      }}
    />
  );
}

export default function ExplorationMapPanel({ events, mapW = 13, mapH = 9 }: Props) {
  const derived = useMemo(() => deriveMapState(events, mapW, mapH), [events, mapW, mapH]);

  const TILE = 26;
  const GAP = 5;

  const playerAsset = assetForPlayer();

  return (
    <CardSection title="Exploration Map (Canon View)">
      <p className="muted" style={{ marginTop: 0 }}>
        This map is derived from canon events. Movement / reveal / marks are drafted during resolution and only become
        canon when the Arbiter commits.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          margin: "10px 0 12px",
        }}
      >
        <LegendChip
          label="Player"
          swatch={
            <span
              style={{
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.20)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              }}
            >
              <IconImg src={playerAsset.src} alt={playerAsset.label} size={14} />
            </span>
          }
        />
        <LegendChip
          label="Known"
          swatch={
            <span
              aria-hidden
              style={{
                width: 16,
                height: 16,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                display: "inline-block",
              }}
            />
          }
        />
        <LegendChip
          label="Fog"
          swatch={
            <span
              aria-hidden
              style={{
                width: 16,
                height: 16,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.62)",
                display: "inline-block",
              }}
            />
          }
        />
        <LegendChip
          label="Marks"
          swatch={
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              {(["door", "stairs", "altar", "cache", "hazard"] as MapMarkKind[]).map((k) => {
                const a = assetForMark(k);
                if (!a) return null;
                return (
                  <span
                    key={k}
                    style={{
                      width: 18,
                      height: 18,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.20)",
                    }}
                    title={a.label}
                  >
                    <IconImg src={a.src} alt={a.label} size={14} />
                  </span>
                );
              })}
            </span>
          }
        />
      </div>

      <div className="muted" style={{ marginBottom: 12 }}>
        Position:{" "}
        <strong>
          ({derived.position.x},{derived.position.y})
        </strong>{" "}
        · Discovered: <strong>{derived.discovered.size}</strong>
        {derived.marks.length > 0 && (
          <>
            {" "}
            · Marks: <strong>{derived.marks.length}</strong>
          </>
        )}
      </div>

      <div
        style={{
          display: "inline-block",
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "radial-gradient(1200px 420px at 30% 0%, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.30) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.35), 0 18px 40px rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            position: "relative",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${mapW}, ${TILE}px)`,
              gap: GAP,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
            }}
          >
            {Array.from({ length: mapW * mapH }, (_, i) => {
              const x = i % mapW;
              const y = Math.floor(i / mapW);

              const here = derived.position.x === x && derived.position.y === y;
              const seen = derived.discovered.has(`${x},${y}`);

              const mark = derived.marksByTile.get(`${x},${y}`) ?? null;
              const markAsset = mark ? assetForMark(mark.kind) : null;

              const titleParts: string[] = [];
              titleParts.push(seen ? `(${x},${y})` : "Unknown");
              if (mark) {
                titleParts.push(`Mark: ${mark.kind}`);
                if (mark.note) titleParts.push(`Note: ${mark.note}`);
              }

              const fogBg = "rgba(0,0,0,0.64)";
              const knownBg = "rgba(255,255,255,0.07)";
              const playerBg = "rgba(138,180,255,0.10)";

              const baseBorder = "1px solid rgba(255,255,255,0.10)";
              const knownBorder = "1px solid rgba(255,255,255,0.14)";
              const playerBorder = "1px solid rgba(138,180,255,0.65)";

              return (
                <div
                  key={`${x},${y}`}
                  title={titleParts.join(" · ")}
                  style={{
                    width: TILE,
                    height: TILE,
                    borderRadius: 8,
                    border: here ? playerBorder : seen ? knownBorder : baseBorder,
                    background: !seen ? fogBg : here ? playerBg : knownBg,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    userSelect: "none",
                    overflow: "hidden",
                    transition:
                      "background 180ms ease, border-color 180ms ease, transform 140ms ease, opacity 180ms ease",
                    transform: here ? "translateY(-0.5px)" : "none",
                    opacity: seen ? 1 : 0.95,
                  }}
                >
                  {seen ? (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "radial-gradient(18px 18px at 30% 25%, rgba(255,255,255,0.06), rgba(255,255,255,0.00) 60%), radial-gradient(22px 22px at 70% 80%, rgba(0,0,0,0.18), rgba(0,0,0,0.00) 62%)",
                        opacity: here ? 0.55 : 0.35,
                        pointerEvents: "none",
                      }}
                    />
                  ) : null}

                  {seen && markAsset ? (
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
                        opacity: here ? 0.55 : 0.9,
                      }}
                    >
                      <IconImg src={markAsset.src} alt={markAsset.label} size={16} />
                    </span>
                  ) : null}

                  {here ? (
                    <span
                      aria-hidden
                      style={{
                        position: "relative",
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        border: "1px solid rgba(138,180,255,0.70)",
                        background: "rgba(0,0,0,0.22)",
                        boxShadow: "0 0 0 3px rgba(138,180,255,0.14), 0 0 18px rgba(138,180,255,0.32)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <IconImg src={playerAsset.src} alt={playerAsset.label} size={14} />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 12,
              pointerEvents: "none",
              background: [
                "radial-gradient(220px 220px at 20% 18%, rgba(255,190,120,0.10), rgba(255,190,120,0.00) 62%)",
                "radial-gradient(260px 260px at 82% 24%, rgba(255,200,140,0.08), rgba(255,200,140,0.00) 65%)",
                "radial-gradient(260px 200px at 52% 58%, rgba(138,180,255,0.06), rgba(138,180,255,0.00) 70%)",
                "radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0.00) 52%, rgba(0,0,0,0.22) 78%, rgba(0,0,0,0.36) 100%)",
              ].join(", "),
              mixBlendMode: "screen",
              opacity: 0.9,
            }}
          />

          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 12,
              pointerEvents: "none",
              background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.00) 42%)",
              opacity: 0.35,
            }}
          />
        </div>

        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Fog clears only through canon events. Marks indicate remembered features — not revealed neighbors.
        </div>
      </div>

      {derived.marks.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary className="muted">Show marks</summary>
          <ul style={{ marginTop: 10 }}>
            {derived.marks
              .slice()
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((m) => {
                const a = assetForMark(m.kind);
                return (
                  <li key={m.eventId}>
                    <strong>{m.kind}</strong> at ({m.at.x},{m.at.y})
                    {m.note ? <> — {m.note}</> : null}
                    {a ? (
                      <span style={{ marginLeft: 10, verticalAlign: "middle" }}>
                        <IconImg src={a.src} alt={a.label} size={14} style={{ display: "inline-block" }} />
                      </span>
                    ) : null}
                  </li>
                );
              })}
          </ul>
        </details>
      )}
    </CardSection>
  );
}
