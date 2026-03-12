"use client";

// ------------------------------------------------------------
// HeroOnboarding.tsx
// ------------------------------------------------------------
// Upgraded onboarding flow:
// - full mode presents a premium first-class threshold experience
// - play style is framed as a ceremonial guide choice, not a settings toggle
// - Human / Solace are rendered as two narrative selection cards
// - fellowship framing remains visible, but no longer competes with the first decision
// - compact mode still reflects fellowship progression instead of starting party size
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

function GuideCard({
  title,
  subtitle,
  body,
  accent,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  body: string;
  accent: "ember" | "azure";
  selected: boolean;
  onClick: () => void;
}) {
  const isAzure = accent === "azure";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 0,
        border: selected
          ? isAzure
            ? "1px solid rgba(138,180,255,0.42)"
            : "1px solid rgba(255,196,132,0.42)"
          : "1px solid rgba(255,255,255,0.10)",
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        background:
          selected
            ? isAzure
              ? "linear-gradient(180deg, rgba(138,180,255,0.12), rgba(18,24,36,0.92))"
              : "linear-gradient(180deg, rgba(255,196,132,0.10), rgba(28,20,14,0.92))"
            : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: selected
          ? isAzure
            ? "0 18px 40px rgba(0,0,0,0.34), 0 0 24px rgba(138,180,255,0.12)"
            : "0 18px 40px rgba(0,0,0,0.34), 0 0 24px rgba(255,166,82,0.10)"
          : "0 12px 28px rgba(0,0,0,0.22)",
        transition:
          "transform 180ms ease, border-color 180ms ease, box-shadow 220ms ease, background 220ms ease, filter 180ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.filter = "brightness(1.03)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.filter = "brightness(1)";
      }}
      aria-pressed={selected}
    >
      <div
        style={{
          position: "relative",
          padding: 18,
          display: "grid",
          gap: 10,
          minHeight: 214,
          background: isAzure
            ? "radial-gradient(520px 240px at 78% 8%, rgba(138,180,255,0.14), rgba(0,0,0,0) 62%)"
            : "radial-gradient(520px 240px at 12% 8%, rgba(255,168,94,0.16), rgba(0,0,0,0) 62%)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: isAzure
              ? "linear-gradient(180deg, rgba(120,150,255,0.06), rgba(0,0,0,0) 34%, rgba(0,0,0,0.12) 100%)"
              : "linear-gradient(180deg, rgba(255,168,94,0.06), rgba(0,0,0,0) 34%, rgba(0,0,0,0.12) 100%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 8 }}>
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
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: selected
                  ? isAzure
                    ? "rgba(190,215,255,0.96)"
                    : "rgba(255,224,188,0.96)"
                  : "rgba(255,255,255,0.7)",
              }}
            >
              {subtitle}
            </div>

            <div
              style={{
                minWidth: 76,
                height: 28,
                borderRadius: 999,
                padding: "0 10px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: selected
                  ? isAzure
                    ? "1px solid rgba(138,180,255,0.32)"
                    : "1px solid rgba(255,196,132,0.32)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: selected
                  ? isAzure
                    ? "rgba(138,180,255,0.12)"
                    : "rgba(255,196,132,0.12)"
                  : "rgba(255,255,255,0.04)",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.45,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {selected ? "Chosen" : "Choose"}
            </div>
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 950,
              lineHeight: 1.06,
              letterSpacing: 0.2,
              textShadow: "0 4px 18px rgba(0,0,0,0.28)",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              opacity: 0.84,
              maxWidth: 420,
            }}
          >
            {body}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginTop: "auto",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: isAzure ? "rgba(138,180,255,0.88)" : "rgba(255,176,96,0.88)",
              boxShadow: isAzure
                ? "0 0 16px rgba(138,180,255,0.34)"
                : "0 0 16px rgba(255,176,96,0.34)",
            }}
          />
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            {isAzure
              ? "Structured guidance, continuity, and balanced pacing."
              : "Human judgment, improvisation, and handcrafted rulings."}
          </span>
        </div>
      </div>
    </button>
  );
}

