"use client";

import React from "react";
import CombatStage from "../CombatStage";
import ActionSection from "../ActionSection";
import { fmtHp } from "./combatSectionUtils";
import type {
  ActionSurfaceProps,
  StageCombatantView,
  TurnTone,
  PressureTone,
} from "./combatSectionTypes";

function chipStyle(
  tone: "neutral" | "info" | "warn" | "accent" = "neutral"
): React.CSSProperties {
  if (tone === "info") {
    return {
      border: "1px solid rgba(138,180,255,0.22)",
      background: "rgba(138,180,255,0.08)",
    };
  }

  if (tone === "warn") {
    return {
      border: "1px solid rgba(255,200,140,0.22)",
      background: "rgba(255,200,140,0.08)",
    };
  }

  if (tone === "accent") {
    return {
      border: "1px solid rgba(180,220,160,0.22)",
      background: "rgba(180,220,160,0.08)",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  };
}

function actionButtonStyle(
  tone: "primary" | "secondary" | "warn" = "secondary"
): React.CSSProperties {
  if (tone === "primary") {
    return {
      border: "1px solid rgba(214,188,120,0.28)",
      background:
        "linear-gradient(180deg, rgba(214,188,120,0.14), rgba(214,188,120,0.06))",
      color: "rgba(245,236,216,0.98)",
    };
  }

  if (tone === "warn") {
    return {
      border: "1px solid rgba(214,110,110,0.28)",
      background:
        "linear-gradient(180deg, rgba(214,110,110,0.14), rgba(214,110,110,0.06))",
      color: "rgba(255,224,224,0.96)",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(236,239,244,0.94)",
  };
}

function InfoPill(props: {
  label: string;
  tone?: "neutral" | "info" | "warn" | "accent";
}) {
  return (
    <span
      style={{
        ...chipStyle(props.tone ?? "neutral"),
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 11,
        lineHeight: 1,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {props.label}
    </span>
  );
}

function OpeningCombatPrompt(props: {
  round?: number;
  canRetreat?: boolean;
  finisherAvailable?: boolean;
  finisherSkill?: string | null;
  isOpeningThresholdCombat?: boolean;
}) {
  const { round, canRetreat, finisherAvailable, finisherSkill, isOpeningThresholdCombat } = props;

  if (!isOpeningThresholdCombat) return null;
  if (!canRetreat && !finisherAvailable) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.20))",
        width: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          opacity: 0.62,
        }}
      >
        Opening Battle{round ? ` · Round ${round}` : ""}
      </div>

      {canRetreat ? (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(232,236,244,0.88)",
          }}
        >
          You can now attempt to <strong>evade</strong>, <strong>withdraw</strong>, or{" "}
          <strong>break away</strong>.
        </div>
      ) : null}

      {finisherAvailable ? (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(255,215,168,0.96)",
            fontWeight: 700,
          }}
        >
          The enemy is exposed. A decisive <strong>{finisherSkill ?? "class skill"}</strong>{" "}
          could end the fight — but your weapon may not survive the strike.
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  stageHero: StageCombatantView | null;
  stageEnemy: StageCombatantView | null;
  isEnemyTurn: boolean;
  combatEnded: boolean;
  enemyTelegraphHint: {
    attackStyleHint: "volley" | "beam" | "charge" | "unknown";
    targetName: string;
  } | null;
  turnTone: TurnTone;
  pressureTone: PressureTone;
  pressureTier: "low" | "medium" | "high";
  openingCombatRound?: number;
  canAttemptCombatRetreat?: boolean;
  openingBattleFinisherAvailable?: boolean;
  openingBattleFinisherSkillLabel?: string | null;
  isOpeningThresholdCombat?: boolean;
  actionSurface: ActionSurfaceProps;
  dmMode: "human" | "solace-neutral" | null;
  activeCombatantSpec: any | null;
  isWrongPlayerForTurn: boolean;
  derivedCombat: any | null;
  onAdvanceTurnBtn: () => void;
  onPassTurnBtn: () => void;
  onEndCombatBtn: () => void;
  onPlayAdvanceSfx: () => void;
  onPlayUiSfx: () => void;
};

