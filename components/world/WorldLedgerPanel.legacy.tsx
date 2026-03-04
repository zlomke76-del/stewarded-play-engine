"use client";

// ------------------------------------------------------------
// WorldLedgerPanelLegacy (OUTCOME-only)
// ------------------------------------------------------------
// Purpose:
// - Show ONLY OUTCOME narration + dice/audit details.
// - Does NOT render other canon events (movement/map/combat).
// - CanonEventsPanel is responsible for non-OUTCOME canon.
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

type OutcomePayload = {
  description?: string;
  dice?: {
    mode?: string;
    roll?: number;
    dc?: number;
    source?: string;
  };
  audit?: string[];
};

function safeTime(ts: unknown) {
  return typeof ts === "number" ? new Date(ts).toLocaleTimeString() : "";
}

function safeOutcomePayload(e: SessionEvent): OutcomePayload {
  const p: any = e.payload ?? {};
  return {
    description: typeof p.description === "string" ? p.description : "",
    dice: p.dice && typeof p.dice === "object" ? p.dice : undefined,
    audit: Array.isArray(p.audit) ? p.audit : [],
  };
}

function fmtDice(d?: OutcomePayload["dice"]) {
  if (!d) return "";
  const mode = typeof d.mode === "string" ? d.mode : "?";
  const roll = typeof d.roll === "number" ? d.roll : "?";
  const dc = typeof d.dc === "number" ? d.dc : "?";
  const source = typeof d.source === "string" ? d.source : "?";
  return `${mode} roll ${roll} vs DC ${dc} · source: ${source}`;
}

export default function WorldLedgerPanelLegacy({ events }: Props) {
  const outcomes = (events ?? []).filter((e) => e.type === "OUTCOME");

  return (
    <CardSection title="World Ledger (Outcome Narration)">
      {outcomes.length === 0 ? (
        <p className="muted">No outcomes recorded yet.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
          {outcomes.map((e) => {
            const p = safeOutcomePayload(e);
            const desc = (p.description ?? "").trim();
            const diceLine = fmtDice(p.dice);
            const audit = p.audit ?? [];

            return (
              <li
                key={e.id}
                style={{
                  padding: "12px 0",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>
                      {desc.length ? desc : "Outcome recorded."}
                    </div>

                    {diceLine && (
                      <div className="muted" style={{ marginTop: 6 }}>
                        🎲 {diceLine}
                      </div>
                    )}

                    {audit.length > 0 && (
                      <details style={{ marginTop: 8 }}>
                        <summary className="muted">Audit trail</summary>
                        <ul style={{ marginTop: 8 }}>
                          {audit.map((a, i) => (
                            <li key={i} className="muted">
                              {String(a)}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}

                    <div className="muted" style={{ marginTop: 8 }}>
                      actor: {e.actor} · type: {e.type}
                    </div>
                  </div>

                  <div className="muted" style={{ whiteSpace: "nowrap" }}>
                    {safeTime(e.timestamp)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CardSection>
  );
}
