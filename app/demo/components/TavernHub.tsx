"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import TavernAxeThrow from "./TavernAxeThrow";

type Props = {
  onBeginDescent?: () => void;
  heroName?: string;
  heroTitle?: string;
  heroLevel?: number;
  echoCount?: number;
};

type HubMode = "hub" | "axe-lane";

const HUB_BG = "/assets/V3/Dungeon/Tavern/tavern_01.png";
const TAVERN_AMBIENCE_A = "/assets/audio/sfx_tavern_01.mp3";
const TAVERN_AMBIENCE_B = "/assets/audio/sfx_tavern_02.mp3";
const TAVERN_BEER = "/assets/audio/sfx_tavern_beer_01.mp3";
const TAVERN_BACKGROUND_LOOP = "/assets/audio/sfx_tavern_background.mp3";

function formatTavernEcho(totalScore: number, bestThrowScore: number) {
  if (bestThrowScore >= 100) return "The tavern remembers a champion's hand.";
  if (totalScore >= 160) return "Word spreads that your aim is steady.";
  if (totalScore >= 90) return "A few nods follow your name.";
  if (totalScore > 0) return "You leave behind a modest impression.";
  return "No one remembers every throw. Only the sharp ones.";
}

function ActionButton(props: {
  label: string;
  onClick?: () => void;
  tone?: "primary" | "secondary";
}) {
  const { label, onClick, tone = "secondary" } = props;

  const isPrimary = tone === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 54,
        padding: "0 20px",
        borderRadius: 14,
        border: isPrimary
          ? "1px solid rgba(255,214,150,0.28)"
          : "1px solid rgba(255,255,255,0.14)",
        background: isPrimary
          ? "linear-gradient(180deg, rgba(122,78,38,0.98), rgba(84,52,28,0.98))"
          : "rgba(10,10,10,0.58)",
        color: "rgba(255,247,233,0.96)",
        fontWeight: 900,
        letterSpacing: 0.2,
        cursor: "pointer",
        boxShadow: isPrimary ? "0 16px 30px rgba(0,0,0,0.32)" : "none",
        transition:
          "transform 140ms ease, filter 140ms ease, box-shadow 160ms ease, border-color 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.filter = "brightness(1.04)";
        if (isPrimary) {
          e.currentTarget.style.boxShadow = "0 20px 38px rgba(0,0,0,0.36)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.filter = "none";
        if (isPrimary) {
          e.currentTarget.style.boxShadow = "0 16px 30px rgba(0,0,0,0.32)";
        }
      }}
    >
      {label}
    </button>
  );
}