export default function CombatMainShell(props: Props) {
  const {
    stageHero,
    stageEnemy,
    isEnemyTurn,
    combatEnded,
    enemyTelegraphHint,
    turnTone,
    pressureTone,
    pressureTier,
    openingCombatRound,
    canAttemptCombatRetreat,
    openingBattleFinisherAvailable,
    openingBattleFinisherSkillLabel,
    isOpeningThresholdCombat,
    actionSurface,
    dmMode,
    activeCombatantSpec,
    isWrongPlayerForTurn,
    derivedCombat,
    onAdvanceTurnBtn,
    onPassTurnBtn,
    onEndCombatBtn,
    onPlayAdvanceSfx,
    onPlayUiSfx,
  } = props;

  const shellStyle: React.CSSProperties = {
    display: "grid",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    border: "1px solid rgba(214,188,120,0.14)",
    background:
      "linear-gradient(180deg, rgba(16,18,28,0.94), rgba(10,12,20,0.92))",
    boxShadow:
      "0 24px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
    width: "100%",
    minWidth: 0,
    alignContent: "start",
  };

  return (
    <div style={shellStyle}>
      <div
        style={{
          width: "100%",
          minWidth: 0,
          minHeight: 320,
          height: "clamp(320px, 48vh, 460px)",
          maxHeight: "48vh",
        }}
      >
        <CombatStage
          hero={stageHero}
          enemy={stageEnemy}
          battlefieldImageSrc={null}
          isEnemyTurn={isEnemyTurn}
          combatEnded={combatEnded}
          telegraphHint={enemyTelegraphHint}
          height={400}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          width: "100%",
          minWidth: 0,
          padding: "10px 12px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${turnTone.border}`,
            background: turnTone.bg,
            color: turnTone.text,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {turnTone.label}
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${pressureTone.border}`,
            background: pressureTone.bg,
            color: "rgba(235,238,244,0.92)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Pressure · {pressureTier}
        </span>

        {stageHero ? (
          <InfoPill
            label={`${stageHero.name} HP ${fmtHp(stageHero.hpCurrent ?? 0, stageHero.hpMax ?? 1)}`}
            tone="info"
          />
        ) : null}

        {stageEnemy ? (
          <InfoPill
            label={`${stageEnemy.name} HP ${fmtHp(stageEnemy.hpCurrent ?? 0, stageEnemy.hpMax ?? 1)}`}
            tone="accent"
          />
        ) : null}
      </div>

      <OpeningCombatPrompt
        round={openingCombatRound}
        canRetreat={canAttemptCombatRetreat}
        finisherAvailable={openingBattleFinisherAvailable}
        finisherSkill={openingBattleFinisherSkillLabel}
        isOpeningThresholdCombat={isOpeningThresholdCombat}
      />

      <div style={{ width: "100%", minWidth: 0 }}>
        <ActionSection
          partyMembers={actionSurface.partyMembers}
          actingPlayerId={actionSurface.actingPlayerId}
          onSetActingPlayerId={actionSurface.onSetActingPlayerId}
          playerInput={actionSurface.playerInput}
          onSetPlayerInput={actionSurface.onSetPlayerInput}
          canSubmit={actionSurface.canSubmit}
          onSubmit={actionSurface.onSubmit}
          combatActive={true}
          passDisabled={(dmMode === "solace-neutral" && isEnemyTurn) || isWrongPlayerForTurn}
          onPassTurn={actionSurface.onPassTurn}
          dmMode={actionSurface.dmMode}
          isEnemyTurn={isEnemyTurn}
          isWrongPlayerForTurn={isWrongPlayerForTurn}
          activeTurnLabel={
            String(activeCombatantSpec?.name ?? activeCombatantSpec?.id ?? "") || null
          }
          showPartyButtons={false}
          commitDisabled
          title={actionSurface.title ?? "Combat Command"}
          eyebrow={actionSurface.eyebrow ?? "Command"}
          description={
            actionSurface.description ??
            "Describe what your character actually does. This command is the move."
          }
          inputPlaceholder={
            actionSurface.inputPlaceholder ??
            "Describe your move in full: target, movement, tactic, and intent..."
          }
          showTurnCards
          showLoadoutDetails
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          width: "100%",
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: "rgba(228,232,240,0.74)",
          }}
        >
          Turn flow controls stay here. Adjudication and support systems stay below.
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (!derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn)) {
                return;
              }
              onPlayAdvanceSfx();
              onAdvanceTurnBtn();
            }}
            disabled={
              !derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn)
            }
            style={{
              ...actionButtonStyle("secondary"),
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Advance Turn
          </button>

          <button
            onClick={() => {
              if (
                !derivedCombat ||
                combatEnded ||
                (dmMode === "solace-neutral" && isEnemyTurn) ||
                isWrongPlayerForTurn
              ) {
                return;
              }
              onPlayUiSfx();
              onPassTurnBtn();
            }}
            disabled={
              !derivedCombat ||
              combatEnded ||
              (dmMode === "solace-neutral" && isEnemyTurn) ||
              isWrongPlayerForTurn
            }
            style={{
              ...actionButtonStyle("secondary"),
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            End My Turn
          </button>

          <button
            onClick={() => {
              if (!derivedCombat || combatEnded) return;
              onPlayUiSfx();
              onEndCombatBtn();
            }}
            disabled={!derivedCombat || combatEnded}
            style={{
              ...actionButtonStyle("warn"),
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            End Combat
          </button>
        </div>
      </div>
    </div>
  );
}
