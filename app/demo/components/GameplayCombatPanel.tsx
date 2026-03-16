"use client";

import CombatSection from "./CombatSection";
import { anchorId } from "../demoUtils";
import { displayName } from "../hooks/useDemoRuntime";

type Props = {
  demo: any;
};

function CombatStatusStrip(props: { demo: any }) {
  const { demo } = props;

  const pressureTier = String(demo.pressureTier ?? "stable");
  const encounterName =
    demo.activeEnemyOverlayName ??
    demo.combatEncounterContext?.encounterName ??
    demo.combatEncounterContext?.theme ??
    "Unknown Hostiles";

  const turnLabel = demo.isEnemyTurn
    ? "Enemy Turn"
    : demo.isWrongPlayerForTurn
      ? "Turn Locked"
      : "Player Turn";

  const turnTone = demo.isEnemyTurn
    ? {
        border: "rgba(214, 110, 110, 0.28)",
        bg: "rgba(214, 110, 110, 0.10)",
        text: "rgba(255, 214, 214, 0.95)",
      }
    : demo.isWrongPlayerForTurn
      ? {
          border: "rgba(180, 180, 180, 0.20)",
          bg: "rgba(255,255,255,0.05)",
          text: "rgba(235, 235, 235, 0.90)",
        }
      : {
          border: "rgba(214, 188, 120, 0.28)",
          bg: "rgba(214, 188, 120, 0.10)",
          text: "rgba(245, 236, 216, 0.96)",
        };

  const pressureTone =
    pressureTier === "high" || pressureTier === "severe"
      ? {
          border: "rgba(214, 110, 110, 0.24)",
          bg: "rgba(214, 110, 110, 0.08)",
        }
      : pressureTier === "elevated"
        ? {
            border: "rgba(214, 188, 120, 0.24)",
            bg: "rgba(214, 188, 120, 0.08)",
          }
        : {
            border: "rgba(120, 160, 214, 0.22)",
            bg: "rgba(120, 160, 214, 0.08)",
          };

  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        padding: "14px 14px 12px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 5 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              opacity: 0.58,
            }}
          >
            Battlefield
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              lineHeight: 1.1,
              color: "rgba(245,236,216,0.97)",
            }}
          >
            {encounterName}
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              color: "rgba(228,232,240,0.78)",
              maxWidth: 760,
            }}
          >
            Combat is now the dominant surface. Read the battlefield, track initiative,
            and keep command and consequence close together.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
            {turnLabel}
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

          {demo.combatEnded ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(118, 188, 132, 0.24)",
                background: "rgba(118,188,132,0.08)",
                color: "rgba(202, 240, 210, 0.95)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Combat Ended
            </span>
          ) : null}
        </div>
      </div>

      {Array.isArray(demo.partyMembers) && demo.partyMembers.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {demo.partyMembers.map((m: any, idx: number) => {
            const name = displayName(m, idx + 1);
            const hpCurrent = m.hpCurrent ?? 0;
            const hpMax = m.hpMax ?? 0;

            return (
              <div
                key={m.id ?? `${name}-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 12,
                  lineHeight: 1,
                  color: "rgba(236,239,244,0.92)",
                }}
              >
                <strong style={{ fontWeight: 800 }}>{name}</strong>
                <span style={{ opacity: 0.62 }}>HP</span>
                <span style={{ fontWeight: 700 }}>
                  {hpCurrent}/{hpMax}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function GameplayCombatPanel({ demo }: Props) {
  return (
    <div id={anchorId("combat")} style={{ scrollMarginTop: 90, display: "grid", gap: 14 }}>
      <CombatStatusStrip demo={demo} />

      <div
        style={{
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(16,18,28,0.92), rgba(10,12,20,0.90))",
          boxShadow:
            "0 22px 56px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Combat Surface
          </div>

          <div
            style={{
              fontSize: 12,
              color: "rgba(230,233,239,0.72)",
              lineHeight: 1.5,
            }}
          >
            Keep the battlefield visible. Keep command nearby. Reduce everything else.
          </div>
        </div>

        <div style={{ padding: 14 }}>
          <CombatSection
            events={demo.state.events as any[]}
            dmMode={demo.dmMode}
            onAppendCanon={demo.appendCanon}
            openingCombatRound={demo.openingCombatRound}
            canAttemptCombatRetreat={demo.canAttemptCombatRetreat}
            openingBattleFinisherAvailable={demo.openingBattleFinisherAvailable}
            openingBattleFinisherSkillLabel={demo.openingBattleFinisherSkillLabel}
            isOpeningThresholdCombat={demo.isOpeningThresholdCombat}
            partyMembers={demo.partyMembers.map((m: any, idx: number) => ({
              id: String(m.id),
              name: displayName(m, idx + 1),
              species: m.species,
              className: m.className,
              portrait: m.portrait ?? "Male",
              skills: m.skills ?? [],
              traits: m.traits ?? [],
              ac: m.ac,
              hpMax: m.hpMax,
              hpCurrent: m.hpCurrent,
              initiativeMod: m.initiativeMod,
            }))}
            pressureTier={demo.pressureTier}
            allowDevControls={false}
            encounterContext={demo.combatEncounterContext}
            showEnemyResolver={demo.solaceNeutralEnemyTurnEnabled}
            activeEnemyGroupName={demo.activeEnemyOverlayName}
            activeEnemyGroupId={demo.activeEnemyOverlayId}
            playerNames={demo.effectivePlayerNames}
            onTelegraph={(info: any) => {
              demo.setEnemyTelegraphHint(info);
            }}
            onCommitOutcomeOnly={(payload: any) => demo.handleRecordOutcomeOnly(payload)}
            onAdvanceTurn={() => demo.advanceTurn()}
            enemyTelegraphHint={demo.enemyTelegraphHint}
            derivedCombat={demo.derivedCombat as any}
            activeCombatantSpec={demo.activeCombatantSpec}
            combatEnded={demo.combatEnded}
            isEnemyTurn={demo.isEnemyTurn}
            isWrongPlayerForTurn={demo.isWrongPlayerForTurn}
            onAdvanceTurnBtn={() => demo.advanceTurn()}
            onPassTurnBtn={() => demo.passTurn()}
            onEndCombatBtn={() => demo.endCombat()}
            actionSurface={{
              partyMembers: demo.partyMembers.map((m: any, idx: number) => ({
                id: String(m.id),
                label: `${displayName(m, idx + 1)} (${m.id})`,
                species: m.species ?? "Human",
                className: m.className || "Warrior",
                portrait: m.portrait ?? "Male",
                skills: m.skills ?? [],
                traits: m.traits ?? [],
                ac: m.ac,
                hpMax: m.hpMax,
                hpCurrent: m.hpCurrent,
                initiativeMod: m.initiativeMod,
              })),
              actingPlayerId: demo.actingPlayerId,
              onSetActingPlayerId: (id: string) => demo.setActingPlayerId(id),
              playerInput: demo.playerInput,
              onSetPlayerInput: (v: string) => demo.setPlayerInput(v),
              canSubmit: demo.canPlayerSubmitIntent,
              onSubmit: demo.handlePlayerAction,
              onPassTurn: demo.passTurn,
              onRecord: demo.handleRecord,
              options: demo.options,
              selectedOption: demo.selectedOption,
              onSetSelectedOption: demo.setSelectedOption,
              dmMode: demo.dmMode,
              role: demo.role,
              resolutionDmMode: demo.resolutionDmMode,
              currentRoomTitle: demo.currentRoomTitle,
              roomSummary: demo.roomSummary,
              resolutionMovement: demo.resolutionMovement,
              resolutionCombat: demo.resolutionCombat,
              actingRollModifier: demo.actingRollModifier,
              actingPlayerInjuryStacks: demo.actingPlayerInjuryStacks,
              title: "Combat Command",
              eyebrow: "Command",
              description: "Describe what your character actually does in this fight.",
              inputPlaceholder:
                "Describe your move in full: where you move, who you target, what you attempt, and why.",
            }}
          />
        </div>
      </div>
    </div>
  );
}
