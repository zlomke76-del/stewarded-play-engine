// app/demo/components/CombatSection.tsx
"use client";

// ------------------------------------------------------------
// CombatSection.tsx
// ------------------------------------------------------------
// Visual wrapper for combat setup, optional enemy-turn resolver,
// and derived turn order panel.
// ------------------------------------------------------------

import React from "react";
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
  return (
    k === "cleric" ||
    k === "paladin" ||
    k === "druid" ||
    k === "bard" ||
    k === "artificer"
  );
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
  return (
    <>
      {/* Players (session truth) — portraits + vitals */}
      {partyMembers.length > 0 && (
        <CardSection title="Players (session truth)">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 10,
            }}
          >
            {partyMembers.map((m) => {
              const src = portraitSrcFor(m);
              const healer = isHealerCapable(m.className);
              const downed = (Number(m.hpCurrent) || 0) <= 0;
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
                    border: downed ? "1px solid rgba(255,120,120,0.28)" : "1px solid rgba(255,255,255,0.12)",
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
            onCommitOutcome={onCommitOutcomeOnly}
            onAdvanceTurn={onAdvanceTurn}
          />

          {enemyTelegraphHint && (
            <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              Telegraph hint: <strong>{enemyTelegraphHint.attackStyleHint}</strong> · Target{" "}
              <strong>{enemyTelegraphHint.targetName}</strong>
            </div>
          )}
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
              disabled={
                !derivedCombat ||
                combatEnded ||
                (dmMode === "solace-neutral" && isEnemyTurn) ||
                isWrongPlayerForTurn
              }
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
