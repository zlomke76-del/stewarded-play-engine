"use client";

import { useMemo } from "react";

import GameStateAdvisoryPanel from "./GameStateAdvisoryPanel";
import RoomTopologyPanel from "./RoomTopologyPanel";
import GameplayActionColumn from "./GameplayActionColumn";
import GameplayCombatPanel from "./GameplayCombatPanel";
import CanonChronicleSection from "./CanonChronicleSection";
import { anchorId } from "../demoUtils";

function ProgressionBanner(props: { demo: any }) {
  const { demo } = props;

  const banner =
    typeof demo.progressionInspectorBanner === "string"
      ? demo.progressionInspectorBanner
      : "";

  const summary = demo.progressionInspectorSummary ?? null;
  const progression = demo.progression ?? null;

  if (!banner || !summary || !progression) return null;

  const heroLevel = summary.hero?.level ?? progression.hero?.level ?? 1;
  const masteryUnlocked = Boolean(
    summary.hero?.masteryUnlocked ?? progression.hero?.masteryUnlocked
  );
  const partyActive = summary.party?.activeSlots ?? progression.party?.activeSlots ?? 1;
  const partyMax = summary.party?.maxSlots ?? progression.party?.maxSlots ?? 6;
  const inventoryUsed =
    summary.inventory?.usedSlots ?? progression.inventory?.usedSlots ?? 0;
  const inventoryTotal =
    summary.inventory?.totalSlots ?? progression.inventory?.totalSlots ?? 0;
  const cryptCleared = Boolean(
    summary.campaign?.cryptFullyCleared ?? progression.campaign?.cryptFullyCleared
  );
  const finalReady = Boolean(
    summary.campaign?.finalDescentUnlocked ??
      progression.campaign?.finalDescentUnlocked
  );
  const fullFellowship = Boolean(
    summary.campaign?.fullFellowshipAssembled ??
      progression.campaign?.fullFellowshipAssembled
  );
  const relicBonded = summary.relics?.bondedCount ?? 0;
  const fallen = summary.party?.fallenMembers ?? progression.party?.fallenMembers ?? 0;

  const statusTone = finalReady
    ? {
        edge: "rgba(167, 219, 174, 0.34)",
        glow: "rgba(120, 196, 128, 0.20)",
        text: "rgba(214, 245, 220, 0.96)",
        chip: "rgba(120, 196, 128, 0.12)",
      }
    : masteryUnlocked
      ? {
          edge: "rgba(214, 188, 120, 0.34)",
          glow: "rgba(214, 188, 120, 0.16)",
          text: "rgba(245, 236, 216, 0.96)",
          chip: "rgba(214, 188, 120, 0.10)",
        }
      : {
          edge: "rgba(126, 150, 196, 0.30)",
          glow: "rgba(92, 116, 168, 0.16)",
          text: "rgba(232, 236, 245, 0.95)",
          chip: "rgba(126, 150, 196, 0.10)",
        };

  const statusLabel = finalReady
    ? "Final Descent Ready"
    : cryptCleared
      ? "Crypt Cleared"
      : fullFellowship
        ? "Fellowship Complete"
        : "Fellowship Forming";

  const subtitle = finalReady
    ? "Six stand together. The lower law answers."
    : cryptCleared
      ? "The crypt has fallen silent. Only the final threshold remains."
      : fullFellowship
        ? "The company is assembled. Mastery now decides the road."
        : "The Chronicle is still gathering its living names.";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        marginBottom: 18,
        borderRadius: 22,
        border: `1px solid ${statusTone.edge}`,
        background:
          "radial-gradient(circle at top left, rgba(214,188,120,0.16), transparent 34%), radial-gradient(circle at top right, rgba(96,116,171,0.14), transparent 30%), linear-gradient(180deg, rgba(16,18,28,0.96), rgba(9,11,18,0.92))",
        boxShadow: `0 18px 48px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px ${statusTone.glow}`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04), transparent 22%, transparent 78%, rgba(255,255,255,0.03))",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "grid",
          gap: 14,
          padding: "16px 16px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Chronicle Status
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: statusTone.text,
                }}
              >
                {statusLabel}
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${statusTone.edge}`,
                  background: statusTone.chip,
                  fontSize: 11,
                  letterSpacing: 0.9,
                  textTransform: "uppercase",
                  fontWeight: 800,
                  color: statusTone.text,
                  whiteSpace: "nowrap",
                }}
              >
                {heroLevel >= 30 ? "Level 30 Mastery" : `Hero Level ${heroLevel}`}
              </div>
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "rgba(229, 232, 240, 0.82)",
                maxWidth: 760,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              minWidth: 220,
              padding: "10px 12px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              display: "grid",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                opacity: 0.55,
              }}
            >
              Live Banner
            </div>
            <div
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                fontSize: 12,
                lineHeight: 1.5,
                color: "rgba(238, 239, 242, 0.92)",
                wordBreak: "break-word",
              }}
            >
              {banner}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          {[
            {
              label: "Fellowship",
              value: `${partyActive}/${partyMax}`,
              hint: fullFellowship ? "Complete" : "Still gathering",
            },
            {
              label: "Inventory",
              value: `${inventoryUsed}/${inventoryTotal}`,
              hint:
                inventoryTotal > 0
                  ? `${Math.max(0, inventoryTotal - inventoryUsed)} free slots`
                  : "No storage",
            },
            {
              label: "Bonded Relics",
              value: String(relicBonded),
              hint: relicBonded > 0 ? "Lineage forming" : "None bonded yet",
            },
            {
              label: "Fallen",
              value: String(fallen),
              hint: fallen > 0 ? "The Chronicle remembers" : "No losses recorded",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "11px 13px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                display: "grid",
                gap: 4,
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
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: "rgba(245,236,216,0.97)",
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "rgba(225, 228, 236, 0.72)",
                }}
              >
                {item.hint}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneFrame(props: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}) {
  const { title, eyebrow, description, children } = props;

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
          borderBottom: "1px solid rgba(255,255,255,0.06)",
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

      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function PuzzleRoomPanel(props: {
  demo: any;
}) {
  const { demo } = props;

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

  const canRunPuzzle =
    typeof demo.runRoomPuzzleAttempt === "function" ||
    typeof demo.runActivePuzzleAttempt === "function";

  const title = activePuzzle?.title ?? activePuzzle?.label ?? "Puzzle Chamber";
  const description =
    activePuzzle?.description ??
    activePuzzle?.shortDescription ??
    "This chamber holds a deterministic trial.";
  const prompt =
    activePuzzle?.prompt ?? "Describe how your hero attempts the puzzle.";
  const hint = activePuzzle?.hint ?? null;
  const puzzleId = activePuzzle?.puzzleId ?? null;

  if (!activePuzzle) return null;

  return (
    <div id={anchorId("puzzle")} style={{ scrollMarginTop: 90 }}>
      <SceneFrame
        eyebrow="Chamber Trial"
        title={title}
        description="The trial is now the entire focal point. Solve it before the route regains the stage."
      >
        <div style={{ display: "grid", gap: 14 }}>
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
                fontSize: 11,
                letterSpacing: 0.9,
                textTransform: "uppercase",
                opacity: 0.58,
              }}
            >
              Puzzle Room
              {puzzleId ? ` · ${String(puzzleId).replaceAll("_", " ")}` : ""}
            </div>

            <div
              style={{
                fontSize: 16,
                lineHeight: 1.65,
                color: "rgba(244, 238, 225, 0.96)",
              }}
            >
              {description}
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
              <div style={{ lineHeight: 1.6 }}>{prompt}</div>
            </div>

            {hint ? (
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
                <strong style={{ fontWeight: 700 }}>Hint:</strong> {hint}
              </div>
            ) : null}
          </div>

          <GameplayActionColumn
            demo={{
              ...demo,
              CanonChronicleSection,
              actionMode: "puzzle",
              actionTitle: "Puzzle Attempt",
              actionEyebrow: "Command",
              actionDescription:
                "Describe exactly how the hero studies, tests, or manipulates the chamber.",
              forceInputPlaceholder:
                "Describe exactly how your hero attempts the puzzle...",
              hideParsedByDefault: true,
              hideChronicleByDefault: true,
              inlinePuzzleSubmit: true,
              onInlineSubmit: async () => {
                const trimmed = String(demo.playerInput ?? "").trim();
                if (!trimmed) return null;

                if (typeof demo.runRoomPuzzleAttempt === "function") {
                  return await demo.runRoomPuzzleAttempt(trimmed);
                }
                if (typeof demo.runActivePuzzleAttempt === "function") {
                  return await demo.runActivePuzzleAttempt(trimmed);
                }
                return null;
              },
            }}
          />

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
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
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
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color:
                      puzzleResult.success === true
                        ? "rgba(165, 225, 178, 0.94)"
                        : "rgba(235, 173, 173, 0.94)",
                  }}
                >
                  {puzzleResult.success === true ? "Success" : "Failure"}
                </div>
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

              {Array.isArray(puzzleResult.effects) &&
              puzzleResult.effects.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      opacity: 0.58,
                    }}
                  >
                    Effects
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {puzzleResult.effects.map((effect: any, idx: number) => (
                      <div
                        key={`${idx}-${effect.kind ?? "effect"}`}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          lineHeight: 1.55,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>
                          {effect.label ?? effect.kind ?? "Effect"}
                        </div>
                        <div style={{ opacity: 0.84 }}>
                          {effect.description ?? "A puzzle effect was applied."}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {!canRunPuzzle ? (
                <div style={{ fontSize: 12, opacity: 0.64, lineHeight: 1.5 }}>
                  Puzzle runtime is not connected yet. The chamber presentation is
                  active, but puzzle submission still needs runtime wiring.
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
    return "map";
  }, [demo.combatActive, demo.gameplayFocusStep, hasPuzzleRoom]);

  const sceneIntro = useMemo(() => {
    if (activeScene === "pressure") {
      return {
        eyebrow: "Threshold State",
        title: "The Air Tightens",
        description:
          "Read the danger state first. This is the mood of the chamber before the chamber itself fully resolves.",
      };
    }

    if (activeScene === "map") {
      return {
        eyebrow: "Current Chamber",
        title: demo.currentRoomTitle ?? "The Descent",
        description:
          hasPuzzleRoom
            ? "The room has resolved, but the chamber also contains a visible trial. Read the space, then face the trial."
            : "The room has resolved. Read the chamber, understand the routes, then choose the next command.",
      };
    }

    if (activeScene === "puzzle") {
      return {
        eyebrow: "Active Trial",
        title: demo.currentRoomTitle ?? "Puzzle Chamber",
        description:
          "The chamber’s trial is now the center of the experience. Solve it before the route regains priority.",
      };
    }

    if (activeScene === "combat") {
      return {
        eyebrow: "Combat",
        title: "Battlefield",
        description:
          "The tactical exchange takes over the viewport. Command, timing, and consequence now matter more than route planning.",
      };
    }

    return {
      eyebrow: "Command",
      title: "Player Action",
      description:
        "Issue one clear command. The acting hero, the tactical intent, and the resolution should all remain within one centered surface.",
    };
  }, [activeScene, demo.currentRoomTitle, hasPuzzleRoom]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <ProgressionBanner demo={demo} />

      <div
        style={{
          position: "relative",
          display: "grid",
          gap: 18,
        }}
      >
        <div
          id={anchorId(activeScene === "pressure" ? "pressure" : activeScene === "map" ? "map" : activeScene)}
          style={{ scrollMarginTop: 90 }}
        >
          {activeScene === "pressure" ? (
            <SceneFrame
              eyebrow={sceneIntro.eyebrow}
              title={sceneIntro.title}
              description={sceneIntro.description}
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
          ) : null}

          {activeScene === "map" ? (
            <SceneFrame
              eyebrow={sceneIntro.eyebrow}
              title={sceneIntro.title}
              description={sceneIntro.description}
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
                />
              ) : null}
            </SceneFrame>
          ) : null}

          {activeScene === "puzzle" ? <PuzzleRoomPanel demo={demo} /> : null}

          {activeScene === "action" ? (
            <SceneFrame
              eyebrow={sceneIntro.eyebrow}
              title={sceneIntro.title}
              description={sceneIntro.description}
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
          ) : null}

          {activeScene === "combat" ? (
            <SceneFrame
              eyebrow={sceneIntro.eyebrow}
              title={sceneIntro.title}
              description={sceneIntro.description}
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
          ) : null}
        </div>

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

            {activeScene !== "map" && demo.gameplayAllowsMap ? (
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
                />
              </div>
            ) : null}

            {activeScene !== "combat" && demo.combatActive ? (
              <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
                <GameplayCombatPanel demo={demo} />
              </div>
            ) : null}
          </div>
        </details>
      </div>
    </div>
  );
}
