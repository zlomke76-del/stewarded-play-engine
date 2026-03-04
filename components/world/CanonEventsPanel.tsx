"use client";

// ------------------------------------------------------------
// CanonEventsPanel
// ------------------------------------------------------------
// Purpose:
// - Show non-OUTCOME canon events in a readable ledger.
// - Keeps WorldLedgerPanelLegacy focused on OUTCOME narration.
// - Event-sourced: renders exactly what exists in events.
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

function fmtXY(xy: any) {
  if (!xy || typeof xy.x !== "number" || typeof xy.y !== "number") return "(?,?)";
  return `(${xy.x},${xy.y})`;
}

function safeTime(ts: unknown) {
  return typeof ts === "number" ? new Date(ts).toLocaleTimeString() : "";
}

function renderCanonEventLine(e: SessionEvent) {
  const p: any = (e as any)?.payload;

  switch (e?.type) {
    case "PLAYER_MOVED": {
      const from = fmtXY(p?.from);
      const to = fmtXY(p?.to);
      return `🧭 Move ${from} → ${to}`;
    }
    case "MAP_REVEALED": {
      const tiles = Array.isArray(p?.tiles) ? p.tiles : [];
      const n = tiles.length;
      return `🗺️ Reveal ${n} tile${n === 1 ? "" : "s"}`;
    }
    case "MAP_MARKED": {
      const at = fmtXY(p?.at);
      const kind = typeof p?.kind === "string" ? p.kind : "mark";
      const note =
        typeof p?.note === "string" && p.note.trim() ? ` — ${p.note.trim()}` : "";
      return `📍 Mark ${kind} at ${at}${note}`;
    }
    case "COMBAT_STARTED": {
      const combatId = p?.combatId ? String(p.combatId) : "(unknown)";
      const participants = Array.isArray(p?.participants) ? p.participants.length : 0;
      return `⚔️ Combat started (${combatId}) — ${participants} participants`;
    }
    case "COMBAT_ENDED": {
      const combatId = p?.combatId ? String(p.combatId) : "(combat)";
      return `🏁 Combat ended (${combatId})`;
    }
    case "INITIATIVE_ROLLED": {
      const who = p?.combatantId ? String(p.combatantId) : "(combatant)";
      const total = typeof p?.total === "number" ? p.total : "?";
      const natural = typeof p?.natural === "number" ? p.natural : "?";
      const mod = typeof p?.modifier === "number" ? p.modifier : "?";
      return `🎲 Initiative ${who}: ${total} (d20 ${natural} + ${mod})`;
    }
    case "TURN_ADVANCED": {
      const combatId = p?.combatId ? String(p.combatId) : "(combat)";
      const round = typeof p?.round === "number" ? p.round : "?";
      const index = typeof p?.index === "number" ? p.index : "?";
      return `⏭️ Turn advanced — ${combatId} (round ${round}, index ${index})`;
    }
    default: {
      const safe = (() => {
        try {
          return JSON.stringify(p ?? {}, null, 0);
        } catch {
          return "{}";
        }
      })();
      return `• ${String(e?.type ?? "UNKNOWN")}${safe !== "{}" ? ` — ${safe}` : ""}`;
    }
  }
}

export default function CanonEventsPanel({ events }: Props) {
  const canon = (events ?? []).filter((e) => e.type !== "OUTCOME");

  return (
    <CardSection title="Canon Events">
      {canon.length === 0 ? (
        <p className="muted">No canon events yet.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
          {canon.map((e) => (
            <li
              key={e.id}
              style={{
                padding: "10px 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{renderCanonEventLine(e)}</div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    actor: {e.actor} · type: {e.type}
                  </div>
                </div>
                <div className="muted" style={{ whiteSpace: "nowrap" }}>
                  {safeTime(e.timestamp)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}
