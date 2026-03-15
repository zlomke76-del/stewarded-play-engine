// app/demo/components/InitialTableSection.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";
import type { DMMode, InitialTable } from "../demoTypes";

type Props = {
  dmMode: DMMode | null;
  initialTable: InitialTable | null;
  tableAccepted: boolean;
  tableDraftText: string;
  setTableDraftText: (next: string) => void;
  onAccept: () => void;
};

const ACCEPT_LABEL = "Begin the Descent";

const SFX = {
  buttonClick: "/assets/audio/sfx_button_click_01.mp3",
  uiSuccess: "/assets/audio/sfx_success_01.mp3",
  uiFailure: "/assets/audio/sfx_failure_01.mp3",
  stoneDoor: "/assets/audio/sfx_stone_door_01.mp3",
  quillWritingA: "/assets/audio/sfx_quill_pen_scroll_01.mp3",
  quillWritingB: "/assets/audio/sfx_quill_pen_scroll_02.mp3",
  waxSeal: "/assets/audio/sfx_wax_seal_01.mp3",
} as const;

const LINE_REVEAL_MS = 1180;
const START_DELAY_MS = 420;
const FADE_STAGGER_MS = 120;
const SEAL_REVEAL_DELAY_MS = 280;
const EMBER_COUNT = 10;
const DESCENT_TRANSITION_DELAY_MS = 900;

function playSfx(src: string, volume = 0.68) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // fail silently; UI audio should never block flow
    });
  } catch {
    // fail silently
  }
}

function buildNarrationLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/\r/g, "").trimEnd())
    .filter((line) => line.trim().length > 0);
}

function buildEmbers(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    return {
      id: `ember-${seed}`,
      left: 12 + ((seed * 71) % 76),
      delay: (seed % 5) * 70,
      size: 4 + (seed % 4) * 2,
      duration: 1200 + (seed % 4) * 220,
      rise: 18 + (seed % 5) * 8,
      drift: -18 + (seed % 7) * 6,
      opacity: 0.24 + (seed % 3) * 0.12,
    };
  });
}

