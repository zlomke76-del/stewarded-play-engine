"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import {
  SAFE_CLASS_ARCHETYPES,
  SAFE_SPECIES,
  type BuildFocus,
  type ClassMeta,
  type FocusMeta,
  type HeroCreationStep,
  type PartyDeclaredPayload,
  type PartyMember,
  type PortraitType,
  type RitualProgress,
  type SpeciesMeta,
} from "./types";
import {
  SFX,
  applyBuildFocusToStats,
  getBaseStatsForClass,
  getFocusPalette,
  playSfx,
} from "./helpers";
import {
  ClassPanel,
  FocusPanel,
  IntroPanel,
  NamePanel,
  OathPanel,
  SexPanel,
  SpeciesPanel,
} from "./HeroRitualPanels";

type Props = {
  heroCreationStep: HeroCreationStep;
  setHeroCreationStep: React.Dispatch<React.SetStateAction<HeroCreationStep>>;
  ritualProgress: RitualProgress;
  setRitualProgress: React.Dispatch<React.SetStateAction<RitualProgress>>;
  editable: boolean;
  row: PartyMember;
  partyDraft: PartyDeclaredPayload | null;
  partyLocked: boolean;
  partyLockedByCombat: boolean;
  resolvedSpecies: string;
  resolvedClass: string;
  currentFocus: BuildFocus;
  display: string;
  hasValidHeroName: boolean;
  resolvedSpeciesMeta: SpeciesMeta;
  resolvedClassMeta: ClassMeta;
  resolvedFocusMeta: FocusMeta;
  setPortrait: (portrait: PortraitType) => void;
  setSpecies: (nextSpecies: string) => void;
  setClass: (nextClassName: string) => void;
  setBuildFocus: (focus: BuildFocus) => void;
  setHeroField: (patch: Partial<PartyMember>) => void;
  onCommitChronicle: () => void;
};

function chunkIntoPages<T>(items: readonly T[], size: number) {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size) as T[]);
  }
  return pages;
}

export const FOCUS_RITUAL_COPY: Record<
  BuildFocus,
  {
    doctrine: string;
    vow: string;
    consequence: string;
    chosenLabel: string;
  }
> = {
  balanced: {
    doctrine: "Yield nothing to extremes.",
    vow: "You walk the middle path, giving up dramatic edges for steadiness under pressure.",
    consequence: "No sharp weakness. No sharp advantage.",
    chosenLabel: "Chosen Stance: Balanced",
  },
  guardian: {
    doctrine: "Hold the line.",
    vow: "You enter danger with discipline first, trusting armor and resolve before speed.",
    consequence: "Harder to break. Slower to answer.",
    chosenLabel: "Chosen Stance: Guardian",
  },
  swift: {
    doctrine: "Strike before fear settles.",
    vow: "You trust tempo over armor, moving first and forcing danger to react to you.",
    consequence: "Faster to act. Easier to punish if caught.",
    chosenLabel: "Chosen Stance: Swift",
  },
  hardy: {
    doctrine: "Endure what should kill you.",
    vow: "You choose survival over elegance and carry extra life into long, punishing fights.",
    consequence: "More staying power. Less tempo advantage.",
    chosenLabel: "Chosen Stance: Hardy",
  },
};

export const CLASS_RITUAL_COPY: Partial<
  Record<
    string,
    {
      doctrine: string;
      callout: string;
    }
  >
> = {
  Warrior: {
    doctrine: "Stand where others break.",
    callout: "Reliable frontline pressure with simple, decisive rhythm.",
  },
  Rogue: {
    doctrine: "Cut where no shield can turn.",
    callout: "Precision, timing, and opportunistic burst.",
  },
  Mage: {
    doctrine: "Shape the fight before steel arrives.",
    callout: "Arcane burst and battlefield control.",
  },
  Cleric: {
    doctrine: "Keep the flame alive.",
    callout: "Stable support, protection, and endurance.",
  },
  Ranger: {
    doctrine: "Hunt from motion, not from safety.",
    callout: "Skirmish pressure, range, and flexible tempo.",
  },
  Paladin: {
    doctrine: "Carry judgment into the front line.",
    callout: "Holy durability with heroic frontline presence.",
  },
  Bard: {
    doctrine: "Turn rhythm into advantage.",
    callout: "Hybrid influence, support, and clever tempo.",
  },
  Druid: {
    doctrine: "Endure and adapt.",
    callout: "Steady hybrid control for long-form fights.",
  },
  Monk: {
    doctrine: "Become motion itself.",
    callout: "Fast pressure with disciplined mobility.",
  },
  Artificer: {
    doctrine: "Outbuild the danger.",
    callout: "Technical utility and battlefield invention.",
  },
  Barbarian: {
    doctrine: "Break through by force.",
    callout: "Raw survivability and relentless aggression.",
  },
  Sorcerer: {
    doctrine: "Unleash power before it slips away.",
    callout: "Explosive magical identity and high-risk burst.",
  },
  Warlock: {
    doctrine: "Command what should command you.",
    callout: "Dark pressure tools with strong identity.",
  },
};

