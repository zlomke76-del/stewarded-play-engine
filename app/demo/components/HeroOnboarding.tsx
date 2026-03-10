"use client";

// ------------------------------------------------------------
// HeroOnboarding.tsx
// ------------------------------------------------------------
// Updated onboarding flow:
// - full mode uses progressive reveal
// - opening state shows:
//    1) title + subtitle
//    2) Choose Your Play Style
//    3) begin-alone / fellowship framing
//    4) cinematic hero image panel
// - Party Size selection is removed
// - compact mode reflects fellowship progression instead of starting party size
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

function TriToggle({
  dmMode,
  onSetDmMode,
  leftLabel,
  rightLabel,
  disabled,
}: {
  dmMode: DMMode | null;
  onSetDmMode: (next: DMMode) => void;
  leftLabel: string;
  rightLabel: string;
  disabled?: boolean;
}) {
  const isHuman = dmMode === "human";
  const isSolace = dmMode === "solace-neutral";
  const knobLeft = dmMode === null ? 16 : isSolace ? 32 : 0;

  const labelStyle = (active: boolean) => ({
    fontSize: 13,
    opacity: disabled ? 0.6 : active ? 0.96 : 0.8,
    fontWeight: active ? 900 : 700,
    cursor: disabled ? "not-allowed" : "pointer",
    userSelect: "none" as const,
    transition: "opacity 140ms ease, transform 140ms ease",
    transform: active ? "translateY(-1px)" : "translateY(0px)",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => !disabled && onSetDmMode("human")}
        disabled={!!disabled}
        style={{
          all: "unset",
          ...labelStyle(isHuman),
        }}
      >
        {leftLabel}
      </button>

      <button
        type="button"
        aria-label="toggle"
        disabled
        style={{
          width: 58,
          height: 30,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
          position: "relative",
          cursor: "default",
          padding: 0,
          opacity: disabled ? 0.65 : 1,
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.24)",
        }}
        title={dmMode === null ? "Declare a style" : undefined}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: 3 + knobLeft,
            width: 24,
            height: 24,
            borderRadius: 999,
            background: "rgba(220,220,255,0.88)",
            boxShadow:
              "0 0 0 1px rgba(0,0,0,0.22), 0 0 18px rgba(150,175,255,0.18)",
            transition: "left 160ms ease",
          }}
        />
      </button>

      <button
        type="button"
        onClick={() => !disabled && onSetDmMode("solace-neutral")}
        disabled={!!disabled}
        style={{
          all: "unset",
          ...labelStyle(isSolace),
        }}
      >
        {rightLabel}
      </button>
    </div>
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

