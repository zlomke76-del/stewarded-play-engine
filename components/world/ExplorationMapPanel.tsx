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

function glyphForMark(kind: MapMarkKind): string {
  switch (kind) {
    case "door":
      return "🚪";
    case "stairs":
      return "⬇️";
    case "altar":
      return "✶";
    case "cache":
      return "⬚";
    case "hazard":
      return "⚠️";
    default:
      return "•";
  }
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
      marksByTile.set(k, {
        at: { x: p.at.x, y: p.at.y },
        kind,
        note: typeof p.note === "string" ? p.note : null,
        eventId: String(e.id ?? ""),
        timestamp: Number(e.timestamp ?? Date.now()),
      });

      // Mark implies the tile is known (but does not reveal neighbors)
      discovered.add(k);
    }
  }

  const marks = Array.from(marksByTile.values());
  return { position, discovered, marksByTile, marks };
}

function LegendChip({
  label,
  swatch,
}: {
  label: string;
  swatch: React.ReactNode;
}) {
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

export default function ExplorationMapPanel({ events, mapW = 13, mapH = 9 }: Props) {
  const derived = useMemo(() => deriveMapState(events, mapW, mapH), [events, mapW, mapH]);

  // B/C feel: board + fog-of-war tactical
  // Keep this simple and inline: no logic changes, presentation only.
  const TILE = 26; // physical presence (was 22)
  const GAP = 5;

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
              aria-hidden
              style={{
                position: "relative",
                width: 16,
                height: 16,
                borderRadius: 999,
                border: "1px solid rgba(138,180,255,0.70)",
                boxShadow: "0 0 0 3px rgba(138,180,255,0.14), 0 0 18px rgba(138,180,255,0.35)",
                background: "rgba(138,180,255,0.14)",
                display: "inline-block",
              }}
            />
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
        <LegendChip label="Marks" swatch={<span aria-hidden style={{ fontSize: 14 }}>🚪 ⬇️ ✶ ⬚ ⚠️</span>} />
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

      {/* Board */}
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
            display: "grid",
            gridTemplateColumns: `repeat(${mapW}, ${TILE}px)`,
            gap: GAP,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              // Subtle “stone board” feel with a faint grid sheen
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
          }}
        >
          {Array.from({ length: mapW * mapH }, (_, i) => {
            const x = i % mapW;
            const y = Math.floor(i / mapW);

            const here = derived.position.x === x && derived.position.y === y;
            const seen = derived.discovered.has(`${x},${y}`);

            const mark = derived.marksByTile.get(`${x},${y}`) ?? null;
            const glyph = mark ? glyphForMark(mark.kind) : "";

            const titleParts: string[] = [];
            titleParts.push(seen ? `(${x},${y})` : "Unknown");
            if (mark) {
              titleParts.push(`Mark: ${mark.kind}`);
              if (mark.note) titleParts.push(`Note: ${mark.note}`);
            }

            // Visual states
            const fogBg = "rgba(0,0,0,0.64)";
            const knownBg = "rgba(255,255,255,0.07)";
            const playerBg = "rgba(138,180,255,0.14)";

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
                  fontSize: 13,
                  lineHeight: 1,
                  userSelect: "none",
                  overflow: "hidden",

                  // “fog clears” feel
                  transition: "background 180ms ease, border-color 180ms ease, transform 140ms ease",
                  transform: here ? "translateY(-0.5px)" : "none",
                }}
              >
                {/* Subtle tile texture for known tiles */}
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

                {/* Player marker (ring + glow) */}
                {here ? (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      border: "1px solid rgba(138,180,255,0.80)",
                      boxShadow: "0 0 0 3px rgba(138,180,255,0.14), 0 0 18px rgba(138,180,255,0.38)",
                      background: "rgba(138,180,255,0.10)",
                      pointerEvents: "none",
                    }}
                  />
                ) : null}

                {/* Mark glyph */}
                {seen && glyph ? (
                  <span
                    style={{
                      position: "relative",
                      transform: "translateY(-0.5px)",
                      filter: mark ? "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" : "none",
                    }}
                  >
                    {glyph}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Optional: tiny “board caption” feel */}
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
              .map((m) => (
                <li key={m.eventId}>
                  <strong>
                    {m.kind} {glyphForMark(m.kind)}
                  </strong>{" "}
                  at ({m.at.x},{m.at.y})
                  {m.note ? <> — {m.note}</> : null}
                </li>
              ))}
          </ul>
        </details>
      )}
    </CardSection>
  );
}
