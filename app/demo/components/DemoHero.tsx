// app/demo/components/DemoHero.tsx
"use client";

import { useEffect, useRef } from "react";
import { DMMode, DemoSectionId } from "../demoTypes";
import { anchorId, sectionLabel } from "../demoUtils";

type ChapterButton = { id: DemoSectionId; hint: string };

export default function DemoHero(props: {
  dmMode: DMMode | null;
  tableAccepted: boolean;
  activeSection: DemoSectionId;
  outcomesCount: number;
  canonCount: number;
  chapterButtons: ChapterButton[];
  onStartHere: () => void;
  onPlayJump: () => void;
  onSelectMode: (nextMode: DMMode) => void;
  onNavigate: (id: DemoSectionId) => void;
}) {
  const {
    dmMode,
    tableAccepted,
    activeSection,
    outcomesCount,
    canonCount,
    chapterButtons,
    onStartHere,
    onPlayJump,
    onSelectMode,
    onNavigate,
  } = props;

  const playDisabled = dmMode === null || !tableAccepted;

  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasPrimedAudioRef = useRef(false);
  const hasPlayedHeroThemeRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/audio/music/chronicles_intro.mp3");
    audio.preload = "auto";
    audio.volume = 0.72;
    introAudioRef.current = audio;

    return () => {
      try {
        audio.pause();
      } catch {
        // no-op
      }
      introAudioRef.current = null;
      hasPrimedAudioRef.current = false;
      hasPlayedHeroThemeRef.current = false;
    };
  }, []);

  function primeHeroAudio() {
    const audio = introAudioRef.current;
    if (!audio || hasPrimedAudioRef.current) return;

    hasPrimedAudioRef.current = true;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {
          hasPrimedAudioRef.current = false;
        });
    }
  }

  function playHeroTheme() {
    const audio = introAudioRef.current;
    if (!audio) return;

    hasPlayedHeroThemeRef.current = true;

    try {
      audio.pause();
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // autoplay/user-gesture issues should fail silently here
        });
      }
    } catch {
      // no-op
    }
  }

  function handleHeroPlayClick() {
    if (playDisabled) return;
    playHeroTheme();
    onPlayJump();
  }

  function handleStartHere() {
    primeHeroAudio();
    onStartHere();
  }

  function handleSelectMode(nextMode: DMMode) {
    primeHeroAudio();
    onSelectMode(nextMode);
  }

  function handleNavigate(id: DemoSectionId, disabled: boolean) {
    if (disabled) return;
    primeHeroAudio();
    onNavigate(id);
  }

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(1200px 240px at 20% 0%, rgba(138,180,255,0.20), transparent 60%), radial-gradient(900px 220px at 80% 20%, rgba(255,120,120,0.12), transparent 55%), rgba(255,255,255,0.03)",
        padding: 18,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1.1fr) minmax(260px, 0.9fr)",
          gap: 14,
          alignItems: "stretch",
        }}
      >
        {/* LEFT */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, letterSpacing: 0.6, opacity: 0.85 }}>
            EVENT-SOURCED PLAY · FAIL-CLOSED CANON
          </div>

          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>
            A governed tabletop loop: intent → resolution → canon.
          </div>

          <div className="muted" style={{ marginTop: 10, maxWidth: 760, lineHeight: 1.55 }}>
            This page is a working demo. It’s long by nature — so it’s organized into “chapters.” Nothing here rewrites
            the world: the UI only renders what the event log contains.
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={handleStartHere}>Start here</button>

            <button
              onClick={handleHeroPlayClick}
              disabled={playDisabled}
              title={
                dmMode === null
                  ? "Choose a facilitator mode first"
                  : !tableAccepted
                    ? "Accept the initial table first"
                    : "Play intro theme and jump to Player Action"
              }
            >
              Play me
            </button>

            <div className="muted" style={{ fontSize: 12 }}>
              outcomes: <strong>{outcomesCount}</strong> · canon events: <strong>{canonCount}</strong>
            </div>
          </div>

          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Pro-tip: choose a mode, accept the table, then submit an action and record an outcome.
          </div>

          {/* MODE (embedded in hero) */}
          <div
            id={anchorId("mode")}
            style={{
              scrollMarginTop: 90,
              marginTop: 14,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16 }}>Facilitation Mode</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Select who is allowed to declare intent and how options are chosen.
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="radio" checked={dmMode === "human"} onChange={() => handleSelectMode("human")} />
                <span>
                  <strong>Human DM</strong>{" "}
                  <span className="muted">(options visible + editable setup)</span>
                </span>
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  checked={dmMode === "solace-neutral"}
                  onChange={() => handleSelectMode("solace-neutral")}
                />
                <span>
                  <strong>Solace</strong> <span className="muted">(Neutral Facilitator)</span>
                </span>
              </label>

              {dmMode === null && (
                <div
                  className="muted"
                  style={{
                    fontSize: 12,
                    marginTop: 6,
                    padding: "10px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  Choose a mode to reveal the Initial Table.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ minWidth: 0, display: "grid", gap: 10 }}>
          {/* Image */}
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              position: "relative",
              minHeight: 190,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url('/Hero_dungeon.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "contrast(1.05) saturate(1.05)",
                transform: "scale(1.02)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, rgba(0,0,0,0.70), rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.65))",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                padding: 12,
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Enter the dungeon</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  You declare intent. The world remembers only what canon records.
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 6, opacity: 0.9 }}>
                  {hasPlayedHeroThemeRef.current
                    ? "Chronicles intro ready."
                    : "Press play to begin with the intro theme."}
                </div>
              </div>

              <button
                onClick={handleHeroPlayClick}
                disabled={playDisabled}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  whiteSpace: "nowrap",
                }}
                title={
                  dmMode === null
                    ? "Choose a facilitator mode first"
                    : !tableAccepted
                      ? "Accept the initial table first"
                      : "Play intro theme and jump to Player Action"
                }
              >
                ▶ Play
              </button>
            </div>
          </div>

          {/* Chapters */}
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Chapters
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {chapterButtons.map((b) => {
                const active = activeSection === b.id;

                const needsSetup =
                  b.id === "action" ||
                  b.id === "resolution" ||
                  b.id === "pressure" ||
                  b.id === "map" ||
                  b.id === "combat" ||
                  b.id === "canon" ||
                  b.id === "ledger";

                const disabled = needsSetup && (dmMode === null || !tableAccepted);

                return (
                  <button
                    key={b.id}
                    onClick={() => handleNavigate(b.id, disabled)}
                    disabled={disabled}
                    style={{
                      padding: "10px 10px",
                      borderRadius: 10,
                      border: active ? "1px solid rgba(138,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
                      background: active ? "rgba(138,180,255,0.10)" : "rgba(255,255,255,0.04)",
                      textAlign: "left",
                      opacity: disabled ? 0.55 : 1,
                    }}
                    aria-label={`Go to ${sectionLabel(b.id)}`}
                    title={disabled ? "Choose a mode and accept the table first" : b.hint}
                  >
                    <div style={{ fontWeight: 800, fontSize: 12 }}>{sectionLabel(b.id)}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.2 }}>
                      {b.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
