"use client";

import CardSection from "@/components/layout/CardSection";
import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import NextActionHint from "@/components/NextActionHint";
import CombatSection from "./CombatSection";
import ActionSection from "./ActionSection";
import CanonChronicleSection from "./CanonChronicleSection";
import GameStateAdvisoryPanel from "./GameStateAdvisoryPanel";
import RoomTopologyPanel from "./RoomTopologyPanel";
import { anchorId, scrollToSection, inferOptionKind } from "../demoUtils";
import { displayName } from "../hooks/useDemoRuntime";

function RitualPromptRow(props: {
  title: string;
  body: string;
  actionLabel: string;
  hint?: string;
  onActivate: () => void;
}) {
  const { title, body, actionLabel, hint, onActivate } = props;

  return (
    <CardSection title={title}>
      <div style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0, lineHeight: 1.65, opacity: 0.9 }}>{body}</p>

        <button
          type="button"
          onClick={onActivate}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px solid rgba(214, 188, 120, 0.22)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 28px rgba(0,0,0,0.22)",
            cursor: "pointer",
            transition:
              "border-color 160ms ease, background 160ms ease, transform 160ms ease, box-shadow 160ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(214, 188, 120, 0.38)";
            e.currentTarget.style.background =
              "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "inset 0 1px 0 rgba(255,255,255,0.07), 0 14px 34px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(214, 188, 120, 0.22)";
            e.currentTarget.style.background =
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 28px rgba(0,0,0,0.22)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Chapter Transition
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: "rgba(245,236,216,0.96)",
                }}
              >
                {actionLabel}
              </span>
            </div>

            <span
              aria-hidden
              style={{
                fontSize: 20,
                opacity: 0.62,
              }}
            >
              →
            </span>
          </div>
        </button>

        {hint ? (
          <div style={{ fontSize: 12, opacity: 0.68, lineHeight: 1.5 }}>{hint}</div>
        ) : null}
      </div>
    </CardSection>
  );
}

type Props = {
  demo: any;
};

export default function GameplayViewport({ demo }: Props) {
  return (
    <>
      {demo.gameplayFocusStep === "pressure" && (
        <RitualPromptRow
          title="The Air Tightens"
          body="The party has crossed the threshold. Read the danger state first, then survey the place itself before issuing the first command."
          actionLabel="Survey the chamber graph"
          hint="Danger first. Space second. Action third."
          onActivate={() => {
            demo.setGameplayFocusStep("map");
            demo.setActiveSection("map");
            queueMicrotask(() => scrollToSection("map"));
          }}
        />
      )}

      <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
        {demo.gameplayAllowsPressure && (
          <GameStateAdvisoryPanel
            currentRoomTitle={demo.currentRoomTitle}
            currentFloorLabel={demo.currentFloor.label}
            floorId={demo.location.floorId}
            roomId={demo.location.roomId}
            dungeonEvolution={demo.dungeonEvolution}
            roomSummary={demo.roomSummary}
          />
        )}
      </div>

      {demo.gameplayFocusStep === "map" && (
        <RitualPromptRow
          title="The Place Resolves"
          body="The dungeon is no longer a field of tiles. It is a set of places, routes, and thresholds. Read the room and its exits before acting."
          actionLabel="Let the first move take shape"
          hint="Rooms create decisions. Doors create tension. Stairs create commitment."
          onActivate={() => {
            demo.setGameplayFocusStep("action");
            demo.setActiveSection("action");
            queueMicrotask(() => scrollToSection("action"));
          }}
        />
      )}

      <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
        {demo.gameplayAllowsMap && (
          <RoomTopologyPanel
            currentRoomVisualKey={demo.currentRoomVisualKey}
            currentRoomTitle={demo.currentRoomTitle}
            roomImage={demo.roomImage}
            roomNarrative={demo.roomNarrative}
            roomFeatureNarrative={demo.roomFeatureNarrative}
            roomExitNarrative={demo.roomExitNarrative}
            roomConnectionsView={demo.roomConnectionsView}
            currentFeatures={demo.currentFeatures}
          />
        )}
      </div>

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
          <CanonChronicleSection events={demo.state.events as any[]} />
        </div>
      </details>

      {demo.gameplayAllowsAction && (
        <div id={anchorId("ledger")} style={{ height: 1, scrollMarginTop: 90 }} />
      )}
    </>
  );
}
