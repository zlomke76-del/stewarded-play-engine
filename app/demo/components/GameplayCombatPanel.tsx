"use client";

import CombatSection from "./CombatSection";
import { anchorId } from "../demoUtils";
import { displayName } from "../hooks/useDemoRuntime";

type Props = {
  demo: any;
};

export default function GameplayCombatPanel({ demo }: Props) {
  return (
    <details open={demo.combatActive} style={{ marginTop: 16 }}>
      <summary style={{ cursor: "pointer", marginBottom: 12 }}>Combat</summary>
      <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
        <CombatSection
          events={demo.state.events as any[]}
          dmMode={demo.dmMode}
          onAppendCanon={demo.appendCanon}
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
        />
      </div>
    </details>
  );
}
