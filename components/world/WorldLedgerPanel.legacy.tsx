"use client";

// ------------------------------------------------------------
// WorldLedgerPanelLegacy (OUTCOME-only)
// ------------------------------------------------------------
// Purpose:
// - Show ONLY OUTCOME narration + dice/audit details.
// - Does NOT render other canon events (movement/map/combat).
// - CanonEventsPanel is responsible for non-OUTCOME canon.
//
// Premium narrative pass:
// - bounded internal scroll chamber
// - newest outcomes first
// - card-style archival entries
// - clearer mechanical readouts
// - stronger authored-feeling outcome headlines
// - tactical tags derived from description / audit text
// ------------------------------------------------------------

import React from "react";
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

type OutcomeTone = "neutral" | "strong-success" | "success" | "failure" | "hard-failure";

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

function outcomeTone(d?: OutcomePayload["dice"]): OutcomeTone {
  if (!d) return "neutral";

  const roll = typeof d.roll === "number" ? d.roll : null;
  const dc = typeof d.dc === "number" ? d.dc : null;
  if (roll === null || dc === null) return "neutral";

  const margin = roll - dc;
  if (margin >= 5) return "strong-success";
  if (margin >= 0) return "success";
  if (margin <= -5) return "hard-failure";
  return "failure";
}

