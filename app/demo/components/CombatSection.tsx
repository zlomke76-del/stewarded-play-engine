"use client";

import React, { useEffect, useRef, useState } from "react";
import CombatMainShell from "./combat/CombatMainShell";
import CombatAdjudicationPanel from "./combat/CombatAdjudicationPanel";
import CombatSupportingSystems from "./combat/CombatSupportingSystems";
import { useCombatSectionModel } from "./combat/useCombatSectionModel";
import {
  computeDeterministicDamage,
  inferDamageStyleFromPayload,
  nameKey,
  playSfx,
} from "./combat/combatSectionUtils";
import type { CombatSectionProps } from "./combat/combatSectionTypes";

const SFX = {
  uiClick: "/assets/audio/sfx_button_click_01.mp3",
  combatHit: "/assets/audio/sfx_sword_hit_01.mp3",
  enemyDeath: "/assets/audio/sfx_monster_dying_01.mp3",
  enemyTelegraph: "/assets/audio/sfx_goblin_attack_01.mp3",
  combatAdvance: "/assets/audio/sfx_button_click_01.mp3",
} as const;

export default function CombatSection(props: CombatSectionProps) {
  const {
    events,
    dmMode,
    onAppendCanon,
    openingCombatRound,
    canAttemptCombatRetreat,
    openingBattleFinisherAvailable,
    openingBattleFinisherSkillLabel,
    isOpeningThresholdCombat,
    partyMembers,
    pressureTier,
    allowDevControls,
    encounterContext = null,
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
    actionSurface,
  } = props;

  const model = useCombatSectionModel({
    events,
    partyMembers,
    derivedCombat,
    activeCombatantSpec,
    combatEnded,
    isEnemyTurn,
    isWrongPlayerForTurn,
    pressureTier,
    enemyTelegraphHint,
    activeEnemyGroupId,
    activeEnemyGroupName,
    encounterContext,
  });

  const prevTelegraphKeyRef = useRef<string>("");
  const [showInspector, setShowInspector] = useState(false);
  const [showSupportingSystems, setShowSupportingSystems] = useState(false);
  const [showAdjudication, setShowAdjudication] = useState(false);

  useEffect(() => {
    const key = enemyTelegraphHint
      ? `${enemyTelegraphHint.enemyName}|${enemyTelegraphHint.targetName}|${enemyTelegraphHint.attackStyleHint}`
      : "";

    if (!key) {
      prevTelegraphKeyRef.current = "";
      return;
    }

    if (prevTelegraphKeyRef.current && prevTelegraphKeyRef.current !== key) {
      playSfx(SFX.enemyTelegraph, 0.42);
    }

    if (!prevTelegraphKeyRef.current) {
      prevTelegraphKeyRef.current = key;
      return;
    }

    prevTelegraphKeyRef.current = key;
  }, [enemyTelegraphHint]);

  function chooseTargetCombatantId(): string | null {
    const hintedName = enemyTelegraphHint?.targetName
      ? nameKey(enemyTelegraphHint.targetName)
      : "";
    const living = model.partyMembersForDisplay.filter((m) => (Number(m.hpCurrent) || 0) > 0);

    if (hintedName) {
      const byName = living.find((m) => nameKey(m.name) === hintedName);
      if (byName) return String(byName.id);

      const byContains = living.find(
        (m) => nameKey(m.name).includes(hintedName) || hintedName.includes(nameKey(m.name))
      );
      if (byContains) return String(byContains.id);
    }

    if (living.length > 0) return String(living[0].id);
    return model.partyMembersForDisplay.length > 0
      ? String(model.partyMembersForDisplay[0].id)
      : null;
  }

  function handleEnemyCommitOutcomeAndDamage(payload: any) {
    onCommitOutcomeOnly(payload);

    if (!model.combatId) return;

    const rollValue = Math.trunc(Number(payload?.dice?.roll ?? 0));
    const dcValue = Math.trunc(Number(payload?.dice?.dc ?? 0));
    const hit =
      Number.isFinite(rollValue) && Number.isFinite(dcValue) ? rollValue >= dcValue : false;
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

    const amount = computeDeterministicDamage({ roll: rollValue, dc: dcValue, style });

    onAppendCanon("COMBATANT_DAMAGED", {
      combatId: model.combatId,
      sourceCombatantId: String(activeEnemyGroupId ?? activeEnemyGroupName ?? "enemy"),
      targetCombatantId,
      amount,
      kind: style,
    });

    playSfx(SFX.combatHit, 0.74);

    const before = model.playerHpById[targetCombatantId];
    const beforeCur =
      before?.hpCurrent ??
      Math.max(
        0,
        Number(
          model.partyMembersForDisplay.find((m) => String(m.id) === targetCombatantId)?.hpCurrent
        ) || 0
      );

    const afterCur = Math.max(0, (Number(beforeCur) || 0) - amount);

    if (afterCur <= 0) {
      onAppendCanon("COMBATANT_DOWNED", {
        combatId: model.combatId,
        combatantId: targetCombatantId,
        reason: "hp_zero",
      });
      playSfx(SFX.enemyDeath, 0.76);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        width: "100%",
        minWidth: 0,
        alignContent: "start",
        justifyItems: "stretch",
      }}
    >
      <CombatMainShell
        stageHero={model.stageHero}
        stageEnemy={model.stageEnemy}
        isEnemyTurn={isEnemyTurn}
        combatEnded={combatEnded}
        enemyTelegraphHint={
          enemyTelegraphHint
            ? {
                attackStyleHint: enemyTelegraphHint.attackStyleHint,
                targetName: enemyTelegraphHint.targetName,
              }
            : null
        }
        turnTone={model.turnTone}
        pressureTone={model.pressureTone}
        pressureTier={pressureTier}
        openingCombatRound={openingCombatRound}
        canAttemptCombatRetreat={canAttemptCombatRetreat}
        openingBattleFinisherAvailable={openingBattleFinisherAvailable}
        openingBattleFinisherSkillLabel={openingBattleFinisherSkillLabel}
        isOpeningThresholdCombat={isOpeningThresholdCombat}
        actionSurface={actionSurface}
        dmMode={dmMode}
        activeCombatantSpec={activeCombatantSpec}
        isWrongPlayerForTurn={isWrongPlayerForTurn}
        derivedCombat={derivedCombat}
        onAdvanceTurnBtn={onAdvanceTurnBtn}
        onPassTurnBtn={onPassTurnBtn}
        onEndCombatBtn={onEndCombatBtn}
        onPlayAdvanceSfx={() => playSfx(SFX.combatAdvance, 0.64)}
        onPlayUiSfx={() => playSfx(SFX.uiClick, 0.64)}
      />

      {showAdjudication ? (
        <CombatAdjudicationPanel actionSurface={actionSurface} uiClickSfxSrc={SFX.uiClick} />
      ) : null}

      <CombatSupportingSystems
        showSupportingSystems={showSupportingSystems}
        showInspector={showInspector}
        onToggleSupportingSystems={() => setShowSupportingSystems((prev) => !prev)}
        onToggleInspector={() => setShowInspector((prev) => !prev)}
        allowDevControls={allowDevControls}
        events={events}
        onAppendCanon={onAppendCanon}
        dmMode={dmMode}
        partyMembers={partyMembers}
        pressureTier={pressureTier}
        encounterContext={encounterContext}
        partyMembersForDisplay={model.partyMembersForDisplay}
        playerHpById={model.playerHpById}
        enemyHpById={model.enemyHpById}
        activePlayerId={model.activePlayerId}
        telegraphTargetKey={model.telegraphTargetKey}
        enemyRoster={model.enemyRoster}
        showEnemyResolver={showEnemyResolver}
        activeEnemyGroupName={activeEnemyGroupName}
        activeEnemyGroupId={activeEnemyGroupId}
        playerNames={playerNames}
        onTelegraph={onTelegraph}
        onCommitOutcome={handleEnemyCommitOutcomeAndDamage}
        onAdvanceTurn={onAdvanceTurn}
        enemyTelegraphHint={enemyTelegraphHint}
        derivedCombat={derivedCombat}
        activeCombatantSpec={activeCombatantSpec}
        isEnemyTurn={isEnemyTurn}
        enemyTelegraphSfxSrc={SFX.enemyTelegraph}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setShowAdjudication((prev) => !prev)}
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: showAdjudication
              ? "linear-gradient(180deg, rgba(214,188,120,0.14), rgba(214,188,120,0.06))"
              : "rgba(255,255,255,0.05)",
            color: "rgba(236,239,244,0.94)",
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {showAdjudication ? "Hide Adjudication" : "Show Adjudication"}
        </button>
      </div>
    </div>
  );
}
