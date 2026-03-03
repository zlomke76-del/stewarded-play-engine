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

export default function ExplorationMapPanel({ events, mapW = 13, mapH = 9 }: Props) {
  const derived = useMemo(() => deriveMapState(events, mapW, mapH), [events, mapW, mapH]);

  return (
    <CardSection title="Exploration Map (Canon View)">
      <p className="muted" style={{ marginTop: 0 }}>
        This map is derived from canon events. Movement / reveal / marks are drafted during resolution and only become
        canon when the Arbiter commits.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 10,
        }}
        className="muted"
      >
        <span>
          You:{" "}
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 4,
              border: "1px solid rgba(138,180,255,0.75)",
              background: "rgba(138,180,255,0.14)",
              verticalAlign: "middle",
            }}
          />
        </span>
        <span>
          Known:{" "}
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.08)",
              verticalAlign: "middle",
            }}
          />
        </span>
        <span>
          Fog:{" "}
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.55)",
              verticalAlign: "middle",
            }}
          />
        </span>
        <span>Marks: 🚪 ⬇️ ✶ ⬚ ⚠️</span>
      </div>

      <div className="muted" style={{ marginBottom: 10 }}>
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
          display: "grid",
          gridTemplateColumns: `repeat(${mapW}, 22px)`,
          gap: 4,
          padding: 10,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.03)",
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

          return (
            <div
              key={`${x},${y}`}
              title={titleParts.join(" · ")}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: here ? "1px solid rgba(138,180,255,0.65)" : "1px solid rgba(255,255,255,0.10)",
                background: !seen ? "rgba(0,0,0,0.55)" : here ? "rgba(138,180,255,0.18)" : "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {seen && glyph ? <span style={{ transform: "translateY(-0.5px)" }}>{glyph}</span> : null}
            </div>
          );
        })}
      </div>

      {derived.marks.length > 0 && (
        <details style={{ marginTop: 12 }}>
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
