"use client";

// ------------------------------------------------------------
// HeroOnboarding.tsx
// ------------------------------------------------------------
// Visual-only onboarding hero.
// Receives all values and callbacks from the page orchestrator.
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

function clampInt(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}

function Chip({
  label,
  state,
  onClick,
}: {
  label: string;
  state: ChipState;
  onClick?: () => void;
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
        padding: "8px 10px",
        borderRadius: 999,
        background: bg,
        border,
        color: "rgba(255,255,255,0.92)",
        opacity,
        fontSize: 12,
        letterSpacing: 0.2,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
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

  // 3 positions: left (human), center (null), right (solace-neutral)
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
        // NOTE: disabled on purpose — this enforces "declare style" intentionally via labels,
        // while still showing neutral-middle state on arrival.
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

function PartyPips({ count }: { count: number }) {
  const n = clampInt(count, 1, 6);
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            fontSize: 16,
          }}
          title={`Adventurer ${i + 1}`}
        >
          ⚔
        </span>
      ))}
    </div>
  );
}

type Props = {
  heroTitle: string;
  heroSubtitle: string;

  dmMode: DMMode | null;
  onSetDmMode: (next: DMMode) => void;

  partySize: number;
  partyLocked: boolean;
  onSetPartySize: (n: number) => void;

  onEnter: () => void;
  canEnter: boolean;

  // hero image
  heroImageSrc: string;
  heroImageOk: boolean;
  onHeroImageError: () => void;

  // chapter nav
  chapterState: Record<ChapterKey, ChipState>;
  onJump: (key: ChapterKey) => void;

  // counts (pure display)
  outcomesCount: number;
  canonCount: number;
};

export default function HeroOnboarding({
  heroTitle,
  heroSubtitle,
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
        {/* Single title lives here */}
        <div>
          <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: 0.2 }}>{heroTitle}</div>
          <div style={{ marginTop: 6, fontSize: 14, opacity: 0.86 }}>{heroSubtitle}</div>
        </div>

        {/* Two-column hero */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          {/* LEFT */}
          <div style={{ display: "grid", gap: 12 }}>
            {/* Mode */}
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
                onSetDmMode={onSetDmMode}
                leftLabel="Human"
                rightLabel="Solace"
              />

              <div style={{ fontSize: 12, opacity: 0.78 }}>{dmHint}</div>
            </div>

            {/* Party size */}
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
                        if (dmMode === null) return;
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

            {/* Chapters */}
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
                <Chip label="Mode" state={chapterState.mode} onClick={() => onJump("mode")} />
                <Chip label="Party" state={chapterState.party} onClick={() => onJump("party")} />
                <Chip label="Table" state={chapterState.table} onClick={() => onJump("table")} />
                <Chip label="Pressure" state={chapterState.pressure} onClick={() => onJump("pressure")} />
                <Chip label="Map" state={chapterState.map} onClick={() => onJump("map")} />
                <Chip label="Combat" state={chapterState.combat} onClick={() => onJump("combat")} />
                <Chip label="Action" state={chapterState.action} onClick={() => onJump("action")} />
                <Chip label="Resolution" state={chapterState.resolution} onClick={() => onJump("resolution")} />
                <Chip label="Canon" state={chapterState.canon} onClick={() => onJump("canon")} />
                <Chip label="Chronicle" state={chapterState.ledger} onClick={() => onJump("ledger")} />
              </div>

              <div style={{ fontSize: 12, opacity: 0.70 }}>Progress unlocks the deeper chapters.</div>
            </div>
          </div>

          {/* RIGHT: cinematic tile */}
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
                  onClick={onEnter}
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

        {/* stats only */}
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="muted" style={{ fontSize: 12 }}>
            outcomes: <strong>{outcomesCount}</strong> · canon events: <strong>{canonCount}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
