"use client";

import { useMemo, useState } from "react";

import GameStateAdvisoryPanel from "./GameStateAdvisoryPanel";
import RoomTopologyPanel from "./RoomTopologyPanel";
import GameplayActionColumn from "./GameplayActionColumn";
import GameplayCombatPanel from "./GameplayCombatPanel";
import CanonChronicleSection from "./CanonChronicleSection";
import PressureGaugeVisual from "./puzzles/PressureGaugeVisual";
import { anchorId } from "../demoUtils";

function SceneAdvanceBar(props: {
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  const { label, hint, onClick } = props;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "14px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            opacity: 0.58,
          }}
        >
          Next Step
        </div>
        {hint ? (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: "rgba(228,232,240,0.72)",
            }}
          >
            {hint}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClick}
        style={{
          padding: "11px 14px",
          borderRadius: 12,
          border: "1px solid rgba(214,188,120,0.24)",
          background:
            "linear-gradient(180deg, rgba(214,188,120,0.16), rgba(214,188,120,0.06))",
          color: "rgba(245,236,216,0.96)",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    </div>
  );
}

function StageTabs(props: {
  activeScene: "pressure" | "chamber" | "puzzle" | "action" | "combat";
  hasPuzzleRoom: boolean;
  onSelectPressure: () => void;
  onSelectChamber: () => void;
  onSelectPuzzle: () => void;
  onSelectAction: () => void;
}) {
  const {
    activeScene,
    hasPuzzleRoom,
    onSelectPressure,
    onSelectChamber,
    onSelectPuzzle,
    onSelectAction,
  } = props;

  const tabs = [
    {
      key: "pressure",
      label: "Threshold",
      onClick: onSelectPressure,
      visible: true,
    },
    {
      key: "chamber",
      label: "Chamber",
      onClick: onSelectChamber,
      visible: true,
    },
    {
      key: "puzzle",
      label: "Trial",
      onClick: onSelectPuzzle,
      visible: hasPuzzleRoom,
    },
    {
      key: "action",
      label: "Command",
      onClick: onSelectAction,
      visible: true,
    },
  ].filter((tab) => tab.visible);

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        padding: "0 16px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {tabs.map((tab) => {
        const active = activeScene === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={tab.onClick}
            style={{
              padding: "8px 11px",
              borderRadius: 999,
              border: active
                ? "1px solid rgba(214,188,120,0.28)"
                : "1px solid rgba(255,255,255,0.10)",
              background: active
                ? "rgba(214,188,120,0.10)"
                : "rgba(255,255,255,0.04)",
              color: active
                ? "rgba(245,236,216,0.96)"
                : "rgba(228,232,240,0.84)",
              fontSize: 11,
              fontWeight: active ? 800 : 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function SceneFrame(props: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerExtra?: React.ReactNode;
}) {
  const { title, eyebrow, description, children, footer, headerExtra } = props;

  return (
    <div
      style={{
        borderRadius: 24,
        border: "1px solid rgba(214, 188, 120, 0.16)",
        background:
          "linear-gradient(180deg, rgba(16,18,28,0.94), rgba(10,12,20,0.92))",
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: headerExtra ? "none" : "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.15,
            textTransform: "uppercase",
            opacity: 0.58,
          }}
        >
          {eyebrow}
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            lineHeight: 1.08,
            color: "rgba(245,236,216,0.98)",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(227, 231, 239, 0.78)",
            maxWidth: 860,
          }}
        >
          {description}
        </div>
      </div>

      {headerExtra ? headerExtra : null}

      <div style={{ padding: 16 }}>{children}</div>
      {footer ? footer : null}
    </div>
  );
}

function MinimalPressureRead(props: { demo: any }) {
  const { demo } = props;

  const roomTitle = demo.currentRoomTitle ?? "Entrance";
  const roomSummary =
    typeof demo.roomSummary === "string" && demo.roomSummary.trim().length > 0
      ? demo.roomSummary.trim()
      : "The threshold waits in tense silence.";

  const signalLine =
    Array.isArray(demo.dungeonEvolution?.signals) && demo.dungeonEvolution.signals.length > 0
      ? String(demo.dungeonEvolution.signals[0] ?? "").trim()
      : "The room still holds. Every sound feels larger because so little answers it.";

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderRadius: 18,
          border: "1px solid rgba(214, 188, 120, 0.16)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            opacity: 0.58,
          }}
        >
          Current Chamber
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 850,
            lineHeight: 1.08,
            color: "rgba(245,236,216,0.97)",
          }}
        >
          {roomTitle}
        </div>

        <div
          style={{
            fontSize: 15,
            lineHeight: 1.72,
            color: "rgba(239,241,246,0.90)",
          }}
        >
          {roomSummary}
        </div>
      </div>

      <div
        style={{
          padding: "14px 16px",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            opacity: 0.58,
          }}
        >
          Signal
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "rgba(231,235,242,0.84)",
          }}
        >
          {signalLine}
        </div>
      </div>
    </div>
  );
}

