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
} as const;

const LINE_REVEAL_MS = 1180;
const START_DELAY_MS = 420;
const FADE_STAGGER_MS = 120;

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
  const activeQuillAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextQuillVariantRef = useRef<"a" | "b">("a");

  const narrationLines = useMemo(
    () => buildNarrationLines(tableDraftText),
    [tableDraftText]
  );

  const [revealedCount, setRevealedCount] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [writingStarted, setWritingStarted] = useState(false);
  const [showSignals, setShowSignals] = useState(false);

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
  }

  useEffect(() => {
    if (dmMode !== "solace-neutral" || tableAccepted || !initialTable) {
      clearAllTimers();
      stopQuillSound();
      setIsWriting(false);
      setWritingStarted(false);
      setRevealedCount(0);
      return;
    }

    setRevealedCount(0);
    setIsWriting(false);
    setWritingStarted(false);
    nextQuillVariantRef.current = "a";

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
          style={{ marginTop: 12 }}
          open={showSignals}
          onToggle={(e) => {
            const nextOpen = (e.currentTarget as HTMLDetailsElement).open;
            setShowSignals(nextOpen);
            playSfx(SFX.buttonClick, 0.5);
          }}
        >
          <summary className="muted" style={{ cursor: "pointer" }}>
            Show chronicle origins
          </summary>

          <div style={{ marginTop: 10 }}>
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
        </details>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (!writingComplete) {
                playSfx(SFX.uiFailure, 0.58);
                return;
              }
              playSfx(SFX.uiSuccess, 0.72);
              playSfx(SFX.stoneDoor, 0.56);
              onAccept();
            }}
            disabled={!writingComplete}
            style={{
              opacity: writingComplete ? 1 : 0.55,
              cursor: writingComplete ? "pointer" : "not-allowed",
            }}
            title={
              writingComplete
                ? ACCEPT_LABEL
                : "Wait for the chronicle to finish, or use Skip Writing."
            }
          >
            {ACCEPT_LABEL}
          </button>
        </div>
      </CardSection>
    );
  }

  return (
    <CardSection title="Opening Chronicle">
      <p className="muted" style={{ marginTop: 0 }}>
        If you want a fast-start opening, refine the chronicle below, then begin the descent.
      </p>

      <textarea
        rows={10}
        value={tableDraftText}
        onChange={(e) => setTableDraftText(e.target.value)}
        style={{ width: "100%" }}
      />

      <details style={{ marginTop: 12 }} open>
        <summary
          className="muted"
          onClick={() => {
            playSfx(SFX.buttonClick, 0.54);
          }}
          style={{ cursor: "pointer" }}
        >
          Show chronicle origins
        </summary>
        <div style={{ marginTop: 10 }}>
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
      </details>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => {
            playSfx(SFX.uiSuccess, 0.72);
            playSfx(SFX.stoneDoor, 0.56);
            onAccept();
          }}
        >
          {ACCEPT_LABEL}
        </button>
      </div>
    </CardSection>
  );
}
