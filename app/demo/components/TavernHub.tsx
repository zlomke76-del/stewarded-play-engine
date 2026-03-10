"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import TavernAxeThrow from "./TavernAxeThrow";

type Props = {
  onBeginDescent?: () => void;
};

type HubMode = "hub" | "axe-lane";

const HUB_BG = "/assets/V3/Dungeon/Tavern/tavern_01.png";
const TAVERN_AMBIENCE_A = "/assets/audio/sfx_tavern_01.mp3";
const TAVERN_AMBIENCE_B = "/assets/audio/sfx_tavern_02.mp3";
const TAVERN_BEER = "/assets/audio/sfx_tavern_beer_01.mp3";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTavernEcho(totalScore: number, bestThrowScore: number) {
  if (bestThrowScore >= 100) return "The tavern remembers a champion's hand.";
  if (totalScore >= 160) return "Word spreads that your aim is steady.";
  if (totalScore >= 90) return "A few nods follow your name.";
  if (totalScore > 0) return "You leave behind a modest impression.";
  return "No one remembers every throw. Only the sharp ones.";
}

export default function TavernHub({ onBeginDescent }: Props) {
  const [mode, setMode] = useState<HubMode>("hub");
  const [mounted, setMounted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const [lastRoundSummary, setLastRoundSummary] = useState<{
    totalScore: number;
    throwsUsed: number;
    bestThrowScore: number;
    bestThrowLabel: string;
  } | null>(null);

  const ambienceARef = useRef<HTMLAudioElement | null>(null);
  const ambienceBRef = useRef<HTMLAudioElement | null>(null);
  const beerRef = useRef<HTMLAudioElement | null>(null);
  const beerTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const hideTimer = window.setTimeout(() => setShowOverlay(false), 1800);

    ambienceARef.current = new Audio(TAVERN_AMBIENCE_A);
    ambienceARef.current.loop = true;
    ambienceARef.current.volume = 0.34;
    ambienceARef.current.play().catch(() => {});

    ambienceBRef.current = new Audio(TAVERN_AMBIENCE_B);
    ambienceBRef.current.loop = true;
    ambienceBRef.current.volume = 0.2;
    ambienceBRef.current.play().catch(() => {});

    beerRef.current = new Audio(TAVERN_BEER);
    beerRef.current.volume = 0.28;

    function scheduleBeer() {
      beerTimerRef.current = window.setTimeout(() => {
        beerRef.current?.play().catch(() => {});
        scheduleBeer();
      }, 9000 + Math.random() * 11000);
    }

    scheduleBeer();

    return () => {
      clearTimeout(hideTimer);
      if (beerTimerRef.current) window.clearTimeout(beerTimerRef.current);
      ambienceARef.current?.pause();
      ambienceBRef.current?.pause();
      beerRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const a = ambienceARef.current;
    const b = ambienceBRef.current;
    if (!a || !b) return;

    if (mode === "hub") {
      a.volume = 0.34;
      b.volume = 0.2;
    } else {
      a.volume = 0.22;
      b.volume = 0.12;
    }
  }, [mode]);

  const tavernEcho = useMemo(() => {
    if (!lastRoundSummary) {
      return "The hearth is warm, the lane is ready, and the dungeon can wait one more breath.";
    }
    return formatTavernEcho(lastRoundSummary.totalScore, lastRoundSummary.bestThrowScore);
  }, [lastRoundSummary]);

  return (
    <section
      style={{
        width: "100%",
        display: "grid",
        gap: 22,
        color: "rgba(255,245,230,0.96)",
      }}
    >
      {mode === "hub" ? (
        <>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>The Tavern Before the Descent</div>
            <div style={{ maxWidth: 860, fontSize: 15, opacity: 0.8, lineHeight: 1.6 }}>
              A warm room before a cold journey. Drink, listen, test your hand, and decide whether your next step belongs
              to the lane or the dark below.
            </div>
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 1440,
              aspectRatio: "16 / 9",
              borderRadius: 24,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 36px 90px rgba(0,0,0,0.46)",
              background: "#120b07",
            }}
          >
            <img
              src={HUB_BG}
              alt="Crowded fantasy tavern"
              draggable={false}
              style={{
                position: "absolute",
                inset: "-4%",
                width: "108%",
                height: "108%",
                objectFit: "cover",
                transform: mounted
                  ? "translate3d(-1.5%, -0.8%, 0) scale(1.045)"
                  : "translate3d(0%, 0%, 0) scale(1.08)",
                transition: "transform 2600ms ease-out",
                filter: "brightness(0.95) saturate(1.03)",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(7,4,3,0.16) 0%, rgba(7,4,3,0.10) 35%, rgba(7,4,3,0.38) 100%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                boxShadow: "inset 0 0 160px rgba(0,0,0,0.30)",
              }}
            />

            <button
              type="button"
              aria-label="Go to the axe lane"
              onClick={() => setMode("axe-lane")}
              style={{
                position: "absolute",
                left: "70.8%",
                top: "31.8%",
                width: "17%",
                height: "26%",
                borderRadius: 18,
                border: "1px solid rgba(255,225,166,0.25)",
                background: "rgba(255,198,104,0.05)",
                boxShadow: "0 0 0 1px rgba(255,214,150,0.08), 0 0 40px rgba(255,189,92,0.08)",
                cursor: "pointer",
                transition: "transform 140ms ease, background 140ms ease, box-shadow 140ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.background = "rgba(255,198,104,0.10)";
                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,214,150,0.12), 0 0 48px rgba(255,189,92,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255,198,104,0.05)";
                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,214,150,0.08), 0 0 40px rgba(255,189,92,0.08)";
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: 10,
                  bottom: 10,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(12,8,6,0.74)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,245,230,0.95)",
                  fontWeight: 900,
                  fontSize: 12,
                  letterSpacing: 0.4,
                }}
              >
                AXE LANE
              </span>
            </button>

            <div
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                top: 24,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  maxWidth: 540,
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "rgba(8,8,8,0.46)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(7px)",
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
                  Tavern Read
                </div>
                <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55 }}>
                  {tavernEcho}
                </div>
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "rgba(8,8,8,0.46)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(7px)",
                  minWidth: 200,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
                  Tonight's Mood
                </div>
                <div style={{ marginTop: 6, fontSize: 16, fontWeight: 900 }}>Warm Steel · Low Firelight</div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                bottom: 24,
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "end",
              }}
            >
              <div
                style={{
                  maxWidth: 520,
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "rgba(8,8,8,0.52)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(7px)",
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
                  House Whisper
                </div>
                <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55 }}>
                  Some heroes sharpen steel. Some steady the hand. The wise do both before the dungeon learns their name.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setMode("axe-lane")}
                  style={{
                    height: 52,
                    padding: "0 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,214,150,0.26)",
                    background: "linear-gradient(180deg, rgba(122,78,38,0.96), rgba(84,52,28,0.96))",
                    color: "rgba(255,247,233,0.96)",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 16px 30px rgba(0,0,0,0.32)",
                  }}
                >
                  Step To The Axe Lane
                </button>

                <button
                  type="button"
                  onClick={onBeginDescent}
                  style={{
                    height: 52,
                    padding: "0 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(10,10,10,0.56)",
                    color: "rgba(255,247,233,0.94)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Begin The Descent
                </button>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                opacity: showOverlay ? 1 : 0,
                transition: "opacity 900ms ease",
                background:
                  "radial-gradient(circle at center, rgba(255,215,140,0.10), rgba(0,0,0,0) 46%), rgba(0,0,0,0.18)",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
                Safe Ground
              </div>
              <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55, opacity: 0.82 }}>
                No pressure. No pursuit. A place to read the room, hear rumors, and choose your pace.
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
                Steel Before Stone
              </div>
              <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55, opacity: 0.82 }}>
                The lane is training, ritual, and reputation all at once. A throw can be practice or prophecy.
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
                Echo
              </div>
              <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55, opacity: 0.82 }}>
                {lastRoundSummary
                  ? `${lastRoundSummary.bestThrowLabel} · ${lastRoundSummary.totalScore} total`
                  : "No throws remembered yet."}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>Axe Lane</div>
              <div style={{ maxWidth: 860, fontSize: 15, opacity: 0.8, lineHeight: 1.6 }}>
                The room narrows. The voices dull. Only the target, the breath, and the hand remain.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMode("hub")}
              style={{
                height: 50,
                padding: "0 18px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(10,10,10,0.56)",
                color: "rgba(255,247,233,0.94)",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Return To Tavern
            </button>
          </div>

          <TavernAxeThrow
            onExit={() => setMode("hub")}
            onRoundComplete={(summary) => {
              setLastRoundSummary({
                totalScore: summary.totalScore,
                throwsUsed: summary.throwsUsed,
                bestThrowScore: summary.bestThrow?.score ?? 0,
                bestThrowLabel: summary.bestThrow?.label ?? "No Mark",
              });
            }}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setMode("hub")}
              style={{
                height: 50,
                padding: "0 18px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(10,10,10,0.56)",
                color: "rgba(255,247,233,0.94)",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Back To The Room
            </button>

            <button
              type="button"
              onClick={onBeginDescent}
              style={{
                height: 50,
                padding: "0 18px",
                borderRadius: 14,
                border: "1px solid rgba(255,214,150,0.26)",
                background: "linear-gradient(180deg, rgba(122,78,38,0.96), rgba(84,52,28,0.96))",
                color: "rgba(255,247,233,0.96)",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 16px 30px rgba(0,0,0,0.32)",
              }}
            >
              Descend From Here
            </button>
          </div>
        </>
      )}
    </section>
  );
}
