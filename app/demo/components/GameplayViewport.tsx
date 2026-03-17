"use client";

import { useEffect, useMemo, useState } from "react";

import GameStateAdvisoryPanel from "./GameStateAdvisoryPanel";
import RoomTopologyPanel from "./RoomTopologyPanel";
import GameplayActionColumn from "./GameplayActionColumn";
import CanonChronicleSection from "./CanonChronicleSection";
import GameplayHeaderSection from "./gameplay/GameplayHeaderSection";
import SceneFrame, {
  SceneAdvanceBar,
  StageTabs,
} from "./gameplay/ViewportSceneFrame";
import ChamberScene from "./gameplay/scenes/ChamberScene";
import PuzzleRoomPanel from "./gameplay/scenes/PuzzleRoomPanel";
import CombatScenePanel from "./gameplay/scenes/CombatScenePanel";
import { anchorId } from "../demoUtils";

type Props = {
  demo: any;
};

export default function GameplayViewport({ demo }: Props) {
  const [showChronicleEntry, setShowChronicleEntry] = useState(true);

  const hasPuzzleRoom = useMemo(() => {
    return !!(
      demo.activePuzzleBlock ??
      demo.activeRoomPuzzle ??
      demo.roomPuzzlePresentation
    );
  }, [demo.activePuzzleBlock, demo.activeRoomPuzzle, demo.roomPuzzlePresentation]);

  const activeScene = useMemo(() => {
    if (demo.combatActive) return "combat";
    if (hasPuzzleRoom && demo.gameplayFocusStep === "puzzle") return "puzzle";
    if (demo.gameplayFocusStep === "action") return "action";
    if (demo.gameplayFocusStep === "pressure") return "pressure";
    return "chamber";
  }, [demo.combatActive, demo.gameplayFocusStep, hasPuzzleRoom]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowChronicleEntry(false);
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const hero = useMemo(
    (): {
      name: string;
      species: string;
      className: string;
      portrait: "Male" | "Female";
      level: number;
      hpCurrent: number;
      hpMax: number;
      ac: number;
      initiativeMod: number;
      xpCurrent: number;
      xpToNextLevel: number;
      attackBonus: number;
      attributes: Record<
        | "strength"
        | "dexterity"
        | "constitution"
        | "intelligence"
        | "wisdom"
        | "charisma",
        number
      >;
      skills: Array<{
        id: string;
        label: string;
        value: number;
        attribute:
          | "strength"
          | "dexterity"
          | "constitution"
          | "intelligence"
          | "wisdom"
          | "charisma";
      }>;
      classFeatures: string[];
      weapon: {
        name: string;
        category: string;
        trait: string;
        damage: string;
      } | null;
      armor: {
        name: string;
        category: string;
        acBase: number;
      } | null;
    } => {
      const member = demo.partyMembers?.[0] ?? null;
      const fallbackName =
        demo.effectivePlayerNames?.[0] ??
        member?.name ??
        "The Lone Hero";

      const portrait: "Male" | "Female" =
        member?.portrait === "Female" ? "Female" : "Male";

      const heroSheet = demo.heroSheet ?? null;

      return {
        name: String(member?.name ?? fallbackName ?? "The Lone Hero"),
        species: String(member?.species ?? "Human"),
        className: String(member?.className ?? "Warrior"),
        portrait,
        level: Number(demo.progression?.hero?.level ?? 1),
        hpCurrent: Number(member?.hpCurrent ?? member?.hpMax ?? 0),
        hpMax: Number(member?.hpMax ?? 0),
        ac: Number(member?.ac ?? 0),
        initiativeMod: Number(member?.initiativeMod ?? 0),
        xpCurrent: Number(heroSheet?.xpCurrent ?? 0),
        xpToNextLevel: Number(heroSheet?.xpToNextLevel ?? 100),
        attackBonus: Number(heroSheet?.attackBonus ?? 0),
        attributes:
          heroSheet?.attributes ?? {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
          },
        skills: Array.isArray(heroSheet?.skills) ? heroSheet.skills : [],
        classFeatures: Array.isArray(heroSheet?.classFeatures)
          ? heroSheet.classFeatures
          : [],
        weapon: heroSheet?.weapon ?? null,
        armor: heroSheet?.armor ?? null,
      };
    },
    [
      demo.partyMembers,
      demo.effectivePlayerNames,
      demo.progression?.hero?.level,
      demo.heroSheet,
    ]
  );

  const shouldShowProgressionBanner = useMemo(() => {
    const summary = demo.progressionInspectorSummary ?? null;
    const progression = demo.progression ?? null;

    const activeSlots =
      summary?.party?.activeSlots ?? progression?.party?.activeSlots ?? 1;

    const inventoryUsed =
      summary?.inventory?.usedSlots ?? progression?.inventory?.usedSlots ?? 0;

    const bondedRelics = summary?.relics?.bondedCount ?? 0;

    const fallen =
      summary?.party?.fallenMembers ?? progression?.party?.fallenMembers ?? 0;

    const cryptCleared = Boolean(
      summary?.campaign?.cryptFullyCleared ??
        progression?.campaign?.cryptFullyCleared
    );

    const finalReady = Boolean(
      summary?.campaign?.finalDescentUnlocked ??
        progression?.campaign?.finalDescentUnlocked
    );

    return (
      activeSlots > 1 ||
      inventoryUsed > 0 ||
      bondedRelics > 0 ||
      fallen > 0 ||
      cryptCleared ||
      finalReady
    );
  }, [demo.progressionInspectorSummary, demo.progression]);

  function setPressureScene() {
    demo.setGameplayFocusStep("pressure");
    demo.setActiveSection("pressure");
  }

  function setChamberScene() {
    demo.setGameplayFocusStep("map");
    demo.setActiveSection("map");
  }

  function setPuzzleScene() {
    demo.setGameplayFocusStep("puzzle");
    demo.setActiveSection("puzzle");
  }

  function setActionScene() {
    demo.setGameplayFocusStep("action");
    demo.setActiveSection("action");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        alignSelf: "stretch",
        gap: 14,
        position: "relative",
      }}
    >
      {showChronicleEntry ? (
        <div
          style={{
            position: "sticky",
            top: 16,
            zIndex: 20,
            pointerEvents: "none",
            display: "flex",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "min(100%, 720px)",
              padding: "16px 18px",
              borderRadius: 18,
              border: "1px solid rgba(214,188,120,0.24)",
              background:
                "linear-gradient(180deg, rgba(16,18,28,0.94), rgba(10,12,20,0.90))",
              boxShadow:
                "0 18px 48px rgba(0,0,0,0.30), 0 0 0 1px rgba(214,188,120,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              animation: "roomFadeIn 320ms ease",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Chronicle Entry
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 22,
                fontWeight: 900,
                lineHeight: 1.08,
                color: "rgba(245,236,216,0.98)",
              }}
            >
              {hero.name} enters the dungeon.
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                lineHeight: 1.6,
                color: "rgba(228,232,240,0.80)",
              }}
            >
              The Chronicle begins. The threshold remembers the first living step.
            </div>
          </div>
        </div>
      ) : null}

      <GameplayHeaderSection
        hero={hero}
        demo={demo}
        showProgressionBanner={shouldShowProgressionBanner}
      />

      <div
        style={{
          position: "relative",
          display: "grid",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          gap: 18,
          flex: 1,
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          paddingRight: 2,
          paddingBottom: 24,
          alignContent: "start",
        }}
      >
        {activeScene === "pressure" ? (
          <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
            <SceneFrame
              eyebrow="Threshold"
              title="The First Chamber"
              description="The dungeon receives your first step. Read the chamber before choosing how to proceed."
              headerExtra={
                <StageTabs
                  activeScene="pressure"
                  hasPuzzleRoom={hasPuzzleRoom}
                  onSelectPressure={setPressureScene}
                  onSelectChamber={setChamberScene}
                  onSelectPuzzle={setPuzzleScene}
                  onSelectAction={setActionScene}
                />
              }
              footer={
                <SceneAdvanceBar
                  label="Continue to Chamber"
                  hint="Read the threshold first. Then step deeper."
                  onClick={setChamberScene}
                />
              }
            >
              {demo.gameplayAllowsPressure ? (
                <GameStateAdvisoryPanel
                  currentRoomTitle={demo.currentRoomTitle}
                  currentFloorLabel={demo.currentFloor.label}
                  floorId={demo.location.floorId}
                  roomId={demo.location.roomId}
                  dungeonEvolution={demo.dungeonEvolution}
                  roomSummary={demo.roomSummary}
                />
              ) : null}
            </SceneFrame>
          </div>
        ) : null}

        {activeScene === "chamber" ? (
          <ChamberScene
            demo={demo}
            hasPuzzleRoom={hasPuzzleRoom}
            onAdvanceToPuzzleOrAction={hasPuzzleRoom ? setPuzzleScene : setActionScene}
          />
        ) : null}

        {activeScene === "puzzle" ? (
          <PuzzleRoomPanel demo={demo} onAdvanceToAction={setActionScene} />
        ) : null}

        {activeScene === "action" ? (
          <div id={anchorId("action")} style={{ scrollMarginTop: 90 }}>
            <SceneFrame
              eyebrow="Command"
              title="Player Action"
              description="The chamber and its immediate obstacle are now understood. Give one decisive command."
              headerExtra={
                <StageTabs
                  activeScene="action"
                  hasPuzzleRoom={hasPuzzleRoom}
                  onSelectPressure={setPressureScene}
                  onSelectChamber={setChamberScene}
                  onSelectPuzzle={setPuzzleScene}
                  onSelectAction={setActionScene}
                />
              }
            >
              <GameplayActionColumn
                demo={{
                  ...demo,
                  CanonChronicleSection,
                  actionMode: "standard",
                  actionTitle: "Player Action",
                  actionEyebrow: "Command",
                  actionDescription:
                    "Give one decisive command. Keep the acting hero, the intended move, and the resulting choice in one focused surface.",
                }}
              />
            </SceneFrame>
          </div>
        ) : null}

        {activeScene === "combat" ? (
          <CombatScenePanel
            demo={demo}
            hasPuzzleRoom={hasPuzzleRoom}
            onSelectPressure={setPressureScene}
            onSelectChamber={setChamberScene}
            onSelectPuzzle={setPuzzleScene}
            onSelectAction={setActionScene}
          />
        ) : null}

        <details
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              padding: "14px 16px",
              fontSize: 12,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              opacity: 0.72,
            }}
          >
            Supporting Systems
          </summary>

          <div
            style={{
              padding: "0 16px 16px",
              display: "grid",
              gap: 14,
            }}
          >
            {activeScene !== "pressure" && demo.gameplayAllowsPressure ? (
              <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
                <GameStateAdvisoryPanel
                  currentRoomTitle={demo.currentRoomTitle}
                  currentFloorLabel={demo.currentFloor.label}
                  floorId={demo.location.floorId}
                  roomId={demo.location.roomId}
                  dungeonEvolution={demo.dungeonEvolution}
                  roomSummary={demo.roomSummary}
                />
              </div>
            ) : null}

            {activeScene !== "chamber" && demo.gameplayAllowsMap ? (
              <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
                <RoomTopologyPanel
                  currentRoomVisualKey={demo.currentRoomVisualKey}
                  currentRoomTitle={demo.currentRoomTitle}
                  roomImage={demo.roomImage}
                  roomNarrative={demo.roomNarrative}
                  roomFeatureNarrative={demo.roomFeatureNarrative}
                  roomExitNarrative={demo.roomExitNarrative}
                  roomConnectionsView={demo.roomConnectionsView}
                  currentFeatures={demo.currentFeatures}
                  selectedRouteId={demo.selectedTraversalTargetId}
                  onSelectRoute={demo.setSelectedTraversalTargetId}
                />
              </div>
            ) : null}

            {activeScene !== "combat" && demo.combatActive ? (
              <CombatScenePanel
                demo={demo}
                hasPuzzleRoom={hasPuzzleRoom}
                onSelectPressure={setPressureScene}
                onSelectChamber={setChamberScene}
                onSelectPuzzle={setPuzzleScene}
                onSelectAction={setActionScene}
              />
            ) : null}
          </div>
        </details>
      </div>
    </div>
  );
}