function ChamberScene(props: {
  demo: any;
  hasPuzzleRoom: boolean;
  onAdvanceToPuzzleOrAction: () => void;
}) {
  const { demo, hasPuzzleRoom, onAdvanceToPuzzleOrAction } = props;

  return (
    <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
      <SceneFrame
        eyebrow="Current Chamber"
        title={demo.currentRoomTitle ?? "The Descent"}
        description={
          hasPuzzleRoom
            ? "The room is now visible. Read the chamber itself, then confront the immediate trial."
            : "The room is now visible. Read the chamber itself, then decide your next command."
        }
        footer={
          <SceneAdvanceBar
            label={hasPuzzleRoom ? "Continue to Trial" : "Continue to Command"}
            hint={
              hasPuzzleRoom
                ? "The chamber is understood. Its obstacle comes next."
                : "The chamber is understood. The next decisive act belongs to the hero."
            }
            onClick={onAdvanceToPuzzleOrAction}
          />
        }
      >
        {demo.gameplayAllowsMap ? (
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
        ) : null}
      </SceneFrame>
    </div>
  );
}

function PuzzleCommandPanel(props: {
  demo: any;
  prompt: string;
  isSubmitting: boolean;
  onAttempt: () => Promise<void>;
}) {
  const { demo, prompt, isSubmitting, onAttempt } = props;

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: 18,
        border: "1px solid rgba(214, 188, 120, 0.16)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.018))",
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          opacity: 0.58,
        }}
      >
        Puzzle Command
      </div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "rgba(228,232,240,0.78)",
        }}
      >
        {prompt}
      </div>

      <textarea
        value={demo.playerInput ?? ""}
        onChange={(e) => demo.setPlayerInput(e.target.value)}
        placeholder="Describe exactly how your hero distributes weight, tests the plates, and attempts to solve the mechanism..."
        rows={6}
        style={{
          width: "100%",
          resize: "vertical",
          borderRadius: 16,
          border: "1px solid rgba(214, 188, 120, 0.18)",
          background:
            "linear-gradient(180deg, rgba(8,10,16,0.88), rgba(10,12,18,0.78))",
          color: "rgba(245,236,216,0.96)",
          padding: "14px 16px",
          lineHeight: 1.6,
          outline: "none",
          boxSizing: "border-box",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: "rgba(225,228,236,0.72)",
          }}
        >
          Keep the sequence and the hero’s method in the same attempt.
        </div>

        <button
          type="button"
          onClick={() => {
            void onAttempt();
          }}
          disabled={!String(demo.playerInput ?? "").trim() || isSubmitting}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid rgba(214, 188, 120, 0.24)",
            background:
              !String(demo.playerInput ?? "").trim() || isSubmitting
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(180deg, rgba(214,188,120,0.18), rgba(214,188,120,0.08))",
            color: "rgba(245,236,216,0.96)",
            cursor:
              !String(demo.playerInput ?? "").trim() || isSubmitting
                ? "not-allowed"
                : "pointer",
            fontWeight: 800,
            opacity:
              !String(demo.playerInput ?? "").trim() || isSubmitting ? 0.5 : 1,
          }}
        >
          {isSubmitting ? "Attempting..." : "Attempt Trial"}
        </button>
      </div>
    </div>
  );
}

