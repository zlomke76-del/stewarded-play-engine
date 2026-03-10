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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        setShowTitleOverlay(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
            transition: "filter 360ms ease, opacity 360ms ease, transform 360ms ease",
            filter: showTitleOverlay ? "blur(2px)" : "blur(0px)",
            opacity: showTitleOverlay ? 0.42 : 1,
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
                "radial-gradient(circle at center, rgba(10,14,24,0.28) 0%, rgba(4,6,12,0.78) 55%, rgba(0,0,0,0.9) 100%)",
              padding: 24,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 1200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
              }}
            >
              <img
                src="/assets/cover/title_page.png"
                alt="Echoes of Fate title screen"
                style={{
                  width: "100%",
                  maxWidth: 960,
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 24px 80px rgba(0,0,0,0.75))",
                }}
              />

              <button
                type="button"
                onClick={dismissTitleOverlay}
                style={{
                  appearance: "none",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
                  color: "#ffffff",
                  padding: "14px 28px",
                  borderRadius: 18,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  transition: "transform 120ms ease, background 160ms ease, box-shadow 160ms ease",
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.985)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.12))";
                  e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.48)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)";
                }}
              >
                Enter the Dungeon
              </button>

              <div
                style={{
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                Press Enter
              </div>
            </div>
          </div>
        )}
      </div>
    </AmbientBackground>
  );
}
