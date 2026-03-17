"use client";

import { useMemo } from "react";
import CombatSection from "./CombatSection";
import { anchorId } from "../demoUtils";
import { displayName } from "../hooks/useDemoRuntime";

type Props = {
  demo: any;
};

export default function GameplayCombatPanel({ demo }: Props) {
  const stagePartyMembers = useMemo(
    () =>
      demo.partyMembers.map((m: any, idx: number) => ({
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
      })),
    [demo.partyMembers]
  );

  const actionPartyMembers = useMemo(
    () =>
      demo.partyMembers.map((m: any, idx: number) => ({
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
    [demo.partyMembers]
  );

  return (
    <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
      <CombatSection
        events={demo.state.events as any[]}
        dmMode={demo.dmMode}
        onAppendCanon={demo.appendCanon}
        openingCombatRound={demo.openingCombatRound}
        canAttemptCombatRetreat={demo.canAttemptCombatRetreat}
        openingBattleFinisherAvailable={demo.openingBattleFinisherAvailable}
        openingBattleFinisherSkillLabel={demo.openingBattleFinisherSkillLabel}
        isOpeningThresholdCombat={demo.isOpeningThresholdCombat}
        partyMembers={stagePartyMembers}
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
          partyMembers: actionPartyMembers,
          actingPlayerId: demo.actingPlayerId,
          onSetActingPlayerId: (id: string) => demo.setActingPlayerId(id),
          playerInput: demo.playerInput,
          onSetPlayerInput: (v: string) => demo.setPlayerInput(v),
          canSubmit: demo.canCombatPlayerSubmitIntent,
          onSubmit: demo.handleCombatPlayerAction,
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
  );
}
