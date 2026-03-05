// app/demo/components/CombatSection.tsx
"use client";

// ------------------------------------------------------------
// CombatSection.tsx
// ------------------------------------------------------------
// Visual wrapper for combat setup, optional enemy-turn resolver,
// and derived turn order panel.
//
// Update (damage v1):
// - Derive player HP for display from canon events:
//     COMBATANT_HP_INITIALIZED (optional baseline)
//     COMBATANT_DAMAGED
//     COMBATANT_HEALED (optional future-proof)
//     COMBATANT_DOWNED
// - When EnemyTurnResolver commits an outcome, CombatSection (arbiter-side)
//   also commits COMBATANT_DAMAGED (+ COMBATANT_DOWNED if HP <= 0),
//   using a deterministic damage heuristic (D&D-ish, simplified).
// ------------------------------------------------------------

import React, { useMemo } from "react";
import CardSection from "@/components/layout/CardSection";
import CombatSetupPanel from "@/components/combat/CombatSetupPanel";
import EnemyTurnResolverPanel from "@/components/combat/EnemyTurnResolverPanel";
import { formatCombatantLabel } from "@/lib/combat/CombatState";

type PartyMemberLite = {
  id: string;
  name: string;
  className: string;
  portrait: "Male" | "Female";
  ac: number;
  hpMax: number;
  hpCurrent: number;
  initiativeMod: number;
};

type EnemyTelegraphHint = {
  enemyName: string;
  targetName: string;
  attackStyleHint: "volley" | "beam" | "charge" | "unknown";
};

type DerivedCombatLite = {
  combatId: string;
  round: number;
  order: string[];
  activeCombatantId: string | null;
  participants: any[];
  initiative: any[];
};

type Props = {
  events: any[];
  dmMode: "human" | "solace-neutral" | null;

  onAppendCanon: (type: string, payload: any) => void;

  partyMembers: PartyMemberLite[];
  pressureTier: "low" | "medium" | "high";
  allowDevControls: boolean;

  // Enemy turn resolver
  showEnemyResolver: boolean;
  activeEnemyGroupName: string | null;
  activeEnemyGroupId: string | null;
  playerNames: string[];
  onTelegraph: (info: EnemyTelegraphHint) => void;
  onCommitOutcomeOnly: (payload: any) => void;
  onAdvanceTurn: () => void;
  enemyTelegraphHint: EnemyTelegraphHint | null;

  // Derived order display
  derivedCombat: DerivedCombatLite | null;
  activeCombatantSpec: any | null;
  combatEnded: boolean;
  isEnemyTurn: boolean;
  isWrongPlayerForTurn: boolean;

  onAdvanceTurnBtn: () => void;
  onPassTurnBtn: () => void;
  onEndCombatBtn: () => void;
};

function portraitSrcFor(member: PartyMemberLite) {
  const cls = (member.className || "").trim();
  const gender = member.portrait === "Female" ? "Female" : "Male";

  // If class isn't set yet, don't request a broken URL.
  if (!cls) return null;

  return `/assets/V2/${cls}_${gender}.png`;
}

function normalizeClassKey(v: string) {
  return (v || "").trim().toLowerCase();
}

