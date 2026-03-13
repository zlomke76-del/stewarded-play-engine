"use client";

import React from "react";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import {
  BUILD_FOCUS_META,
  BUILD_FOCUS_OPTIONS,
  CLASS_META,
  SAFE_CLASS_ARCHETYPES,
  SAFE_SPECIES,
  SPECIES_META,
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
  getBaseStatsForClass,
  getFocusPalette,
  getFocusTitleColor,
  getPortraitObjectPosition,
  playSfx,
} from "./helpers";
import {
  RitualChoiceCard,
  RitualFrame,
  RitualStepPills,
  SectionPill,
  StatChip,
  TinyLabel,
} from "./HeroRitualUI";
import HeroRitualPortrait from "./HeroRitualPortrait";

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
  const ritualStageStyle: React.CSSProperties = {
    transition: "opacity 260ms ease, transform 260ms ease",
    opacity: 1,
    transform: "translateY(0)",
    minWidth: 0,
  };

  const controlButtonBase: React.CSSProperties = {
    padding: "11px 14px",
    borderRadius: 12,
    fontWeight: 850,
    letterSpacing: 0.2,
    cursor: "pointer",
    transition:
      "transform 140ms ease, filter 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    outline: "none",
  };

  const helperCardStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    display: "grid",
    gap: 8,
    boxSizing: "border-box",
    minWidth: 0,
  };

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
    const nextStats = getBaseStatsForClass(resolvedClass);
    let ac = nextStats.ac;
    let hp = nextStats.hpMax;
    let init = nextStats.initiativeMod;

    if (focus === "guardian") {
      ac = Math.min(18, ac + 1);
      init = Math.max(-2, init - 1);
    } else if (focus === "swift") {
      ac = Math.max(10, ac - 1);
      init = Math.min(6, init + 2);
    } else if (focus === "hardy") {
      hp = hp + 2;
    }

    const acDelta = ac - nextStats.ac;
    const hpDelta = hp - nextStats.hpMax;
    const initDelta = init - nextStats.initiativeMod;

    const chips: string[] = [];
    if (acDelta !== 0) chips.push(`AC ${acDelta > 0 ? `+${acDelta}` : acDelta}`);
    if (hpDelta !== 0) chips.push(`HP ${hpDelta > 0 ? `+${hpDelta}` : hpDelta}`);
    if (initDelta !== 0) {
      chips.push(`INIT ${initDelta > 0 ? `+${initDelta}` : initDelta}`);
    }
    if (chips.length === 0) chips.push("No stat shift");

    return chips.join(" · ");
  }

  switch (heroCreationStep) {
    case "intro":
      return (
        <div key="ritual-intro" style={ritualStageStyle}>
          <RitualFrame
            title="Echoes of Fate"
            subtitle={
              <>
                The tavern grows quiet.
                <br />
                One hero will begin the descent.
                <br />
                Their name will enter the Chronicle.
              </>
            }
            footer={
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.6);
                    setHeroCreationStep("sex");
                  }}
                  disabled={!editable}
                  style={{
                    ...controlButtonBase,
                    padding: "14px 22px",
                    border: "1px solid rgba(255,205,126,0.28)",
                    background: editable
                      ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                      : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
                    color: editable ? "#2f1606" : "rgba(244,227,201,0.75)",
                    boxShadow: editable
                      ? "0 0 20px rgba(255,160,60,0.35), 0 10px 28px rgba(255,145,42,0.18), inset 0 1px 0 rgba(255,244,220,0.72)"
                      : "none",
                    opacity: editable ? 1 : 0.62,
                    cursor: editable ? "pointer" : "not-allowed",
                    minWidth: 220,
                  }}
                >
                  Begin the Chronicle
                </button>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <RitualStepPills currentStep={heroCreationStep} />

              <div
                style={{
                  display: "grid",
                  justifyItems: "center",
                  gap: 18,
                  padding: "10px 0 6px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: "min(100%, 760px)",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    boxShadow: "0 18px 46px rgba(0,0,0,0.24)",
                    position: "relative",
                    boxSizing: "border-box",
                  }}
                >
                  <img
                    src="/assets/V3/Dungeon/Tavern/tavern_01.png"
                    alt="The tavern grows quiet"
                    style={{
                      width: "100%",
                      height: 320,
                      objectFit: "cover",
                      objectPosition: getPortraitObjectPosition("intro"),
                      display: "block",
                    }}
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = fallbackPortraitPath;
                      img.style.objectPosition =
                        getPortraitObjectPosition("intro");
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.08) 18%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.52) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 14,
                    opacity: 0.78,
                    maxWidth: 700,
                    textAlign: "center",
                    lineHeight: 1.7,
                  }}
                >
                  The first name set into canon will carry forward into every
                  future descent. Choose slowly.
                </div>
              </div>
            </div>
          </RitualFrame>
        </div>
      );

    case "sex":
      return (
        <div key="ritual-sex" style={ritualStageStyle}>
          <RitualFrame
            title="Choose a Form"
            subtitle="Set the first face of your hero. This determines which portrait line follows through the ritual."
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.54);
                    goToPreviousStep();
                  }}
                  style={{
                    ...controlButtonBase,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "inherit",
                  }}
                >
                  Back
                </button>
                <div
                  style={{ fontSize: 12, opacity: 0.72, alignSelf: "center" }}
                >
                  Select the portrait line to continue.
                </div>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <RitualStepPills currentStep={heroCreationStep} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 18,
                  width: "100%",
                  minWidth: 0,
                  alignItems: "stretch",
                }}
              >
                {(["Male", "Female"] as const).map((portrait) => {
                  const selected = row?.portrait === portrait;
                  const imageSrc = getPortraitPath(
                    resolvedSpecies,
                    resolvedClass,
                    portrait
                  );

                  return (
                    <RitualChoiceCard
                      key={portrait}
                      title={portrait}
                      subtitle={
                        portrait === "Male"
                          ? "A rugged line of portraits for your hero's journey."
                          : "A fierce line of portraits for your hero's journey."
                      }
                      imageSrc={imageSrc}
                      fallbackImageSrc={fallbackPortraitPath}
                      species={resolvedSpecies}
                      className={resolvedClass}
                      portrait={portrait}
                      selected={selected}
                      disabled={!editable}
                      details={
                        <div
                          style={{
                            fontSize: 12,
                            opacity: 0.72,
                            lineHeight: 1.5,
                          }}
                        >
                          This choice controls the portrait set shown during
                          species, class, name, and oath.
                        </div>
                      }
                      onClick={() => {
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
                })}
              </div>
            </div>
          </RitualFrame>
        </div>
      );

    case "species":
      return (
        <div key="ritual-species" style={ritualStageStyle}>
          <RitualFrame
            title="Choose a Species"
            subtitle="Identity begins with lineage. Here the player should understand not just the fantasy, but the practical shape of the build."
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.54);
                    goToPreviousStep();
                  }}
                  style={{
                    ...controlButtonBase,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "inherit",
                  }}
                >
                  Back
                </button>

                <div
                  style={{ fontSize: 12, opacity: 0.72, alignSelf: "center" }}
                >
                  Compare strengths, tradeoffs, and playstyle fit.
                </div>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <RitualStepPills currentStep={heroCreationStep} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                  width: "100%",
                  minWidth: 0,
                  alignItems: "stretch",
                }}
              >
                {SAFE_SPECIES.map((species) => {
                  const imageSrc = getPortraitPath(
                    species,
                    resolvedClass,
                    row?.portrait ?? "Male"
                  );
                  const selected =
                    resolvedSpecies.toLowerCase() === species.toLowerCase();
                  const meta = SPECIES_META[species] ?? SPECIES_META.Human;

                  return (
                    <RitualChoiceCard
                      key={species}
                      title={species}
                      subtitle={meta.fantasy}
                      imageSrc={imageSrc}
                      fallbackImageSrc={fallbackPortraitPath}
                      species={species}
                      className={resolvedClass}
                      portrait={row?.portrait ?? "Male"}
                      selected={selected}
                      disabled={!editable}
                      details={
                        <>
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.88,
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Strengths:</strong>{" "}
                            {meta.strengths.join(" · ")}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.78,
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Tradeoff:</strong> {meta.tradeoff}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.72,
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Best for:</strong> {meta.bestFor}
                          </div>
                        </>
                      }
                      onClick={() => {
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
                })}
              </div>
            </div>
          </RitualFrame>
        </div>
      );

    case "class":
      return (
        <div key="ritual-class" style={ritualStageStyle}>
          <RitualFrame
            title="Choose a Class"
            subtitle="This should tell the player how the hero fights, how difficult the role is, and which focus pairings make sense."
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.54);
                    goToPreviousStep();
                  }}
                  style={{
                    ...controlButtonBase,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "inherit",
                  }}
                >
                  Back
                </button>

                <div
                  style={{ fontSize: 12, opacity: 0.72, alignSelf: "center" }}
                >
                  Compare role, difficulty, strengths, and synergy.
                </div>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <RitualStepPills currentStep={heroCreationStep} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                  width: "100%",
                  minWidth: 0,
                  alignItems: "stretch",
                }}
              >
                {SAFE_CLASS_ARCHETYPES.map((className) => {
                  const imageSrc = getPortraitPath(
                    resolvedSpecies,
                    className,
                    row?.portrait ?? "Male"
                  );
                  const selected =
                    resolvedClass.toLowerCase() === className.toLowerCase();
                  const meta = CLASS_META[className] ?? CLASS_META.Warrior;

                  return (
                    <RitualChoiceCard
                      key={className}
                      title={className}
                      subtitle={meta.fantasy}
                      imageSrc={imageSrc}
                      fallbackImageSrc={fallbackPortraitPath}
                      species={resolvedSpecies}
                      className={className}
                      portrait={row?.portrait ?? "Male"}
                      selected={selected}
                      disabled={!editable}
                      details={
                        <>
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.88,
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Role:</strong> {meta.role}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.88,
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Difficulty:</strong> {meta.difficulty}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.84,
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Strengths:</strong>{" "}
                            {meta.strengths.join(" · ")}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.76,
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Tradeoff:</strong> {meta.tradeoff}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.72,
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Best focus:</strong> {meta.bestFocus}
                          </div>
                        </>
                      }
                      onClick={() => {
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
                })}
              </div>
            </div>
          </RitualFrame>
        </div>
      );

    case "focus":
      return (
        <div key="ritual-focus" style={ritualStageStyle}>
          <RitualFrame
            title="Choose a Focus"
            subtitle="This is the stance your hero carries into danger. The player should understand the exact gains and the exact cost."
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.54);
                    goToPreviousStep();
                  }}
                  style={{
                    ...controlButtonBase,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "inherit",
                  }}
                >
                  Back
                </button>

                <div
                  style={{ fontSize: 12, opacity: 0.72, alignSelf: "center" }}
                >
                  Choose the stat tradeoff that best fits the build.
                </div>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <RitualStepPills currentStep={heroCreationStep} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 14,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                {BUILD_FOCUS_OPTIONS.map((option) => {
                  const active = currentFocus === option.id;
                  const meta = BUILD_FOCUS_META[option.id];
                  const palette = getFocusPalette(option.id, active);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (!editable) {
                          playSfx(SFX.uiFailure, 0.5);
                          return;
                        }
                        setBuildFocus(option.id);
                        setRitualProgress((prev) => ({
                          ...prev,
                          focusConfirmed: true,
                        }));
                        setHeroCreationStep("name");
                      }}
                      disabled={!editable}
                      style={{
                        textAlign: "left",
                        padding: 18,
                        borderRadius: 18,
                        border: palette.border,
                        background: palette.background,
                        boxShadow: palette.shadow,
                        color: "inherit",
                        cursor: editable ? "pointer" : "not-allowed",
                        opacity: editable ? 1 : 0.6,
                        display: "grid",
                        gap: 10,
                        transition:
                          "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
                        minWidth: 0,
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: getFocusTitleColor(option.id),
                        }}
                      >
                        {option.icon} {option.label}
                      </div>
                      <div
                        style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.6 }}
                      >
                        {meta.hint}
                      </div>
                      <div
                        style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.5 }}
                      >
                        <strong>Shift:</strong>{" "}
                        {renderFocusDeltaSummary(option.id)}
                      </div>
                      <div
                        style={{ fontSize: 12, opacity: 0.84, lineHeight: 1.5 }}
                      >
                        <strong>Gains:</strong> {meta.gains.join(" · ")}
                      </div>
                      <div
                        style={{ fontSize: 12, opacity: 0.76, lineHeight: 1.5 }}
                      >
                        <strong>Tradeoff:</strong> {meta.tradeoff}
                      </div>
                      <div
                        style={{ fontSize: 12, opacity: 0.72, lineHeight: 1.5 }}
                      >
                        <strong>Best for:</strong> {meta.bestFor}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </RitualFrame>
        </div>
      );

    case "name":
      return (
        <div key="ritual-name" style={ritualStageStyle}>
          <RitualFrame
            title="Name the Hero"
            subtitle="A name binds memory to fate. This is the first voice the Chronicle will remember."
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.54);
                    goToPreviousStep();
                  }}
                  style={{
                    ...controlButtonBase,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "inherit",
                  }}
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canContinueFromName) {
                      playSfx(SFX.uiFailure, 0.5);
                      return;
                    }
                    playSfx(SFX.uiSuccess, 0.64);
                    setHeroCreationStep("confirm");
                  }}
                  disabled={!canContinueFromName}
                  style={{
                    ...controlButtonBase,
                    border: "1px solid rgba(255,205,126,0.28)",
                    background: canContinueFromName
                      ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                      : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
                    color: canContinueFromName
                      ? "#2f1606"
                      : "rgba(244,227,201,0.75)",
                    opacity: canContinueFromName ? 1 : 0.62,
                    cursor: canContinueFromName ? "pointer" : "not-allowed",
                    minWidth: 140,
                  }}
                >
                  Continue
                </button>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <RitualStepPills currentStep={heroCreationStep} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 20,
                  alignItems: "start",
                  minWidth: 0,
                }}
              >
                <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
                  <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                    <TinyLabel>Hero Name</TinyLabel>
                    <input
                      value={row?.name ?? ""}
                      disabled={!editable}
                      onChange={(e) => setHeroField({ name: e.target.value })}
                      placeholder="The Lone Hero"
                      style={{
                        ...inputStyle,
                        padding: "14px 16px",
                        fontSize: 18,
                        borderRadius: 14,
                      }}
                    />
                    <div
                      style={{ fontSize: 13, opacity: 0.74, lineHeight: 1.6 }}
                    >
                      {(row?.name ?? "").trim().length > 0 ? (
                        <>
                          Current Chronicle entry: <strong>{display}</strong>
                        </>
                      ) : (
                        <>Choose a true name before continuing.</>
                      )}
                    </div>
                  </div>

                  <div style={helperCardStyle}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>
                      Current Build Summary
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.6 }}>
                      <strong>{resolvedSpecies}</strong> {resolvedClass} ·{" "}
                      <strong>
                        {BUILD_FOCUS_OPTIONS.find((x) => x.id === currentFocus)
                          ?.label ?? ""}
                      </strong>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.76, lineHeight: 1.6 }}>
                      {resolvedSpeciesMeta.bestFor} · {resolvedClassMeta.role} ·{" "}
                      {resolvedFocusMeta.bestFor}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <HeroRitualPortrait
                    species={resolvedSpecies}
                    className={resolvedClass}
                    portrait={row?.portrait ?? "Male"}
                    imageSrc={portraitPath}
                    fallbackImageSrc={fallbackPortraitPath}
                    alt={`${display} portrait`}
                    height={320}
                    objectPosition={getPortraitObjectPosition("name")}
                  />
                </div>
              </div>
            </div>
          </RitualFrame>
        </div>
      );

    case "confirm":
      return (
        <div key="ritual-confirm" style={ritualStageStyle}>
          <RitualFrame
            title="The Oath"
            subtitle="A new name enters the Chronicle."
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.54);
                    goToPreviousStep();
                  }}
                  style={{
                    ...controlButtonBase,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "inherit",
                  }}
                >
                  Back
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => {
                      if (!canEnterChronicle || partyLocked || !partyDraft) {
                        playSfx(SFX.uiFailure, 0.5);
                        return;
                      }
                      onCommitChronicle();
                    }}
                    disabled={!canEnterChronicle || partyLocked || !partyDraft}
                    style={{
                      ...controlButtonBase,
                      border: "1px solid rgba(255,205,126,0.28)",
                      background:
                        canEnterChronicle && !partyLocked && !!partyDraft
                          ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                          : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
                      color:
                        canEnterChronicle && !partyLocked && !!partyDraft
                          ? "#2f1606"
                          : "rgba(244,227,201,0.75)",
                      boxShadow:
                        canEnterChronicle && !partyLocked && !!partyDraft
                          ? "0 10px 28px rgba(255,145,42,0.18), inset 0 1px 0 rgba(255,244,220,0.72)"
                          : "none",
                      opacity:
                        canEnterChronicle && !partyLocked && !!partyDraft
                          ? 1
                          : 0.62,
                      cursor:
                        canEnterChronicle && !partyLocked && !!partyDraft
                          ? "pointer"
                          : "not-allowed",
                      minWidth: 210,
                    }}
                  >
                    Enter the Chronicle
                  </button>

                  <span style={{ fontSize: 12, opacity: 0.72 }}>
                    {canEnterChronicle
                      ? "Ritual complete"
                      : "Complete every choice to continue"}
                    {partyLockedByCombat ? " · Combat lock active" : ""}
                  </span>
                </div>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <RitualStepPills currentStep={heroCreationStep} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 20,
                  alignItems: "start",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    boxShadow:
                      "0 0 40px rgba(255,180,80,0.18), 0 18px 40px rgba(0,0,0,0.24)",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <HeroRitualPortrait
                    species={resolvedSpecies}
                    className={resolvedClass}
                    portrait={row?.portrait ?? "Male"}
                    imageSrc={portraitPath}
                    fallbackImageSrc={fallbackPortraitPath}
                    alt={`${display} portrait`}
                    height={400}
                    objectPosition={getPortraitObjectPosition("oath")}
                  />
                </div>

                <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
                  <div>
                    <div
                      style={{ fontSize: 36, fontWeight: 950, lineHeight: 1.05 }}
                    >
                      {display}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 16, opacity: 0.82 }}>
                      {resolvedSpecies} {resolvedClass}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <SectionPill>
                      <strong>Focus</strong>{" "}
                      {BUILD_FOCUS_OPTIONS.find((x) => x.id === currentFocus)
                        ?.label ?? "Balanced"}
                    </SectionPill>
                    <SectionPill>
                      <strong>Portrait</strong> {row?.portrait ?? "Male"}
                    </SectionPill>
                    <SectionPill tone="warn">
                      <strong>Role</strong> {resolvedClassMeta.role}
                    </SectionPill>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <StatChip
                      label="AC"
                      value={`${row?.ac ?? baseStats.ac}${focusDeltaAc ? ` (${focusDeltaAc > 0 ? `+${focusDeltaAc}` : focusDeltaAc})` : ""}`}
                    />
                    <StatChip
                      label="HP Max"
                      value={`${row?.hpMax ?? baseStats.hpMax}${focusDeltaHp ? ` (${focusDeltaHp > 0 ? `+${focusDeltaHp}` : focusDeltaHp})` : ""}`}
                    />
                    <StatChip
                      label="Init"
                      value={`${row?.initiativeMod ?? baseStats.initiativeMod}${focusDeltaInit ? ` (${focusDeltaInit > 0 ? `+${focusDeltaInit}` : focusDeltaInit})` : ""}`}
                    />
                  </div>

                  <div style={helperCardStyle}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>
                      What this build does well
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.84, lineHeight: 1.65 }}>
                      • {resolvedSpeciesMeta.strengths[0]}
                      <br />
                      • {resolvedClassMeta.strengths[0]}
                      <br />
                      • {resolvedFocusMeta.gains[0]}
                    </div>
                  </div>

                  <div style={helperCardStyle}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>Tradeoffs</div>
                    <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.65 }}>
                      • {resolvedSpeciesMeta.tradeoff}
                      <br />
                      • {resolvedClassMeta.tradeoff}
                      <br />
                      • {resolvedFocusMeta.tradeoff}
                    </div>
                  </div>

                  <div style={helperCardStyle}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>
                      Recommended playstyle
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.65 }}>
                      This hero fits{" "}
                      <strong>
                        {resolvedSpeciesMeta.bestFor.toLowerCase()}
                      </strong>
                      , operates as a{" "}
                      <strong>{resolvedClassMeta.role.toLowerCase()}</strong>, and
                      is best used for{" "}
                      <strong>{resolvedFocusMeta.bestFor.toLowerCase()}</strong>.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RitualFrame>
        </div>
      );

    default:
      return null;
  }
}
