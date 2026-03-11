"use client";

import { useMemo, useState } from "react";

import CardSection from "@/components/layout/CardSection";
import GameStateAdvisoryPanel from "./GameStateAdvisoryPanel";
import RoomTopologyPanel from "./RoomTopologyPanel";
import GameplayActionColumn from "./GameplayActionColumn";
import GameplayCombatPanel from "./GameplayCombatPanel";
import CanonChronicleSection from "./CanonChronicleSection";
import { anchorId, scrollToSection } from "../demoUtils";

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
  const masteryUnlocked = Boolean(summary.hero?.masteryUnlocked ?? progression.hero?.masteryUnlocked);
  const partyActive = summary.party?.activeSlots ?? progression.party?.activeSlots ?? 1;
  const partyMax = summary.party?.maxSlots ?? progression.party?.maxSlots ?? 6;
  const inventoryUsed = summary.inventory?.usedSlots ?? progression.inventory?.usedSlots ?? 0;
  const inventoryTotal = summary.inventory?.totalSlots ?? progression.inventory?.totalSlots ?? 0;
  const cryptCleared = Boolean(summary.campaign?.cryptFullyCleared ?? progression.campaign?.cryptFullyCleared);
  const finalReady = Boolean(summary.campaign?.finalDescentUnlocked ?? progression.campaign?.finalDescentUnlocked);
  const fullFellowship = Boolean(
    summary.campaign?.fullFellowshipAssembled ?? progression.campaign?.fullFellowshipAssembled
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
          gap: 16,
          padding: "18px 18px 16px",
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
                maxWidth: 720,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              alignSelf: "stretch",
              minWidth: 200,
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
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
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
              hint: inventoryTotal > 0 ? `${Math.max(0, inventoryTotal - inventoryUsed)} free slots` : "No storage",
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
                padding: "12px 14px",
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

function RitualDivider(props: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "10px 0 14px",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(214,188,120,0.28), rgba(214,188,120,0.08))",
        }}
      />
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          opacity: 0.58,
          whiteSpace: "nowrap",
        }}
      >
        {props.label}
      </div>
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(90deg, rgba(214,188,120,0.08), rgba(214,188,120,0.28), transparent)",
        }}
      />
    </div>
  );
}

