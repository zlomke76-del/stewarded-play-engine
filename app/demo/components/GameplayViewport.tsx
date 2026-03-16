"use client";

import { useEffect, useMemo, useState } from "react";

import HeroStatusBar from "./HeroStatusBar";
import GameStateAdvisoryPanel from "./GameStateAdvisoryPanel";
import RoomTopologyPanel from "./RoomTopologyPanel";
import GameplayActionColumn from "./GameplayActionColumn";
import GameplayCombatPanel from "./GameplayCombatPanel";
import CanonChronicleSection from "./CanonChronicleSection";
import PressureGaugeVisual from "./puzzles/PressureGaugeVisual";
import HeroRitualPortrait from "./hero-ritual/HeroRitualPortrait";
import { anchorId } from "../demoUtils";

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function resolveHeroVisualData(demo: any, member: any) {
  const portraitType = pickFirstString(
    member?.portrait,
    member?.portraitType,
    member?.selectedPortrait,
    demo?.selectedPortrait,
    demo?.heroPortraitType,
    demo?.activeHeroPortraitType,
    demo?.currentPortraitType
  );

  const imageSrc = pickFirstString(
    member?.imageSrc,
    member?.portraitImage,
    member?.portraitSrc,
    member?.heroImage,
    member?.tokenImage,
    demo?.heroPortraitSrc,
    demo?.activeHeroPortraitSrc,
    demo?.portraitImageSrc,
    demo?.heroImageSrc,
    demo?.currentHeroImage
  );

  const fallbackImageSrc = pickFirstString(
    member?.fallbackImageSrc,
    member?.fallbackPortraitSrc,
    demo?.heroPortraitFallbackSrc,
    demo?.portraitFallbackSrc,
    demo?.fallbackHeroImage
  );

  const objectPosition =
    pickFirstString(
      member?.portraitObjectPosition,
      demo?.heroPortraitObjectPosition,
      demo?.portraitObjectPosition
    ) ?? "center top";

  return {
    portraitType,
    imageSrc,
    fallbackImageSrc,
    objectPosition,
  };
}

function HeaderHeroVisual(props: {
  demo: any;
  hero: {
    name: string;
    species: string;
    className: string;
  };
}) {
  const { demo, hero } = props;

  const member = demo.partyMembers?.[0] ?? null;
  const visual = resolveHeroVisualData(demo, member);

  if (visual.imageSrc && visual.portraitType) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <HeroRitualPortrait
          species={hero.species}
          className={hero.className}
          portrait={visual.portraitType as any}
          imageSrc={visual.imageSrc}
          fallbackImageSrc={visual.fallbackImageSrc}
          alt={`${hero.name} portrait`}
          height="100%"
          objectPosition={visual.objectPosition}
        />
      </div>
    );
  }

  const staticPortraitSrc = visual.imageSrc ?? visual.fallbackImageSrc;

  if (staticPortraitSrc) {
    return (
      <img
        src={staticPortraitSrc}
        alt={`${hero.name} portrait`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: visual.objectPosition,
          display: "block",
        }}
      />
    );
  }

  return null;
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
  const masteryUnlocked = Boolean(
    summary.hero?.masteryUnlocked ?? progression.hero?.masteryUnlocked
  );
  const partyActive =
    summary.party?.activeSlots ?? progression.party?.activeSlots ?? 1;
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
  const fallen =
    summary.party?.fallenMembers ?? progression.party?.fallenMembers ?? 0;

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
            ? "See the chamber, choose the route that matters, then confront the room’s immediate trial."
            : "See the chamber, choose the route that matters, then issue a decisive command."
        }
        footer={
          <SceneAdvanceBar
            label={hasPuzzleRoom ? "Continue to Trial" : "Continue to Command"}
            hint={
              hasPuzzleRoom
                ? "The chamber is understood. The room’s obstacle comes next."
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
  const [showChronicleEntry, setShowChronicleEntry] = useState(true);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowChronicleEntry(false);
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const hero = useMemo(() => {
    const member = demo.partyMembers?.[0] ?? null;
    const fallbackName =
      demo.effectivePlayerNames?.[0] ??
      member?.name ??
      "The Lone Hero";

    return {
      name: String(member?.name ?? fallbackName ?? "The Lone Hero"),
      species: String(member?.species ?? "Human"),
      className: String(member?.className ?? "Warrior"),
      level: Number(demo.progression?.hero?.level ?? 1),
      hpCurrent: Number(member?.hpCurrent ?? member?.hpMax ?? 0),
      hpMax: Number(member?.hpMax ?? 0),
      ac: Number(member?.ac ?? 0),
      initiativeMod: Number(member?.initiativeMod ?? 0),
    };
  }, [demo.partyMembers, demo.effectivePlayerNames, demo.progression?.hero?.level]);

  const heroHeaderVisual = useMemo(() => {
    return <HeaderHeroVisual demo={demo} hero={hero} />;
  }, [demo, hero]);

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
    <div style={{ display: "grid", gap: 18, position: "relative" }}>
      {showChronicleEntry ? (
        <div
          style={{
            position: "sticky",
            top: 16,
            zIndex: 20,
            pointerEvents: "none",
            display: "flex",
            justifyContent: "center",
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

      <HeroStatusBar
        heroName={hero.name}
        species={hero.species}
        className={hero.className}
        level={hero.level}
        hpCurrent={hero.hpCurrent}
        hpMax={hero.hpMax}
        ac={hero.ac}
        initiativeMod={hero.initiativeMod}
        heroVisual={heroHeaderVisual}
      />

      <ProgressionBanner demo={demo} />

      <div style={{ position: "relative", display: "grid", gap: 18 }}>
        {activeScene === "pressure" ? (
          <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
            <SceneFrame
              eyebrow="Threshold State"
              title="The Air Tightens"
              description="Read the danger state first. This establishes the chamber’s pressure before the chamber itself fully resolves."
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
                  hint="Danger first. Chamber second. Obstacle third. Command last."
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
