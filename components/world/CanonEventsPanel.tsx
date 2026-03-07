"use client";

// ------------------------------------------------------------
// CanonEventsPanel
// ------------------------------------------------------------
// Purpose:
// - Show non-OUTCOME canon events in a readable chronicle timeline.
// - Keep WorldLedgerPanelLegacy focused on OUTCOME narration.
// - Event-sourced: renders exactly what exists in events.
// - Premium UI pass:
//   - card-per-event timeline presentation
//   - readable titles + summaries
//   - icon/type-specific styling
//   - collapsible raw canon entry instead of dumping payload inline
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

type CanonTone = "neutral" | "movement" | "map" | "combat" | "party" | "system";

function fmtXY(xy: any) {
  if (!xy || typeof xy.x !== "number" || typeof xy.y !== "number") return "(?,?)";
  return `(${xy.x},${xy.y})`;
}

function safeTime(ts: unknown) {
  return typeof ts === "number" ? new Date(ts).toLocaleTimeString() : "";
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function zoneLabel(zoneId: unknown) {
  return typeof zoneId === "string" && zoneId.trim() ? `Zone ${zoneId}` : "Unknown zone";
}

function summarizeParty(payload: any) {
  const members = Array.isArray(payload?.members) ? payload.members : [];
  const names = members
    .map((m: any, idx: number) => {
      const raw = String(m?.name ?? "").trim();
      return raw || `Player ${idx + 1}`;
    })
    .filter(Boolean);

  const uniqueClasses = new Set(
    members.map((m: any) => String(m?.className ?? "").trim()).filter(Boolean)
  );
  const portraitCount = members.filter((m: any) => String(m?.portrait ?? "").trim()).length;

  return {
    names,
    classCount: uniqueClasses.size,
    portraitCount,
  };
}

function describeCanonEvent(e: SessionEvent): {
  icon: string;
  title: string;
  summary: string;
  detail?: string;
  tone: CanonTone;
} {
  const p: any = (e as any)?.payload;

  switch (e?.type) {
    case "PARTY_DECLARED": {
      const info = summarizeParty(p);
      const joinedNames =
        info.names.length === 0
          ? "A party has entered the chronicle."
          : info.names.length <= 4
            ? `${info.names.join(", ")} have entered the chronicle.`
            : `${info.names.slice(0, 4).join(", ")} and others have entered the chronicle.`;

      return {
        icon: "👥",
        title: "Party Declared",
        summary: joinedNames,
        detail: `${info.classCount} class${info.classCount === 1 ? "" : "es"} represented · ${info.portraitCount} image${info.portraitCount === 1 ? "" : "s"} present.`,
        tone: "party",
      };
    }

    case "PLAYER_MOVED": {
      const from = fmtXY(p?.from);
      const to = fmtXY(p?.to);
      return {
        icon: "🧭",
        title: "Movement Committed",
        summary: `The party advanced from ${from} to ${to}.`,
        detail: "Position is now reflected on the exploration map.",
        tone: "movement",
      };
    }

    case "MAP_REVEALED": {
      const tiles = Array.isArray(p?.tiles) ? p.tiles : [];
      const n = tiles.length;
      return {
        icon: "🗺️",
        title: "Map Revealed",
        summary: `${n} tile${n === 1 ? "" : "s"} entered known terrain.`,
        detail: n > 0 ? `New terrain has been written into canon.` : "No new terrain was revealed.",
        tone: "map",
      };
    }

    case "MAP_MARKED": {
      const at = fmtXY(p?.at);
      const kind = typeof p?.kind === "string" ? p.kind : "mark";
      const note =
        typeof p?.note === "string" && p.note.trim() ? p.note.trim() : null;

      return {
        icon: "📍",
        title: "Map Marked",
        summary: `A ${kind} marker was set at ${at}.`,
        detail: note ? `Note: ${note}` : "The party recorded a remembered feature.",
        tone: "map",
      };
    }

    case "ZONE_PRESSURE_CHANGED": {
      const delta = typeof p?.delta === "number" ? p.delta : 0;
      return {
        icon: "🔥",
        title: "Pressure Shift",
        summary: `${zoneLabel(p?.zoneId)} pressure rose by +${delta}.`,
        detail: "The dungeon grows less forgiving in this area.",
        tone: "system",
      };
    }

    case "ZONE_AWARENESS_CHANGED": {
      const delta = typeof p?.delta === "number" ? p.delta : 0;
      return {
        icon: "👁️",
        title: "Awareness Stirred",
        summary: `${zoneLabel(p?.zoneId)} awareness rose by +${delta}.`,
        detail: "Something in the dungeon is becoming more alert.",
        tone: "system",
      };
    }

    case "COMBAT_STARTED": {
      const participants = Array.isArray(p?.participants) ? p.participants.length : 0;
      const combatId = p?.combatId ? String(p.combatId) : "(unknown)";
      return {
        icon: "⚔️",
        title: "Combat Began",
        summary: `${participants} participant${participants === 1 ? "" : "s"} entered initiative.`,
        detail: `Combat ID: ${combatId}`,
        tone: "combat",
      };
    }

    case "COMBAT_ENDED": {
      const combatId = p?.combatId ? String(p.combatId) : "(combat)";
      return {
        icon: "🏁",
        title: "Combat Ended",
        summary: `The exchange has been closed and combat is no longer active.`,
        detail: `Combat ID: ${combatId}`,
        tone: "combat",
      };
    }

    case "INITIATIVE_ROLLED": {
      const who = p?.combatantId ? String(p.combatantId) : "(combatant)";
      const total = typeof p?.total === "number" ? p.total : "?";
      const natural = typeof p?.natural === "number" ? p.natural : "?";
      const mod = typeof p?.modifier === "number" ? p.modifier : "?";

      return {
        icon: "🎲",
        title: "Initiative Rolled",
        summary: `${who} secured initiative ${total}.`,
        detail: `d20 ${natural} + ${mod}`,
        tone: "combat",
      };
    }

    case "TURN_ADVANCED": {
      const round = typeof p?.round === "number" ? p.round : "?";
      const index = typeof p?.index === "number" ? p.index : "?";
      return {
        icon: "⏭️",
        title: "Turn Advanced",
        summary: `Combat flow advanced to round ${round}, turn ${index}.`,
        detail: "Initiative order remains event-sourced and canonical.",
        tone: "combat",
      };
    }

    default: {
      return {
        icon: "📜",
        title: String(e?.type ?? "UNKNOWN")
          .toLowerCase()
          .split("_")
          .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
          .join(" "),
        summary: "A canonical system event was recorded.",
        detail: "Open the raw canon entry for full payload detail.",
        tone: "neutral",
      };
    }
  }
}

function toneStyles(tone: CanonTone): React.CSSProperties {
  if (tone === "party") {
    return {
      border: "1px solid rgba(255,210,140,0.20)",
      background:
        "linear-gradient(180deg, rgba(255,196,118,0.08), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "movement" || tone === "map") {
    return {
      border: "1px solid rgba(120,180,255,0.18)",
      background:
        "linear-gradient(180deg, rgba(120,180,255,0.06), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "combat") {
    return {
      border: "1px solid rgba(255,140,120,0.18)",
      background:
        "linear-gradient(180deg, rgba(255,140,120,0.06), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "system") {
    return {
      border: "1px solid rgba(190,160,255,0.16)",
      background:
        "linear-gradient(180deg, rgba(190,160,255,0.06), rgba(255,255,255,0.03))",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
  };
}

export default function CanonEventsPanel({ events }: Props) {
  const canon = (events ?? [])
    .filter((e) => e.type !== "OUTCOME")
    .slice()
    .reverse();

  return (
    <CardSection title="Canon Chronicle">
      {canon.length === 0 ? (
        <p className="muted">No canon entries yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div
            className="muted"
            style={{ fontSize: 12, lineHeight: 1.55, marginTop: -2 }}
          >
            The chronicle records what has truly entered canon. This view favors
            readable consequence over raw system payloads.
          </div>

          {canon.map((e, idx) => {
            const view = describeCanonEvent(e);
            const newest = idx === 0;

            return (
              <article
                key={e.id}
                style={{
                  borderRadius: 14,
                  padding: "12px 14px",
                  boxShadow: newest
                    ? "0 0 0 1px rgba(255,210,140,0.04), 0 12px 26px rgba(0,0,0,0.14)"
                    : "none",
                  ...toneStyles(view.tone),
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "start",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{view.icon}</span>
                      <div style={{ fontWeight: 900, fontSize: 15 }}>{view.title}</div>
                      {newest ? (
                        <span
                          style={{
                            fontSize: 10,
                            lineHeight: 1,
                            padding: "4px 7px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,210,140,0.20)",
                            background: "rgba(255,210,140,0.08)",
                            opacity: 0.9,
                          }}
                        >
                          Latest
                        </span>
                      ) : null}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        lineHeight: 1.6,
                        opacity: 0.92,
                      }}
                    >
                      {view.summary}
                    </div>

                    {view.detail ? (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          lineHeight: 1.55,
                          opacity: 0.72,
                        }}
                      >
                        {view.detail}
                      </div>
                    ) : null}

                    <details style={{ marginTop: 10 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          fontSize: 11,
                          opacity: 0.72,
                          userSelect: "none",
                        }}
                      >
                        Show raw canon entry
                      </summary>

                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(0,0,0,0.22)",
                        }}
                      >
                        <pre
                          style={{
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: 11,
                            lineHeight: 1.55,
                            opacity: 0.86,
                          }}
                        >
{safeJson({
  id: e.id,
  actor: e.actor,
  type: e.type,
  payload: (e as any)?.payload ?? {},
})}
                        </pre>
                      </div>
                    </details>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.72,
                      whiteSpace: "nowrap",
                      alignSelf: "start",
                    }}
                  >
                    {safeTime(e.timestamp)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </CardSection>
  );
}
