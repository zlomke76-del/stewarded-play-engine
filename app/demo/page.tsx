"use client";

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

      <div style={{ position: "relative", zIndex: 1 }}>
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
    </AmbientBackground>
  );
}