function ModeLoreBlock({ dmMode }: { dmMode: DMMode | null }) {
  const title =
    dmMode === "human"
      ? "Human Dungeon Master"
      : dmMode === "solace-neutral"
        ? "Solace Dungeon Master"
        : "Choose Who Guides the Adventure";

  const body =
    dmMode === "human"
      ? "A human DM interprets the world through judgment, improvisation, and personal storytelling. You shape the pace, tone, and consequences by hand."
      : dmMode === "solace-neutral"
        ? "Solace guides the expedition with responsive pacing and narrative continuity. The dungeon keeps moving while preserving balance, tone, and consequence."
        : "A human DM offers handcrafted control and creative rulings. Solace offers a living guided flow that keeps the story moving through the dark.";

  return (
    <div
      style={{
        padding: "12px 13px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 0.45,
          textTransform: "uppercase",
          color: "rgba(190,205,255,0.88)",
          marginBottom: 7,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.55,
          opacity: 0.8,
        }}
      >
        {body}
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
    if (dmMode === "solace-neutral") return "Solace keeps the adventure moving.";
    if (dmMode === "human") return "You decide how each action resolves.";
    return "Choose who guides the fate of the expedition.";
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
                <SummaryPill label="Unlocked" value={`${unlockedPartySlots} Slot${unlockedPartySlots === 1 ? "" : "s"}`} />
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
              <Chip label="Mode" state={chapterState.mode} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("mode"); }} />
              <Chip label="Fellowship" state={chapterState.party} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("party"); }} />
              <Chip label="Table" state={chapterState.table} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("table"); }} />
              <Chip label="Pressure" state={chapterState.pressure} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("pressure"); }} />
              <Chip label="Map" state={chapterState.map} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("map"); }} />
              <Chip label="Combat" state={chapterState.combat} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("combat"); }} />
              <Chip label="Action" state={chapterState.action} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("action"); }} />
              <Chip label="Resolution" state={chapterState.resolution} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("resolution"); }} />
              <Chip label="Canon" state={chapterState.canon} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("canon"); }} />
              <Chip label="Chronicle" state={chapterState.ledger} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("ledger"); }} />
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
          "linear-gradient(180deg, rgba(17,17,17,0.86), rgba(10,10,10,0.86))",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 18,
        padding: "28px 24px",
        marginTop: 20,
        boxShadow: "0 18px 60px rgba(0,0,0,0.36)",
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
      `}</style>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-120px",
          background:
            "radial-gradient(600px 400px at 50% 0%, rgba(140,160,255,0.10), transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 950,
              letterSpacing: 0.4,
              lineHeight: 1.04,
              textShadow: "0 6px 24px rgba(0,0,0,0.38)",
            }}
          >
            {heroTitle}
          </div>
          <div
            style={{
              fontSize: 15,
              opacity: 0.82,
              lineHeight: 1.45,
              maxWidth: 700,
            }}
          >
            {heroSubtitle}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.06fr) minmax(0, 0.94fr)",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <div
              style={{
                display: "grid",
                gap: 12,
                padding: 16,
                borderRadius: 16,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.028))",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                animation: "onboardingFadeUp 300ms ease both",
              }}
            >
              <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 18 }}>
                Choose Your Play Style
              </div>

              <TriToggle
                dmMode={dmMode}
                onSetDmMode={(next) => {
                  playSfx(SFX.buttonClick, 0.62);
                  onSetDmMode(next);
                }}
                leftLabel="Human"
                rightLabel="Solace"
              />

              <div style={{ fontSize: 12.5, opacity: 0.82, lineHeight: 1.45 }}>{dmHint}</div>

              <ModeLoreBlock dmMode={dmMode} />
            </div>

            {showFellowshipStep && (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 16,
                  borderRadius: 16,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.028))",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                  animation: "onboardingFadeUp 320ms ease both",
                }}
              >
                <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 18 }}>
                  You Begin Alone
                </div>

                <div style={{ fontSize: 12.5, opacity: 0.84, lineHeight: 1.55 }}>
                  One hero enters the dark. Fellowship is not chosen at the threshold — it is earned
                  through survival, consequence, trust, and sacrifice.
                </div>

                <div style={{ display: "grid", gap: 9 }}>
                  <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>
                    Fellowship Progression
                  </div>
                  <div style={{ fontSize: 12.5, opacity: 0.78, lineHeight: 1.45 }}>
                    Power and companionship will not always grow together. Some milestones will force a
                    choice between strengthening the hero and unlocking another place in the fellowship.
                  </div>
                  <FellowshipPips
                    active={activePartySize}
                    unlocked={unlockedPartySlots}
                    max={maxPartySlots}
                  />
                </div>

                <div
                  style={{
                    padding: "12px 13px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 6 }}>
                    North Star
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55, opacity: 0.78 }}>
                    Rare heroes may defeat impossible things alone, but true campaign completion remains
                    sealed until the full fellowship of six stands assembled.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.40)",
              position: "relative",
              minHeight: 360,
              boxShadow: "0 16px 44px rgba(0,0,0,0.42)",
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
                  opacity: 0.9,
                  animation: "heroTorchPulse 6s ease-in-out infinite",
                  transform: "scale(1.025)",
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
                  "linear-gradient(90deg, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.34) 32%, rgba(0,0,0,0.34) 68%, rgba(0,0,0,0.70) 100%), radial-gradient(120% 95% at 50% 55%, rgba(0,0,0,0.04), rgba(0,0,0,0.82))",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(700px 360px at 65% 35%, rgba(255,170,90,0.10), rgba(0,0,0,0) 62%), radial-gradient(520px 280px at 35% 70%, rgba(120,150,255,0.08), rgba(0,0,0,0) 60%)",
                mixBlendMode: "screen",
                pointerEvents: "none",
                opacity: 0.9,
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
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 14,
                padding: 14,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "linear-gradient(180deg, rgba(10,10,10,0.34), rgba(10,10,10,0.64))",
                backdropFilter: "blur(10px)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: 0.2 }}>
                {showEnterStep ? "Enter the Dungeon" : "The Journey Begins"}
              </div>
              <div style={{ marginTop: 5, fontSize: 12.5, opacity: 0.82, lineHeight: 1.45 }}>
                {showEnterStep
                  ? "You enter with one hero only. The depths will decide whether strength or fellowship comes first."
                  : "Choose who guides the expedition, and the echoes of fate will answer."}
              </div>

              {showEnterStep ? (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
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
                      padding: "11px 16px",
                      borderRadius: 12,
                      fontWeight: 950,
                      letterSpacing: 0.2,
                      border: canEnter
                        ? "1px solid rgba(255,255,255,0.24)"
                        : "1px solid rgba(255,255,255,0.18)",
                      background: canEnter
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(255,255,255,0.04)",
                      cursor: canEnter ? "pointer" : "not-allowed",
                      opacity: canEnter ? 1 : 0.6,
                      boxShadow: canEnter ? "0 0 18px rgba(255,255,255,0.06)" : "none",
                    }}
                  >
                    Enter
                  </button>

                  <div style={{ fontSize: 12.5, opacity: 0.76 }}>
                    Next: accept the scene and declare the lone hero who descends first.
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 12, fontSize: 12.5, opacity: 0.76 }}>
                  Choose a play style to continue.
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 2,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
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
