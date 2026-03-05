"use client";

// ------------------------------------------------------------
// DungeonPressurePanel.tsx
// ------------------------------------------------------------
// Advisory-only dungeon pressure + zone inference + awareness meter.
// NO authority, NO mutation, NO automation.
//
// Purpose:
// - Make zone pressure + awareness visible (D&D-friendly)
// - Show nearby heat (adjacent zones)
// - Recommend (never assert) current location/zone
// - Preserve Arbiter authority
//
// Upgrade:
// - Integrates DungeonEvolution (dragon/apex pacing + dungeon condition) as
//   a READ-ONLY, deterministic layer derived from canon events.
// ------------------------------------------------------------

import React, { useMemo } from "react";
import { deriveDungeonEvolution } from "@/lib/world/DungeonEvolution";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
};

type Props = {
  turn: number;

  // Canonical room (if your canon has it). This panel will respect it as a label,
  // but zone mechanics are derived independently from movement/map.
  currentRoomId?: string;

  events: readonly SessionEvent[];

  // Optional, advisory-only
  parsedCommand?: any;
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

type ZoneCoord = { zx: number; zy: number };
type ZoneId = string;

const ZONE_SIZE_TILES = 4;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNum(x: any): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function parseZoneId(zoneId: string): ZoneCoord | null {
  const m = /^(\-?\d+),(\-?\d+)$/.exec(zoneId.trim());
  if (!m) return null;
  const zx = Number(m[1]);
  const zy = Number(m[2]);
  if (!Number.isFinite(zx) || !Number.isFinite(zy)) return null;
  return { zx, zy };
}

function makeZoneId(zx: number, zy: number): ZoneId {
  return `${zx},${zy}`;
}

function zoneFromTileXY(x: number, y: number, zoneSize = ZONE_SIZE_TILES): ZoneId {
  const zx = Math.floor(x / zoneSize);
  const zy = Math.floor(y / zoneSize);
  return makeZoneId(zx, zy);
}

function adjacentZones(zoneId: ZoneId): ZoneId[] {
  const c = parseZoneId(zoneId);
  if (!c) return [];
  const { zx, zy } = c;
  return [
    makeZoneId(zx, zy - 1), // N
    makeZoneId(zx, zy + 1), // S
    makeZoneId(zx - 1, zy), // W
    makeZoneId(zx + 1, zy), // E
  ];
}

function tierForPressure(p: number): {
  tier: "Quiet" | "Uneasy" | "Alert" | "Hunting" | "Active Threat" | "Crisis";
  rangeLabel: string;
} {
  const x = clamp(Math.round(p), 0, 100);
  if (x <= 10) return { tier: "Quiet", rangeLabel: "0–10" };
  if (x <= 25) return { tier: "Uneasy", rangeLabel: "11–25" };
  if (x <= 45) return { tier: "Alert", rangeLabel: "26–45" };
  if (x <= 70) return { tier: "Hunting", rangeLabel: "46–70" };
  if (x <= 90) return { tier: "Active Threat", rangeLabel: "71–90" };
  return { tier: "Crisis", rangeLabel: "91–100" };
}

function statusForAwareness(a: number): {
  label: "Calm" | "Whispers" | "Search" | "Reinforcements" | "Alarm";
  nextHint: string;
} {
  const x = clamp(Math.round(a), 0, 100);
  if (x < 25) return { label: "Calm", nextHint: "Noise and failure will draw attention." };
  if (x < 50) return { label: "Whispers", nextHint: "Minor signs of movement nearby." };
  if (x < 75) return { label: "Search", nextHint: "Patrols begin probing the area." };
  if (x < 100) return { label: "Reinforcements", nextHint: "A response is likely if disturbances continue." };
  return { label: "Alarm", nextHint: "The dungeon responds." };
}

// ------------------------------------------------------------
// Canon-derived position + zone inference
// ------------------------------------------------------------

type XY = { x: number; y: number };

function derivePlayerPosition(events: readonly SessionEvent[]): XY | null {
  // Matches the engine convention used elsewhere: PLAYER_MOVED payload.to {x,y}
  let last: XY | null = null;
  for (const e of events as any[]) {
    if (e?.type !== "PLAYER_MOVED") continue;
    const to = e?.payload?.to;
    const x = safeNum(to?.x);
    const y = safeNum(to?.y);
    if (x === null || y === null) continue;
    last = { x, y };
  }
  return last;
}

// ------------------------------------------------------------
// Pressure + awareness derivation (preferred: canonical events)
// ------------------------------------------------------------

type ZonePressureState = {
  byZone: Map<ZoneId, number>; // 0..100
  estimated: boolean; // true if we had to estimate (no canonical pressure events)
};

function deriveZonePressure(events: readonly SessionEvent[]): ZonePressureState {
  const byZone = new Map<ZoneId, number>();
  let sawCanonical = false;

  for (const e of events as any[]) {
    if (e?.type !== "ZONE_PRESSURE_CHANGED") continue;
    const zoneId = typeof e?.payload?.zoneId === "string" ? e.payload.zoneId : null;
    const delta = safeNum(e?.payload?.delta);
    if (!zoneId || delta === null) continue;

    sawCanonical = true;
    const prev = byZone.get(zoneId) ?? 0;
    byZone.set(zoneId, clamp(prev + delta, 0, 100));
  }

  // If no canonical pressure exists yet, we keep everything at 0.
  // (We intentionally do NOT infer from narration text.)
  return { byZone, estimated: !sawCanonical };
}

type ZoneAwarenessState = {
  byZone: Map<ZoneId, number>; // 0..100
  estimated: boolean; // true if we had to estimate (no canonical awareness events)
};

function deriveZoneAwareness(events: readonly SessionEvent[], pressure: ZonePressureState): ZoneAwarenessState {
  const byZone = new Map<ZoneId, number>();
  let sawCanonical = false;

  for (const e of events as any[]) {
    // Optional explicit awareness deltas (best)
    if (e?.type === "ZONE_AWARENESS_CHANGED") {
      const zoneId = typeof e?.payload?.zoneId === "string" ? e.payload.zoneId : null;
      const delta = safeNum(e?.payload?.delta);
      if (!zoneId || delta === null) continue;

      sawCanonical = true;
      const prev = byZone.get(zoneId) ?? 0;
      byZone.set(zoneId, clamp(prev + delta, 0, 100));
      continue;
    }

    // Guaranteed response trigger at 100 (we reset to baseline; default 40)
    if (e?.type === "ZONE_RESPONSE_TRIGGERED") {
      const zoneId = typeof e?.payload?.zoneId === "string" ? e.payload.zoneId : null;
      if (!zoneId) continue;

      sawCanonical = true;
      const resetTo = safeNum(e?.payload?.resetTo);
      byZone.set(zoneId, clamp(resetTo ?? 40, 0, 100));
      continue;
    }
  }

  if (sawCanonical) return { byZone, estimated: false };

  // No canonical awareness yet: estimate from pressure (advisory only).
  // This keeps the UI useful while you roll in the canonical events.
  const estimatedMap = new Map<ZoneId, number>();
  for (const [zoneId, p] of pressure.byZone.entries()) {
    // Mildly more sensitive than pressure (tripwire feel), still deterministic.
    estimatedMap.set(zoneId, clamp(Math.round(p * 1.15), 0, 100));
  }
  return { byZone: estimatedMap, estimated: true };
}

// ------------------------------------------------------------
// Advisory location inference (only used if no movement & no canon)
// ------------------------------------------------------------

function recommendLocation(parsedCommand?: any): { label: string; reason: string } {
  const text = parsedCommand?.rawInput?.toLowerCase?.() ?? "";

  if (text.includes("open door") || text.includes("enter") || text.includes("hallway") || text.includes("passage")) {
    return {
      label: "Stone Hallway",
      reason: "Door/entry language implies movement into an interior passage.",
    };
  }

  return {
    label: "Dungeon Entrance",
    reason: "No movement signal detected; default staging location.",
  };
}

// ------------------------------------------------------------
// Persistent world notes (room-scoped) — advisory aggregator
// ------------------------------------------------------------

function derivePersistentWorldState(events: readonly SessionEvent[], roomId?: string): string[] {
  const notes: string[] = [];

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;
    const w = e.payload?.world;
    if (!w) return;

    if (roomId && w.roomId && w.roomId !== roomId) return;

    if (w.lock) {
      notes.push(`Door ${w.lock.state}${w.lock.keyId ? ` (Key: ${w.lock.keyId})` : ""}`);
    }

    if (w.trap) {
      notes.push(`Trap ${w.trap.state}`);
    }
  });

  // De-dup while preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of notes) {
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