function GuideLorePanel({ dmMode }: { dmMode: DMMode | null }) {
  const title =
    dmMode === "human"
      ? "The Human Guide"
      : dmMode === "solace-neutral"
        ? "Solace — Keeper of the Chronicle"
        : "Who Will Guide the Expedition?";

  const body =
    dmMode === "human"
      ? "A human guide shapes the dungeon through live judgment, improvisation, and authored instinct. The story breathes through discretion, surprise, and table-born rulings."
      : dmMode === "solace-neutral"
        ? "Solace stewards the expedition through continuity, pacing, and consequence. The chronicle remains coherent while the descent unfolds through responsive but disciplined guidance."
        : "This choice is not a setting. It is the voice that will stand beside the threshold and interpret what comes next.";

  return (
    <div
      style={{
        padding: "14px 15px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.025))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color:
            dmMode === "solace-neutral"
              ? "rgba(190,210,255,0.9)"
              : dmMode === "human"
                ? "rgba(255,220,188,0.9)"
                : "rgba(215,220,235,0.86)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12.75,
          lineHeight: 1.6,
          opacity: 0.82,
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
    if (dmMode === "solace-neutral") return "Solace has been chosen to guide the descent.";
    if (dmMode === "human") return "A human guide has been chosen to shape the expedition.";
    return "Choose who will guide your fate at the threshold.";
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
          "linear-gradient(180deg, rgba(14,15,18,0.88), rgba(8,8,10,0.90))",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 22,
        padding: "30px 26px",
        marginTop: 20,
        boxShadow: "0 20px 70px rgba(0,0,0,0.42)",
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

        @keyframes runeGlow {
          0% {
            opacity: 0.14;
          }
          50% {
            opacity: 0.28;
          }
          100% {
            opacity: 0.14;
          }
        }

        @media (max-width: 1080px) {
          .hero-onboarding-grid {
            grid-template-columns: 1fr !important;
          }

          .hero-onboarding-guides {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .hero-onboarding-shell {
            padding: 22px 18px !important;
            border-radius: 18px !important;
          }

          .hero-onboarding-title {
            font-size: 28px !important;
          }

          .hero-onboarding-viewport {
            min-height: 320px !important;
          }

          .hero-onboarding-panel {
            padding: 14px !important;
          }
        }
      `}</style>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-140px",
          background:
            "radial-gradient(700px 420px at 50% -2%, rgba(140,160,255,0.11), transparent 72%), radial-gradient(540px 300px at 12% 14%, rgba(255,164,88,0.08), transparent 70%)",
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
            "linear-gradient(90deg, rgba(255,255,255,0.015), rgba(255,255,255,0) 14%, rgba(255,255,255,0.015) 86%, rgba(255,255,255,0.02))",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="hero-onboarding-shell" style={{ position: "relative", zIndex: 1, display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div
            className="hero-onboarding-title"
            style={{
              fontSize: 38,
              fontWeight: 950,
              letterSpacing: 0.35,
              lineHeight: 1.02,
              textShadow: "0 8px 28px rgba(0,0,0,0.42)",
            }}
          >
            {heroTitle}
          </div>

          <div
            style={{
              display: "grid",
              gap: 6,
              maxWidth: 780,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: 0.55,
                textTransform: "uppercase",
                color: "rgba(198,210,235,0.78)",
              }}
            >
              Every action leaves an echo
            </div>
            <div
              style={{
                fontSize: 15,
                opacity: 0.82,
                lineHeight: 1.5,
              }}
            >
              {heroSubtitle}
            </div>
          </div>
        </div>

        <div
          className="hero-onboarding-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.08fr) minmax(0, 0.92fr)",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
            <div
              className="hero-onboarding-panel"
              style={{
                display: "grid",
                gap: 14,
                padding: 18,
                borderRadius: 18,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.025))",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                animation: "onboardingFadeUp 320ms ease both",
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "rgba(195,205,230,0.84)",
                  }}
                >
                  The Threshold
                </div>
                <div style={{ fontWeight: 950, letterSpacing: 0.2, fontSize: 24, lineHeight: 1.08 }}>
                  Who Will Guide the Expedition?
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, maxWidth: 660 }}>
                  This is not a play-style toggle. It is the voice that stands beside the gate and
                  answers when fate is invoked.
                </div>
              </div>

              <div
                className="hero-onboarding-guides"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <GuideCard
                  title="Human Dungeon Master"
                  subtitle="Handcrafted Guidance"
                  body="A living guide interprets the world through instinct, rulings, and improvisation. Expect authored turns, table energy, and judgment shaped in the moment."
                  accent="ember"
                  selected={dmMode === "human"}
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.62);
                    onSetDmMode("human");
                  }}
                />

                <GuideCard
                  title="Solace — Keeper of the Chronicle"
                  subtitle="Stewarded Guidance"
                  body="Solace guides the descent with continuity, discipline, and narrative balance. The expedition moves with responsive pacing while consequence remains legible."
                  accent="azure"
                  selected={dmMode === "solace-neutral"}
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.62);
                    onSetDmMode("solace-neutral");
                  }}
                />
              </div>

              <GuideLorePanel dmMode={dmMode} />

              <div
                style={{
                  padding: "12px 13px",
                  borderRadius: 14,
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
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background:
                      dmMode === "solace-neutral"
                        ? "rgba(138,180,255,0.92)"
                        : dmMode === "human"
                          ? "rgba(255,180,108,0.92)"
                          : "rgba(255,255,255,0.66)",
                    boxShadow:
                      dmMode === "solace-neutral"
                        ? "0 0 16px rgba(138,180,255,0.34)"
                        : dmMode === "human"
                          ? "0 0 16px rgba(255,180,108,0.34)"
                          : "0 0 10px rgba(255,255,255,0.16)",
                  }}
                />
                <div style={{ fontSize: 12.75, opacity: 0.84 }}>{dmHint}</div>
              </div>
            </div>

            {showFellowshipStep && (
              <div
                className="hero-onboarding-panel"
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 18,
                  borderRadius: 18,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.028))",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                  animation: "onboardingFadeUp 360ms ease both",
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      color: "rgba(195,205,230,0.84)",
                    }}
                  >
                    Fellowship
                  </div>
                  <div style={{ fontWeight: 950, letterSpacing: 0.2, fontSize: 22, lineHeight: 1.08 }}>
                    You Begin Alone
                  </div>
                </div>

                <div style={{ fontSize: 13, opacity: 0.84, lineHeight: 1.62 }}>
                  One hero enters the dark. Companions are not chosen at the threshold. They are earned
                  through trust, survival, consequence, and sacrifice.
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Fellowship Progression</div>
                  <div style={{ fontSize: 12.75, opacity: 0.78, lineHeight: 1.52 }}>
                    Some milestones will force a difficult choice between deepening the hero’s power and
                    unlocking another place in the fellowship.
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
                  <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 6 }}>North Star</div>
                  <div style={{ fontSize: 12.75, lineHeight: 1.58, opacity: 0.78 }}>
                    Rare heroes may overcome horrors alone, but true campaign completion remains sealed
                    until the full fellowship of six stands assembled.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="hero-onboarding-viewport"
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.40)",
              position: "relative",
              minHeight: 430,
              boxShadow: "0 18px 50px rgba(0,0,0,0.46)",
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
                  opacity: 0.92,
                  animation: "heroTorchPulse 6s ease-in-out infinite",
                  transform: "scale(1.03)",
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
                  "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.34) 28%, rgba(0,0,0,0.32) 72%, rgba(0,0,0,0.72) 100%), radial-gradient(120% 95% at 50% 55%, rgba(0,0,0,0.04), rgba(0,0,0,0.82))",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(720px 380px at 66% 34%, rgba(255,170,90,0.12), rgba(0,0,0,0) 62%), radial-gradient(520px 280px at 35% 70%, rgba(120,150,255,0.10), rgba(0,0,0,0) 60%)",
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
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 50% 22%, rgba(138,180,255,0.10) 0%, rgba(138,180,255,0) 24%)",
                animation: "runeGlow 4.4s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 16,
                padding: 16,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "linear-gradient(180deg, rgba(10,10,10,0.34), rgba(10,10,10,0.68))",
                backdropFilter: "blur(12px)",
                boxShadow: "0 14px 42px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "rgba(198,210,235,0.78)",
                  }}
                >
                  The Chronicle Awaits
                </div>

                <div style={{ fontWeight: 950, fontSize: 24, letterSpacing: 0.2, lineHeight: 1.06 }}>
                  {showEnterStep ? "Step Through the Gate" : "Choose Your Guide"}
                </div>

                <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.58 }}>
                  {showEnterStep
                    ? "You descend with one hero only. The dungeon will decide whether strength or fellowship comes first."
                    : "Choose who will guide the expedition, and the first echo of fate will answer."}
                </div>
              </div>

              {showEnterStep ? (
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 12,
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
                      position: "relative",
                      padding: "13px 18px",
                      borderRadius: 14,
                      fontWeight: 950,
                      letterSpacing: 0.3,
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
                        ? "0 0 20px rgba(255,166,82,0.12), 0 12px 28px rgba(0,0,0,0.28)"
                        : "none",
                      transition:
                        "transform 140ms ease, filter 160ms ease, box-shadow 180ms ease, border-color 180ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!canEnter) return;
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.filter = "brightness(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 0 28px rgba(255,166,82,0.18), 0 16px 34px rgba(0,0,0,0.34)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0px)";
                      e.currentTarget.style.filter = "brightness(1)";
                      e.currentTarget.style.boxShadow = canEnter
                        ? "0 0 20px rgba(255,166,82,0.12), 0 12px 28px rgba(0,0,0,0.28)"
                        : "none";
                    }}
                  >
                    Enter the Dungeon
                  </button>

                  <div style={{ fontSize: 12.75, opacity: 0.76 }}>
                    Next: accept the scene and declare the lone hero who descends first.
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 14, fontSize: 12.75, opacity: 0.76 }}>
                  Declare a guide to continue.
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
