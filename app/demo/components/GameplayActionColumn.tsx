"use client";

import CardSection from "@/components/layout/CardSection";
import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import NextActionHint from "@/components/NextActionHint";
import ActionSection from "./ActionSection";
import { anchorId, inferOptionKind, scrollToSection } from "../demoUtils";
import { displayName } from "../hooks/useDemoRuntime";

type Props = {
  demo: any;
};

export default function GameplayActionColumn({ demo }: Props) {
  return (
    <>
      {demo.gameplayAllowsAction && (
        <div id={anchorId("action")} style={{ scrollMarginTop: 90 }}>
          <ActionSection
            partyMembers={
              demo.partyMembers.length
                ? demo.partyMembers.map((m: any, idx: number) => ({
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
                  }))
                : []
            }
            actingPlayerId={demo.actingPlayerId}
            onSetActingPlayerId={(id) => demo.setActingPlayerId(id)}
            playerInput={demo.playerInput}
            onSetPlayerInput={(v) => demo.setPlayerInput(v)}
            canSubmit={demo.canPlayerSubmitIntent}
            onSubmit={demo.handlePlayerAction}
            combatActive={demo.combatActive}
            passDisabled={(demo.dmMode === "solace-neutral" && demo.isEnemyTurn) || demo.isWrongPlayerForTurn}
            onPassTurn={demo.passTurn}
            dmMode={demo.dmMode}
            isEnemyTurn={demo.isEnemyTurn}
            isWrongPlayerForTurn={demo.isWrongPlayerForTurn}
            activeTurnLabel={demo.activeTurnLabel}
            showPartyButtons={demo.dmMode === "human" && !demo.partyLocked && !!demo.partyDraft}
            onCommitParty={demo.commitParty}
            onRandomNames={demo.randomizePartyNames}
            commitDisabled={demo.partyLocked}
          />
        </div>
      )}

      {demo.gameplayAllowsAction && demo.parsed && (
        <CardSection title="Parsed Action">
          <pre>{JSON.stringify(demo.parsed, null, 2)}</pre>
        </CardSection>
      )}

      {demo.gameplayAllowsAction && demo.options && demo.dmMode === "human" && (
        <CardSection title="Options">
          <ul>
            {demo.options.map((opt: any) => (
              <li key={opt.id}>
                <button
                  onClick={() => {
                    demo.setSelectedOption(opt);
                    demo.setActiveSection("resolution");
                    queueMicrotask(() => scrollToSection("resolution"));
                  }}
                >
                  {opt.description}
                </button>
              </li>
            ))}
          </ul>
        </CardSection>
      )}

      {demo.gameplayAllowsAction && (
        <div id={anchorId("resolution")} style={{ scrollMarginTop: 90 }}>
          {demo.selectedOption && (
            <ResolutionDraftAdvisoryPanel
              context={{
                optionDescription: demo.selectedOption.description,
                optionKind: inferOptionKind(`${demo.playerInput}\n${demo.selectedOption.description}`.trim()),
              }}
              role={demo.role}
              dmMode={demo.resolutionDmMode}
              setupText={`${demo.playerInput}\n\nCurrent Room: ${demo.currentRoomTitle}\n\n${demo.roomSummary}`}
              movement={demo.resolutionMovement}
              combat={demo.resolutionCombat}
              rollModifier={demo.actingRollModifier}
              rollModifierLabel={
                demo.actingPlayerInjuryStacks > 0
                  ? `Injury stacks: ${demo.actingPlayerInjuryStacks}`
                  : null
              }
              onRecord={demo.handleRecord}
            />
          )}
        </div>
      )}

      {demo.gameplayAllowsAction && <NextActionHint state={demo.state} />}

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", marginBottom: 12 }}>Chronicle</summary>
        <div id={anchorId("canon")} style={{ scrollMarginTop: 90 }}>
          <demo.CanonChronicleSection events={demo.state.events as any[]} />
        </div>
      </details>

      {demo.gameplayAllowsAction && (
        <div id={anchorId("ledger")} style={{ height: 1, scrollMarginTop: 90 }} />
      )}
    </>
  );
}
