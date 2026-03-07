"use client";

// ------------------------------------------------------------
// HeroOnboarding.tsx
// ------------------------------------------------------------
// Visual-only onboarding hero / compact adventure header.
// Receives all values and callbacks from the page orchestrator.
//
// Upgraded:
// - supports two presentation modes:
//   1) "full"    -> pre-entry onboarding hero
//   2) "compact" -> slim adventure header after entry
// - keeps local UI SFX for mode selection, party size, chapter chips,
//   and the Enter button
// - keeps music ownership in page/orchestrator
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
    void audio.play().catch(() => {
      // fail silently; onboarding SFX should never block flow
    });
  } catch {
    // fail silently
  }
}

function clampInt(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
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
    fontSize: 12,
    opacity: disabled ? 0.6 : active ? 0.92 : 0.78,
    fontWeight: active ? 900 : 650,
    cursor: disabled ? "not-allowed" : "pointer",
    userSelect: "none" as const,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
        disabled={true}
        style={{
          width: 54,
          height: 28,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
          position: "relative",
          cursor: "default",
          padding: 0,
          opacity: disabled ? 0.65 : 1,
        }}
        title={dmMode === null ? "Declare a style" : undefined}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: 3 + knobLeft,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "rgba(220,220,255,0.85)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
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

function PartyPips({ count, compact = false }: { count: number; compact?: boolean }) {
  const n = clampInt(count, 1, 6);
  const size = compact ? 28 : 34;

  return (
    <div style={{ display: "flex", gap: compact ? 8 : 10, flexWrap: "wrap", alignItems: "center" }}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            fontSize: compact ? 13 : 16,
          }}
          title={`Adventurer ${i + 1}`}
        >
          ⚔
        </span>
      ))}
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

type Props = {
  heroTitle: string;
  heroSubtitle: string;

  presentationMode?: PresentationMode;

  dmMode: DMMode | null;
  onSetDmMode: (next: DMMode) => void;

  partySize: number;
  partyLocked: boolean;
  onSetPartySize: (n: number) => void;

  onEnter: () => void;
  canEnter: boolean;

  heroImageSrc: string;
  heroImageOk: boolean;
  onHeroImageError: () => void;

  chapterState: Record<ChapterKey, ChipState>;
  onJump: (key: ChapterKey) => void;

  outcomesCount: number;
  canonCount: number;
};

