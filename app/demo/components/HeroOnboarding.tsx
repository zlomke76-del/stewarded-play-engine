"use client";

// ------------------------------------------------------------
// HeroOnboarding.tsx
// ------------------------------------------------------------
// Direction:
// - full mode becomes a cinematic threshold scene
// - guide choice is presented as a mythic split-path decision
// - less library / dashboard energy
// - fewer nested boxes, larger typography, stronger atmosphere
// - fellowship remains, but no longer competes with the first choice
// - compact mode remains functional and unchanged in purpose
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

function GuidePathCard({
  title,
  kicker,
  body,
  pathLine,
  accent,
  selected,
  onChoose,
}: {
  title: string;
  kicker: string;
  body: string;
  pathLine: string;
  accent: "ember" | "azure";
  selected: boolean;
  onChoose: () => void;
}) {
  const isAzure = accent === "azure";

  return (
    <div
      style={{
        position: "relative",
        minHeight: 380,
        borderRadius: 26,
        overflow: "hidden",
        border: selected
          ? isAzure
            ? "1px solid rgba(138,180,255,0.42)"
            : "1px solid rgba(255,196,132,0.42)"
          : "1px solid rgba(255,255,255,0.10)",
        background:
          selected
            ? isAzure
              ? "linear-gradient(180deg, rgba(26,34,52,0.90), rgba(10,12,16,0.96))"
              : "linear-gradient(180deg, rgba(40,24,14,0.90), rgba(10,10,12,0.96))"
            : "linear-gradient(180deg, rgba(20,20,24,0.84), rgba(10,10,12,0.96))",
        boxShadow: selected
          ? isAzure
            ? "0 22px 60px rgba(0,0,0,0.42), 0 0 28px rgba(138,180,255,0.12)"
            : "0 22px 60px rgba(0,0,0,0.42), 0 0 28px rgba(255,166,82,0.10)"
          : "0 18px 46px rgba(0,0,0,0.34)",
        transition:
          "transform 180ms ease, border-color 180ms ease, box-shadow 220ms ease, filter 180ms ease",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: isAzure
            ? "radial-gradient(800px 300px at 78% 10%, rgba(138,180,255,0.18), rgba(0,0,0,0) 54%), radial-gradient(500px 240px at 22% 88%, rgba(90,130,255,0.08), rgba(0,0,0,0) 50%)"
            : "radial-gradient(800px 300px at 18% 10%, rgba(255,168,94,0.20), rgba(0,0,0,0) 54%), radial-gradient(500px 240px at 78% 88%, rgba(255,128,60,0.08), rgba(0,0,0,0) 50%)",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0) 22%, rgba(0,0,0,0.16) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          padding: "26px 24px 22px",
          gap: 20,
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: selected
                  ? isAzure
                    ? "rgba(190,215,255,0.96)"
                    : "rgba(255,226,196,0.96)"
                  : "rgba(210,216,228,0.74)",
              }}
            >
              {kicker}
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: selected
                  ? isAzure
                    ? "1px solid rgba(138,180,255,0.32)"
                    : "1px solid rgba(255,196,132,0.32)"
                  : "1px solid rgba(255,255,255,0.12)",
                background: selected
                  ? isAzure
                    ? "rgba(138,180,255,0.12)"
                    : "rgba(255,196,132,0.12)"
                  : "rgba(255,255,255,0.04)",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {selected ? "Chosen Path" : "Open Path"}
            </div>
          </div>

          <div
            style={{
              fontSize: 38,
              fontWeight: 950,
              lineHeight: 0.96,
              letterSpacing: 0.1,
              maxWidth: 420,
              textShadow: "0 6px 24px rgba(0,0,0,0.34)",
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            alignContent: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              opacity: 0.86,
              maxWidth: 430,
            }}
          >
            {body}
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              opacity: 0.74,
              maxWidth: 420,
            }}
          >
            {pathLine}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onChoose}
            style={{
              padding: "14px 18px",
              borderRadius: 14,
              border: selected
                ? isAzure
                  ? "1px solid rgba(138,180,255,0.34)"
                  : "1px solid rgba(255,196,132,0.34)"
                : "1px solid rgba(255,255,255,0.16)",
              background: selected
                ? isAzure
                  ? "linear-gradient(180deg, rgba(138,180,255,0.16), rgba(18,30,60,0.22))"
                  : "linear-gradient(180deg, rgba(255,196,132,0.14), rgba(56,28,12,0.22))"
                : "rgba(255,255,255,0.06)",
              color: "rgba(255,248,240,0.98)",
              fontWeight: 950,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: selected
                ? isAzure
                  ? "0 0 22px rgba(138,180,255,0.12)"
                  : "0 0 22px rgba(255,166,82,0.10)"
                : "none",
            }}
          >
            {selected ? "Path Chosen" : "Choose This Guide"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12.5,
              opacity: 0.76,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: isAzure ? "rgba(138,180,255,0.9)" : "rgba(255,176,96,0.9)",
                boxShadow: isAzure
                  ? "0 0 18px rgba(138,180,255,0.30)"
                  : "0 0 18px rgba(255,176,96,0.30)",
              }}
            />
            {isAzure ? "Rune-lit stewardship" : "Torch-lit judgment"}
          </div>
        </div>
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
    if (dmMode === "solace-neutral") return "Solace has taken her place beside the threshold.";
    if (dmMode === "human") return "A human guide now stands beside the gate.";
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

  return (
    <section
      className="card"
      style={{
        position: "relative",
        background:
          "linear-gradient(180deg, rgba(12,13,16,0.84), rgba(7,8,10,0.94))",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 26,
        padding: "34px 30px 28px",
        marginTop: 16,
        boxShadow: "0 26px 90px rgba(0,0,0,0.48)",
        overflow: "hidden",
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

        @media (max-width: 1180px) {
          .hero-threshold-grid {
            grid-template-columns: 1fr !important;
          }

          .hero-guide-split {
            grid-template-columns: 1fr !important;
          }

          .hero-scene-panel {
            min-height: 380px !important;
          }
        }

        @media (max-width: 760px) {
          .hero-onboarding-shell {
            gap: 18px !important;
          }

          .hero-title {
            font-size: 30px !important;
          }

          .hero-guide-card-title {
            font-size: 30px !important;
          }

          .hero-onboarding-body {
            padding: 24px 18px 22px !important;
          }

          .hero-scene-panel {
            min-height: 320px !important;
          }
        }
      `}</style>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-120px",
          background:
            "radial-gradient(840px 460px at 50% -4%, rgba(110,140,255,0.12), transparent 72%), radial-gradient(760px 400px at 0% 34%, rgba(255,128,42,0.08), transparent 70%), radial-gradient(760px 400px at 100% 34%, rgba(255,170,90,0.06), transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.012), rgba(255,255,255,0) 16%, rgba(255,255,255,0.012) 84%, rgba(255,255,255,0.018))",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="hero-onboarding-shell" style={{ position: "relative", zIndex: 1, display: "grid", gap: 24 }}>
        <div style={{ display: "grid", gap: 10, animation: "onboardingFadeUp 320ms ease both" }}>
          <div
            className="hero-title"
            style={{
              fontSize: 46,
              fontWeight: 950,
              letterSpacing: 0.2,
              lineHeight: 0.96,
              textShadow: "0 10px 32px rgba(0,0,0,0.42)",
            }}
          >
            {heroTitle}
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
              maxWidth: 860,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: "rgba(196,206,228,0.76)",
              }}
            >
              A Threshold of Fate
            </div>

            <div
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                opacity: 0.86,
              }}
            >
              {heroSubtitle}
            </div>
          </div>
        </div>

        <div
          className="hero-threshold-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.36fr) minmax(0, 0.84fr)",
            gap: 22,
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                display: "grid",
                gap: 10,
                animation: "onboardingFadeUp 360ms ease both",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 0.72,
                  textTransform: "uppercase",
                  color: "rgba(198,208,228,0.72)",
                }}
              >
                Who Will Guide the Expedition?
              </div>

              <div
                style={{
                  fontSize: 20,
                  lineHeight: 1.6,
                  opacity: 0.82,
                  maxWidth: 900,
                }}
              >
                Choose the voice that will stand beside the gate and answer when the first echo is made.
              </div>
            </div>

            <div
              className="hero-guide-split"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
                animation: "onboardingFadeUp 420ms ease both",
              }}
            >
              <GuidePathCard
                title="Human Dungeon Master"
                kicker="The Mortal Path"
                body="A living guide of instinct, judgment, and improvisation. The dungeon breathes through authored rulings, table energy, and the surprise of human discretion."
                pathLine="Choose this path for handcrafted turns, narrative instinct, and the warmth of a torch carried by mortal hands."
                accent="ember"
                selected={dmMode === "human"}
                onChoose={() => {
                  playSfx(SFX.buttonClick, 0.62);
                  onSetDmMode("human");
                }}
              />

              <GuidePathCard
                title="Solace — Keeper of the Chronicle"
                kicker="The Stewarded Path"
                body="A guide of continuity, consequence, and measured cadence. Solace stewards the descent with balance, memory, and a clear sense of what the journey becomes."
                pathLine="Choose this path for rune-lit guidance, narrative continuity, and a chronicle that remembers the shape of your choices."
                accent="azure"
                selected={dmMode === "solace-neutral"}
                onChoose={() => {
                  playSfx(SFX.buttonClick, 0.62);
                  onSetDmMode("solace-neutral");
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                animation: "onboardingFadeUp 500ms ease both",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background:
                      dmMode === "solace-neutral"
                        ? "rgba(138,180,255,0.92)"
                        : dmMode === "human"
                          ? "rgba(255,180,108,0.92)"
                          : "rgba(255,255,255,0.66)",
                    boxShadow:
                      dmMode === "solace-neutral"
                        ? "0 0 18px rgba(138,180,255,0.34)"
                        : dmMode === "human"
                          ? "0 0 18px rgba(255,180,108,0.34)"
                          : "0 0 10px rgba(255,255,255,0.16)",
                  }}
                />
                <div style={{ fontSize: 13.25, opacity: 0.84 }}>{dmHint}</div>
              </div>

              {showFellowshipStep && (
                <div
                  style={{
                    padding: "18px 18px 16px",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        color: "rgba(198,208,228,0.72)",
                      }}
                    >
                      Fellowship
                    </div>

                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 950,
                        lineHeight: 1.06,
                      }}
                    >
                      You Begin Alone
                    </div>
                  </div>

                  <div style={{ fontSize: 14, lineHeight: 1.65, opacity: 0.82, maxWidth: 900 }}>
                    One hero crosses the threshold first. Companions are not declared here. They are earned through trust, survival, and sacrifice.
                  </div>

                  <FellowshipPips
                    active={activePartySize}
                    unlocked={unlockedPartySlots}
                    max={maxPartySlots}
                  />

                  <div style={{ fontSize: 12.75, lineHeight: 1.62, opacity: 0.74 }}>
                    Rare heroes may survive impossible things alone, but true completion remains sealed until the full fellowship of six stands assembled.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="hero-scene-panel"
            style={{
              position: "relative",
              minHeight: 560,
              borderRadius: 26,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.38)",
              boxShadow: "0 22px 60px rgba(0,0,0,0.46)",
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
                  opacity: 0.94,
                  animation: "heroTorchPulse 6s ease-in-out infinite",
                  transform: "scale(1.035)",
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
                  "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.12) 18%, rgba(0,0,0,0.58) 100%), linear-gradient(90deg, rgba(0,0,0,0.54) 0%, rgba(0,0,0,0.16) 30%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.58) 100%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(720px 380px at 66% 34%, rgba(255,170,90,0.14), rgba(0,0,0,0) 62%), radial-gradient(520px 280px at 35% 70%, rgba(120,150,255,0.12), rgba(0,0,0,0) 60%)",
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
              className="hero-onboarding-body"
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 18,
                padding: "22px 20px 18px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "linear-gradient(180deg, rgba(8,8,10,0.26), rgba(8,8,10,0.72))",
                backdropFilter: "blur(12px)",
                boxShadow: "0 14px 42px rgba(0,0,0,0.45)",
                display: "grid",
                gap: 10,
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
                style={{
                  fontSize: 30,
                  fontWeight: 950,
                  lineHeight: 0.98,
                  letterSpacing: 0.1,
                  textShadow: "0 6px 22px rgba(0,0,0,0.34)",
                }}
              >
                {showEnterStep ? "Step Into the Dungeon" : "Choose Your Guide"}
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  opacity: 0.82,
                  maxWidth: 480,
                }}
              >
                {showEnterStep
                  ? "You enter with one hero only. The depths will decide whether strength or fellowship comes first."
                  : "Choose the voice that will walk beside the threshold, and the first echo of fate will answer."}
              </div>

              {showEnterStep ? (
                <div
                  style={{
                    marginTop: 6,
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
                      padding: "15px 22px",
                      borderRadius: 15,
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
                    Next: accept the scene and declare the lone hero who descends first.
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 6, fontSize: 12.75, opacity: 0.76 }}>
                  Declare a guide to continue.
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            animation: "onboardingFadeUp 560ms ease both",
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
