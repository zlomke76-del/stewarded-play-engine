"use client";

import { useEffect, useState } from "react";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";

import AmbientBackground from "./components/AmbientBackground";
import InitialTableSection from "./components/InitialTableSection";
import HeroOnboarding from "./components/HeroOnboarding";
import PartySetupSection from "./components/PartySetupSection";
import GameplayViewport from "./components/GameplayViewport";

import { anchorId, scrollToSection } from "./demoUtils";
import { useDemoRuntime } from "./hooks/useDemoRuntime";
import type { DemoSectionId } from "./demoTypes";

export default function DemoPage() {
  const demo = useDemoRuntime();
  const [showTitleOverlay, setShowTitleOverlay] = useState(true);
  const [titleReady, setTitleReady] = useState(false);

  useEffect(() => {
    setTitleReady(true);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        setShowTitleOverlay(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!showTitleOverlay) return;

    const audio = demo.introAudioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.volume = 0.72;

    const tryPlay = () => {
      audio.play().catch(() => {});
    };

    tryPlay();

    const unlock = () => {
      tryPlay();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [showTitleOverlay, demo.introAudioRef]);

  function dismissTitleOverlay() {
    setShowTitleOverlay(false);
  }

  function jumpTo(key: any) {
    const nextKey = key as DemoSectionId;

    if (demo.showGameplay && demo.allowGameplay) {
      if (nextKey === "pressure") {
        demo.setGameplayFocusStep("pressure");
      } else if (nextKey === "map") {
        demo.setGameplayFocusStep("map");
      } else if (
        nextKey === "combat" ||
        nextKey === "action" ||
        nextKey === "resolution" ||
        nextKey === "canon" ||
        nextKey === "ledger"
      ) {
        demo.setGameplayFocusStep("action");
      }
    }

    demo.setActiveSection(nextKey);
    scrollToSection(nextKey);
  }

  return (
    <AmbientBackground>
      <style jsx global>{`
        @keyframes roomFadeIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes roomImageIn {
          0% {
            opacity: 0;
            transform: scale(1.025);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes roomTextIn {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes titleFadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes titleFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes torchFlicker {
          0% {
            opacity: 0.96;
            filter: brightness(0.98);
          }
          20% {
            opacity: 1;
            filter: brightness(1.02);
          }
          40% {
            opacity: 0.985;
            filter: brightness(0.995);
          }
          60% {
            opacity: 1;
            filter: brightness(1.015);
          }
          80% {
            opacity: 0.975;
            filter: brightness(1);
          }
          100% {
            opacity: 0.96;
            filter: brightness(0.99);
          }
        }

        @keyframes mistDrift {
          0% {
            transform: translate3d(-1.5%, 0%, 0) scale(1.02);
            opacity: 0.18;
          }
          50% {
            transform: translate3d(1.5%, -1%, 0) scale(1.045);
            opacity: 0.26;
          }
          100% {
            transform: translate3d(-1.5%, 0%, 0) scale(1.02);
            opacity: 0.18;
          }
        }

        @keyframes glowPulse {
          0% {
            opacity: 0.14;
          }
          50% {
            opacity: 0.24;
          }
          100% {
            opacity: 0.14;
          }
        }
      `}</style>

      <audio
        ref={demo.introAudioRef}
        preload="auto"
        src="/audio/music/chronicles_intro.mp3"
        style={{ display: "none" }}
      />
      <audio ref={demo.bgmAudioRef} preload="auto" style={{ display: "none" }} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <div
          style={{
            transition: "filter 420ms ease, opacity 420ms ease, transform 420ms ease",
            filter: showTitleOverlay ? "blur(2px)" : "blur(0px)",
            opacity: showTitleOverlay ? 0.35 : 1,
            transform: showTitleOverlay ? "scale(0.995)" : "scale(1)",
            pointerEvents: showTitleOverlay ? "none" : "auto",
            userSelect: showTitleOverlay ? "none" : "auto",
          }}
          aria-hidden={showTitleOverlay}
        >
          <StewardedShell>
            <ModeHeader
              title="Echoes of Fate"
              onShare={demo.shareCanon}
              showTitle={false}
              showRoles={false}
              showShare={false}
            />

            <div id={anchorId("mode")} style={{ scrollMarginTop: 90 }}>
              {demo.showFullHero && (
                <HeroOnboarding
                  presentationMode="full"
                  heroTitle="Echoes of Fate"
                  heroSubtitle="Every action leaves an echo."
                  dmMode={demo.dmMode}
                  onSetDmMode={(nextMode) => {
                    demo.setDmMode(nextMode);
                    demo.setEnteredDungeon(false);
                    demo.setTableAccepted(false);
                    demo.setGameplayFocusStep("pressure");
                    demo.setActiveSection("mode");
                    demo.setPartyDraft((prev: any) => prev ?? null);
                  }}
                  partySize={demo.partySize}
                  partyLocked={demo.partyLocked}
                  onSetPartySize={(n) => {
                    if (demo.dmMode === null) return;
                    demo.setEnteredDungeon(false);
                    demo.setTableAccepted(false);
                    demo.setGameplayFocusStep("pressure");
                    demo.setPartySize(n);
                  }}
                  onEnter={demo.enterDungeon}
                  canEnter={demo.dmMode !== null && demo.partySize > 0}
                  heroImageSrc={demo.HERO_IMAGE_SRC}
                  heroImageOk={demo.heroImageOk}
                  onHeroImageError={() => demo.setHeroImageOk(false)}
                  chapterState={demo.chapterState as any}
                  onJump={(k) => jumpTo(k)}
                  outcomesCount={demo.outcomesCount}
                  canonCount={demo.canonCount}
                />
              )}

              {demo.showCompactHero && (
                <HeroOnboarding
                  presentationMode="compact"
                  heroTitle="Echoes of Fate"
                  heroSubtitle="Every action leaves an echo."
                  dmMode={demo.dmMode}
                  onSetDmMode={(nextMode) => {
                    demo.setDmMode(nextMode);
                    demo.setEnteredDungeon(false);
                    demo.setTableAccepted(false);
                    demo.setGameplayFocusStep("pressure");
                    demo.setActiveSection("mode");
                    demo.setPartyDraft((prev: any) => prev ?? null);
                  }}
                  partySize={demo.partySize}
                  partyLocked={demo.partyLocked}
                  onSetPartySize={(n) => {
                    if (demo.dmMode === null) return;
                    demo.setEnteredDungeon(false);
                    demo.setTableAccepted(false);
                    demo.setGameplayFocusStep("pressure");
                    demo.setPartySize(n);
                  }}
                  onEnter={demo.enterDungeon}
                  canEnter={demo.dmMode !== null && demo.partySize > 0}
                  heroImageSrc={demo.HERO_IMAGE_SRC}
                  heroImageOk={demo.heroImageOk}
                  onHeroImageError={() => demo.setHeroImageOk(false)}
                  chapterState={demo.chapterState as any}
                  onJump={(k) => jumpTo(k)}
                  outcomesCount={demo.outcomesCount}
                  canonCount={demo.canonCount}
                />
              )}
            </div>

            {demo.showInitialTable && (
              <div id={anchorId("table")} style={{ scrollMarginTop: 90, marginTop: 16 }}>
                <InitialTableSection
                  dmMode={demo.dmMode}
                  initialTable={demo.initialTable}
                  tableAccepted={demo.tableAccepted}
                  tableDraftText={demo.tableDraftText}
                  setTableDraftText={demo.setTableDraftText}
                  onAccept={() => {
                    demo.setTableAccepted(true);
                    demo.setGameplayFocusStep("pressure");
                    demo.setActiveSection("party");
                    queueMicrotask(() => scrollToSection("party"));
                  }}
                />
              </div>
            )}

            <div id={anchorId("party")} style={{ scrollMarginTop: 90, marginTop: 16 }}>
              <PartySetupSection
                enabled={demo.showInitialTable && demo.dmMode !== null && demo.tableAccepted}
                partyDraft={demo.partyDraft}
                partyMembersFallback={demo.partyMembers}
                partyCanonicalExists={demo.partyCanonicalExists}
                partyLocked={demo.partyLocked}
                partyLockedByCombat={demo.partyLockedByCombat}
                setPartySize={(n) => demo.setPartySize(n)}
                randomizePartyNames={demo.randomizePartyNames}
                commitParty={demo.commitParty}
                safeInt={demo.safeInt}
                setPartyDraft={demo.setPartyDraft}
              />
            </div>

            {demo.showGameplay && demo.allowGameplay && <GameplayViewport demo={demo} />}
          </StewardedShell>
        </div>

        {showTitleOverlay && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at center, rgba(15,20,30,0.16) 0%, rgba(5,8,14,0.68) 52%, rgba(0,0,0,0.9) 100%)",
              padding: 24,
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 50% 44%, rgba(92,152,255,0.16) 0%, rgba(92,152,255,0.08) 14%, rgba(0,0,0,0) 38%)",
                animation: "glowPulse 4.8s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-8%",
                background:
                  "radial-gradient(circle at 50% 62%, rgba(210,220,255,0.16) 0%, rgba(160,180,220,0.08) 18%, rgba(0,0,0,0) 42%)",
                mixBlendMode: "screen",
                animation: "mistDrift 9s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                width: "100%",
                maxWidth: 1280,
                maxHeight: "calc(100vh - 48px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                animation: titleReady ? "titleFadeIn 700ms ease both" : undefined,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  flex: "0 1 auto",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  animation: "titleFloat 7s ease-in-out infinite",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: "10% 18% 12% 18%",
                    borderRadius: 40,
                    background:
                      "radial-gradient(circle at 50% 45%, rgba(90,150,255,0.16) 0%, rgba(90,150,255,0.06) 25%, rgba(0,0,0,0) 58%)",
                    filter: "blur(26px)",
                    animation: "glowPulse 4.2s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />

                <img
                  src="/assets/cover/title_page.png"
                  alt="Echoes of Fate title screen"
                  style={{
                    width: "auto",
                    height: "auto",
                    maxWidth: "min(78vw, 1100px)",
                    maxHeight: "72vh",
                    minWidth: 280,
                    objectFit: "contain",
                    position: "relative",
                    zIndex: 2,
                    animation: "torchFlicker 4.8s ease-in-out infinite",
                    filter:
                      "drop-shadow(0 28px 90px rgba(0,0,0,0.84)) drop-shadow(0 0 44px rgba(80,140,255,0.16))",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={dismissTitleOverlay}
                style={{
                  appearance: "none",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.09))",
                  color: "#ffffff",
                  padding: "14px 30px",
                  borderRadius: 18,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  boxShadow: "0 14px 44px rgba(0,0,0,0.48)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  transition:
                    "transform 120ms ease, background 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.985)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background =
                    "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.09))";
                  e.currentTarget.style.boxShadow = "0 14px 44px rgba(0,0,0,0.48)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.13))";
                  e.currentTarget.style.boxShadow = "0 18px 54px rgba(0,0,0,0.56)";
                  e.currentTarget.style.borderColor = "rgba(140,180,255,0.34)";
                }}
                aria-label="Enter the Dungeon"
              >
                Enter the Dungeon
              </button>

              <div
                style={{
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.72)",
                  textShadow: "0 2px 12px rgba(0,0,0,0.45)",
                }}
              >
                Press Enter to Begin
              </div>
            </div>
          </div>
        )}
      </div>
    </AmbientBackground>
  );
}
