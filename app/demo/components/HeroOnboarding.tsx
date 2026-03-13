"use client";

// ------------------------------------------------------------
// HeroOnboarding.tsx
// ------------------------------------------------------------
// Layout discipline pass:
// - choice moment separated from descent moment
// - guide plaques sit higher in the scene
// - CTA slab is narrower and more altar-like
// - fellowship is pushed lower and simplified
// - copy reduced slightly inside plaques
// - compact mode remains stable
// ------------------------------------------------------------

import React, { useMemo } from "react";
import { DMMode } from "../demoTypes";

type ChapterKey =
  | "mode"
  | "party"
  | "table"
  | "pressure"
  | "map"
  | "combat"
  | "action"
  | "resolution"
  | "canon"
  | "ledger";

type ChipState = "done" | "next" | "locked" | "open";
type PresentationMode = "full" | "compact";

const SFX = {
  buttonClick: "/assets/audio/sfx_button_click_01.mp3",
  uiSuccess: "/assets/audio/sfx_success_01.mp3",
  uiFailure: "/assets/audio/sfx_failure_01.mp3",
} as const;

function playSfx(src: string, volume = 0.66) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // fail silently
  }
}

function FellowshipPips({
  active,
  unlocked,
  max,
  compact = false,
}: {
  active: number;
  unlocked: number;
  max: number;
  compact?: boolean;
}) {
  const size = compact ? 28 : 34;

  return (
    <div style={{ display: "flex", gap: compact ? 8 : 10, flexWrap: "wrap", alignItems: "center" }}>
      {Array.from({ length: max }, (_, i) => {
        const slot = i + 1;
        const isActive = slot <= active;
        const isUnlocked = slot <= unlocked;

        return (
          <span
            key={slot}
            style={{
              width: size,
              height: size,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              border: isActive
                ? "1px solid rgba(138,180,255,0.35)"
                : isUnlocked
                  ? "1px solid rgba(255,255,255,0.14)"
                  : "1px solid rgba(255,255,255,0.08)",
              background: isActive
                ? "rgba(138,180,255,0.12)"
                : isUnlocked
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.02)",
              fontSize: compact ? 13 : 16,
              boxShadow: isActive ? "0 6px 16px rgba(0,0,0,0.24)" : "none",
              opacity: isUnlocked ? 1 : 0.5,
            }}
            title={
              isActive
                ? `Active fellowship slot ${slot}`
                : isUnlocked
                  ? `Unlocked fellowship slot ${slot}`
                  : `Locked fellowship slot ${slot}`
            }
          >
            {isActive ? "⚔" : isUnlocked ? "◌" : "🔒"}
          </span>
        );
      })}
    </div>
  );
}

function Chip({
  label,
  state,
  onClick,
  compact = false,
}: {
  label: string;
  state: ChipState;
  onClick?: () => void;
  compact?: boolean;
}) {
  const clickable = !!onClick && state !== "locked";
  const bg =
    state === "done"
      ? "rgba(138,180,255,0.12)"
      : state === "next"
        ? "rgba(255,255,255,0.08)"
        : state === "open"
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.03)";

  const border =
    state === "done"
      ? "1px solid rgba(138,180,255,0.35)"
      : state === "next"
        ? "1px solid rgba(255,255,255,0.18)"
        : state === "open"
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid rgba(255,255,255,0.08)";

  const opacity = state === "locked" ? 0.55 : 1;

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      style={{
        cursor: clickable ? "pointer" : "default",
        padding: compact ? "6px 9px" : "8px 10px",
        borderRadius: 999,
        background: bg,
        border,
        color: "rgba(255,255,255,0.92)",
        opacity,
        fontSize: compact ? 11 : 12,
        letterSpacing: 0.2,
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        whiteSpace: "nowrap",
      }}
      title={state === "locked" ? "Locked until you progress" : undefined}
    >
      <span style={{ fontWeight: 800 }}>{label}</span>
      {state === "done" ? <span style={{ opacity: 0.85 }}>✓</span> : null}
      {state === "next" ? <span style={{ opacity: 0.8 }}>→</span> : null}
    </button>
  );
}

function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: 38,
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 850 }}>{value}</span>
    </div>
  );
}

