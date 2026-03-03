"use client";

// ------------------------------------------------------------
// ExplorationMapPanel
// ------------------------------------------------------------
// Event-sourced fog-of-war exploration UI.
// - Derives position + discovered tiles + marks purely from events
// - Records canon ONLY via callbacks passed from parent (arbiter-only)
// - No silent mutation, no procedural "facts"
// ------------------------------------------------------------

import { useMemo, useState } from "react";
import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type XY = { x: number; y: number };

type PlayerMovedPayload = { from: XY; to: XY };
type MapRevealedPayload = { tiles: XY[] };

export type MapMarkKind = "door" | "stairs" | "altar" | "cache" | "hazard";
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

  // Canon recorders (arbiter-only)
  onMove: (to: XY) => void;
  onReveal: (tiles: XY[]) => void;
  onMark: (at: XY, kind: MapMarkKind, note?: string | null) => void;
};

function keyXY(p: XY) {
  return `${p.x},${p.y}`;
}

function withinBounds(p: XY, w: number, h: number) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

function revealRadius(center: XY, radius: number, w: number, h: number): XY[] {
  const out: XY[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const p = { x: center.x + dx, y: center.y + dy };
      if (withinBounds(p, w, h)) out.push(p);
    }
  }
  return out;
}

function normalizeNote(s: string) {
  return s.replace(/\s+/g, " ").trim();
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

  // Latest mark per tile (last write wins by event order)
  const marksByTile = new Map<string, MapMark>();

  // Always reveal start tile
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

      // Marking implies the tile is known (does not reveal neighbors)
      discovered.add(k);
    }
  }

  const marks = Array.from(marksByTile.values());
  return { position, discovered, marksByTile, marks };
}

export default function ExplorationMapPanel({
  events,
  mapW = 13,
  mapH = 9,
  onMove,
  onReveal,
  onMark,
}: Props) {
  const derived = useMemo(() => deriveMapState(events, mapW, mapH), [events, mapW, mapH]);

  const [markKind, setMarkKind] = useState<MapMarkKind>("door");
  const [markNote, setMarkNote] = useState("");

  function moveAndReveal(to: XY) {
    onMove(to);
    onReveal(revealRadius(to, 1, mapW, mapH));
  }

  function tryMove(dx: number, dy: number) {
    const to = { x: derived.position.x + dx, y: derived.position.y + dy };
    if (!withinBounds(to, mapW, mapH)) return;
    moveAndReveal(to);
  }

  function isAdjacent(to: XY) {
    const dx = Math.abs(to.x - derived.position.x);
    const dy = Math.abs(to.y - derived.position.y);
    return dx + dy === 1; // 4-neighbor adjacency
  }

  const canUp = derived.position.y > 0;
  const canDown = derived.position.y < mapH - 1;
  const canLeft = derived.position.x > 0;
  const canRight = derived.position.x < mapW - 1;

  return (
    <CardSection title="Exploration Map (Fog-of-War)">
      <p className="muted" style={{ marginTop: 0 }}>
        Arbiter-only: move / reveal / mark are canon events (append-only). The map is derived from events.
      </p>

      {/* Legend (makes the grid understandable instantly) */}
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

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Grid */}
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
            if (isAdjacent({ x, y })) titleParts.push("Click to move");

            const clickable = isAdjacent({ x, y }) && withinBounds({ x, y }, mapW, mapH);

            return (
              <button
                key={`${x},${y}`}
                title={titleParts.join(" · ")}
                onClick={() => {
                  if (!clickable) return;
                  moveAndReveal({ x, y });
                }}
                disabled={!clickable}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  position: "relative",
                  padding: 0,
                  cursor: clickable ? "pointer" : "default",
                  border: here
                    ? "1px solid rgba(138,180,255,0.65)"
                    : "1px solid rgba(255,255,255,0.10)",
                  background: !seen
                    ? "rgba(0,0,0,0.55)" // fog
                    : here
                      ? "rgba(138,180,255,0.18)"
                      : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  lineHeight: 1,
                  userSelect: "none",
                  opacity: clickable || here ? 1 : 0.92,
                }}
              >
                {seen && glyph ? <span style={{ transform: "translateY(-0.5px)" }}>{glyph}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ minWidth: 320 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => onReveal(revealRadius(derived.position, 1, mapW, mapH))}>
              Reveal (radius 1)
            </button>
            <button onClick={() => onReveal(revealRadius(derived.position, 2, mapW, mapH))}>
              Reveal (radius 2)
            </button>
          </div>

          {/* Mark tile */}
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              Mark current tile (commits MAP_MARKED)
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                Kind:
                <select value={markKind} onChange={(e) => setMarkKind(e.target.value as MapMarkKind)}>
                  <option value="door">door 🚪</option>
                  <option value="stairs">stairs ⬇️</option>
                  <option value="altar">altar ✶</option>
                  <option value="cache">cache ⬚</option>
                  <option value="hazard">hazard ⚠️</option>
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 180px" }}>
                Note (optional):
                <input
                  value={markNote}
                  onChange={(e) => setMarkNote(e.target.value)}
                  placeholder="e.g., locked, rune, blood, warm air…"
                />
              </label>

              <button
                onClick={() => {
                  const note = normalizeNote(markNote);
                  onMark(derived.position, markKind, note || null);
                  setMarkNote("");
                }}
              >
                Add mark
              </button>
            </div>

            {derived.marksByTile.get(keyXY(derived.position)) ? (
              <div className="muted" style={{ marginTop: 8 }}>
                Current tile mark:{" "}
                <strong>{derived.marksByTile.get(keyXY(derived.position))?.kind}</strong>
                {derived.marksByTile.get(keyXY(derived.position))?.note ? (
                  <> — {derived.marksByTile.get(keyXY(derived.position))?.note}</>
                ) : null}
              </div>
            ) : (
              <div className="muted" style={{ marginTop: 8 }}>
                No mark on current tile.
              </div>
            )}
          </div>

          {/* Movement */}
          <div style={{ marginTop: 14 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
              Move (commits PLAYER_MOVED + MAP_REVEALED radius 1)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 70px)", gap: 8 }}>
              <span />
              <button onClick={() => tryMove(0, -1)} disabled={!canUp} style={{ opacity: canUp ? 1 : 0.5 }}>
                ↑
              </button>
              <span />

              <button onClick={() => tryMove(-1, 0)} disabled={!canLeft} style={{ opacity: canLeft ? 1 : 0.5 }}>
                ←
              </button>

              <button disabled style={{ opacity: 0.5 }}>
                •
              </button>

              <button onClick={() => tryMove(1, 0)} disabled={!canRight} style={{ opacity: canRight ? 1 : 0.5 }}>
                →
              </button>

              <span />
              <button onClick={() => tryMove(0, 1)} disabled={!canDown} style={{ opacity: canDown ? 1 : 0.5 }}>
                ↓
              </button>
              <span />
            </div>

            <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
              Tip: click an adjacent tile to move. Marks create “dungeon memory” without inventing facts.
            </p>
          </div>
        </div>
      </div>
    </CardSection>
  );
}
