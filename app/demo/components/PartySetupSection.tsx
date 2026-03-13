"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import HeroRitualFlow from "./hero-ritual/HeroRitualFlow";
import {
  BUILD_FOCUS_META,
  CLASS_META,
  SPECIES_META,
  type HeroCreationStep,
  type PartyDeclaredPayload,
  type PartyMember,
  type RitualProgress,
} from "./hero-ritual/types";
import {
  SFX,
  applyBuildFocusToStats,
  getResolvedClass,
  getResolvedLoadout,
  getResolvedSpecies,
  inferBuildFocus,
  playSfx,
} from "./hero-ritual/helpers";
import { SectionPill } from "./hero-ritual/HeroRitualUI";
import { resolvePartyLoadout } from "@/lib/skills/loadoutResolver";

export default function PartySetupSection(props: {
  enabled: boolean;
  partyDraft: PartyDeclaredPayload | null;
  partyMembersFallback: PartyMember[];
  partyCanonicalExists: boolean;
  partyLocked: boolean;
  partyLockedByCombat: boolean;
  commitParty: () => void;
  setPartyDraft: React.Dispatch<React.SetStateAction<PartyDeclaredPayload | null>>;
  unlockedPartySlots: number;
  maxPartySlots: number;
  completionRequiresFullFellowship: boolean;
}) {
  const {
    enabled,
    partyDraft,
    partyMembersFallback,
    partyCanonicalExists,
    partyLocked,
    partyLockedByCombat,
    commitParty,
    setPartyDraft,
  } = props;

  const [heroCreationStep, setHeroCreationStep] =
    useState<HeroCreationStep>("intro");
  const [ritualProgress, setRitualProgress] = useState<RitualProgress>({
    sexConfirmed: false,
    speciesConfirmed: false,
    classConfirmed: false,
    focusConfirmed: false,
  });
  const [canonFlashVisible, setCanonFlashVisible] = useState(false);

  const heroSelectionAudioRef = useRef<HTMLAudioElement | null>(null);
  const canonFlashTimeoutRef = useRef<number | null>(null);
  const commitDelayTimeoutRef = useRef<number | null>(null);

  const editable = !partyLocked && !!partyDraft;
  const sourceHero = (partyDraft?.members?.[0] ??
    partyMembersFallback?.[0]) as PartyMember | undefined;
  const row: PartyMember | null = sourceHero ?? null;

  const heroSummary = useMemo(() => {
    if (!row) {
      return {
        hpTotal: 0,
        resolvedSpecies: "Human",
        resolvedClass: "Warrior",
      };
    }

    return {
      hpTotal: Number(row.hpCurrent ?? 0),
      resolvedSpecies: getResolvedSpecies(row.species),
      resolvedClass: getResolvedClass(row.className),
    };
  }, [row]);

  function stopHeroSelectionLoop(resetTime = true) {
    const audio = heroSelectionAudioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      if (resetTime) {
        audio.currentTime = 0;
      }
    } catch {
      // fail silently
    }
  }

  function startHeroSelectionLoop() {
    try {
      let audio = heroSelectionAudioRef.current;

      if (!audio) {
        audio = new Audio(SFX.heroSelectionLoop);
        audio.loop = true;
        audio.volume = 0.44;
        audio.preload = "auto";
        heroSelectionAudioRef.current = audio;
      }

      if (!audio.paused) return;

      void audio.play().catch(() => {});
    } catch {
      // fail silently
    }
  }

  useEffect(() => {
    const shouldPlayLoop = enabled && !!row && !partyCanonicalExists && editable;

    if (shouldPlayLoop) {
      startHeroSelectionLoop();
    } else {
      stopHeroSelectionLoop(false);
    }

    return () => {
      stopHeroSelectionLoop(false);
    };
  }, [enabled, row, partyCanonicalExists, editable]);

  useEffect(() => {
    return () => {
      stopHeroSelectionLoop(true);
      heroSelectionAudioRef.current = null;

      if (canonFlashTimeoutRef.current) {
        window.clearTimeout(canonFlashTimeoutRef.current);
      }
      if (commitDelayTimeoutRef.current) {
        window.clearTimeout(commitDelayTimeoutRef.current);
      }
    };
  }, []);

  function triggerCanonFlash() {
    setCanonFlashVisible(true);

    if (canonFlashTimeoutRef.current) {
      window.clearTimeout(canonFlashTimeoutRef.current);
    }

    canonFlashTimeoutRef.current = window.setTimeout(() => {
      setCanonFlashVisible(false);
    }, 180);
  }

  function setHeroField(patch: Partial<PartyMember>) {
    setPartyDraft((prev) => {
      if (!prev || !prev.members?.length) return prev;

      const current = { ...prev.members[0], ...patch };
      return {
        ...prev,
        members: [current],
      };
    });
  }

  function setPortrait(portrait: "Male" | "Female") {
    playSfx(SFX.buttonClick, 0.52);
    setHeroField({ portrait });
  }

  function setSpecies(nextSpecies: string) {
    if (!row) return;
    const next = resolvePartyLoadout(
      row.className || "Warrior",
      nextSpecies || "Human"
    );
    setHeroField({
      species: nextSpecies,
      traits: next.traitIds,
    });
  }

  function setClass(nextClassName: string) {
    if (!row) return;

    const next = resolvePartyLoadout(
      nextClassName || "Warrior",
      row.species || "Human"
    );
    const resolvedClass = getResolvedClass(nextClassName || "Warrior");
    const focus = inferBuildFocus(
      row,
      getResolvedClass(row.className || "Warrior")
    );
    const focusedStats = applyBuildFocusToStats(
      {
        ac:
          resolvedClass === "Warrior"
            ? 14
            : resolvedClass === "Rogue"
              ? 13
              : resolvedClass === "Mage"
                ? 11
                : resolvedClass === "Cleric"
                  ? 13
                  : resolvedClass === "Ranger"
                    ? 13
                    : resolvedClass === "Paladin"
                      ? 15
                      : resolvedClass === "Bard"
                        ? 12
                        : resolvedClass === "Druid"
                          ? 12
                          : resolvedClass === "Monk"
                            ? 13
                            : resolvedClass === "Artificer"
                              ? 13
                              : resolvedClass === "Barbarian"
                                ? 13
                                : resolvedClass === "Sorcerer"
                                  ? 11
                                  : resolvedClass === "Warlock"
                                    ? 12
                                    : 14,
        hpMax:
          resolvedClass === "Warrior"
            ? 14
            : resolvedClass === "Rogue"
              ? 11
              : resolvedClass === "Mage"
                ? 9
                : resolvedClass === "Cleric"
                  ? 12
                  : resolvedClass === "Ranger"
                    ? 12
                    : resolvedClass === "Paladin"
                      ? 14
                      : resolvedClass === "Bard"
                        ? 10
                        : resolvedClass === "Druid"
                          ? 10
                          : resolvedClass === "Monk"
                            ? 11
                            : resolvedClass === "Artificer"
                              ? 11
                              : resolvedClass === "Barbarian"
                                ? 15
                                : resolvedClass === "Sorcerer"
                                  ? 9
                                  : resolvedClass === "Warlock"
                                    ? 10
                                    : 12,
        initiativeMod:
          resolvedClass === "Warrior"
            ? 1
            : resolvedClass === "Rogue"
              ? 3
              : resolvedClass === "Mage"
                ? 1
                : resolvedClass === "Cleric"
                  ? 0
                  : resolvedClass === "Ranger"
                    ? 2
                    : resolvedClass === "Paladin"
                      ? 0
                      : resolvedClass === "Bard"
                        ? 2
                        : resolvedClass === "Druid"
                          ? 1
                          : resolvedClass === "Monk"
                            ? 3
                            : resolvedClass === "Artificer"
                              ? 1
                              : resolvedClass === "Barbarian"
                                ? 1
                                : resolvedClass === "Sorcerer"
                                  ? 2
                                  : resolvedClass === "Warlock"
                                    ? 1
                                    : 1,
      },
      focus
    );

    setHeroField({
      className: nextClassName,
      skills: next.skillIds,
      ac: focusedStats.ac,
      hpMax: focusedStats.hpMax,
      hpCurrent: focusedStats.hpMax,
      initiativeMod: focusedStats.initiativeMod,
    });
  }

  function setBuildFocus(focus: "balanced" | "guardian" | "swift" | "hardy") {
    if (!row) return;

    const resolvedClass = getResolvedClass(row.className || "Warrior");
    const base =
      resolvedClass === "Warrior"
        ? { ac: 14, hpMax: 14, initiativeMod: 1 }
        : resolvedClass === "Rogue"
          ? { ac: 13, hpMax: 11, initiativeMod: 3 }
          : resolvedClass === "Mage"
            ? { ac: 11, hpMax: 9, initiativeMod: 1 }
            : resolvedClass === "Cleric"
              ? { ac: 13, hpMax: 12, initiativeMod: 0 }
              : resolvedClass === "Ranger"
                ? { ac: 13, hpMax: 12, initiativeMod: 2 }
                : resolvedClass === "Paladin"
                  ? { ac: 15, hpMax: 14, initiativeMod: 0 }
                  : resolvedClass === "Bard"
                    ? { ac: 12, hpMax: 10, initiativeMod: 2 }
                    : resolvedClass === "Druid"
                      ? { ac: 12, hpMax: 10, initiativeMod: 1 }
                      : resolvedClass === "Monk"
                        ? { ac: 13, hpMax: 11, initiativeMod: 3 }
                        : resolvedClass === "Artificer"
                          ? { ac: 13, hpMax: 11, initiativeMod: 1 }
                          : resolvedClass === "Barbarian"
                            ? { ac: 13, hpMax: 15, initiativeMod: 1 }
                            : resolvedClass === "Sorcerer"
                              ? { ac: 11, hpMax: 9, initiativeMod: 2 }
                              : resolvedClass === "Warlock"
                                ? { ac: 12, hpMax: 10, initiativeMod: 1 }
                                : { ac: 14, hpMax: 12, initiativeMod: 1 };

    const nextStats = applyBuildFocusToStats(base, focus);

    playSfx(SFX.buttonClick, 0.54);
    setHeroField({
      ac: nextStats.ac,
      hpMax: nextStats.hpMax,
      hpCurrent: nextStats.hpMax,
      initiativeMod: nextStats.initiativeMod,
    });
  }

  function resetRitualFlow() {
    setHeroCreationStep("intro");
    setRitualProgress({
      sexConfirmed: false,
      speciesConfirmed: false,
      classConfirmed: false,
      focusConfirmed: false,
    });
  }

  if (!enabled || !row) return null;
  if (partyCanonicalExists) return null;

  const { resolvedSpecies, resolvedClass } = getResolvedLoadout(row);
  const currentFocus = inferBuildFocus(row, resolvedClass);
  const display = row?.name?.trim() || "The Lone Hero";
  const hasValidHeroName = (row?.name ?? "").trim().length > 0;

  const resolvedSpeciesMeta = SPECIES_META[resolvedSpecies] ?? SPECIES_META.Human;
  const resolvedClassMeta = CLASS_META[resolvedClass] ?? CLASS_META.Warrior;
  const resolvedFocusMeta = BUILD_FOCUS_META[currentFocus];

  const shellStyle: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "radial-gradient(circle at top, rgba(255,194,116,0.08), transparent 24%), linear-gradient(180deg, rgba(17,17,17,0.90), rgba(12,12,12,0.86))",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 44px rgba(0,0,0,0.24)",
    padding: 18,
    overflowX: "hidden",
    position: "relative",
    boxSizing: "border-box",
  };

  function handleCommitChronicle() {
    if (!partyDraft || partyLocked) {
      playSfx(SFX.uiFailure, 0.5);
      return;
    }

    stopHeroSelectionLoop(true);
    triggerCanonFlash();
    playSfx(SFX.arbiterCanonRecord, 0.78);

    if (commitDelayTimeoutRef.current) {
      window.clearTimeout(commitDelayTimeoutRef.current);
    }

    commitDelayTimeoutRef.current = window.setTimeout(() => {
      commitParty();
    }, 120);
  }

  return (
    <div style={{ scrollMarginTop: 90, overflowX: "hidden", position: "relative", minWidth: 0 }}>
      {canonFlashVisible ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at center, rgba(255,220,160,0.18), rgba(255,200,120,0.08) 35%, rgba(255,255,255,0) 70%)",
            zIndex: 40,
          }}
        />
      ) : null}

      <section style={shellStyle}>
        <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 14,
              alignItems: "start",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: 0.2 }}>
                Declare the Lone Hero
              </div>
              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.82, maxWidth: 820, lineHeight: 1.6 }}>
                The journey begins with one hero only. This opening should feel like the start of a Chronicle, not a
                control panel.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <SectionPill>
                  <strong>1</strong> Starting Hero
                </SectionPill>
                <SectionPill>
                  <strong>{row?.portrait ?? "Male"}</strong> Portrait
                </SectionPill>
                <SectionPill>
                  <strong>{heroSummary.resolvedClass}</strong> Class
                </SectionPill>
                <SectionPill>
                  <strong>{heroSummary.resolvedSpecies}</strong> Lineage
                </SectionPill>
                <SectionPill>Draft hero only</SectionPill>
                {partyLockedByCombat ? (
                  <SectionPill tone="warn">Combat lock active</SectionPill>
                ) : null}
              </div>
            </div>
          </div>

          <HeroRitualFlow
            heroCreationStep={heroCreationStep}
            setHeroCreationStep={setHeroCreationStep}
            ritualProgress={ritualProgress}
            setRitualProgress={setRitualProgress}
            editable={editable}
            row={row}
            partyDraft={partyDraft}
            partyLocked={partyLocked}
            partyLockedByCombat={partyLockedByCombat}
            resolvedSpecies={resolvedSpecies}
            resolvedClass={resolvedClass}
            currentFocus={currentFocus}
            display={display}
            hasValidHeroName={hasValidHeroName}
            resolvedSpeciesMeta={resolvedSpeciesMeta}
            resolvedClassMeta={resolvedClassMeta}
            resolvedFocusMeta={resolvedFocusMeta}
            setPortrait={setPortrait}
            setSpecies={setSpecies}
            setClass={setClass}
            setBuildFocus={setBuildFocus}
            setHeroField={setHeroField}
            onCommitChronicle={handleCommitChronicle}
          />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => {
                playSfx(SFX.buttonClick, 0.54);
                resetRitualFlow();
              }}
              style={{
                padding: "11px 14px",
                borderRadius: 12,
                fontWeight: 850,
                letterSpacing: 0.2,
                cursor: "pointer",
                transition:
                  "transform 140ms ease, filter 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "inherit",
              }}
            >
              Restart Ritual
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
