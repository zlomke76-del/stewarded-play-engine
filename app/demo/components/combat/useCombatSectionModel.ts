"use client";

import { useMemo } from "react";
import type {
  CombatSectionModel,
  CombatSectionProps,
} from "./combatSectionTypes";
import {
  deriveEnemyHpFromCanon,
  deriveEnemyRoster,
  derivePlayerHpFromCanon,
  getResolvedClass,
  getResolvedSpecies,
  nameKey,
  portraitSrcFor,
  renderPressureTone,
  renderTurnTone,
} from "./combatSectionUtils";

export function useCombatSectionModel(
  props: Pick<
    CombatSectionProps,
    | "events"
    | "partyMembers"
    | "derivedCombat"
    | "activeCombatantSpec"
    | "combatEnded"
    | "isEnemyTurn"
    | "isWrongPlayerForTurn"
    | "pressureTier"
    | "enemyTelegraphHint"
    | "activeEnemyGroupId"
    | "activeEnemyGroupName"
    | "encounterContext"
  >
): CombatSectionModel {
  const {
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
  } = props;

  const combatId = derivedCombat?.combatId ?? null;

  const playerHpById = useMemo(
    () => derivePlayerHpFromCanon({ events, combatId, partyMembers }),
    [events, combatId, partyMembers]
  );

  const enemyHpById = useMemo(
    () => deriveEnemyHpFromCanon({ events, combatId, derivedCombat }),
    [events, combatId, derivedCombat]
  );

  const partyMembersForDisplay = useMemo(() => {
    return partyMembers.map((m) => {
      const hp = playerHpById[String(m.id)];
      if (!hp) return m;
      return { ...m, hpMax: hp.hpMax, hpCurrent: hp.hpCurrent };
    });
  }, [partyMembers, playerHpById]);

  const activePlayerId = useMemo(() => {
    if (!activeCombatantSpec) return null;
    if (String(activeCombatantSpec?.kind ?? "") !== "player") return null;
    const id = String(activeCombatantSpec?.id ?? "").trim();
    return id || null;
  }, [activeCombatantSpec]);

  const telegraphTargetKey = useMemo(() => {
    const targetName = enemyTelegraphHint?.targetName ? nameKey(enemyTelegraphHint.targetName) : "";
    return targetName || null;
  }, [enemyTelegraphHint?.targetName]);

  const enemyRoster = useMemo(
    () =>
      deriveEnemyRoster({
        derivedCombat,
        enemyHpById,
        encounterContext,
      }),
    [derivedCombat, enemyHpById, encounterContext]
  );

  const activeEnemyCard = useMemo(() => {
    if (activeEnemyGroupId) {
      const byId = enemyRoster.find((e) => e.combatantId === activeEnemyGroupId);
      if (byId) return byId;
    }

    if (activeEnemyGroupName) {
      const byName = enemyRoster.find(
        (e) => nameKey(e.enemyName) === nameKey(activeEnemyGroupName)
      );
      if (byName) return byName;
    }

    return enemyRoster.find((e) => !e.defeated) ?? enemyRoster[0] ?? null;
  }, [enemyRoster, activeEnemyGroupId, activeEnemyGroupName]);

  const turnTone = useMemo(
    () =>
      renderTurnTone({
        combatEnded,
        isEnemyTurn,
        isWrongPlayerForTurn,
      }),
    [combatEnded, isEnemyTurn, isWrongPlayerForTurn]
  );

  const pressureTone = useMemo(() => renderPressureTone(pressureTier), [pressureTier]);

  const stageHero = useMemo(() => {
    const preferred =
      (activePlayerId
        ? partyMembersForDisplay.find((m) => String(m.id) === String(activePlayerId))
        : null) ??
      partyMembersForDisplay[0] ??
      null;

    if (!preferred) return null;

    const hpState = playerHpById[String(preferred.id)];
    const downed = hpState ? hpState.downed : (Number(preferred.hpCurrent) || 0) <= 0;
    const src = portraitSrcFor(preferred);

    return {
      name: preferred.name || "Hero",
      species: getResolvedSpecies(preferred),
      className: getResolvedClass(preferred),
      portrait: preferred.portrait,
      imageSrc: src,
      fallbackImageSrc: src,
      modelSrc: null,
      hpCurrent: hpState?.hpCurrent ?? preferred.hpCurrent,
      hpMax: hpState?.hpMax ?? preferred.hpMax,
      ac: preferred.ac,
      defeated: downed,
      active: !combatEnded && !isEnemyTurn,
    };
  }, [partyMembersForDisplay, activePlayerId, playerHpById, combatEnded, isEnemyTurn]);

  const stageEnemy = useMemo(() => {
    if (!activeEnemyCard) return null;

    return {
      name: activeEnemyCard.label,
      className: activeEnemyCard.roleLabel,
      imageSrc: activeEnemyCard.portraitSrc,
      fallbackImageSrc: activeEnemyCard.portraitSrc,
      modelSrc: null,
      hpCurrent: activeEnemyCard.hpCurrent,
      hpMax: activeEnemyCard.hpMax,
      ac: activeEnemyCard.ac,
      defeated: activeEnemyCard.defeated,
      active: !combatEnded && isEnemyTurn && activeEnemyCard.isActive,
    };
  }, [activeEnemyCard, combatEnded, isEnemyTurn]);

  return {
    combatId,
    playerHpById,
    enemyHpById,
    partyMembersForDisplay,
    activePlayerId,
    telegraphTargetKey,
    enemyRoster,
    activeEnemyCard,
    turnTone,
    pressureTone,
    stageHero,
    stageEnemy,
  };
}