export default function HeroRitualFlow({
  heroCreationStep,
  setHeroCreationStep,
  ritualProgress,
  setRitualProgress,
  editable,
  row,
  partyDraft,
  partyLocked,
  partyLockedByCombat,
  resolvedSpecies,
  resolvedClass,
  currentFocus,
  display,
  hasValidHeroName,
  resolvedSpeciesMeta,
  resolvedClassMeta,
  resolvedFocusMeta,
  setPortrait,
  setSpecies,
  setClass,
  setBuildFocus,
  setHeroField,
  onCommitChronicle,
}: Props) {
  const [speciesPageIndex, setSpeciesPageIndex] = useState(0);
  const [classPageIndex, setClassPageIndex] = useState(0);
  const [hoveredFocus, setHoveredFocus] = useState<BuildFocus | null>(null);

  const speciesPages = useMemo(() => chunkIntoPages(SAFE_SPECIES, 3), []);
  const classPages = useMemo(() => chunkIntoPages(SAFE_CLASS_ARCHETYPES, 4), []);

  useEffect(() => {
    const speciesIndex = SAFE_SPECIES.findIndex(
      (species) => species.toLowerCase() === resolvedSpecies.toLowerCase()
    );
    if (speciesIndex >= 0) {
      setSpeciesPageIndex(Math.floor(speciesIndex / 3));
    }
  }, [resolvedSpecies]);

  useEffect(() => {
    const classIndex = SAFE_CLASS_ARCHETYPES.findIndex(
      (className) => className.toLowerCase() === resolvedClass.toLowerCase()
    );
    if (classIndex >= 0) {
      setClassPageIndex(Math.floor(classIndex / 4));
    }
  }, [resolvedClass]);

  useEffect(() => {
    if (heroCreationStep !== "focus") return;
    setHoveredFocus(null);
  }, [heroCreationStep]);

  const baseStats = getBaseStatsForClass(resolvedClass);
  const focusDeltaAc = (row?.ac ?? baseStats.ac) - baseStats.ac;
  const focusDeltaHp = (row?.hpMax ?? baseStats.hpMax) - baseStats.hpMax;
  const focusDeltaInit =
    (row?.initiativeMod ?? baseStats.initiativeMod) - baseStats.initiativeMod;

  const canContinueFromName = editable && hasValidHeroName;
  const canEnterChronicle =
    editable &&
    ritualProgress.sexConfirmed &&
    ritualProgress.speciesConfirmed &&
    ritualProgress.classConfirmed &&
    ritualProgress.focusConfirmed &&
    hasValidHeroName;

  const portraitPath = getPortraitPath(
    resolvedSpecies,
    resolvedClass,
    row?.portrait ?? "Male"
  );
  const fallbackPortraitPath = getPortraitPath(
    "Human",
    "Warrior",
    row?.portrait ?? "Male"
  );

  const visibleSpecies = speciesPages[speciesPageIndex] ?? [];
  const visibleClasses = classPages[classPageIndex] ?? [];
  const previewFocus = hoveredFocus ?? currentFocus;
  const previewFocusCopy = FOCUS_RITUAL_COPY[previewFocus];
  const previewFocusPalette = getFocusPalette(previewFocus, true);

  function goToPreviousStep() {
    setHeroCreationStep((prev) => {
      if (prev === "confirm") return "name";
      if (prev === "name") return "focus";
      if (prev === "focus") return "class";
      if (prev === "class") return "species";
      if (prev === "species") return "sex";
      if (prev === "sex") return "intro";
      return "intro";
    });
  }

  function renderFocusDeltaSummary(focus: BuildFocus) {
    const nextStats = applyBuildFocusToStats(
      getBaseStatsForClass(resolvedClass),
      focus
    );

    const acDelta = nextStats.ac - baseStats.ac;
    const hpDelta = nextStats.hpMax - baseStats.hpMax;
    const initDelta = nextStats.initiativeMod - baseStats.initiativeMod;

    const chips: string[] = [];
    if (acDelta !== 0) chips.push(`AC ${acDelta > 0 ? `+${acDelta}` : acDelta}`);
    if (hpDelta !== 0) chips.push(`HP ${hpDelta > 0 ? `+${hpDelta}` : hpDelta}`);
    if (initDelta !== 0) {
      chips.push(`INIT ${initDelta > 0 ? `+${initDelta}` : initDelta}`);
    }
    if (chips.length === 0) chips.push("No stat shift");

    return chips.join(" · ");
  }

  function renderClassStepCallout(className: string) {
    const copy = CLASS_RITUAL_COPY[className];
    if (!copy) return null;

    return (
      <>
        <div
          style={{
            fontSize: 13,
            opacity: 0.92,
            lineHeight: 1.45,
            fontWeight: 800,
          }}
        >
          {copy.doctrine}
        </div>
        <div
          style={{
            fontSize: 12,
            opacity: 0.74,
            lineHeight: 1.55,
          }}
        >
          {copy.callout}
        </div>
      </>
    );
  }

  switch (heroCreationStep) {
    case "intro":
      return (
        <IntroPanel
          currentStep={heroCreationStep}
          editable={editable}
          fallbackPortraitPath={fallbackPortraitPath}
          onBegin={() => {
            playSfx(SFX.buttonClick, 0.6);
            setHeroCreationStep("sex");
          }}
        />
      );

    case "sex":
      return (
        <SexPanel
          currentStep={heroCreationStep}
          editable={editable}
          row={row}
          resolvedSpecies={resolvedSpecies}
          resolvedClass={resolvedClass}
          fallbackPortraitPath={fallbackPortraitPath}
          onBack={() => {
            playSfx(SFX.buttonClick, 0.54);
            goToPreviousStep();
          }}
          onSelectPortrait={(portrait) => {
            if (!editable) {
              playSfx(SFX.uiFailure, 0.5);
              return;
            }
            setPortrait(portrait);
            setRitualProgress((prev) => ({
              ...prev,
              sexConfirmed: true,
            }));
            setHeroCreationStep("species");
          }}
        />
      );

    case "species":
      return (
        <SpeciesPanel
          currentStep={heroCreationStep}
          editable={editable}
          row={row}
          resolvedSpecies={resolvedSpecies}
          resolvedClass={resolvedClass}
          visibleSpecies={visibleSpecies}
          pageIndex={speciesPageIndex}
          pageCount={speciesPages.length}
          fallbackPortraitPath={fallbackPortraitPath}
          onBack={() => {
            playSfx(SFX.buttonClick, 0.54);
            goToPreviousStep();
          }}
          onPrevPage={() => {
            playSfx(SFX.buttonClick, 0.5);
            setSpeciesPageIndex((prev) => Math.max(0, prev - 1));
          }}
          onNextPage={() => {
            playSfx(SFX.buttonClick, 0.5);
            setSpeciesPageIndex((prev) =>
              Math.min(speciesPages.length - 1, prev + 1)
            );
          }}
          onSelectSpecies={(species) => {
            if (!editable) {
              playSfx(SFX.uiFailure, 0.5);
              return;
            }
            playSfx(SFX.buttonClick, 0.56);
            setSpecies(species);
            setRitualProgress((prev) => ({
              ...prev,
              speciesConfirmed: true,
            }));
            setHeroCreationStep("class");
          }}
        />
      );

    case "class":
      return (
        <ClassPanel
          currentStep={heroCreationStep}
          editable={editable}
          row={row}
          resolvedSpecies={resolvedSpecies}
          resolvedClass={resolvedClass}
          visibleClasses={visibleClasses}
          pageIndex={classPageIndex}
          pageCount={classPages.length}
          fallbackPortraitPath={fallbackPortraitPath}
          renderClassStepCallout={renderClassStepCallout}
          onBack={() => {
            playSfx(SFX.buttonClick, 0.54);
            goToPreviousStep();
          }}
          onPrevPage={() => {
            playSfx(SFX.buttonClick, 0.5);
            setClassPageIndex((prev) => Math.max(0, prev - 1));
          }}
          onNextPage={() => {
            playSfx(SFX.buttonClick, 0.5);
            setClassPageIndex((prev) =>
              Math.min(classPages.length - 1, prev + 1)
            );
          }}
          onSelectClass={(className) => {
            if (!editable) {
              playSfx(SFX.uiFailure, 0.5);
              return;
            }
            playSfx(SFX.buttonClick, 0.56);
            setClass(className);
            setRitualProgress((prev) => ({
              ...prev,
              classConfirmed: true,
            }));
            setHeroCreationStep("focus");
          }}
        />
      );

    case "focus":
      return (
        <FocusPanel
          currentStep={heroCreationStep}
          editable={editable}
          row={row}
          display={display}
          resolvedSpecies={resolvedSpecies}
          resolvedClass={resolvedClass}
          resolvedSpeciesMeta={resolvedSpeciesMeta}
          resolvedClassMeta={resolvedClassMeta}
          portraitPath={portraitPath}
          fallbackPortraitPath={fallbackPortraitPath}
          currentFocus={currentFocus}
          hoveredFocus={hoveredFocus}
          previewFocus={previewFocus}
          previewFocusCopy={previewFocusCopy}
          previewFocusPalette={previewFocusPalette}
          baseStats={baseStats}
          renderFocusDeltaSummary={renderFocusDeltaSummary}
          onBack={() => {
            playSfx(SFX.buttonClick, 0.54);
            goToPreviousStep();
          }}
          onHoverFocus={setHoveredFocus}
          onSelectFocus={(focus) => {
            if (!editable) {
              playSfx(SFX.uiFailure, 0.5);
              return;
            }
            playSfx(SFX.uiSuccess, 0.62);
            setBuildFocus(focus);
            setRitualProgress((prev) => ({
              ...prev,
              focusConfirmed: true,
            }));
            setHeroCreationStep("name");
          }}
        />
      );

    case "name":
      return (
        <NamePanel
          currentStep={heroCreationStep}
          editable={editable}
          row={row}
          display={display}
          resolvedSpecies={resolvedSpecies}
          resolvedClass={resolvedClass}
          resolvedSpeciesMeta={resolvedSpeciesMeta}
          resolvedClassMeta={resolvedClassMeta}
          resolvedFocusMeta={resolvedFocusMeta}
          currentFocus={currentFocus}
          portraitPath={portraitPath}
          fallbackPortraitPath={fallbackPortraitPath}
          canContinueFromName={canContinueFromName}
          onBack={() => {
            playSfx(SFX.buttonClick, 0.54);
            goToPreviousStep();
          }}
          onSetHeroField={(patch) => setHeroField(patch)}
          onContinue={() => {
            if (!canContinueFromName) {
              playSfx(SFX.uiFailure, 0.5);
              return;
            }
            playSfx(SFX.uiSuccess, 0.64);
            setHeroCreationStep("confirm");
          }}
        />
      );

    case "confirm":
      return (
        <OathPanel
          row={row}
          display={display}
          resolvedSpecies={resolvedSpecies}
          resolvedClass={resolvedClass}
          resolvedSpeciesMeta={resolvedSpeciesMeta}
          resolvedClassMeta={resolvedClassMeta}
          resolvedFocusMeta={resolvedFocusMeta}
          currentFocus={currentFocus}
          portraitPath={portraitPath}
          fallbackPortraitPath={fallbackPortraitPath}
          baseStats={baseStats}
          focusDeltaAc={focusDeltaAc}
          focusDeltaHp={focusDeltaHp}
          focusDeltaInit={focusDeltaInit}
          canEnterChronicle={canEnterChronicle}
          partyLocked={partyLocked}
          partyDraft={partyDraft}
          partyLockedByCombat={partyLockedByCombat}
          onBack={() => {
            playSfx(SFX.buttonClick, 0.54);
            goToPreviousStep();
          }}
          onCommit={() => {
            if (!canEnterChronicle || partyLocked || !partyDraft) {
              playSfx(SFX.uiFailure, 0.5);
              return;
            }
            onCommitChronicle();
          }}
        />
      );

    default:
      return null;
  }
}
