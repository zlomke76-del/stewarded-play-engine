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
                  <div className="muted">{roll ? `Init ${roll.total} (d20 ${roll.natural} + ${roll.modifier})` : "Init —"}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onAdvanceTurnBtn} disabled={!derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn)}>
              Advance Turn
            </button>

            <button onClick={onPassTurnBtn} disabled={!derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn) || isWrongPlayerForTurn}>
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