function PuzzleRoomPanel(props: {
  demo: any;
  onAdvanceToAction: () => void;
}) {
  const { demo, onAdvanceToAction } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePuzzle = useMemo(() => {
    return (
      demo.activePuzzleBlock ??
      demo.activeRoomPuzzle ??
      demo.roomPuzzlePresentation ??
      null
    );
  }, [demo.activePuzzleBlock, demo.activeRoomPuzzle, demo.roomPuzzlePresentation]);

  const puzzleResult =
    demo.puzzleResolution ?? demo.activePuzzleResolution ?? null;

  const intendedRouteLabel =
    demo.selectedTraversalTargetLabel ??
    demo.roomConnectionsView?.[0]?.targetLabel ??
    "Passage forward";

  const isPressureGaugePuzzle =
    String(activePuzzle?.puzzleId ?? activePuzzle?.id ?? activePuzzle?.key ?? "")
      .toLowerCase()
      .includes("pressure") ||
    String(activePuzzle?.title ?? activePuzzle?.label ?? "")
      .toLowerCase()
      .includes("pressure");

  const riddleLines =
    Array.isArray(activePuzzle?.riddleLines) && activePuzzle.riddleLines.length > 0
      ? activePuzzle.riddleLines
      : typeof activePuzzle?.hint === "string" && activePuzzle.hint.trim()
        ? [activePuzzle.hint.trim()]
        : [];

  async function handleAttempt() {
    const trimmed = String(demo.playerInput ?? "").trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      if (typeof demo.runRoomPuzzleAttempt === "function") {
        await demo.runRoomPuzzleAttempt(trimmed);
      } else if (typeof demo.runActivePuzzleAttempt === "function") {
        await demo.runActivePuzzleAttempt(trimmed);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!activePuzzle) return null;

  return (
    <div id={anchorId("puzzle")} style={{ scrollMarginTop: 90 }}>
      <SceneFrame
        eyebrow="Chamber Trial"
        title={activePuzzle?.title ?? activePuzzle?.label ?? "Puzzle Chamber"}
        description="The chamber’s immediate obstacle now takes the center. Solve or answer it before returning to broad command."
        footer={
          !isPressureGaugePuzzle && puzzleResult ? (
            <SceneAdvanceBar
              label="Continue to Command"
              hint="The trial has been confronted. Now decide what the hero does next."
              onClick={onAdvanceToAction}
            />
          ) : undefined
        }
      >
        <div style={{ display: "grid", gap: 14 }}>
          {isPressureGaugePuzzle ? (
            <PressureGaugeVisual
              currentRoomTitle={demo.currentRoomTitle}
              intendedRouteLabel={intendedRouteLabel}
              puzzleResult={puzzleResult}
              playerInput={demo.playerInput ?? ""}
              setPlayerInput={demo.setPlayerInput}
              isSubmitting={isSubmitting}
              riddleLines={riddleLines}
              victoryState={demo.pressurePuzzleVictoryState ?? null}
              onConfirmTraversal={async () => {
                if (typeof demo.confirmPressurePuzzleTraversal === "function") {
                  await demo.confirmPressurePuzzleTraversal();
                }
              }}
              isConfirmingTraversal={Boolean(
                demo.isConfirmingPressurePuzzleTraversal
              )}
              onSolved={async () => {
                if (typeof demo.resolvePressureGaugePuzzleSuccess === "function") {
                  await demo.resolvePressureGaugePuzzleSuccess();
                }
              }}
            />
          ) : (
            <>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 18,
                  border: "1px solid rgba(214, 188, 120, 0.16)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.018))",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.65,
                    color: "rgba(244, 238, 225, 0.96)",
                  }}
                >
                  {activePuzzle?.description ??
                    activePuzzle?.shortDescription ??
                    "This chamber holds a deterministic trial."}
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 13px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: 0.75,
                        textTransform: "uppercase",
                        opacity: 0.58,
                      }}
                    >
                      Current Chamber
                    </div>
                    <div style={{ lineHeight: 1.55, fontWeight: 700 }}>
                      {demo.currentRoomTitle ?? "Corridor"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 13px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: 0.75,
                        textTransform: "uppercase",
                        opacity: 0.58,
                      }}
                    >
                      Intended Route
                    </div>
                    <div style={{ lineHeight: 1.55, fontWeight: 700 }}>
                      {intendedRouteLabel}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 13px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: 0.75,
                        textTransform: "uppercase",
                        opacity: 0.58,
                      }}
                    >
                      Trial State
                    </div>
                    <div style={{ lineHeight: 1.55, fontWeight: 700 }}>
                      {puzzleResult
                        ? puzzleResult.success === true
                          ? "Resolved"
                          : "Attempt recorded"
                        : "Passage blocked"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 13px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 0.75,
                      textTransform: "uppercase",
                      opacity: 0.58,
                    }}
                  >
                    Prompt
                  </div>
                  <div style={{ lineHeight: 1.6 }}>
                    {activePuzzle?.prompt ?? "Describe how your hero attempts the puzzle."}
                  </div>
                </div>

                {activePuzzle?.hint ? (
                  <div
                    style={{
                      padding: "11px 13px",
                      borderRadius: 14,
                      border: "1px solid rgba(120, 160, 214, 0.16)",
                      background:
                        "linear-gradient(180deg, rgba(120,160,214,0.08), rgba(120,160,214,0.04))",
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    <strong style={{ fontWeight: 700 }}>Hint:</strong> {activePuzzle.hint}
                  </div>
                ) : null}
              </div>

              <PuzzleCommandPanel
                demo={demo}
                prompt={activePuzzle?.prompt ?? "Describe how your hero attempts the puzzle."}
                isSubmitting={isSubmitting}
                onAttempt={handleAttempt}
              />
            </>
          )}

          {puzzleResult ? (
            <div
              style={{
                padding: "16px",
                borderRadius: 18,
                border:
                  puzzleResult.success === true
                    ? "1px solid rgba(118, 188, 132, 0.26)"
                    : "1px solid rgba(188, 118, 118, 0.24)",
                background:
                  puzzleResult.success === true
                    ? "linear-gradient(180deg, rgba(118,188,132,0.10), rgba(118,188,132,0.04))"
                    : "linear-gradient(180deg, rgba(188,118,118,0.10), rgba(188,118,118,0.04))",
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  opacity: 0.58,
                }}
              >
                Resolution
              </div>

              {puzzleResult.summary ? (
                <div style={{ lineHeight: 1.65, fontWeight: 700 }}>
                  {puzzleResult.summary}
                </div>
              ) : null}

              {Array.isArray(puzzleResult.narration) &&
              puzzleResult.narration.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {puzzleResult.narration.map((line: string, idx: number) => (
                    <p key={`${idx}-${line.slice(0, 24)}`} style={{ margin: 0, lineHeight: 1.7 }}>
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </SceneFrame>
    </div>
  );
}

type Props = {
  demo: any;
};

export default function GameplayViewport({ demo }: Props) {
  const hasPuzzleRoom = !!(
    demo.activePuzzleBlock ??
    demo.activeRoomPuzzle ??
    demo.roomPuzzlePresentation
  );

  const activeScene = useMemo(() => {
    if (demo.combatActive) return "combat";
    if (hasPuzzleRoom && demo.gameplayFocusStep === "puzzle") return "puzzle";
    if (demo.gameplayFocusStep === "action") return "action";
    if (demo.gameplayFocusStep === "pressure") return "pressure";
    return "chamber";
  }, [demo.combatActive, demo.gameplayFocusStep, hasPuzzleRoom]);

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
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ position: "relative", display: "grid", gap: 18 }}>
        {activeScene === "pressure" ? (
          <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
            <SceneFrame
              eyebrow="Threshold State"
              title={demo.currentRoomTitle ?? "Entrance"}
              description="You crossed the threshold. Read the room before you move."
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
                  hint="Take in the room first. Then move deeper."
                  onClick={setChamberScene}
                />
              }
            >
              <MinimalPressureRead demo={demo} />
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
          <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
            <SceneFrame
              eyebrow="Combat"
              title="Battlefield"
              description="The tactical exchange takes over the viewport. Battlefield, command, and consequence now belong together."
            >
              <GameplayCombatPanel demo={demo} />
              <div style={{ marginTop: 14 }}>
                <GameplayActionColumn
                  demo={{
                    ...demo,
                    CanonChronicleSection,
                    actionMode: "combat",
                    actionTitle: "Combat Command",
                    actionEyebrow: "Command",
                    actionDescription:
                      "The battlefield is active. Keep action input and combat resolution in the same immediate frame.",
                  }}
                />
              </div>
            </SceneFrame>
          </div>
        ) : null}

        <details
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            overflow: "hidden",
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
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                fontSize: 12,
                lineHeight: 1.6,
                color: "rgba(226,230,238,0.74)",
              }}
            >
              Chronicle status and advisory systems are intentionally collapsed here so the main dungeon flow stays immersive.
            </div>

            {demo.gameplayAllowsPressure ? (
              <div id={anchorId("pressure-support")} style={{ scrollMarginTop: 90 }}>
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

            {demo.gameplayAllowsMap ? (
              <div id={anchorId("map-support")} style={{ scrollMarginTop: 90 }}>
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

            {demo.combatActive ? (
              <div id={anchorId("combat-support")} style={{ scrollMarginTop: 90 }}>
                <GameplayCombatPanel demo={demo} />
              </div>
            ) : null}
          </div>
        </details>
      </div>
    </div>
  );
}