// ------------------------------------------------------------
// Visual components
// ------------------------------------------------------------

function RingGauge({
  value,
  title,
  subtitle,
  footnote,
  pulse,
}: {
  value: number; // 0..100
  title: string;
  subtitle?: string;
  footnote?: string;
  pulse?: "none" | "breathe" | "heartbeat";
}) {
  const v = clamp(value, 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  const pulseAnim =
    pulse === "heartbeat"
      ? "rg-heartbeat 1.25s ease-in-out infinite"
      : pulse === "breathe"
      ? "rg-breathe 2.4s ease-in-out infinite"
      : undefined;

  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
      <div style={{ width: 132, height: 132, position: "relative" }}>
        <svg viewBox="0 0 120 120" width="132" height="132" style={{ display: "block" }}>
          {/* track */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="10" />
          {/* glow ring */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="10"
            style={{ filter: "blur(0.6px)" }}
          />
          {/* progress */}
          <g style={{ transformOrigin: "60px 60px", transform: "rotate(-90deg)" }}>
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="rgba(220,220,255,0.85)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              style={{ animation: pulseAnim }}
            />
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 10,
          }}
        >
          <div style={{ fontWeight: 900, letterSpacing: 0.6, fontSize: 13, opacity: 0.95 }}>
            {title.toUpperCase()}
          </div>
          {subtitle ? <div style={{ marginTop: 4, fontSize: 12, opacity: 0.82 }}>{subtitle}</div> : null}
          {footnote ? <div style={{ marginTop: 6, fontSize: 11, opacity: 0.65 }}>{footnote}</div> : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes rg-breathe {
          0% {
            stroke: rgba(220, 220, 255, 0.72);
            filter: drop-shadow(0 0 0px rgba(220, 220, 255, 0));
          }
          50% {
            stroke: rgba(240, 240, 255, 0.92);
            filter: drop-shadow(0 0 6px rgba(240, 240, 255, 0.18));
          }
          100% {
            stroke: rgba(220, 220, 255, 0.72);
            filter: drop-shadow(0 0 0px rgba(220, 220, 255, 0));
          }
        }

        @keyframes rg-heartbeat {
          0% {
            stroke: rgba(220, 220, 255, 0.75);
            filter: drop-shadow(0 0 0px rgba(240, 240, 255, 0));
          }
          18% {
            stroke: rgba(255, 245, 245, 0.92);
            filter: drop-shadow(0 0 8px rgba(255, 210, 210, 0.18));
          }
          34% {
            stroke: rgba(220, 220, 255, 0.78);
            filter: drop-shadow(0 0 2px rgba(240, 240, 255, 0.08));
          }
          52% {
            stroke: rgba(255, 245, 245, 0.92);
            filter: drop-shadow(0 0 10px rgba(255, 210, 210, 0.22));
          }
          100% {
            stroke: rgba(220, 220, 255, 0.75);
            filter: drop-shadow(0 0 0px rgba(240, 240, 255, 0));
          }
        }
      `}</style>
    </div>
  );
}

function MeterBar({
  value,
  ticks = [25, 50, 75, 100],
  label,
  sublabel,
}: {
  value: number;
  ticks?: number[];
  label: string;
  sublabel?: string;
}) {
  const v = clamp(value, 0, 100);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{v}</div>
      </div>

      <div
        style={{
          position: "relative",
          height: 12,
          borderRadius: 999,
          background: "rgba(255,255,255,0.10)",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            background: "rgba(220,220,255,0.75)",
          }}
        />
        {ticks.map((t) => (
          <div
            key={t}
            style={{
              position: "absolute",
              left: `${t}%`,
              top: -2,
              width: 1,
              height: 16,
              background: "rgba(255,255,255,0.18)",
            }}
          />
        ))}
      </div>

      {sublabel ? <div style={{ fontSize: 12, opacity: 0.78 }}>{sublabel}</div> : null}
    </div>
  );
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function DungeonPressurePanel({ turn, currentRoomId, events, parsedCommand }: Props) {
  const playerPos = useMemo(() => derivePlayerPosition(events), [events]);

  const zoneId = useMemo<ZoneId>(() => {
    if (playerPos) return zoneFromTileXY(playerPos.x, playerPos.y, ZONE_SIZE_TILES);
    // If no player position, place in a deterministic fallback zone
    return makeZoneId(0, 0);
  }, [playerPos]);

  const adjacent = useMemo(() => adjacentZones(zoneId), [zoneId]);

  const zonePressure = useMemo(() => deriveZonePressure(events), [events]);
  const zoneAwareness = useMemo(() => deriveZoneAwareness(events, zonePressure), [events, zonePressure]);

  const currentPressure = zonePressure.byZone.get(zoneId) ?? 0;
  const currentAwareness = zoneAwareness.byZone.get(zoneId) ?? 0;

  const tier = tierForPressure(currentPressure);
  const awarenessStatus = statusForAwareness(currentAwareness);

  const nearbyMaxPressure = useMemo(() => {
    let m = 0;
    for (const z of adjacent) m = Math.max(m, zonePressure.byZone.get(z) ?? 0);
    return m;
  }, [adjacent, zonePressure]);

  const nearbyTier = tierForPressure(nearbyMaxPressure);

  const location = useMemo(() => {
    // Canonical room label (if present)
    if (currentRoomId) {
      return {
        label: currentRoomId,
        canonical: true,
        reason: "Confirmed by recorded canon.",
      };
    }

    // If we have a player position, we can at least label by zone
    if (playerPos) {
      return {
        label: `Zone ${zoneId}`,
        canonical: false,
        reason: "Derived from player movement (advisory label).",
      };
    }

    const rec = recommendLocation(parsedCommand);
    return { label: rec.label, canonical: false, reason: rec.reason };
  }, [currentRoomId, parsedCommand, playerPos, zoneId]);

  const persistent = useMemo(
    () => derivePersistentWorldState(events, location.canonical ? location.label : undefined),
    [events, location]
  );

  // Pulse logic: only visual, derived
  const pressurePulse: "none" | "breathe" | "heartbeat" =
    currentPressure >= 70 ? "heartbeat" : currentPressure >= 25 ? "breathe" : "none";

  // Dungeon Evolution (apex/dragon pacing + condition) — derived, advisory
  const evolution = useMemo(() => {
    return deriveDungeonEvolution({
      events: events as any,
      zoneId,
      nearbyZoneIds: adjacent,
    });
  }, [events, zoneId, adjacent]);

  const advisoryNotes = useMemo(() => {
    const notes: string[] = [];

    if (zonePressure.estimated) {
      notes.push("Pressure is not yet canonical (no ZONE_PRESSURE_CHANGED events detected).");
    }
    if (zoneAwareness.estimated) {
      notes.push("Awareness is estimated from pressure (no explicit awareness events detected).");
    }

    notes.push("Advisory only — Arbiter determines all outcomes.");
    return notes;
  }, [zonePressure.estimated, zoneAwareness.estimated]);

  return (
    <section
      className="card"
      style={{
        borderLeft: "4px solid rgba(255,255,255,0.18)",
        background: "rgba(17,17,17,0.92)",
      }}
    >
      <h3 style={{ marginBottom: 10 }}>🧭 Dungeon State (Advisory)</h3>

      {/* Top grid: gauges */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "160px 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        <RingGauge
          value={currentPressure}
          title={tier.tier}
          subtitle={`Zone Pressure: ${Math.round(currentPressure)}`}
          footnote={`Range ${tier.rangeLabel}`}
          pulse={pressurePulse}
        />

        <div style={{ display: "grid", gap: 12 }}>
          {/* Location */}
          <div>
            <div style={{ fontWeight: 800 }}>
              📍 Location: <span style={{ opacity: 0.95 }}>{location.label}</span>
            </div>
            {!location.canonical ? (
              <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                Recommended — not yet confirmed. <br />
                Reason: {location.reason}
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{location.reason}</div>
            )}
            {playerPos ? (
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                Tile: ({playerPos.x}, {playerPos.y}) · ZoneId: {zoneId} · ZoneSize: {ZONE_SIZE_TILES}
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                ZoneId: {zoneId} · ZoneSize: {ZONE_SIZE_TILES}
              </div>
            )}
          </div>

          {/* Awareness meter */}
          <MeterBar
            value={currentAwareness}
            label={`Zone Awareness — ${awarenessStatus.label}`}
            sublabel={awarenessStatus.nextHint}
          />

          {/* Nearby heat */}
          <MeterBar
            value={nearbyMaxPressure}
            label={`Nearby Heat — ${nearbyTier.tier}`}
            sublabel={`Max adjacent zone pressure: ${Math.round(nearbyMaxPressure)} (derived)`}
          />

          {/* NEW: Dungeon evolution (dragon/apex pacing) */}
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900 }}>
                🐉 Apex Presence: <span style={{ opacity: 0.92 }}>{evolution.apex}</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.78 }}>
                Condition: <strong>{evolution.condition}</strong>
              </div>
            </div>

            {evolution.signals.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {evolution.signals.slice(0, 4).map((s, i) => (
                  <li key={i} style={{ fontSize: 12, opacity: 0.86, marginBottom: 4 }}>
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.72 }}>No significant dungeon signals detected yet.</div>
            )}

            <div style={{ fontSize: 11, opacity: 0.62 }}>
              Advisory pacing only — this does not spawn enemies or force encounters.
            </div>
          </div>

          {/* Small status row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, opacity: 0.78 }}>
            <span>
              <strong>Turn:</strong> {turn}
            </span>
            <span>
              <strong>Tier:</strong> {tier.tier}
            </span>
            <span>
              <strong>Awareness:</strong> {awarenessStatus.label}
            </span>
          </div>
        </div>
      </div>

      <hr style={{ opacity: 0.2, margin: "14px 0" }} />

      {/* Persistent memory */}
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>🧱 Environmental Memory</div>

        {persistent.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.72 }}>No notable persistent changes detected.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {persistent.map((n, i) => (
              <li key={i} style={{ fontSize: 12, opacity: 0.86, marginBottom: 4 }}>
                {n}
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
          {advisoryNotes.map((n, i) => (
            <div key={i} style={{ fontSize: 11, opacity: 0.62 }}>
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