function toneStyles(tone: OutcomeTone): React.CSSProperties {
  if (tone === "strong-success") {
    return {
      border: "1px solid rgba(120,190,140,0.24)",
      background: "linear-gradient(180deg, rgba(120,190,140,0.10), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "success") {
    return {
      border: "1px solid rgba(120,180,255,0.20)",
      background: "linear-gradient(180deg, rgba(120,180,255,0.08), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "hard-failure") {
    return {
      border: "1px solid rgba(220,120,120,0.24)",
      background: "linear-gradient(180deg, rgba(220,120,120,0.10), rgba(255,255,255,0.03))",
    };
  }

  if (tone === "failure") {
    return {
      border: "1px solid rgba(255,196,118,0.20)",
      background: "linear-gradient(180deg, rgba(255,196,118,0.08), rgba(255,255,255,0.03))",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
  };
}

function diceSummary(d?: OutcomePayload["dice"]) {
  if (!d) {
    return {
      line: "",
      margin: null as number | null,
      badge: "Outcome",
      compact: "",
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

  const compact =
    roll !== null && dc !== null
      ? `${roll} vs ${dc}${margin !== null ? ` (${margin >= 0 ? "+" : ""}${margin})` : ""}`
      : mode;

  return { line, margin, badge, compact };
}

function normalizeText(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function firstSentence(text: string) {
  const clean = normalizeText(text);
  if (!clean) return "";
  const m = clean.match(/^(.+?[.!?])(?:\s|$)/);
  return m ? m[1].trim() : clean;
}

function remainderAfterFirstSentence(text: string) {
  const clean = normalizeText(text);
  if (!clean) return "";
  const first = firstSentence(clean);
  if (!first) return clean;
  return clean.slice(first.length).trim();
}

function containsAny(text: string, needles: string[]) {
  return needles.some((n) => text.includes(n));
}

function deriveOutcomeHeadline(args: {
  description: string;
  audit: string[];
  tone: OutcomeTone;
  diceBadge: string;
}) {
  const description = normalizeText(args.description).toLowerCase();
  const audit = args.audit.map((a) => normalizeText(String(a)).toLowerCase());
  const combined = [description, ...audit].join(" | ");

  if (containsAny(combined, ["door", "locked", "seal", "sealed", "lock"])) {
    if (args.tone === "strong-success" || args.tone === "success") return "The way is forced open.";
    if (args.tone === "hard-failure" || args.tone === "failure") return "The way resists the party.";
    return "A passage is contested.";
  }

  if (containsAny(combined, ["hazard", "trap", "danger", "snare", "tripwire"])) {
    if (args.tone === "strong-success" || args.tone === "success") return "The danger is brought to light.";
    if (args.tone === "hard-failure" || args.tone === "failure") return "The danger presses back.";
    return "A hidden threat shapes the moment.";
  }

  if (containsAny(combined, ["combat", "attack", "strike", "enemy", "hostile", "wound"])) {
    if (args.tone === "strong-success" || args.tone === "success") return "The exchange breaks in the party's favor.";
    if (args.tone === "hard-failure" || args.tone === "failure") return "The clash turns costly.";
    return "Steel meets consequence.";
  }

  if (containsAny(combined, ["stealth", "quiet", "noise", "awareness", "noticed", "patrol"])) {
    if (args.tone === "strong-success" || args.tone === "success") return "The party moves without yielding the dark.";
    if (args.tone === "hard-failure" || args.tone === "failure") return "The dungeon notices movement.";
    return "The dark listens.";
  }

  if (containsAny(combined, ["cache", "loot", "treasure", "supply", "supplies", "altar", "stairs"])) {
    if (args.tone === "strong-success" || args.tone === "success") return "A meaningful advantage is uncovered.";
    if (args.tone === "hard-failure" || args.tone === "failure") return "The opportunity comes at a cost.";
    return "A point of interest changes the field.";
  }

  if (args.tone === "strong-success") return "The party secures a decisive outcome.";
  if (args.tone === "success") return "The moment breaks in the party's favor.";
  if (args.tone === "hard-failure") return "The cost of action becomes clear.";
  if (args.tone === "failure") return "The dungeon yields only partially.";
  return args.diceBadge;
}

function deriveOutcomeSubhead(args: {
  description: string;
  tone: OutcomeTone;
  dice: ReturnType<typeof diceSummary>;
}) {
  const first = firstSentence(args.description);
  if (first) return first;

  if (args.tone === "strong-success") return "The action resolves with unusual force and clarity.";
  if (args.tone === "success") return "The action succeeds, though the dungeon remains reactive.";
  if (args.tone === "hard-failure") return "The attempt falters and the consequences bite back.";
  if (args.tone === "failure") return "The effort strains against resistance.";
  if (args.dice.line) return `Resolution recorded — ${args.dice.compact}.`;
  return "Outcome recorded.";
}

function deriveOutcomeDetail(description: string) {
  const rest = remainderAfterFirstSentence(description);
  return rest || "";
}

function deriveOutcomeTags(args: {
  description: string;
  audit: string[];
  tone: OutcomeTone;
  dice: ReturnType<typeof diceSummary>;
}) {
  const text = [args.description, ...args.audit].join(" ").toLowerCase();
  const tags: string[] = [];

  if (containsAny(text, ["door", "locked", "seal", "sealed", "lock"])) tags.push("Passage");
  if (containsAny(text, ["hazard", "trap", "danger", "snare", "tripwire"])) tags.push("Hazard");
  if (containsAny(text, ["combat", "enemy", "attack", "hostile", "wound", "damage"])) tags.push("Combat");
  if (containsAny(text, ["awareness", "patrol", "noticed", "noise", "stealth"])) tags.push("Awareness");
  if (containsAny(text, ["cache", "loot", "treasure", "altar", "stairs", "supply"])) tags.push("Discovery");

  if (args.tone === "strong-success") tags.push("Decisive");
  else if (args.tone === "success") tags.push("Success");
  else if (args.tone === "hard-failure") tags.push("Hard Failure");
  else if (args.tone === "failure") tags.push("Strain");

  if (args.dice.compact) tags.push(args.dice.compact);

  return tags.slice(0, 4);
}

function badgeGlyph(tone: OutcomeTone) {
  if (tone === "strong-success") return "✦";
  if (tone === "success") return "◆";
  if (tone === "hard-failure") return "✕";
  if (tone === "failure") return "△";
  return "●";
}

function badgeLabel(tone: OutcomeTone) {
  if (tone === "strong-success") return "Decisive";
  if (tone === "success") return "Success";
  if (tone === "hard-failure") return "Hard Failure";
  if (tone === "failure") return "Strain";
  return "Recorded";
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
            Outcome memory is preserved here as a bounded archive so the live play surface stays stable.
          </div>

          <div
            style={{
              maxHeight: 360,
              overflowY: "auto",
              paddingRight: 6,
              display: "grid",
              gap: 10,
            }}
          >
            {outcomes.map((e, idx) => {
              const p = safeOutcomePayload(e);
              const desc = normalizeText(p.description ?? "");
              const audit = p.audit ?? [];
              const tone = outcomeTone(p.dice);
              const dice = diceSummary(p.dice);
              const newest = idx === 0;

              const headline = deriveOutcomeHeadline({
                description: desc,
                audit,
                tone,
                diceBadge: dice.badge,
              });

              const subhead = deriveOutcomeSubhead({
                description: desc,
                tone,
                dice,
              });

              const detail = deriveOutcomeDetail(desc);
              const tags = deriveOutcomeTags({
                description: desc,
                audit,
                tone,
                dice,
              });

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
                        <span style={{ fontSize: 15, lineHeight: 1 }}>{badgeGlyph(tone)}</span>

                        <div style={{ fontWeight: 900, fontSize: 15 }}>{headline}</div>

                        <span
                          style={{
                            fontSize: 10,
                            lineHeight: 1,
                            padding: "4px 7px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.05)",
                            opacity: 0.9,
                          }}
                        >
                          {badgeLabel(tone)}
                        </span>

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
                          opacity: 0.96,
                          fontWeight: 600,
                        }}
                      >
                        {subhead || "Outcome recorded."}
                      </div>

                      {detail ? (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 12,
                            lineHeight: 1.65,
                            opacity: 0.82,
                          }}
                        >
                          {detail}
                        </div>
                      ) : null}

                      {tags.length > 0 ? (
                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          {tags.map((tag, i) => (
                            <span
                              key={`${tag}-${i}`}
                              style={{
                                fontSize: 10,
                                lineHeight: 1,
                                padding: "5px 7px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(255,255,255,0.04)",
                                opacity: 0.86,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {dice.line && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(0,0,0,0.16)",
                            fontSize: 12,
                            opacity: 0.82,
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