function PuzzleRoomPanel(props: {
  demo: any;
}) {
  const { demo } = props;

  const [inputText, setInputText] = useState("");
  const [localResolution, setLocalResolution] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activePuzzle = useMemo(() => {
    return (
      demo.activePuzzleBlock ??
      demo.activeRoomPuzzle ??
      demo.roomPuzzlePresentation ??
      null
    );
  }, [demo.activePuzzleBlock, demo.activeRoomPuzzle, demo.roomPuzzlePresentation]);

  const canRunPuzzle =
    typeof demo.runRoomPuzzleAttempt === "function" ||
    typeof demo.runActivePuzzleAttempt === "function";

  const puzzleResult =
    demo.puzzleResolution ??
    demo.activePuzzleResolution ??
    localResolution ??
    null;

  if (!activePuzzle) return null;

  const title =
    activePuzzle.title ??
    activePuzzle.label ??
    "Puzzle Chamber";

  const description =
    activePuzzle.description ??
    activePuzzle.shortDescription ??
    "This room contains a deterministic trial.";

  const prompt =
    activePuzzle.prompt ??
    "Describe how you attempt the puzzle.";

  const hint = activePuzzle.hint ?? null;
  const puzzleId = activePuzzle.puzzleId ?? null;

  async function handleSubmit() {
    const trimmed = inputText.trim();
    if (!trimmed || !canRunPuzzle) return;

    setSubmitting(true);
    try {
      let result: any = null;

      if (typeof demo.runRoomPuzzleAttempt === "function") {
        result = await demo.runRoomPuzzleAttempt(trimmed);
      } else if (typeof demo.runActivePuzzleAttempt === "function") {
        result = await demo.runActivePuzzleAttempt(trimmed);
      }

      if (result) {
        setLocalResolution(result);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const effects: any[] = Array.isArray(puzzleResult?.effects)
    ? puzzleResult.effects
    : [];

  const narration: string[] = Array.isArray(puzzleResult?.narration)
    ? puzzleResult.narration
    : [];

  return (
    <div id={anchorId("puzzle")} style={{ scrollMarginTop: 90, marginTop: 18 }}>
      <CardSection title={title}>
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              opacity: 0.62,
            }}
          >
            Puzzle Room
            {puzzleId ? ` · ${String(puzzleId).replaceAll("_", " ")}` : ""}
          </div>

          <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.92 }}>{description}</p>

          <div
            style={{
              padding: "15px 16px",
              borderRadius: 16,
              border: "1px solid rgba(214, 188, 120, 0.18)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: 0.75,
                textTransform: "uppercase",
                opacity: 0.58,
                marginBottom: 6,
              }}
            >
              Prompt
            </div>
            <div style={{ lineHeight: 1.65 }}>{prompt}</div>
          </div>

          {hint ? (
            <div
              style={{
                padding: "11px 13px",
                borderRadius: 14,
                border: "1px solid rgba(120, 160, 214, 0.16)",
                background: "linear-gradient(180deg, rgba(120,160,214,0.08), rgba(120,160,214,0.04))",
                fontSize: 13,
                lineHeight: 1.55,
                opacity: 0.92,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <strong style={{ fontWeight: 700 }}>Hint:</strong> {hint}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 10 }}>
            <label
              htmlFor="echoes-puzzle-input"
              style={{
                fontSize: 12,
                letterSpacing: 0.75,
                textTransform: "uppercase",
                opacity: 0.58,
              }}
            >
              Your Attempt
            </label>

            <textarea
              id="echoes-puzzle-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe exactly how your hero attempts the puzzle..."
              rows={5}
              style={{
                width: "100%",
                resize: "vertical",
                borderRadius: 16,
                border: "1px solid rgba(214, 188, 120, 0.18)",
                background: "linear-gradient(180deg, rgba(8,10,16,0.88), rgba(10,12,18,0.78))",
                color: "rgba(245,236,216,0.96)",
                padding: "14px 16px",
                lineHeight: 1.6,
                outline: "none",
                boxSizing: "border-box",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={!inputText.trim() || !canRunPuzzle || submitting}
                onClick={handleSubmit}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(214, 188, 120, 0.24)",
                  background:
                    !inputText.trim() || !canRunPuzzle || submitting
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(180deg, rgba(214,188,120,0.18), rgba(214,188,120,0.08))",
                  color: "rgba(245,236,216,0.96)",
                  cursor:
                    !inputText.trim() || !canRunPuzzle || submitting
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 700,
                  boxShadow:
                    !inputText.trim() || !canRunPuzzle || submitting
                      ? "none"
                      : "0 10px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {submitting ? "Resolving..." : "Attempt Puzzle"}
              </button>

              <button
                type="button"
                onClick={() => setInputText("")}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(245,236,216,0.88)",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>

            {!canRunPuzzle ? (
              <div style={{ fontSize: 12, opacity: 0.64, lineHeight: 1.5 }}>
                Puzzle runtime is not connected yet. The room presentation is active, but
                submission still needs runtime wiring.
              </div>
            ) : null}
          </div>

          {puzzleResult ? (
            <div
              style={{
                marginTop: 6,
                padding: "16px 16px 14px",
                borderRadius: 16,
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
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    opacity: 0.62,
                  }}
                >
                  Resolution
                </div>

                <div
                  style={{
                    fontSize: 12,
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
                <div style={{ lineHeight: 1.65, fontWeight: 600 }}>
                  {puzzleResult.summary}
                </div>
              ) : null}

              {narration.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {narration.map((line, idx) => (
                    <p key={`${idx}-${line.slice(0, 24)}`} style={{ margin: 0, lineHeight: 1.7 }}>
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}

              {effects.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      opacity: 0.58,
                    }}
                  >
                    Effects
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {effects.map((effect, idx) => (
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
            </div>
          ) : null}
        </div>
      </CardSection>
    </div>
  );
}

type Props = {
  demo: any;
};

export default function GameplayViewport({ demo }: Props) {
  const actionDemo = {
    ...demo,
    CanonChronicleSection,
  };

  const hasPuzzleRoom = !!(
    demo.activePuzzleBlock ??
    demo.activeRoomPuzzle ??
    demo.roomPuzzlePresentation
  );

  return (
    <>
      <ProgressionBanner demo={demo} />

      <RitualDivider label="Threshold State" />

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
          actionLabel={
            hasPuzzleRoom ? "Face the chamber's trial" : "Let the first move take shape"
          }
          hint={
            hasPuzzleRoom
              ? "Some rooms want more than movement. They want an answer."
              : "Rooms create decisions. Doors create tension. Stairs create commitment."
          }
          onActivate={() => {
            demo.setGameplayFocusStep(hasPuzzleRoom ? "puzzle" : "action");
            demo.setActiveSection(hasPuzzleRoom ? "puzzle" : "action");
            queueMicrotask(() => scrollToSection(hasPuzzleRoom ? "puzzle" : "action"));
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

      {hasPuzzleRoom ? (
        <>
          <RitualDivider label="Chamber Trial" />
          <PuzzleRoomPanel demo={demo} />
        </>
      ) : null}

      <RitualDivider label="Command & Consequence" />

      <GameplayActionColumn demo={actionDemo} />

      <GameplayCombatPanel demo={demo} />
    </>
  );
}
