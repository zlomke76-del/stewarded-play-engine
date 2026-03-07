"use client";

// ------------------------------------------------------------
// WorldLedgerPanelLegacy (OUTCOME-only)
// ------------------------------------------------------------
// Purpose:
// - Show ONLY OUTCOME narration + dice/audit details.
// - Does NOT render other canon events (movement/map/combat).
// - CanonEventsPanel is responsible for non-OUTCOME canon.
//
// Premium UI pass:
// - bounded internal scroll chamber
// - newest outcomes first
// - card-style archival entries
// - clearer mechanical readouts
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

function outcomeTone(d?: OutcomePayload["dice"]) {
  if (!d) return "neutral" as const;

  const roll = typeof d.roll === "number" ? d.roll : null;
  const dc = typeof d.dc === "number" ? d.dc : null;
  if (roll === null || dc === null) return "neutral" as const;

  const margin = roll - dc;
  if (margin >= 5) return "strong-success" as const;
  if (margin >= 0) return "success" as const;
  if (margin <= -5) return "hard-failure" as const;
  return "failure" as const;
}

function toneStyles(tone: ReturnType<typeof outcomeTone>): React.CSSProperties {
  if (tone === "strong-success") {
    return {
      border: "1px solid rgba(120,190,140,0.24)",
      background:
        "linear-gradient(180deg, rgba(120,190,140,0.10), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "success") {
    return {
      border: "1px solid rgba(120,180,255,0.20)",
      background:
        "linear-gradient(180deg, rgba(120,180,255,0.08), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "hard-failure") {
    return {
      border: "1px solid rgba(220,120,120,0.24)",
      background:
        "linear-gradient(180deg, rgba(220,120,120,0.10), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "failure") {
    return {
      border: "1px solid rgba(255,196,118,0.20)",
      background:
        "linear-gradient(180deg, rgba(255,196,118,0.08), rgba(255,255,255,0.03))",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
  };
}

function diceSummary(d?: OutcomePayload["dice"]) {
  if (!d) {
    return {
      line: "",
      margin: null as number | null,
      badge: "Outcome",
    };
  }

  const mode = typeof d.mode === "string" ? d.mode : "?";
  const roll = typeof d.roll === "number" ? d.roll : null;
  const dc = typeof d.dc === "number" ? d.dc : null;
  const source = typeof d.source === "string" ? d.source : "?";

  const margin = roll !== null && dc !== null ? roll - dc : null;

  let badge = "Outcome";
  if (margin !== null) {
    if (margin >= 5) badge = "Decisive Success";
    else if (margin >= 0) badge = "Success";
    else if (margin <= -5) badge = "Hard Failure";
    else badge = "Strain";
  }

  const line =
    roll !== null && dc !== null
      ? `${mode} ${roll} vs DC ${dc}${margin !== null ? ` · margin ${margin >= 0 ? "+" : ""}${margin}` : ""} · ${source}`
      : `${mode} · ${source}`;

  return { line, margin, badge };
}

export default function WorldLedgerPanelLegacy({ events }: Props) {
  const outcomes = (events ?? [])
    .filter((e) => e.type === "OUTCOME")
    .slice()
    .reverse();

  return (
    <CardSection title="World Ledger (Outcome Narration)">
      {outcomes.length === 0 ? (
        <p className="muted">No outcomes recorded yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div
            className="muted"
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              marginTop: -2,
            }}
          >
            Outcome memory is preserved here as a bounded archive so the live play
            surface stays stable.
          </div>

          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
              paddingRight: 6,
              display: "grid",
              gap: 10,
            }}
          >
            {outcomes.map((e, idx) => {
              const p = safeOutcomePayload(e);
              const desc = (p.description ?? "").trim();
              const audit = p.audit ?? [];
              const tone = outcomeTone(p.dice);
              const dice = diceSummary(p.dice);
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
                    ...toneStyles(tone),
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
                        <span style={{ fontSize: 15, lineHeight: 1 }}>📝</span>
                        <div style={{ fontWeight: 900, fontSize: 15 }}>
                          {dice.badge}
                        </div>

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
                          marginTop: 10,
                          fontSize: 13,
                          lineHeight: 1.65,
                          opacity: 0.94,
                        }}
                      >
                        {desc.length ? desc : "Outcome recorded."}
                      </div>

                      {dice.line && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 12,
                            opacity: 0.78,
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <span>🎲</span>
                          <span>{dice.line}</span>
                        </div>
                      )}

                      {audit.length > 0 && (
                        <details style={{ marginTop: 10 }}>
                          <summary
                            className="muted"
                            style={{
                              cursor: "pointer",
                              fontSize: 11,
                              userSelect: "none",
                            }}
                          >
                            Audit trail
                          </summary>

                          <div
                            style={{
                              marginTop: 10,
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "rgba(0,0,0,0.20)",
                            }}
                          >
                            <ul
                              style={{
                                margin: 0,
                                paddingLeft: 18,
                                display: "grid",
                                gap: 6,
                              }}
                            >
                              {audit.map((a, i) => (
                                <li
                                  key={i}
                                  className="muted"
                                  style={{ lineHeight: 1.5 }}
                                >
                                  {String(a)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      )}

                      <div
                        className="muted"
                        style={{
                          marginTop: 10,
                          fontSize: 11,
                        }}
                      >
                        actor: {e.actor} · type: {e.type}
                      </div>
                    </div>

                    <div
                      className="muted"
                      style={{
                        whiteSpace: "nowrap",
                        fontSize: 12,
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
        </div>
      )}
    </CardSection>
  );
}
