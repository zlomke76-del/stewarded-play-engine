"use client";

// ------------------------------------------------------------
// CanonChronicleSection.tsx
// ------------------------------------------------------------
// Chronicle-first canon presentation.
//
// Upgraded:
// - replaces raw event dump with readable chronicle entries
// - keeps subtle canon-record SFX when new canon events arrive
// - skips initial mount so historical events do not trigger audio
// - preserves optional raw event inspection behind disclosure
// - keeps World Ledger below the chronicle
// ------------------------------------------------------------

import React, { useEffect, useMemo, useRef } from "react";
import CardSection from "@/components/layout/CardSection";
import WorldLedgerPanelLegacy from "@/components/world/WorldLedgerPanel.legacy";

type Props = {
  events: readonly any[];
};

const SFX = {
  arbiterCanonRecord: "/assets/audio/sfx_arbiter_cannon_record_01.mp3",
} as const;

function playSfx(src: string, volume = 0.5) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // fail silently; chronicle audio should never interrupt flow
    });
  } catch {
    // fail silently
  }
}

function safeText(v: unknown) {
  return String(v ?? "").trim();
}

function titleCase(value: string) {
  return safeText(value)
    .replace(/[_\-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function listToNatural(items: string[]) {
  const clean = items.map((x) => safeText(x)).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function formatClock(ts: unknown) {
  const n = Number(ts);
  if (!Number.isFinite(n)) return "";
  try {
    return new Date(n).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function optionKindLabel(kind: unknown) {
  const raw = safeText(kind).toLowerCase();
  if (!raw) return "";
  if (raw === "safe") return "Measured";
  if (raw === "risky") return "Risky";
  if (raw === "contested") return "Contested";
  if (raw === "environmental") return "Environmental";
  return titleCase(raw);
}

function summarizePartyDeclared(payload: any) {
  const members = Array.isArray(payload?.members) ? payload.members : [];
  const names = members.map((m: any, idx: number) => safeText(m?.name) || `Player ${idx + 1}`);
  const classes = Array.from(
    new Set(members.map((m: any) => safeText(m?.className)).filter(Boolean))
  );
  const species = Array.from(
    new Set(members.map((m: any) => safeText(m?.species)).filter(Boolean))
  );

  const line1 =
    names.length > 0
      ? `${listToNatural(names)} ${names.length === 1 ? "has" : "have"} entered the chronicle.`
      : "A party has been declared.";

  const fragments: string[] = [];
  if (classes.length > 0) fragments.push(`${classes.length} class${classes.length === 1 ? "" : "es"} represented`);
  if (species.length > 0) fragments.push(`${species.length} lineage${species.length === 1 ? "" : "s"} present`);

  const line2 = fragments.length > 0 ? `${fragments.join(" · ")}.` : "The roster now defines session identity.";

  return {
    title: "Party Declared",
    body: [line1, line2],
    tone: "gold" as const,
  };
}

function summarizeOutcome(payload: any) {
  const description = safeText(payload?.description);
  const kind = optionKindLabel(payload?.meta?.optionKind);
  const success = payload?.meta?.success === true ? "Success" : payload?.meta?.success === false ? "Strain" : "";
  const zoneId = safeText(payload?.meta?.zoneId);

  const metaBits = [kind, success, zoneId ? `Zone ${zoneId}` : ""].filter(Boolean);
  return {
    title: "Outcome Recorded",
    body: [
      description || "An outcome was committed to canon.",
      metaBits.length ? metaBits.join(" · ") : "",
    ].filter(Boolean),
    tone: "default" as const,
  };
}

function summarizePressureChanged(payload: any) {
  const zoneId = safeText(payload?.zoneId) || "unknown";
  const delta = Number(payload?.delta);
  const deltaText = Number.isFinite(delta) ? `+${Math.round(delta)}` : "shifted";

  return {
    title: "Pressure Shift",
    body: [`Zone ${zoneId} pressure ${Number.isFinite(delta) ? `rose by ${deltaText}` : deltaText}.`],
    tone: "warn" as const,
  };
}

function summarizeAwarenessChanged(payload: any) {
  const zoneId = safeText(payload?.zoneId) || "unknown";
  const delta = Number(payload?.delta);
  const deltaText = Number.isFinite(delta) ? `+${Math.round(delta)}` : "shifted";

  return {
    title: "Awareness Stirred",
    body: [`Zone ${zoneId} awareness ${Number.isFinite(delta) ? `rose by ${deltaText}` : deltaText}.`],
    tone: "warn" as const,
  };
}

function summarizePlayerMoved(payload: any) {
  const fromX = Number(payload?.from?.x);
  const fromY = Number(payload?.from?.y);
  const toX = Number(payload?.to?.x);
  const toY = Number(payload?.to?.y);

  const fromText =
    Number.isFinite(fromX) && Number.isFinite(fromY) ? `(${fromX}, ${fromY})` : "the previous position";
  const toText = Number.isFinite(toX) && Number.isFinite(toY) ? `(${toX}, ${toY})` : "a new tile";

  return {
    title: "Movement Committed",
    body: [`The party advanced from ${fromText} to ${toText}.`],
    tone: "default" as const,
  };
}

function summarizeMapRevealed(payload: any) {
  const tiles = Array.isArray(payload?.tiles) ? payload.tiles : [];
  return {
    title: "Map Revealed",
    body: [
      tiles.length > 0
        ? `${tiles.length} tile${tiles.length === 1 ? "" : "s"} entered known terrain.`
        : "New ground was revealed.",
    ],
    tone: "default" as const,
  };
}

function summarizeMapMarked(payload: any) {
  const kind = titleCase(safeText(payload?.kind) || "mark");
  const x = Number(payload?.at?.x);
  const y = Number(payload?.at?.y);
  const note = safeText(payload?.note);
  const atText = Number.isFinite(x) && Number.isFinite(y) ? `at (${x}, ${y})` : "";

  return {
    title: "Map Marked",
    body: [`${kind} marked ${atText}${note ? ` · ${note}` : ""}`.trim()],
    tone: "default" as const,
  };
}

function summarizeCombatStarted(payload: any) {
  const enemies = Array.isArray(payload?.enemyGroups) ? payload.enemyGroups : [];
  const names = enemies
    .map((g: any) => safeText(g?.name))
    .filter(Boolean)
    .slice(0, 4);

  return {
    title: "Combat Began",
    body: [
      names.length > 0 ? `Threats engaged: ${listToNatural(names)}.` : "The battlefield was joined.",
    ],
    tone: "warn" as const,
  };
}

function summarizeCombatEnded() {
  return {
    title: "Combat Ended",
    body: ["The clash was brought to a close."],
    tone: "gold" as const,
  };
}

function summarizeTurnAdvanced(payload: any) {
  const nextId = safeText(payload?.nextCombatantId || payload?.activeCombatantId);
  return {
    title: "Turn Advanced",
    body: [nextId ? `Initiative passed to ${nextId}.` : "Initiative advanced."],
    tone: "default" as const,
  };
}

function summarizeFallback(type: string) {
  return {
    title: titleCase(type),
    body: ["A canon event was recorded."],
    tone: "default" as const,
  };
}

function summarizeEvent(event: any) {
  const type = safeText(event?.type);

  switch (type) {
    case "PARTY_DECLARED":
      return summarizePartyDeclared(event?.payload);
    case "OUTCOME":
      return summarizeOutcome(event?.payload);
    case "ZONE_PRESSURE_CHANGED":
      return summarizePressureChanged(event?.payload);
    case "ZONE_AWARENESS_CHANGED":
      return summarizeAwarenessChanged(event?.payload);
    case "PLAYER_MOVED":
      return summarizePlayerMoved(event?.payload);
    case "MAP_REVEALED":
      return summarizeMapRevealed(event?.payload);
    case "MAP_MARKED":
      return summarizeMapMarked(event?.payload);
    case "COMBAT_STARTED":
      return summarizeCombatStarted(event?.payload);
    case "COMBAT_ENDED":
      return summarizeCombatEnded();
    case "TURN_ADVANCED":
      return summarizeTurnAdvanced(event?.payload);
    default:
      return summarizeFallback(type || "Canon Event");
  }
}

function toneStyles(tone: "default" | "warn" | "gold"): React.CSSProperties {
  if (tone === "warn") {
    return {
      border: "1px solid rgba(255,196,118,0.18)",
      background: "rgba(255,196,118,0.06)",
    };
  }

  if (tone === "gold") {
    return {
      border: "1px solid rgba(255,215,140,0.20)",
      background: "rgba(255,215,140,0.07)",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
  };
}

export default function CanonChronicleSection({ events }: Props) {
  const didMountRef = useRef(false);
  const prevCountRef = useRef<number>(events.length);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      prevCountRef.current = events.length;
      return;
    }

    const prevCount = prevCountRef.current;
    const nextCount = events.length;

    if (nextCount > prevCount) {
      const latest = events[nextCount - 1];
      if (latest?.type) {
        playSfx(SFX.arbiterCanonRecord, 0.52);
      }
    }

    prevCountRef.current = nextCount;
  }, [events]);

  const chronicleEntries = useMemo(() => {
    const filtered = (events as any[]).filter((e) => {
      const type = safeText(e?.type);
      if (!type) return false;
      return true;
    });

    return filtered
      .slice()
      .reverse()
      .map((event) => ({
        event,
        summary: summarizeEvent(event),
        timeLabel: formatClock(event?.timestamp),
      }));
  }, [events]);

  return (
    <>
      <CardSection title="Canon Chronicle">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.78, lineHeight: 1.6 }}>
            The chronicle records what has truly entered canon. This view favors readable consequence over raw system payloads.
          </div>

          {chronicleEntries.length === 0 ? (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 13,
                opacity: 0.76,
              }}
            >
              No canon has been recorded yet.
            </div>
          ) : (
            chronicleEntries.map(({ event, summary, timeLabel }, idx) => (
              <article
                key={String(event?.id ?? `chronicle_${idx}`)}
                style={{
                  ...toneStyles(summary.tone),
                  borderRadius: 16,
                  padding: "14px 16px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{summary.title}</div>
                  {timeLabel ? <div style={{ fontSize: 12, opacity: 0.62 }}>{timeLabel}</div> : null}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  {summary.body.map((line, lineIdx) => (
                    <div key={lineIdx} style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>
                      {line}
                    </div>
                  ))}
                </div>

                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer", fontSize: 12, opacity: 0.62 }}>
                    Show raw canon entry
                  </summary>
                  <pre
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      overflowX: "auto",
                      fontSize: 11,
                      lineHeight: 1.5,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(0,0,0,0.22)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </details>
              </article>
            ))
          )}
        </div>
      </CardSection>

      <WorldLedgerPanelLegacy events={events as any} />
    </>
  );
}