function isHealerCapable(className: string) {
  const k = normalizeClassKey(className);
  // Keep this intentionally conservative & “RPG obvious”.
  // (No new schema needed; derived from className.)
  return k === "cleric" || k === "paladin" || k === "druid" || k === "bard" || k === "artificer";
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function hpPercent(hpCurrent: number, hpMax: number) {
  const max = Math.max(1, Number(hpMax) || 1);
  const cur = Math.max(0, Number(hpCurrent) || 0);
  return clamp01(cur / max);
}

function fmtHp(hpCurrent: number, hpMax: number) {
  const max = Math.max(1, Number(hpMax) || 1);
  const cur = Math.max(0, Number(hpCurrent) || 0);
  return `${cur} / ${max}`;
}

function nameKey(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function clampInt(n: unknown, lo: number, hi: number) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : lo;
  return Math.max(lo, Math.min(hi, x));
}

type HpState = {
  hpMax: number;
  hpCurrent: number;
  downed: boolean;
};

function derivePlayerHpFromCanon(args: {
  events: readonly any[];
  combatId: string | null;
  partyMembers: PartyMemberLite[];
}): Record<string, HpState> {
  const { events, combatId, partyMembers } = args;

  const base: Record<string, HpState> = {};
  for (const m of partyMembers) {
    const hpMax = Math.max(1, Number(m.hpMax) || 1);
    const hpCur = clampInt(m.hpCurrent, 0, hpMax);
    base[String(m.id)] = { hpMax, hpCurrent: hpCur, downed: hpCur <= 0 };
  }

  if (!combatId) return base;

  // If we have explicit initialized HP events, use them as the baseline (per combat).
  for (const e of events) {
    if (e?.type !== "COMBATANT_HP_INITIALIZED") continue;
    const p = e?.payload ?? {};
    if (String(p.combatId ?? "") !== String(combatId)) continue;

    const id = String(p.combatantId ?? "");
    if (!id) continue;

    const hpMax = Math.max(1, Number(p.hpMax) || 1);
    const hpCur = clampInt(p.hpCurrent, 0, hpMax);

    base[id] = { hpMax, hpCurrent: hpCur, downed: hpCur <= 0 };
  }

  // Apply damage/heal deltas (event-sourced replay)
  for (const e of events) {
    const t = e?.type;
    const p = e?.payload ?? {};
    if (!combatId || String(p.combatId ?? "") !== String(combatId)) continue;

    if (t === "COMBATANT_DAMAGED") {
      const targetId = String(p.targetCombatantId ?? "");
      const amount = Math.max(0, Math.trunc(Number(p.amount ?? 0)));
      if (!targetId || amount <= 0) continue;

      const cur = base[targetId] ?? { hpMax: 12, hpCurrent: 12, downed: false };
      const nextCur = Math.max(0, (Number(cur.hpCurrent) || 0) - amount);
      base[targetId] = { ...cur, hpCurrent: nextCur, downed: cur.downed || nextCur <= 0 };
    }

    if (t === "COMBATANT_HEALED") {
      const targetId = String(p.targetCombatantId ?? "");
      const amount = Math.max(0, Math.trunc(Number(p.amount ?? 0)));
      if (!targetId || amount <= 0) continue;

      const cur = base[targetId] ?? { hpMax: 12, hpCurrent: 0, downed: true };
      const max = Math.max(1, Number(cur.hpMax) || 1);
      const nextCur = Math.min(max, (Number(cur.hpCurrent) || 0) + amount);
      base[targetId] = { ...cur, hpCurrent: nextCur, downed: nextCur <= 0 ? true : false };
    }

    if (t === "COMBATANT_DOWNED") {
      const id = String(p.combatantId ?? "");
      if (!id) continue;
      const cur = base[id] ?? { hpMax: 12, hpCurrent: 0, downed: true };
      base[id] = { ...cur, hpCurrent: Math.max(0, Number(cur.hpCurrent) || 0), downed: true };
    }
  }

  return base;
}

function inferDamageStyleFromPayload(payload: any): "volley" | "beam" | "charge" | "unknown" {
  const text = String(payload?.description ?? "").toLowerCase();
  if (text.includes("volley") || text.includes("arrows")) return "volley";
  if (text.includes("spell") || text.includes("beam") || text.includes("force") || text.includes("burn")) return "beam";
  if (text.includes("charge") || text.includes("smash") || text.includes("strike")) return "charge";
  return "unknown";
}

// Deterministic “D&D-ish” damage from (roll, dc, style)
// (no RNG; replayable given OUTCOME dice)
function computeDeterministicDamage(args: { roll: number; dc: number; style: "volley" | "beam" | "charge" | "unknown" }) {
  const roll = Math.trunc(Number(args.roll) || 0);
  const dc = Math.trunc(Number(args.dc) || 0);
  const margin = roll - dc;

  const base =
    args.style === "beam" ? 6 : args.style === "charge" ? 5 : args.style === "volley" ? 4 : 4;

  const bonus = Math.max(0, Math.floor(margin / 5)); // +1 per 5 over DC
  const raw = base + bonus;

  // keep it reasonable at low levels
  return clampInt(raw, 1, 12);
}

export default function CombatSection({
  events,
  dmMode,
  onAppendCanon,
  partyMembers,
  pressureTier,
  allowDevControls,
  showEnemyResolver,
  activeEnemyGroupName,
  activeEnemyGroupId,
  playerNames,
  onTelegraph,
  onCommitOutcomeOnly,
  onAdvanceTurn,
  enemyTelegraphHint,
  derivedCombat,
  activeCombatantSpec,
  combatEnded,
  isEnemyTurn,
  isWrongPlayerForTurn,
  onAdvanceTurnBtn,
  onPassTurnBtn,
  onEndCombatBtn,
}: Props) {
  const combatId = derivedCombat?.combatId ?? null;

  const playerHpById = useMemo(
    () => derivePlayerHpFromCanon({ events, combatId, partyMembers }),
    [events, combatId, partyMembers]
  );

  const partyMembersForDisplay = useMemo(() => {
    return partyMembers.map((m) => {
      const hp = playerHpById[String(m.id)];
      if (!hp) return m;
      return { ...m, hpMax: hp.hpMax, hpCurrent: hp.hpCurrent };
    });
  }, [partyMembers, playerHpById]);

  function chooseTargetCombatantId(): string | null {
    // Prefer telegraph target if it matches a living player.
    const hintedName = enemyTelegraphHint?.targetName ? nameKey(enemyTelegraphHint.targetName) : "";
    const living = partyMembersForDisplay.filter((m) => (Number(m.hpCurrent) || 0) > 0);

    if (hintedName) {
      const byName = living.find((m) => nameKey(m.name) === hintedName);
      if (byName) return String(byName.id);

      // Sometimes playerNames may be display-only; fallback to partial match.
      const byContains = living.find((m) => nameKey(m.name).includes(hintedName) || hintedName.includes(nameKey(m.name)));
      if (byContains) return String(byContains.id);
    }

    // Otherwise pick first living; if none, pick first party member (still deterministic).
    if (living.length > 0) return String(living[0].id);
    return partyMembersForDisplay.length > 0 ? String(partyMembersForDisplay[0].id) : null;
  }

  function handleEnemyCommitOutcomeAndDamage(payload: any) {
    // Always commit the OUTCOME first (existing pipeline).
    onCommitOutcomeOnly(payload);

    // If we don't have combat context, don't attempt HP mutation.
    if (!combatId) return;

    const roll = Math.trunc(Number(payload?.dice?.roll ?? 0));
    const dc = Math.trunc(Number(payload?.dice?.dc ?? 0));
    const hit = Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;

    if (!hit) return;

    const styleFromTelegraph =
      enemyTelegraphHint?.enemyName && activeEnemyGroupName
        ? nameKey(enemyTelegraphHint.enemyName) === nameKey(activeEnemyGroupName)
          ? enemyTelegraphHint.attackStyleHint
          : null
        : null;

    const style = (styleFromTelegraph ?? inferDamageStyleFromPayload(payload)) as
      | "volley"
      | "beam"
      | "charge"
      | "unknown";

    const targetCombatantId = chooseTargetCombatantId();
    if (!targetCombatantId) return;

    const amount = computeDeterministicDamage({ roll, dc, style });

    // Commit damage canon
    onAppendCanon("COMBATANT_DAMAGED", {
      combatId,
      sourceCombatantId: String(activeEnemyGroupId ?? activeEnemyGroupName ?? "enemy"),
      targetCombatantId,
      amount,
      kind: style,
    });

    // If this drops the target to 0, emit DOWNED canon.
    const before = playerHpById[targetCombatantId];
    const beforeCur =
      before?.hpCurrent ?? clampInt(partyMembersForDisplay.find((m) => String(m.id) === targetCombatantId)?.hpCurrent, 0, 999);
    const afterCur = Math.max(0, (Number(beforeCur) || 0) - amount);

    if (afterCur <= 0) {
      onAppendCanon("COMBATANT_DOWNED", { combatId, combatantId: targetCombatantId, reason: "hp_zero" });
    }
  }

  return (
    <>
      {/* Players (session truth) — portraits + vitals (HP derived from canon when available) */}
      {partyMembersForDisplay.length > 0 && (
        <CardSection title="Players (session truth)">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 10,
            }}
          >
            {partyMembersForDisplay.map((m) => {
              const src = portraitSrcFor(m);
              const healer = isHealerCapable(m.className);

              const hpState = playerHpById[String(m.id)];
              const downed = hpState ? hpState.downed : (Number(m.hpCurrent) || 0) <= 0;

              const pct = hpPercent(m.hpCurrent, m.hpMax);

              return (
                <div
                  key={m.id}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 12px",
                    borderRadius: 12,
                    border: downed
                      ? "1px solid rgba(255,120,120,0.28)"
                      : "1px solid rgba(255,255,255,0.12)",
                    background: downed ? "rgba(255,120,120,0.06)" : "rgba(255,255,255,0.04)",
                    boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
                    opacity: downed ? 0.72 : 1,
                  }}
                >
                  {/* role glyph */}
                  {healer && (
                    <div
                      title="Healer-capable"
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        lineHeight: 1,
                        opacity: 0.95,
                        userSelect: "none",
                      }}
                    >
                      ✚
                    </div>
                  )}

                  {/* downed badge */}
                  {downed && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,120,120,0.35)",
                        background: "rgba(255,120,120,0.10)",
                        fontSize: 11,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        opacity: 0.95,
                      }}
                    >
                      Downed
                    </div>
                  )}

                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.16)",
                      background: "rgba(0,0,0,0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    title={src ? `${m.className}_${m.portrait}` : "Select class to enable portrait"}
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={`${m.className} ${m.portrait}`}
                        width={64}
                        height={64}
                        style={{ width: 64, height: 64, objectFit: "cover", display: "block" }}
                        onError={(e) => {
                          // Avoid infinite error loops; hide the broken image.
                          const el = e.currentTarget;
                          el.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="muted" style={{ fontSize: 11 }}>
                        no class
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 15, lineHeight: 1.2 }}>{m.name || "Unnamed"}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>
                        id: {m.id} · AC {Number(m.ac) || 0} · init{" "}
                        {m.initiativeMod >= 0 ? `+${m.initiativeMod}` : m.initiativeMod}
                      </span>
                    </div>

                    {/* HP bar */}
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          height: 7,
                          borderRadius: 999,
                          background: "rgba(0,0,0,0.36)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          overflow: "hidden",
                        }}
                        aria-label={`HP ${fmtHp(m.hpCurrent, m.hpMax)}`}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.round(pct * 100)}%`,
                            background: downed ? "rgba(255,120,120,0.65)" : "rgba(160,220,255,0.55)",
                            boxShadow: downed ? "none" : "0 0 12px rgba(160,220,255,0.22)",
                          }}
                        />
                      </div>

                      <div
                        className="muted"
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <span>
                          HP <strong>{fmtHp(m.hpCurrent, m.hpMax)}</strong>
                        </span>
                        <span>{m.className ? <strong>{m.className}</strong> : "—"}</span>
                      </div>
                    </div>

                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      {m.className ? (
                        <>
                          Portrait: <strong>{m.portrait}</strong>
                          {healer ? (
                            <>
                              {" "}
                              · Role: <strong>Healer</strong>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <>Set a class name to load portrait</>
                      )}
                    </div>

                    {/* Canon hint */}
                    {combatId && (
                      <div className="muted" style={{ fontSize: 11, marginTop: 6, opacity: 0.85 }}>
                        Combat HP is event-sourced (damage/downed).
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardSection>
      )}

      <CombatSetupPanel
        events={events as any[]}
        onAppendCanon={onAppendCanon}
        dmMode={dmMode as any}
        partyMembers={partyMembers as any}
        pressureTier={pressureTier as any}
        allowDevControls={allowDevControls}
      />

      {showEnemyResolver && (
        <CardSection title="Enemy Turn Resolution (Solace-neutral)">
          <EnemyTurnResolverPanel
            enabled={true}
            activeEnemyGroupName={activeEnemyGroupName ?? ""}
            activeEnemyGroupId={activeEnemyGroupId ?? ""}
            playerNames={playerNames}
            onTelegraph={onTelegraph}
            onCommitOutcome={handleEnemyCommitOutcomeAndDamage}
            onAdvanceTurn={onAdvanceTurn}
          />

          {enemyTelegraphHint && (
            <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              Telegraph hint: <strong>{enemyTelegraphHint.attackStyleHint}</strong> · Target{" "}
              <strong>{enemyTelegraphHint.targetName}</strong>
            </div>
          )}

          <div className="muted" style={{ marginTop: 10, fontSize: 11, opacity: 0.85, lineHeight: 1.5 }}>
            Damage V1: if roll ≥ DC, we commit <strong>COMBATANT_DAMAGED</strong> (deterministic, style-based).
            If HP hits 0, we also commit <strong>COMBATANT_DOWNED</strong>.
          </div>
        </CardSection>
      )}

      {derivedCombat && (
        <CardSection title="Derived Turn Order">
          <div className="muted">
            Combat: <strong>{derivedCombat.combatId}</strong> · Round <strong>{derivedCombat.round}</strong>
            {activeCombatantSpec && (
              <>
                {" "}
                · Active: <strong>{formatCombatantLabel(activeCombatantSpec)}</strong>
              </>
            )}
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
            {derivedCombat.order.map((id: string, idx: number) => {
              const spec = derivedCombat.participants.find((p: any) => p.id === id) ?? null;
              const roll = derivedCombat.initiative.find((r: any) => r.combatantId === id) ?? null;
              const active = derivedCombat.activeCombatantId === id;

              return (
                <div
                  key={id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: active ? "1px solid rgba(138,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
                    background: active ? "rgba(138,180,255,0.10)" : "rgba(255,255,255,0.04)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div>
                    <strong>
                      {idx + 1}. {spec ? formatCombatantLabel(spec) : id}
                    </strong>
                    {active && <span className="muted">{"  "}← active</span>}
                  </div>
                  <div className="muted">
                    {roll ? `Init ${roll.total} (d20 ${roll.natural} + ${roll.modifier})` : "Init —"}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={onAdvanceTurnBtn}
              disabled={!derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn)}
            >
              Advance Turn
            </button>

            <button
              onClick={onPassTurnBtn}
              disabled={!derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn) || isWrongPlayerForTurn}
            >
              Pass / End Turn
            </button>

            <button onClick={onEndCombatBtn} disabled={!derivedCombat || combatEnded}>
              End Combat
            </button>
          </div>
        </CardSection>
      )}
    </>
  );
}