export default function HeroOnboarding({
  heroTitle,
  heroSubtitle,
  presentationMode = "full",
  dmMode,
  onSetDmMode,
  partySize,
  partyLocked,
  onSetPartySize,
  onEnter,
  canEnter,
  heroImageSrc,
  heroImageOk,
  onHeroImageError,
  chapterState,
  onJump,
  outcomesCount,
  canonCount,
}: Props) {
  const dmHint = useMemo(() => {
    if (dmMode === "solace-neutral") return "Solace keeps the adventure moving.";
    if (dmMode === "human") return "You choose how each action resolves.";
    return "Pick a style to begin.";
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
      { key: "party", label: "Party" },
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
                <SummaryPill label="Party" value={`${partySize} Adventurer${partySize === 1 ? "" : "s"}`} />
                <SummaryPill label="Chapter" value={compactActiveChapter} />
                <SummaryPill label="Canon" value={`${canonCount}`} />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <PartyPips count={partySize} compact />
                <div style={{ fontSize: 12, opacity: 0.72 }}>
                  {dmHint}
                </div>
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
                  Earlier rites are complete. The deeper chapters now take the stage.
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
              <Chip label="Party" state={chapterState.party} compact onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("party"); }} />
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
                The current chapter now owns the screen.
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="card"
      style={{
        background: "rgba(17,17,17,0.82)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: 0.2 }}>{heroTitle}</div>
          <div style={{ marginTop: 6, fontSize: 14, opacity: 0.86 }}>{heroSubtitle}</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 10,
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Choose Your Play Style</div>

              <TriToggle
                dmMode={dmMode}
                onSetDmMode={(next) => {
                  playSfx(SFX.buttonClick, 0.62);
                  onSetDmMode(next);
                }}
                leftLabel="Human"
                rightLabel="Solace"
              />

              <div style={{ fontSize: 12, opacity: 0.78 }}>{dmHint}</div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 10,
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                opacity: dmMode === null ? 0.75 : 1,
              }}
            >
              <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Party Size</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {([1, 2, 3, 4, 5, 6] as const).map((n) => {
                  const active = partySize === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        if (dmMode === null || partyLocked) {
                          playSfx(SFX.uiFailure, 0.52);
                          return;
                        }
                        playSfx(SFX.buttonClick, 0.6);
                        onSetPartySize(n);
                      }}
                      disabled={dmMode === null || partyLocked}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: active
                          ? "1px solid rgba(138,180,255,0.55)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: active ? "rgba(138,180,255,0.10)" : "rgba(255,255,255,0.04)",
                        cursor: dmMode === null || partyLocked ? "not-allowed" : "pointer",
                        opacity: dmMode === null || partyLocked ? 0.6 : 1,
                        minWidth: 36,
                        textAlign: "center",
                        fontWeight: 850,
                      }}
                      title={partyLocked ? "Party locked by canon/combat" : undefined}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.78 }}>
                  {partyLocked ? "Party locked for this session." : "Quick start — details come next."}
                </div>

                <div>
                  <div style={{ fontWeight: 900, letterSpacing: 0.2, marginBottom: 6 }}>Assemble Your Party</div>
                  <div style={{ fontSize: 12, opacity: 0.78, marginBottom: 10 }}>
                    These are the adventurers entering the dungeon.
                  </div>
                  <PartyPips count={partySize} />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 2,
                paddingTop: 10,
                borderTop: "1px solid rgba(255,255,255,0.10)",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Chapters</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip label="Mode" state={chapterState.mode} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("mode"); }} />
                <Chip label="Party" state={chapterState.party} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("party"); }} />
                <Chip label="Table" state={chapterState.table} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("table"); }} />
                <Chip label="Pressure" state={chapterState.pressure} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("pressure"); }} />
                <Chip label="Map" state={chapterState.map} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("map"); }} />
                <Chip label="Combat" state={chapterState.combat} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("combat"); }} />
                <Chip label="Action" state={chapterState.action} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("action"); }} />
                <Chip label="Resolution" state={chapterState.resolution} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("resolution"); }} />
                <Chip label="Canon" state={chapterState.canon} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("canon"); }} />
                <Chip label="Chronicle" state={chapterState.ledger} onClick={() => { playSfx(SFX.buttonClick, 0.58); onJump("ledger"); }} />
              </div>

              <div style={{ fontSize: 12, opacity: 0.70 }}>Progress unlocks the deeper chapters.</div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.40)",
              position: "relative",
              minHeight: 320,
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
                  opacity: 0.88,
                  filter: "brightness(0.90) contrast(1.08) saturate(1.08)",
                  transform: "scale(1.02)",
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
                  "linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.35) 32%, rgba(0,0,0,0.35) 68%, rgba(0,0,0,0.68) 100%), radial-gradient(120% 95% at 50% 55%, rgba(0,0,0,0.05), rgba(0,0,0,0.78))",
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
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 14,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "linear-gradient(180deg, rgba(10,10,10,0.35), rgba(10,10,10,0.62))",
                backdropFilter: "blur(10px)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: 0.2 }}>Enter the Dungeon</div>
              <div style={{ marginTop: 4, fontSize: 12, opacity: 0.80 }}>
                You declare intent. The world remembers what you do.
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
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
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontWeight: 950,
                    letterSpacing: 0.2,
                    border: canEnter ? "1px solid rgba(255,255,255,0.24)" : "1px solid rgba(255,255,255,0.18)",
                    background: canEnter ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                    cursor: canEnter ? "pointer" : "not-allowed",
                    opacity: canEnter ? 1 : 0.6,
                  }}
                >
                  Enter
                </button>

                <div style={{ fontSize: 12, opacity: 0.74 }}>
                  {dmMode === null ? "Choose a play style first." : "Next: accept the scene and start acting."}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="muted" style={{ fontSize: 12 }}>
            outcomes: <strong>{outcomesCount}</strong> · canon events: <strong>{canonCount}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