function GuideOverlayCard({
  title,
  kicker,
  body,
  accent,
  selected,
  onChoose,
}: {
  title: string;
  kicker: string;
  body: string;
  accent: "ember" | "azure";
  selected: boolean;
  onChoose: () => void;
}) {
  const isAzure = accent === "azure";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        border: selected
          ? isAzure
            ? "1px solid rgba(138,180,255,0.42)"
            : "1px solid rgba(255,196,132,0.42)"
          : "1px solid rgba(255,255,255,0.11)",
        background: selected
          ? isAzure
            ? "linear-gradient(180deg, rgba(18,28,54,0.72), rgba(8,10,16,0.80))"
            : "linear-gradient(180deg, rgba(48,28,14,0.72), rgba(10,10,12,0.80))"
          : "linear-gradient(180deg, rgba(10,11,15,0.58), rgba(8,8,10,0.76))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: selected
          ? isAzure
            ? "0 18px 46px rgba(0,0,0,0.34), 0 0 28px rgba(138,180,255,0.14)"
            : "0 18px 46px rgba(0,0,0,0.34), 0 0 28px rgba(255,166,82,0.12)"
          : "0 14px 34px rgba(0,0,0,0.26)",
        transform: selected ? "translateY(-2px)" : "translateY(0px)",
        transition:
          "transform 180ms ease, border-color 180ms ease, box-shadow 220ms ease, background 220ms ease, opacity 180ms ease",
        opacity: selected ? 1 : 0.96,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: isAzure
            ? "radial-gradient(460px 180px at 82% 8%, rgba(138,180,255,0.16), rgba(0,0,0,0) 60%)"
            : "radial-gradient(460px 180px at 18% 8%, rgba(255,168,94,0.18), rgba(0,0,0,0) 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, padding: "20px 20px 18px", display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.72,
                textTransform: "uppercase",
                color: selected
                  ? isAzure
                    ? "rgba(190,215,255,0.96)"
                    : "rgba(255,226,196,0.96)"
                  : "rgba(220,224,235,0.76)",
              }}
            >
              {kicker}
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: selected
                  ? isAzure
                    ? "1px solid rgba(138,180,255,0.28)"
                    : "1px solid rgba(255,196,132,0.28)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: selected
                  ? isAzure
                    ? "rgba(138,180,255,0.10)"
                    : "rgba(255,196,132,0.10)"
                  : "rgba(255,255,255,0.04)",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 0.55,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {selected ? "Chosen" : "Open Path"}
            </div>
          </div>

          <div
            style={{
              fontSize: 31,
              fontWeight: 950,
              lineHeight: 0.98,
              letterSpacing: 0.08,
              textShadow: "0 6px 18px rgba(0,0,0,0.34)",
              maxWidth: 420,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            fontSize: 13.5,
            lineHeight: 1.6,
            opacity: 0.86,
            maxWidth: 400,
          }}
        >
          {body}
        </div>

        <button
          type="button"
          onClick={onChoose}
          style={{
            justifySelf: "start",
            padding: "13px 18px",
            borderRadius: 16,
            border: selected
              ? isAzure
                ? "1px solid rgba(138,180,255,0.30)"
                : "1px solid rgba(255,196,132,0.30)"
              : "1px solid rgba(255,255,255,0.14)",
            background: selected
              ? isAzure
                ? "linear-gradient(180deg, rgba(138,180,255,0.14), rgba(18,30,60,0.18))"
                : "linear-gradient(180deg, rgba(255,196,132,0.14), rgba(56,28,12,0.18))"
              : "rgba(255,255,255,0.05)",
            color: "rgba(255,248,240,0.98)",
            fontWeight: 950,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: selected
              ? isAzure
                ? "0 0 20px rgba(138,180,255,0.10)"
                : "0 0 20px rgba(255,166,82,0.10)"
              : "none",
          }}
        >
          {selected ? "Path Chosen" : "Choose This Path"}
        </button>
      </div>
    </div>
  );
}

type Props = {
  heroTitle: string;
  heroSubtitle: string;
  presentationMode?: PresentationMode;
  dmMode: DMMode | null;
  onSetDmMode: (next: DMMode) => void;
  onEnter: () => void;
  canEnter: boolean;
  heroImageSrc: string;
  heroImageOk: boolean;
  onHeroImageError: () => void;
  chapterState: Record<ChapterKey, ChipState>;
  onJump: (key: ChapterKey) => void;
  outcomesCount: number;
  canonCount: number;
  activePartySize: number;
  unlockedPartySlots: number;
  maxPartySlots: number;
  completionRequiresFullFellowship: boolean;
};

