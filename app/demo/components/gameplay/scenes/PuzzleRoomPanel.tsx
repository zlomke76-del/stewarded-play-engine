"use client";

import { useMemo, useState } from "react";
import PressureGaugeVisual from "../../puzzles/PressureGaugeVisual";
import SceneFrame, { SceneAdvanceBar } from "../ViewportSceneFrame";
import { anchorId } from "../../../demoUtils";

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

type Props = {
  demo: any;
  onAdvanceToAction: () => void;
};

export default function PuzzleRoomPanel({ demo, onAdvanceToAction }: Props) {
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