function GlassCard(props: {
  title: string;
  children: React.ReactNode;
  maxWidth?: number | string;
  minWidth?: number | string;
}) {
  const { title, children, maxWidth, minWidth } = props;

  return (
    <div
      style={{
        maxWidth,
        minWidth,
        padding: "14px 16px",
        borderRadius: 16,
        background: "rgba(8,8,8,0.48)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 11,
          opacity: 0.68,
          textTransform: "uppercase",
          letterSpacing: 0.7,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function TavernHub({
  onBeginDescent,
  heroName = "The Wanderer",
  heroTitle = "Unproven",
  heroLevel = 1,
  echoCount = 0,
}: Props) {
  const [mode, setMode] = useState<HubMode>("hub");
  const [mounted, setMounted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showKeeperWelcome, setShowKeeperWelcome] = useState(true);

  const [lastRoundSummary, setLastRoundSummary] = useState<{
    totalScore: number;
    throwsUsed: number;
    bestThrowScore: number;
    bestThrowLabel: string;
  } | null>(null);

  const ambienceARef = useRef<HTMLAudioElement | null>(null);
  const ambienceBRef = useRef<HTMLAudioElement | null>(null);
  const backgroundLoopRef = useRef<HTMLAudioElement | null>(null);
  const beerRef = useRef<HTMLAudioElement | null>(null);
  const beerTimerRef = useRef<number | null>(null);
  const backgroundFadeFrameRef = useRef<number | null>(null);

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

    backgroundLoopRef.current = new Audio(TAVERN_BACKGROUND_LOOP);
    backgroundLoopRef.current.loop = true;
    backgroundLoopRef.current.volume = 0;
    backgroundLoopRef.current.play().catch(() => {});

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
      if (backgroundFadeFrameRef.current) {
        window.cancelAnimationFrame(backgroundFadeFrameRef.current);
      }

      ambienceARef.current?.pause();
      ambienceBRef.current?.pause();
      backgroundLoopRef.current?.pause();
      beerRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const a = ambienceARef.current;
    const b = ambienceBRef.current;
    const bg = backgroundLoopRef.current;
    if (!a || !b || !bg) return;

    if (mode === "hub") {
      a.volume = 0.34;
      b.volume = 0.2;
    } else {
      a.volume = 0.22;
      b.volume = 0.12;
    }

    const targetBackgroundVolume = mode === "hub" ? 0.24 : 0;

    if (backgroundFadeFrameRef.current) {
      window.cancelAnimationFrame(backgroundFadeFrameRef.current);
      backgroundFadeFrameRef.current = null;
    }

    const fadeStep = () => {
      const current = bg.volume;
      const diff = targetBackgroundVolume - current;

      if (Math.abs(diff) < 0.01) {
        bg.volume = targetBackgroundVolume;
        backgroundFadeFrameRef.current = null;
        return;
      }

      bg.volume = Math.max(0, Math.min(1, current + diff * 0.08));
      backgroundFadeFrameRef.current = window.requestAnimationFrame(fadeStep);
    };

    backgroundFadeFrameRef.current = window.requestAnimationFrame(fadeStep);

    return () => {
      if (backgroundFadeFrameRef.current) {
        window.cancelAnimationFrame(backgroundFadeFrameRef.current);
        backgroundFadeFrameRef.current = null;
      }
    };
  }, [mode]);

  const tavernEcho = useMemo(() => {
    if (!lastRoundSummary) {
      return "The hearth is warm, the lane is ready, and the dungeon can wait one more breath.";
    }
    return formatTavernEcho(
      lastRoundSummary.totalScore,
      lastRoundSummary.bestThrowScore
    );
  }, [lastRoundSummary]);

  const chronicleLine = useMemo(() => {
    if (lastRoundSummary) {
      return `Best remembered mark: ${lastRoundSummary.bestThrowLabel}.`;
    }
    return "No throws have entered the Chronicle yet.";
  }, [lastRoundSummary]);

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 1520,
        margin: "0 auto",
        paddingTop: 8,
        display: "grid",
        gap: 24,
        color: "rgba(255,245,230,0.96)",
        boxSizing: "border-box",
      }}
    >
      <style jsx>{`
        @keyframes tavernFlicker {
          0% {
            opacity: 0.26;
            transform: scale(1) translate3d(0, 0, 0);
          }
          25% {
            opacity: 0.32;
            transform: scale(1.015) translate3d(0.3%, -0.2%, 0);
          }
          50% {
            opacity: 0.22;
            transform: scale(1.01) translate3d(-0.2%, 0.2%, 0);
          }
          75% {
            opacity: 0.3;
            transform: scale(1.02) translate3d(0.25%, 0.1%, 0);
          }
          100% {
            opacity: 0.26;
            transform: scale(1) translate3d(0, 0, 0);
          }
        }

        @keyframes emberRiseA {
          0% {
            transform: translate3d(0, 8px, 0) scale(0.9);
            opacity: 0;
          }
          15% {
            opacity: 0.5;
          }
          100% {
            transform: translate3d(18px, -110px, 0) scale(1.12);
            opacity: 0;
          }
        }

        @keyframes emberRiseB {
          0% {
            transform: translate3d(0, 10px, 0) scale(0.85);
            opacity: 0;
          }
          20% {
            opacity: 0.42;
          }
          100% {
            transform: translate3d(-14px, -95px, 0) scale(1.08);
            opacity: 0;
          }
        }

        @media (max-width: 1120px) {
          .tavern-hub-header {
            gap: 10px !important;
          }

          .tavern-hub-title {
            font-size: 38px !important;
          }

          .tavern-hub-stage {
            aspect-ratio: 16 / 10 !important;
          }

          .tavern-stage-top,
          .tavern-stage-bottom {
            left: 18px !important;
            right: 18px !important;
          }

          .tavern-stage-top {
            top: 18px !important;
          }

          .tavern-stage-bottom {
            bottom: 18px !important;
          }

          .tavern-lore-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 820px) {
          .tavern-hub-title {
            font-size: 30px !important;
          }

          .tavern-hub-subtitle {
            font-size: 14px !important;
          }

          .tavern-hub-stage {
            aspect-ratio: 4 / 5 !important;
            border-radius: 20px !important;
          }

          .tavern-stage-top,
          .tavern-stage-bottom {
            left: 14px !important;
            right: 14px !important;
            gap: 10px !important;
          }

          .tavern-stage-top {
            top: 14px !important;
          }

          .tavern-stage-bottom {
            bottom: 14px !important;
          }

          .tavern-stage-actions {
            width: 100% !important;
          }

          .tavern-stage-actions > :global(button),
          .tavern-stage-actions > button {
            flex: 1 1 100% !important;
          }

          .tavern-lane-hotspot {
            left: 66.5% !important;
            top: 30.5% !important;
            width: 23% !important;
            height: 28% !important;
          }
        }
      `}</style>

      {mode === "hub" ? (
        <>
          <div
            className="tavern-hub-header"
            style={{
              display: "grid",
              gap: 12,
              paddingTop: 4,
            }}
          >
            <div
              className="tavern-hub-title"
              style={{
                fontSize: 44,
                fontWeight: 950,
                letterSpacing: 0.2,
                lineHeight: 0.98,
                textShadow: "0 8px 28px rgba(0,0,0,0.34)",
              }}
            >
              The Tavern Before the Descent
            </div>

            <div
              className="tavern-hub-subtitle"
              style={{
                maxWidth: 960,
                fontSize: 16,
                opacity: 0.84,
                lineHeight: 1.7,
              }}
            >
              A warm room before a cold journey. Drink, listen, test your hand,
              and decide whether your next step belongs to the lane or the dark
              below.
            </div>
          </div>

          <div
            className="tavern-hub-stage"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 1520,
              aspectRatio: "16 / 8.8",
              borderRadius: 28,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 42px 110px rgba(0,0,0,0.50)",
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
                filter: "brightness(0.96) saturate(1.04)",
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 15% 34%, rgba(255,165,82,0.24), rgba(255,165,82,0) 24%), radial-gradient(circle at 84% 28%, rgba(255,177,84,0.22), rgba(255,177,84,0) 20%), radial-gradient(circle at 58% 20%, rgba(255,133,56,0.08), rgba(255,133,56,0) 18%)",
                mixBlendMode: "screen",
                animation: "tavernFlicker 4200ms ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "11.5%",
                bottom: "19%",
                width: 10,
                height: 10,
                borderRadius: "999px",
                background: "rgba(255,199,120,0.65)",
                filter: "blur(0.4px)",
                boxShadow: "0 0 18px rgba(255,170,88,0.5)",
                animation: "emberRiseA 3600ms linear infinite",
                pointerEvents: "none",
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "15.2%",
                bottom: "22%",
                width: 8,
                height: 8,
                borderRadius: "999px",
                background: "rgba(255,210,138,0.54)",
                filter: "blur(0.3px)",
                boxShadow: "0 0 14px rgba(255,170,88,0.45)",
                animation: "emberRiseB 4200ms linear infinite",
                animationDelay: "900ms",
                pointerEvents: "none",
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "83.8%",
                bottom: "30%",
                width: 9,
                height: 9,
                borderRadius: "999px",
                background: "rgba(255,191,105,0.56)",
                filter: "blur(0.35px)",
                boxShadow: "0 0 16px rgba(255,170,88,0.42)",
                animation: "emberRiseA 3900ms linear infinite",
                animationDelay: "1400ms",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(7,4,3,0.10) 0%, rgba(7,4,3,0.06) 28%, rgba(7,4,3,0.34) 100%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                boxShadow:
                  "inset 0 0 180px rgba(0,0,0,0.34), inset 0 -80px 120px rgba(0,0,0,0.22)",
              }}
            />

            <button
              className="tavern-lane-hotspot"
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
                boxShadow:
                  "0 0 0 1px rgba(255,214,150,0.08), 0 0 40px rgba(255,189,92,0.08)",
                cursor: "pointer",
                transition:
                  "transform 140ms ease, background 140ms ease, box-shadow 140ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.background = "rgba(255,198,104,0.10)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 1px rgba(255,214,150,0.12), 0 0 48px rgba(255,189,92,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255,198,104,0.05)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 1px rgba(255,214,150,0.08), 0 0 40px rgba(255,189,92,0.08)";
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
              className="tavern-stage-top"
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                top: 26,
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "start",
              }}
            >
              <GlassCard title="Tavern Read" maxWidth={620}>
                {tavernEcho}
              </GlassCard>

              <GlassCard title="Tonight's Mood" minWidth={240}>
                <div style={{ fontSize: 17, fontWeight: 900 }}>
                  Warm Steel · Low Firelight
                </div>
              </GlassCard>
            </div>

            <div
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                top: 106,
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "start",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  maxWidth: 420,
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "rgba(10,10,10,0.46)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.68,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                  }}
                >
                  The Chronicle
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 22,
                    fontWeight: 900,
                    lineHeight: 1.05,
                    textShadow: "0 6px 18px rgba(0,0,0,0.28)",
                  }}
                >
                  {heroName}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    opacity: 0.82,
                    fontWeight: 700,
                  }}
                >
                  {heroTitle}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    fontSize: 13,
                    opacity: 0.84,
                  }}
                >
                  <span>Level {heroLevel}</span>
                  <span>•</span>
                  <span>Echo {echoCount}</span>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    lineHeight: 1.55,
                    opacity: 0.76,
                  }}
                >
                  {chronicleLine}
                </div>
              </div>
            </div>

            {showKeeperWelcome ? (
              <div
                style={{
                  position: "absolute",
                  left: 28,
                  right: 28,
                  bottom: 112,
                  display: "flex",
                  justifyContent: "flex-start",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    maxWidth: 640,
                    padding: "16px 18px",
                    borderRadius: 18,
                    background: "rgba(7,7,7,0.62)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow: "0 20px 44px rgba(0,0,0,0.28)",
                    pointerEvents: "auto",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.68,
                      textTransform: "uppercase",
                      letterSpacing: 0.7,
                    }}
                  >
                    Tavern Keeper
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 15,
                      lineHeight: 1.7,
                      opacity: 0.92,
                    }}
                  >
                    You look new to the stone below. Most who rush the dungeon
                    regret it. Best steady your hand first.
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <ActionButton
                      label="Step To The Axe Lane"
                      tone="primary"
                      onClick={() => {
                        setShowKeeperWelcome(false);
                        setMode("axe-lane");
                      }}
                    />
                    <ActionButton
                      label="I Will Choose My Pace"
                      onClick={() => setShowKeeperWelcome(false)}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className="tavern-stage-bottom"
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                bottom: 26,
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "end",
              }}
            >
              <GlassCard title="House Whisper" maxWidth={580}>
                Some heroes sharpen steel. Some steady the hand. The wise do
                both before the dungeon learns their name.
              </GlassCard>

              <div
                className="tavern-stage-actions"
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <ActionButton
                  label="Step To The Axe Lane"
                  tone="primary"
                  onClick={() => setMode("axe-lane")}
                />
                <ActionButton
                  label="Begin The Descent"
                  onClick={onBeginDescent}
                />
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
            className="tavern-lore-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.68,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                Safe Ground
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                  opacity: 0.84,
                }}
              >
                No pressure. No pursuit. A place to read the room, hear rumors,
                and choose your pace.
              </div>
            </div>

            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.68,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                Steel Before Stone
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                  opacity: 0.84,
                }}
              >
                The lane is training, ritual, and reputation all at once. A
                throw can be practice or prophecy.
              </div>
            </div>

            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.68,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                Echo
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                  opacity: 0.84,
                }}
              >
                {lastRoundSummary
                  ? `${lastRoundSummary.bestThrowLabel} · ${lastRoundSummary.totalScore} total`
                  : "No throws remembered yet."}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "end",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>Axe Lane</div>
              <div
                style={{
                  maxWidth: 860,
                  fontSize: 15,
                  opacity: 0.82,
                  lineHeight: 1.6,
                }}
              >
                The room narrows. The voices dull. Only the target, the breath,
                and the hand remain.
              </div>
            </div>

            <ActionButton
              label="Return To Tavern"
              onClick={() => setMode("hub")}
            />
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
              setShowKeeperWelcome(false);
            }}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <ActionButton
              label="Back To The Room"
              onClick={() => setMode("hub")}
            />

            <ActionButton
              label="Descend From Here"
              tone="primary"
              onClick={onBeginDescent}
            />
          </div>
        </>
      )}
    </section>
  );
}