export default function HeroOnboarding({
  heroTitle,
  heroSubtitle,
  presentationMode = "full",
  dmMode,
  onSetDmMode,
  onEnter,
  canEnter,
  heroImageSrc,
  heroImageOk,
  onHeroImageError,
  chapterState,
  onJump,
  outcomesCount,
  canonCount,
  activePartySize,
  unlockedPartySlots,
  maxPartySlots,
  completionRequiresFullFellowship,
}: Props) {
  const dmHint = useMemo(() => {
    if (dmMode === "solace-neutral") return "Solace now stands beside the threshold.";
    if (dmMode === "human") return "A human guide now stands beside the threshold.";
    return "Choose the voice that will answer when fate is invoked.";
  }, [dmMode]);

  const modeLabel = useMemo(() => {
    if (dmMode === "solace-neutral") return "Solace";
    if (dmMode === "human") return "Human";
    return "Unchosen";
  }, [dmMode]);

  const compactActiveChapter = useMemo(() => {
    const ordered: Array<{ key: ChapterKey; label: string }> = [
      { key: "mode", label: "Mode" },
      { key: "table", label: "Chronicle" },
      { key: "party", label: "Fellowship" },
      { key: "pressure", label: "Pressure" },
      { key: "map", label: "Map" },
      { key: "combat", label: "Combat" },
      { key: "action", label: "Action" },
      { key: "resolution", label: "Resolution" },
      { key: "canon", label: "Canon" },
      { key: "ledger", label: "Chronicle" },
    ];

    const next = ordered.find((item) => chapterState[item.key] === "next");
    if (next) return next.label;

    const open = ordered.find((item) => chapterState[item.key] === "open");
    if (open) return open.label;

    const lastDone = [...ordered].reverse().find((item) => chapterState[item.key] === "done");
    return lastDone?.label ?? "Mode";
  }, [chapterState]);

  if (presentationMode === "compact") {
    return (
      <section
        className="card"
        style={{
          background: "rgba(17,17,17,0.82)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 16,
          padding: 14,
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)",
              gap: 12,
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: 0.2 }}>{heroTitle}</div>
                <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>{heroSubtitle}</div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 8,
                }}
              >
                <SummaryPill label="Mode" value={modeLabel} />
                <SummaryPill label="Fellowship" value={`${activePartySize} / ${maxPartySlots}`} />
                <SummaryPill
                  label="Unlocked"
                  value={`${unlockedPartySlots} Slot${unlockedPartySlots === 1 ? "" : "s"}`}
                />
                <SummaryPill label="Chapter" value={compactActiveChapter} />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <FellowshipPips
                  active={activePartySize}
                  unlocked={unlockedPartySlots}
                  max={maxPartySlots}
                  compact
                />
                <div style={{ fontSize: 12, opacity: 0.72 }}>{dmHint}</div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.34)",
                position: "relative",
                minHeight: 138,
              }}
            >
              {heroImageOk ? (
                <img
                  src={heroImageSrc}
                  alt="Echoes of Fate"
                  onError={onHeroImageError}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    opacity: 0.82,
                    filter: "brightness(0.88) contrast(1.06) saturate(1.04)",
                    transform: "scale(1.02)",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(700px 300px at 70% 40%, rgba(255,190,120,0.12), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.10))",
                  }}
                />
              )}

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.24) 40%, rgba(0,0,0,0.52) 100%)",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  bottom: 12,
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "linear-gradient(180deg, rgba(10,10,10,0.32), rgba(10,10,10,0.58))",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 14 }}>Adventure in Progress</div>
                <div style={{ marginTop: 3, fontSize: 12, opacity: 0.78 }}>
                  One hero began the descent. The fellowship is still incomplete.
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip
                label="Mode"
                state={chapterState.mode}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("mode");
                }}
              />
              <Chip
                label="Fellowship"
                state={chapterState.party}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("party");
                }}
              />
              <Chip
                label="Table"
                state={chapterState.table}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("table");
                }}
              />
              <Chip
                label="Pressure"
                state={chapterState.pressure}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("pressure");
                }}
              />
              <Chip
                label="Map"
                state={chapterState.map}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("map");
                }}
              />
              <Chip
                label="Combat"
                state={chapterState.combat}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("combat");
                }}
              />
              <Chip
                label="Action"
                state={chapterState.action}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("action");
                }}
              />
              <Chip
                label="Resolution"
                state={chapterState.resolution}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("resolution");
                }}
              />
              <Chip
                label="Canon"
                state={chapterState.canon}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("canon");
                }}
              />
              <Chip
                label="Chronicle"
                state={chapterState.ledger}
                compact
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  onJump("ledger");
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                outcomes: <strong>{outcomesCount}</strong> · canon events: <strong>{canonCount}</strong>
              </div>
              <div style={{ fontSize: 12, opacity: 0.68 }}>
                {completionRequiresFullFellowship
                  ? "True completion remains sealed until the full fellowship stands."
                  : "The path to completion is open."}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const showFellowshipStep = dmMode !== null;
  const showEnterStep = dmMode !== null;
  const selectedModeTitle =
    dmMode === "human"
      ? "Human Dungeon Master"
      : dmMode === "solace-neutral"
        ? "Solace — Keeper of the Chronicle"
        : null;

  return (
    <section
      className="card"
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        borderRadius: 28,
        padding: "16px 0 10px",
        marginTop: 6,
        maxWidth: 1420,
        marginInline: "auto",
        overflow: "visible",
      }}
    >
      <style jsx>{`
        @keyframes heroTorchPulse {
          0% {
            filter: brightness(0.92) contrast(1.06) saturate(1.06);
          }
          50% {
            filter: brightness(1) contrast(1.1) saturate(1.12);
          }
          100% {
            filter: brightness(0.92) contrast(1.06) saturate(1.06);
          }
        }

        @keyframes heroMistShift {
          0% {
            transform: translate3d(-1%, 0, 0) scale(1.02);
            opacity: 0.18;
          }
          50% {
            transform: translate3d(1%, -1%, 0) scale(1.04);
            opacity: 0.28;
          }
          100% {
            transform: translate3d(-1%, 0, 0) scale(1.02);
            opacity: 0.18;
          }
        }

        @keyframes onboardingFadeUp {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes thresholdGlow {
          0% {
            opacity: 0.12;
          }
          50% {
            opacity: 0.24;
          }
          100% {
            opacity: 0.12;
          }
        }

        @keyframes plaqueFloatA {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes plaqueFloatB {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @media (max-width: 1260px) {
          .hero-overlay-choices {
            grid-template-columns: 1fr !important;
            left: 28px !important;
            right: 28px !important;
            top: 140px !important;
            max-width: 520px !important;
            justify-content: start !important;
          }

          .hero-scene-panel {
            min-height: 1040px !important;
          }

          .hero-viewport-bottom {
            left: 28px !important;
            right: 28px !important;
            bottom: 24px !important;
          }
        }

        @media (max-width: 760px) {
          .hero-onboarding-root {
            gap: 14px !important;
          }

          .hero-title {
            font-size: 34px !important;
          }

          .hero-subtitle {
            font-size: 16px !important;
          }

          .hero-scene-panel {
            min-height: 980px !important;
            border-radius: 22px !important;
          }

          .hero-overlay-choices {
            left: 16px !important;
            right: 16px !important;
            top: 122px !important;
            gap: 12px !important;
          }

          .hero-viewport-bottom {
            left: 16px !important;
            right: 16px !important;
            bottom: 16px !important;
          }

          .hero-viewport-bottom-title {
            font-size: 24px !important;
          }
        }
      `}</style>

      <div className="hero-onboarding-root" style={{ position: "relative", zIndex: 1, display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 8, animation: "onboardingFadeUp 300ms ease both" }}>
          <div
            className="hero-title"
            style={{
              fontSize: 54,
              fontWeight: 950,
              letterSpacing: 0.12,
              lineHeight: 0.92,
              textShadow: "0 10px 32px rgba(0,0,0,0.42)",
            }}
          >
            {heroTitle}
          </div>

          <div
            style={{
              display: "grid",
              gap: 6,
              maxWidth: 860,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.82,
                textTransform: "uppercase",
                color: "rgba(196,206,228,0.70)",
              }}
            >
              A Threshold of Fate
            </div>

            <div
              className="hero-subtitle"
              style={{
                fontSize: 18,
                lineHeight: 1.56,
                opacity: 0.88,
              }}
            >
              {heroSubtitle}
            </div>
          </div>
        </div>

        <div
          className="hero-scene-panel"
          style={{
            position: "relative",
            minHeight: 860,
            borderRadius: 30,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.28)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.48)",
            animation: "onboardingFadeUp 420ms ease both",
          }}
        >
          {heroImageOk ? (
            <img
              src={heroImageSrc}
              alt="Enter the dungeon"
              onError={onHeroImageError}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                opacity: 0.98,
                animation: "heroTorchPulse 6s ease-in-out infinite",
                transform: "scale(1.05)",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(1200px 600px at 70% 40%, rgba(255,190,120,0.12), rgba(0,0,0,0) 60%), radial-gradient(900px 500px at 40% 65%, rgba(140,170,255,0.10), rgba(0,0,0,0) 55%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.10))",
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.08) 24%, rgba(0,0,0,0.64) 100%), linear-gradient(90deg, rgba(0,0,0,0.56) 0%, rgba(0,0,0,0.10) 30%, rgba(0,0,0,0.10) 70%, rgba(0,0,0,0.56) 100%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(760px 380px at 66% 34%, rgba(255,170,90,0.15), rgba(0,0,0,0) 62%), radial-gradient(520px 280px at 35% 70%, rgba(120,150,255,0.12), rgba(0,0,0,0) 60%)",
              mixBlendMode: "screen",
              pointerEvents: "none",
              opacity: 0.94,
            }}
          />

          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 78%, rgba(235,245,255,0.18) 0%, rgba(160,180,220,0.08) 18%, rgba(0,0,0,0) 42%)",
              mixBlendMode: "screen",
              animation: "heroMistShift 8s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 52% 20%, rgba(138,180,255,0.11) 0%, rgba(138,180,255,0) 26%)",
              animation: "thresholdGlow 4.4s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          <div
            className="hero-overlay-choices"
            style={{
              position: "absolute",
              left: 34,
              right: 34,
              top: 110,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 420px))",
              justifyContent: "space-between",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div style={{ animation: "plaqueFloatA 7.2s ease-in-out infinite" }}>
              <GuideOverlayCard
                title="Human Dungeon Master"
                kicker="The Mortal Path"
                body="A living guide of instinct and improvisation. The dungeon breathes through authored rulings and human surprise."
                accent="ember"
                selected={dmMode === "human"}
                onChoose={() => {
                  playSfx(SFX.buttonClick, 0.62);
                  onSetDmMode("human");
                }}
              />
            </div>

            <div style={{ animation: "plaqueFloatB 8.2s ease-in-out infinite" }}>
              <GuideOverlayCard
                title="Solace — Keeper of the Chronicle"
                kicker="The Stewarded Path"
                body="A guide of continuity and memory. Solace stewards the descent with balance, cadence, and clarity."
                accent="azure"
                selected={dmMode === "solace-neutral"}
                onChoose={() => {
                  playSfx(SFX.buttonClick, 0.62);
                  onSetDmMode("solace-neutral");
                }}
              />
            </div>
          </div>

          <div
            className="hero-viewport-bottom"
            style={{
              position: "absolute",
              left: 34,
              right: 34,
              bottom: 28,
              display: "grid",
              gap: 18,
              justifyItems: "center",
            }}
          >
            {!showEnterStep ? (
              <div
                style={{
                  width: "min(100%, 560px)",
                  padding: "16px 18px 14px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "linear-gradient(180deg, rgba(8,8,10,0.18), rgba(8,8,10,0.58))",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: "0 12px 34px rgba(0,0,0,0.36)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 0.72,
                    textTransform: "uppercase",
                    color: "rgba(198,208,228,0.72)",
                  }}
                >
                  The Gate Stands Open
                </div>

                <div
                  className="hero-viewport-bottom-title"
                  style={{
                    marginTop: 8,
                    fontSize: 30,
                    fontWeight: 950,
                    lineHeight: 0.98,
                    letterSpacing: 0.08,
                    textShadow: "0 6px 22px rgba(0,0,0,0.34)",
                  }}
                >
                  Choose Your Guide
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    lineHeight: 1.62,
                    opacity: 0.84,
                    maxWidth: 460,
                  }}
                >
                  Choose the voice that will walk beside the threshold.
                </div>

                <div style={{ marginTop: 12, fontSize: 12.75, opacity: 0.76 }}>{dmHint}</div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    width: "min(100%, 620px)",
                    padding: "22px 22px 20px",
                    borderRadius: 24,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "linear-gradient(180deg, rgba(8,8,10,0.28), rgba(8,8,10,0.74))",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "0 14px 42px rgba(0,0,0,0.45)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 0.72,
                      textTransform: "uppercase",
                      color: "rgba(198,208,228,0.72)",
                    }}
                  >
                    The Gate Stands Open
                  </div>

                  <div
                    className="hero-viewport-bottom-title"
                    style={{
                      marginTop: 8,
                      fontSize: 36,
                      fontWeight: 950,
                      lineHeight: 0.98,
                      letterSpacing: 0.08,
                      textShadow: "0 6px 22px rgba(0,0,0,0.34)",
                    }}
                  >
                    Step Into the Dungeon
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 14.5,
                      lineHeight: 1.66,
                      opacity: 0.84,
                      maxWidth: 520,
                    }}
                  >
                    You descend with one hero only. The depths will decide whether strength or fellowship comes first.
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!canEnter) {
                          playSfx(SFX.uiFailure, 0.54);
                          return;
                        }
                        playSfx(SFX.uiSuccess, 0.68);
                        onEnter();
                      }}
                      disabled={!canEnter}
                      style={{
                        padding: "16px 24px",
                        borderRadius: 16,
                        fontWeight: 950,
                        letterSpacing: 0.35,
                        textTransform: "uppercase",
                        border: canEnter
                          ? "1px solid rgba(255,224,188,0.28)"
                          : "1px solid rgba(255,255,255,0.14)",
                        background: canEnter
                          ? "linear-gradient(180deg, rgba(255,230,198,0.16), rgba(186,96,28,0.14) 48%, rgba(40,18,8,0.68) 100%)"
                          : "rgba(255,255,255,0.04)",
                        color: "rgba(255,245,230,0.98)",
                        cursor: canEnter ? "pointer" : "not-allowed",
                        opacity: canEnter ? 1 : 0.6,
                        boxShadow: canEnter
                          ? "0 0 24px rgba(255,166,82,0.14), 0 14px 34px rgba(0,0,0,0.28)"
                          : "none",
                      }}
                    >
                      Enter the Dungeon
                    </button>

                    <div style={{ fontSize: 12.75, opacity: 0.76 }}>
                      Chosen guide: <strong>{selectedModeTitle}</strong>
                    </div>
                  </div>
                </div>

                {showFellowshipStep && (
                  <div
                    style={{
                      width: "min(100%, 780px)",
                      padding: "14px 16px",
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "linear-gradient(180deg, rgba(8,8,10,0.18), rgba(8,8,10,0.56))",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        letterSpacing: 0.68,
                        textTransform: "uppercase",
                        color: "rgba(198,208,228,0.72)",
                      }}
                    >
                      Fellowship
                    </div>

                    <div style={{ fontSize: 21, fontWeight: 950, lineHeight: 1.02 }}>
                      You Begin Alone
                    </div>

                    <div style={{ fontSize: 13.25, lineHeight: 1.56, opacity: 0.82 }}>
                      One hero crosses the threshold first. Companions are earned through trust, survival, and sacrifice.
                    </div>

                    <FellowshipPips
                      active={activePartySize}
                      unlocked={unlockedPartySlots}
                      max={maxPartySlots}
                    />

                    <div style={{ fontSize: 12.25, lineHeight: 1.52, opacity: 0.74 }}>
                      True completion remains sealed until the full fellowship of six stands assembled.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            animation: "onboardingFadeUp 540ms ease both",
          }}
        >
          <div className="muted" style={{ fontSize: 12 }}>
            outcomes: <strong>{outcomesCount}</strong> · canon events: <strong>{canonCount}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