export default function InitialTableSection({
  dmMode,
  initialTable,
  tableAccepted,
  tableDraftText,
  setTableDraftText,
  onAccept,
}: Props) {
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const startTimerRef = useRef<number | null>(null);
  const sealTimerRef = useRef<number | null>(null);
  const acceptTimerRef = useRef<number | null>(null);
  const activeQuillAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextQuillVariantRef = useRef<"a" | "b">("a");
  const sealSfxPlayedRef = useRef(false);

  const narrationLines = useMemo(
    () => buildNarrationLines(tableDraftText),
    [tableDraftText]
  );

  const embers = useMemo(() => buildEmbers(EMBER_COUNT), []);

  const [revealedCount, setRevealedCount] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [writingStarted, setWritingStarted] = useState(false);
  const [showSignals, setShowSignals] = useState(false);
  const [showWaxSeal, setShowWaxSeal] = useState(false);
  const [sealPulseActive, setSealPulseActive] = useState(false);
  const [showEmberBurst, setShowEmberBurst] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const writingComplete =
    narrationLines.length === 0 || revealedCount >= narrationLines.length;

  function stopQuillSound() {
    const audio = activeQuillAudioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // fail silently
    } finally {
      activeQuillAudioRef.current = null;
    }
  }

  function playAlternatingQuillSound() {
    stopQuillSound();

    try {
      const useA = nextQuillVariantRef.current === "a";
      const src = useA ? SFX.quillWritingA : SFX.quillWritingB;

      const audio = new Audio(src);
      audio.volume = 0.24;
      activeQuillAudioRef.current = audio;

      nextQuillVariantRef.current = useA ? "b" : "a";

      void audio.play().catch(() => {
        // fail silently if autoplay is blocked or asset is missing
      });
    } catch {
      // fail silently
    }
  }

  function clearAllTimers() {
    if (startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (revealTimerRef.current !== null) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (sealTimerRef.current !== null) {
      window.clearTimeout(sealTimerRef.current);
      sealTimerRef.current = null;
    }
    if (acceptTimerRef.current !== null) {
      window.clearTimeout(acceptTimerRef.current);
      acceptTimerRef.current = null;
    }
  }

  function triggerSealMoment() {
    setShowWaxSeal(true);
    setSealPulseActive(true);
    setShowEmberBurst(true);

    window.setTimeout(() => {
      setSealPulseActive(false);
    }, 900);

    window.setTimeout(() => {
      setShowEmberBurst(false);
    }, 1450);

    if (!sealSfxPlayedRef.current) {
      sealSfxPlayedRef.current = true;
      playSfx(SFX.waxSeal, 0.72);
    }
  }

  function handleAccept() {
    if (isAccepting) return;

    if (dmMode === "solace-neutral" && !writingComplete) {
      playSfx(SFX.uiFailure, 0.58);
      return;
    }

    setIsAccepting(true);
    playSfx(SFX.uiSuccess, 0.72);
    playSfx(SFX.stoneDoor, 0.56);

    acceptTimerRef.current = window.setTimeout(() => {
      onAccept();
    }, DESCENT_TRANSITION_DELAY_MS);
  }

  useEffect(() => {
    if (dmMode !== "solace-neutral" || tableAccepted || !initialTable) {
      clearAllTimers();
      stopQuillSound();
      setIsWriting(false);
      setWritingStarted(false);
      setRevealedCount(0);
      setShowWaxSeal(false);
      setSealPulseActive(false);
      setShowEmberBurst(false);
      setIsAccepting(false);
      sealSfxPlayedRef.current = false;
      return;
    }

    setRevealedCount(0);
    setIsWriting(false);
    setWritingStarted(false);
    setShowWaxSeal(false);
    setSealPulseActive(false);
    setShowEmberBurst(false);
    setIsAccepting(false);
    nextQuillVariantRef.current = "a";
    sealSfxPlayedRef.current = false;

    if (narrationLines.length === 0) {
      setWritingStarted(true);
      return;
    }

    startTimerRef.current = window.setTimeout(() => {
      setWritingStarted(true);
      setIsWriting(true);

      playAlternatingQuillSound();
      setRevealedCount(1);

      if (narrationLines.length <= 1) {
        clearAllTimers();
        stopQuillSound();
        setIsWriting(false);
        setRevealedCount(narrationLines.length);
        return;
      }

      revealTimerRef.current = window.setInterval(() => {
        setRevealedCount((prev) => {
          const next = prev + 1;

          if (next >= narrationLines.length) {
            clearAllTimers();
            stopQuillSound();
            setIsWriting(false);
            return narrationLines.length;
          }

          playAlternatingQuillSound();
          return next;
        });
      }, LINE_REVEAL_MS);
    }, START_DELAY_MS);

    return () => {
      clearAllTimers();
      stopQuillSound();
    };
  }, [dmMode, tableAccepted, initialTable, narrationLines.length]);

  useEffect(() => {
    if (!scrollBodyRef.current) return;
    scrollBodyRef.current.scrollTo({
      top: scrollBodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [revealedCount]);

  useEffect(() => {
    if (!writingComplete || dmMode !== "solace-neutral") {
      if (sealTimerRef.current !== null) {
        window.clearTimeout(sealTimerRef.current);
        sealTimerRef.current = null;
      }
      return;
    }

    if (showWaxSeal) return;

    sealTimerRef.current = window.setTimeout(() => {
      triggerSealMoment();
    }, SEAL_REVEAL_DELAY_MS);

    return () => {
      if (sealTimerRef.current !== null) {
        window.clearTimeout(sealTimerRef.current);
        sealTimerRef.current = null;
      }
    };
  }, [writingComplete, dmMode, showWaxSeal]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      stopQuillSound();
    };
  }, []);

  if (dmMode === null) return <Disclaimer />;

  if (tableAccepted) return null;

  if (!initialTable) {
    return (
      <CardSection title="Opening Chronicle">
        <div className="muted">Preparing the chronicle…</div>
      </CardSection>
    );
  }

  if (dmMode === "solace-neutral") {
    return (
      <CardSection title="Opening Chronicle">
        <p className="muted" style={{ marginBottom: 10 }}>
          The first record of your descent is being inscribed.
        </p>

        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 16,
            border: "1px solid rgba(205, 162, 96, 0.28)",
            background:
              "radial-gradient(circle at top, rgba(255,206,128,0.12), rgba(31,18,8,0.16) 28%, rgba(15,10,6,0.18) 60%), linear-gradient(180deg, rgba(75,49,24,0.96), rgba(45,28,13,0.98))",
            boxShadow:
              "inset 0 0 0 1px rgba(255,220,160,0.05), inset 0 18px 40px rgba(255,208,136,0.08), 0 16px 40px rgba(0,0,0,0.28)",
            padding: "22px 22px 18px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 20% 0%, rgba(255,236,188,0.18), transparent 22%), radial-gradient(circle at 80% 18%, rgba(255,214,122,0.09), transparent 18%), linear-gradient(180deg, rgba(255,231,179,0.08), transparent 20%, transparent 80%, rgba(0,0,0,0.16))",
              mixBlendMode: "screen",
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: sealPulseActive ? 1 : 0,
              transition: "opacity 260ms ease",
              background: sealPulseActive
                ? "radial-gradient(circle at 50% 72%, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.26) 26%, rgba(0,0,0,0.12) 52%, transparent 76%)"
                : "transparent",
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: sealPulseActive ? 1 : 0,
              transition: "opacity 260ms ease",
              background: sealPulseActive
                ? "radial-gradient(circle at 50% 78%, rgba(255,140,52,0.14) 0%, rgba(255,116,26,0.08) 18%, transparent 34%)"
                : "transparent",
              filter: "blur(8px)",
            }}
          />

          {showEmberBurst && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "hidden",
              }}
            >
              {embers.map((ember) => (
                <div
                  key={ember.id}
                  style={{
                    position: "absolute",
                    left: `${ember.left}%`,
                    bottom: 70,
                    width: ember.size,
                    height: ember.size,
                    borderRadius: "999px",
                    background:
                      "radial-gradient(circle, rgba(255,236,191,0.98) 0%, rgba(255,170,71,0.92) 36%, rgba(255,101,28,0.55) 70%, rgba(255,101,28,0) 100%)",
                    boxShadow:
                      "0 0 10px rgba(255,160,62,0.34), 0 0 18px rgba(255,118,36,0.18)",
                    opacity: ember.opacity,
                    animation: `sealEmberRise ${ember.duration}ms ease-out ${ember.delay}ms forwards`,
                    transform: `translate3d(0, 0, 0)`,
                    ["--ember-rise" as any]: `-${ember.rise}px`,
                    ["--ember-drift" as any]: `${ember.drift}px`,
                  }}
                />
              ))}
            </div>
          )}

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              top: 10,
              height: 16,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(70,45,20,0.7), rgba(120,86,49,0.95), rgba(70,45,20,0.7))",
              boxShadow:
                "inset 0 2px 4px rgba(255,219,162,0.08), inset 0 -2px 4px rgba(0,0,0,0.28)",
              opacity: 0.9,
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 10,
              height: 16,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(70,45,20,0.7), rgba(120,86,49,0.95), rgba(70,45,20,0.7))",
              boxShadow:
                "inset 0 2px 4px rgba(255,219,162,0.08), inset 0 -2px 4px rgba(0,0,0,0.28)",
              opacity: 0.9,
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              padding: "18px 18px 22px",
              borderRadius: 12,
              background:
                "linear-gradient(180deg, rgba(246,225,185,0.9), rgba(228,200,154,0.92) 45%, rgba(210,178,131,0.94))",
              color: "#2a1709",
              border: "1px solid rgba(115,75,32,0.34)",
              boxShadow:
                "inset 0 1px 0 rgba(255,244,220,0.6), inset 0 -12px 24px rgba(102,65,26,0.08)",
              transition: "filter 260ms ease, transform 260ms ease",
              filter: sealPulseActive ? "brightness(0.94) saturate(0.92)" : "none",
              transform: sealPulseActive ? "translateY(1px)" : "translateY(0)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    opacity: 0.72,
                  }}
                >
                  Opening Chronicle
                </div>
                <div
                  style={{
                    fontSize: 14,
                    opacity: 0.78,
                    marginTop: 2,
                  }}
                >
                  The first record of your descent
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.46);
                  clearAllTimers();
                  stopQuillSound();
                  setWritingStarted(true);
                  setIsWriting(false);
                  setRevealedCount(narrationLines.length);
                  triggerSealMoment();
                }}
                style={{
                  borderRadius: 999,
                  padding: "6px 10px",
                  border: "1px solid rgba(78,45,17,0.28)",
                  background: "rgba(255,247,230,0.38)",
                  color: "#3a2310",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: writingComplete ? "default" : "pointer",
                  opacity: writingComplete ? 0.45 : 1,
                }}
                disabled={writingComplete}
              >
                Skip Writing
              </button>
            </div>

            <div
              ref={scrollBodyRef}
              style={{
                position: "relative",
                minHeight: 260,
                maxHeight: 520,
                overflowY: "auto",
                paddingRight: 10,
              }}
            >
              {!writingStarted && (
                <div
                  style={{
                    paddingTop: 16,
                    fontStyle: "italic",
                    opacity: 0.7,
                    lineHeight: 1.7,
                  }}
                >
                  The quill hovers above the page…
                </div>
              )}

              {narrationLines.slice(0, revealedCount).map((line, idx) => {
                const isCurrent = idx === revealedCount - 1 && isWriting;
                return (
                  <div
                    key={`${idx}-${line}`}
                    style={{
                      position: "relative",
                      paddingLeft: isCurrent ? 34 : 0,
                      marginBottom: 14,
                      lineHeight: 1.9,
                      fontSize: 16,
                      letterSpacing: "0.01em",
                      opacity: 1,
                      transform: "translateY(0)",
                      transition: `opacity 360ms ease ${idx * FADE_STAGGER_MS}ms, transform 360ms ease ${idx * FADE_STAGGER_MS}ms`,
                      textShadow: "0 1px 0 rgba(255,248,232,0.22)",
                    }}
                  >
                    {isCurrent && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 1,
                          fontSize: 23,
                          lineHeight: 1,
                          transform: "rotate(-18deg)",
                          filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.16))",
                        }}
                      >
                        🪶
                      </span>
                    )}
                    {line}
                  </div>
                );
              })}

              {isWriting && revealedCount > 0 && (
                <div
                  aria-hidden="true"
                  style={{
                    marginTop: -4,
                    paddingLeft: 34,
                    fontSize: 18,
                    opacity: 0.45,
                    letterSpacing: "0.2em",
                    userSelect: "none",
                  }}
                >
                  . . .
                </div>
              )}

              {writingComplete && narrationLines.length > 0 && (
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: "1px solid rgba(78,45,17,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontStyle: "italic",
                      opacity: 0.72,
                    }}
                  >
                    The chronicle is sealed. The descent may begin.
                  </div>

                  <div
                    aria-hidden="true"
                    style={{
                      fontSize: 22,
                      opacity: 0.72,
                    }}
                  >
                    ✢
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <details
          style={{
            marginTop: 14,
            border: "1px solid rgba(193,145,84,0.18)",
            borderRadius: 12,
            background:
              "linear-gradient(180deg, rgba(18,12,8,0.9), rgba(11,8,6,0.94))",
            boxShadow: "inset 0 1px 0 rgba(255,220,160,0.04)",
            overflow: "hidden",
          }}
          open={showSignals}
          onToggle={(e) => {
            const nextOpen = (e.currentTarget as HTMLDetailsElement).open;
            setShowSignals(nextOpen);
            playSfx(SFX.buttonClick, 0.5);
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              listStyle: "none",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              userSelect: "none",
              color: "rgba(244,220,184,0.92)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            <span>{showSignals ? "▾" : "▸"} Behind the Chronicle</span>
            <span
              style={{
                fontSize: 11,
                opacity: 0.62,
                fontWeight: 600,
              }}
            >
              hidden threads and omens
            </span>
          </summary>

          <div
            style={{
              padding: "0 14px 14px",
              borderTop: "1px solid rgba(193,145,84,0.12)",
              color: "rgba(240,230,213,0.88)",
            }}
          >
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(193,145,84,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  opacity: 0.56,
                  marginBottom: 8,
                }}
              >
                Opening Frame
              </div>
              <div style={{ lineHeight: 1.7 }}>{initialTable.openingFrame}</div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
                marginTop: 10,
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(193,145,84,0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    opacity: 0.56,
                    marginBottom: 8,
                  }}
                >
                  Location Traits
                </div>
                <div style={{ lineHeight: 1.7 }}>
                  {initialTable.locationTraits.join(" · ")}
                </div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(193,145,84,0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    opacity: 0.56,
                    marginBottom: 8,
                  }}
                >
                  Oddities
                </div>
                <div style={{ lineHeight: 1.7 }}>
                  {initialTable.environmentalOddities.join(" · ")}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(193,145,84,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  opacity: 0.56,
                  marginBottom: 8,
                }}
              >
                Factions in Motion
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {initialTable.latentFactions.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.018)",
                      border: "1px solid rgba(193,145,84,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "rgba(255,230,193,0.95)",
                        marginBottom: 3,
                      }}
                    >
                      {f.name}
                    </div>
                    <div style={{ lineHeight: 1.6 }}>
                      {f.desire}
                      <span style={{ opacity: 0.58 }}> · {f.pressure}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(193,145,84,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  opacity: 0.56,
                  marginBottom: 8,
                }}
              >
                Dormant Hook
              </div>
              <div style={{ lineHeight: 1.7 }}>
                {initialTable.dormantHooks.join(" · ")}
              </div>
            </div>
          </div>
        </details>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              position: "relative",
              height: showWaxSeal ? 88 : 0,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              transition: "height 320ms ease",
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 6,
                width: showWaxSeal ? 112 : 0,
                height: showWaxSeal ? 112 : 0,
                borderRadius: "999px",
                background:
                  "radial-gradient(circle, rgba(255,162,110,0.35) 0%, rgba(255,110,60,0.16) 38%, rgba(255,90,42,0.04) 68%, transparent 78%)",
                filter: "blur(10px)",
                opacity: showWaxSeal ? 1 : 0,
                transition:
                  "opacity 360ms ease, width 360ms ease, height 360ms ease",
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "relative",
                width: 74,
                height: 74,
                borderRadius: "999px",
                transform: showWaxSeal
                  ? "translateY(0) scale(1) rotate(-6deg)"
                  : "translateY(18px) scale(0.72) rotate(-10deg)",
                opacity: showWaxSeal ? 1 : 0,
                transition:
                  "transform 420ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 320ms ease",
                background:
                  "radial-gradient(circle at 34% 28%, rgba(255,213,190,0.24), transparent 18%), radial-gradient(circle at 50% 45%, rgba(166,22,25,0.96), rgba(120,10,17,0.98) 68%, rgba(82,6,12,1) 100%)",
                border: "1px solid rgba(255,210,185,0.16)",
                boxShadow:
                  "0 10px 22px rgba(92,8,12,0.42), inset 0 2px 5px rgba(255,228,214,0.18), inset 0 -10px 16px rgba(58,0,4,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 8,
                  borderRadius: "999px",
                  border: "1px solid rgba(255,214,192,0.12)",
                }}
              />
              <div
                style={{
                  fontSize: 24,
                  color: "rgba(255,232,214,0.92)",
                  textShadow: "0 1px 2px rgba(43,0,0,0.4)",
                  transform: "translateY(-1px)",
                }}
              >
                ✢
              </div>
            </div>
          </div>

          <button
            onClick={handleAccept}
            disabled={!writingComplete || isAccepting}
            style={{
              minWidth: 240,
              padding: "14px 22px",
              borderRadius: 14,
              border: "1px solid rgba(255,203,122,0.42)",
              background:
                writingComplete && !isAccepting
                  ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                  : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
              color:
                writingComplete && !isAccepting
                  ? "#2f1606"
                  : "rgba(244,227,201,0.75)",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "0.04em",
              boxShadow:
                writingComplete && !isAccepting
                  ? "0 0 0 1px rgba(255,224,163,0.08), 0 10px 28px rgba(255,145,42,0.22), inset 0 1px 0 rgba(255,244,220,0.72)"
                  : "inset 0 1px 0 rgba(255,255,255,0.05)",
              cursor:
                writingComplete && !isAccepting ? "pointer" : "not-allowed",
              opacity: writingComplete && !isAccepting ? 1 : 0.62,
              transform: writingComplete && !isAccepting ? "translateY(0)" : "none",
              transition:
                "transform 160ms ease, box-shadow 160ms ease, filter 160ms ease, opacity 160ms ease",
            }}
            title={
              writingComplete
                ? isAccepting
                  ? "The descent is opening..."
                  : ACCEPT_LABEL
                : "Wait for the chronicle to finish, or use Skip Writing."
            }
            onMouseEnter={(e) => {
              if (!writingComplete || isAccepting) return;
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.filter = "brightness(1.03)";
              e.currentTarget.style.boxShadow =
                "0 0 0 1px rgba(255,224,163,0.08), 0 14px 36px rgba(255,145,42,0.28), inset 0 1px 0 rgba(255,244,220,0.76)";
            }}
            onMouseLeave={(e) => {
              if (!writingComplete || isAccepting) return;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.boxShadow =
                "0 0 0 1px rgba(255,224,163,0.08), 0 10px 28px rgba(255,145,42,0.22), inset 0 1px 0 rgba(255,244,220,0.72)";
            }}
          >
            {isAccepting ? "Opening the Descent..." : ACCEPT_LABEL}
          </button>
        </div>

        <div
          style={{
            marginTop: 8,
            textAlign: "center",
            fontSize: 12,
            opacity: 0.56,
            letterSpacing: "0.03em",
          }}
        >
          {writingComplete
            ? isAccepting
              ? "Stone answers the seal."
              : "Step below and let the dungeon answer."
            : "The descent awaits the sealing of the chronicle."}
        </div>

        <style jsx>{`
          @keyframes sealEmberRise {
            0% {
              opacity: 0;
              transform: translate3d(0, 8px, 0) scale(0.55);
            }
            15% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translate3d(
                  var(--ember-drift, 0px),
                  var(--ember-rise, -28px),
                  0
                )
                scale(1.15);
            }
          }
        `}</style>
      </CardSection>
    );
  }

  return (
    <CardSection title="Opening Chronicle">
      <p className="muted" style={{ marginTop: 0 }}>
        If you want a fast-start opening, refine the chronicle below, then begin
        the descent.
      </p>

      <textarea
        rows={10}
        value={tableDraftText}
        onChange={(e) => setTableDraftText(e.target.value)}
        style={{ width: "100%" }}
      />

      <details
        style={{
          marginTop: 14,
          border: "1px solid rgba(193,145,84,0.18)",
          borderRadius: 12,
          background:
            "linear-gradient(180deg, rgba(18,12,8,0.9), rgba(11,8,6,0.94))",
          boxShadow: "inset 0 1px 0 rgba(255,220,160,0.04)",
          overflow: "hidden",
        }}
        open
      >
        <summary
          className="muted"
          onClick={() => {
            playSfx(SFX.buttonClick, 0.54);
          }}
          style={{
            cursor: "pointer",
            padding: "12px 14px",
            userSelect: "none",
          }}
        >
          Behind the Chronicle
        </summary>

        <div
          style={{
            padding: "0 14px 14px",
            borderTop: "1px solid rgba(193,145,84,0.12)",
          }}
        >
          <div style={{ marginTop: 12, lineHeight: 1.7 }}>
            <p>{initialTable.openingFrame}</p>
            <p className="muted">
              Traits: {initialTable.locationTraits.join(", ")}
            </p>
            <ul>
              {initialTable.latentFactions.map((f, i) => (
                <li key={i}>
                  <strong>{f.name}</strong> — {f.desire} ({f.pressure})
                </li>
              ))}
            </ul>
            <p className="muted">
              Oddity: {initialTable.environmentalOddities.join(", ")}
            </p>
            <p className="muted">
              Hook: {initialTable.dormantHooks.join(", ")}
            </p>
          </div>
        </div>
      </details>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={handleAccept}
          disabled={isAccepting}
          style={{
            minWidth: 240,
            padding: "14px 22px",
            borderRadius: 14,
            border: "1px solid rgba(255,203,122,0.42)",
            background:
              !isAccepting
                ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
            color: !isAccepting ? "#2f1606" : "rgba(244,227,201,0.75)",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.04em",
            boxShadow: !isAccepting
              ? "0 0 0 1px rgba(255,224,163,0.08), 0 10px 28px rgba(255,145,42,0.22), inset 0 1px 0 rgba(255,244,220,0.72)"
              : "inset 0 1px 0 rgba(255,255,255,0.05)",
            cursor: !isAccepting ? "pointer" : "not-allowed",
            transition:
              "transform 160ms ease, box-shadow 160ms ease, filter 160ms ease",
            opacity: !isAccepting ? 1 : 0.62,
          }}
          onMouseEnter={(e) => {
            if (isAccepting) return;
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.filter = "brightness(1.03)";
            e.currentTarget.style.boxShadow =
              "0 0 0 1px rgba(255,224,163,0.08), 0 14px 36px rgba(255,145,42,0.28), inset 0 1px 0 rgba(255,244,220,0.76)";
          }}
          onMouseLeave={(e) => {
            if (isAccepting) return;
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.filter = "none";
            e.currentTarget.style.boxShadow =
              "0 0 0 1px rgba(255,224,163,0.08), 0 10px 28px rgba(255,145,42,0.22), inset 0 1px 0 rgba(255,244,220,0.72)";
          }}
        >
          {isAccepting ? "Opening the Descent..." : ACCEPT_LABEL}
        </button>
      </div>

      <div
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 12,
          opacity: 0.56,
          letterSpacing: "0.03em",
        }}
      >
        {isAccepting
          ? "Stone answers the seal."
          : "Step below and let the dungeon answer."}
      </div>
    </CardSection>
  );
}
