"use client";

import React, { useMemo, useState } from "react";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import { getSkillDefinition } from "@/lib/skills/skillDefinitions";
import { getSpeciesTraitDefinition } from "@/lib/skills/speciesTraitMap";
import { resolvePartyLoadout } from "@/lib/skills/loadoutResolver";

type PortraitType = "Male" | "Female";
type BuildFocus = "balanced" | "guardian" | "swift" | "hardy";

type PartyMember = {
  id: string;
  name: string;
  species?: string;
  className: string;
  portrait: PortraitType;
  skills?: string[];
  traits?: string[];
  ac: number;
  hpMax: number;
  hpCurrent: number;
  initiativeMod: number;
};

type PartyDeclaredPayload = {
  partyId: string;
  members: PartyMember[];
};

const SAFE_CLASS_ARCHETYPES = [
  "Warrior",
  "Rogue",
  "Mage",
  "Cleric",
  "Ranger",
  "Paladin",
  "Bard",
  "Druid",
  "Monk",
  "Artificer",
  "Barbarian",
  "Sorcerer",
  "Warlock",
] as const;

const SAFE_SPECIES = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Dragonborn",
] as const;

const BUILD_FOCUS_OPTIONS: Array<{
  id: BuildFocus;
  label: string;
  hint: string;
}> = [
  { id: "balanced", label: "Balanced", hint: "Steady all-around profile." },
  { id: "guardian", label: "Guardian", hint: "Higher AC, lower speed." },
  { id: "swift", label: "Swift", hint: "Higher initiative, lighter defense." },
  { id: "hardy", label: "Hardy", hint: "More vitality for longer fights." },
];

const SFX = {
  buttonClick: "/assets/audio/sfx_button_click_01.mp3",
  uiSuccess: "/assets/audio/sfx_success_01.mp3",
  uiFailure: "/assets/audio/sfx_failure_01.mp3",
  arbiterCanonRecord: "/assets/audio/sfx_arbiter_cannon_record_01.mp3",
} as const;

function playSfx(src: string, volume = 0.66) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // fail silently
  }
}

function normalizeClassValue(v: string) {
  return (v ?? "").trim();
}

function normalizeSpeciesValue(v: string) {
  return (v ?? "").trim();
}

function isKnownValue(value: string, allowed: readonly string[]) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return allowed.some((x) => x.toLowerCase() === normalized);
}

function getResolvedSpecies(value?: string) {
  const normalized = normalizeSpeciesValue(value ?? "");
  if (!normalized) return "Human";
  return SAFE_SPECIES.find((x) => x.toLowerCase() === normalized.toLowerCase()) ?? normalized;
}

function getResolvedClass(value?: string) {
  const normalized = normalizeClassValue(value ?? "");
  if (!normalized) return "Warrior";
  return SAFE_CLASS_ARCHETYPES.find((x) => x.toLowerCase() === normalized.toLowerCase()) ?? normalized;
}

function getResolvedLoadout(row: PartyMember) {
  const resolvedClass = getResolvedClass(row.className);
  const resolvedSpecies = getResolvedSpecies(row.species);

  const canonical = resolvePartyLoadout(resolvedClass, resolvedSpecies);

  return {
    skillIds: Array.isArray(row.skills) && row.skills.length > 0 ? row.skills : canonical.skillIds,
    traitIds: Array.isArray(row.traits) && row.traits.length > 0 ? row.traits : canonical.traitIds,
    resolvedClass,
    resolvedSpecies,
  };
}

function getBaseStatsForClass(className: string) {
  const table: Record<string, { ac: number; hpMax: number; initiativeMod: number }> = {
    Warrior: { ac: 14, hpMax: 14, initiativeMod: 1 },
    Rogue: { ac: 13, hpMax: 11, initiativeMod: 3 },
    Mage: { ac: 11, hpMax: 9, initiativeMod: 1 },
    Cleric: { ac: 13, hpMax: 12, initiativeMod: 0 },
    Ranger: { ac: 13, hpMax: 12, initiativeMod: 2 },
    Paladin: { ac: 15, hpMax: 14, initiativeMod: 0 },
    Bard: { ac: 12, hpMax: 10, initiativeMod: 2 },
    Druid: { ac: 12, hpMax: 10, initiativeMod: 1 },
    Monk: { ac: 13, hpMax: 11, initiativeMod: 3 },
    Artificer: { ac: 13, hpMax: 11, initiativeMod: 1 },
    Barbarian: { ac: 13, hpMax: 15, initiativeMod: 1 },
    Sorcerer: { ac: 11, hpMax: 9, initiativeMod: 2 },
    Warlock: { ac: 12, hpMax: 10, initiativeMod: 1 },
  };

  return table[className] ?? { ac: 14, hpMax: 12, initiativeMod: 1 };
}

function applyBuildFocusToStats(
  base: { ac: number; hpMax: number; initiativeMod: number },
  focus: BuildFocus
) {
  if (focus === "guardian") {
    return {
      ac: Math.min(18, base.ac + 1),
      hpMax: base.hpMax,
      initiativeMod: Math.max(-2, base.initiativeMod - 1),
    };
  }

  if (focus === "swift") {
    return {
      ac: Math.max(10, base.ac - 1),
      hpMax: base.hpMax,
      initiativeMod: Math.min(6, base.initiativeMod + 2),
    };
  }

  if (focus === "hardy") {
    return {
      ac: base.ac,
      hpMax: base.hpMax + 2,
      initiativeMod: base.initiativeMod,
    };
  }

  return base;
}

function inferBuildFocus(row: PartyMember, resolvedClass: string): BuildFocus {
  const base = getBaseStatsForClass(resolvedClass);

  if (row.initiativeMod >= base.initiativeMod + 2) return "swift";
  if (row.hpMax >= base.hpMax + 2) return "hardy";
  if (row.ac >= base.ac + 1 && row.initiativeMod <= base.initiativeMod - 1) return "guardian";
  return "balanced";
}

function SectionPill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "good" | "warn";
}) {
  const palette =
    tone === "good"
      ? {
          border: "1px solid rgba(120,190,255,0.24)",
          background: "rgba(120,190,255,0.10)",
        }
      : tone === "warn"
        ? {
            border: "1px solid rgba(255,196,118,0.22)",
            background: "rgba(255,196,118,0.08)",
          }
        : {
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
          };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 11px",
        borderRadius: 999,
        fontSize: 12,
        lineHeight: 1,
        ...palette,
      }}
    >
      {children}
    </span>
  );
}

function TinyLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        opacity: 0.62,
        marginBottom: 6,
        fontWeight: 800,
      }}
    >
      {children}
    </div>
  );
}

function StatChip({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        minWidth: 70,
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.62, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </div>
      <div style={{ marginTop: 4, fontWeight: 900, fontSize: 15 }}>{value}</div>
    </div>
  );
}

function FellowshipSlots({
  unlockedPartySlots,
  maxPartySlots,
}: {
  unlockedPartySlots: number;
  maxPartySlots: number;
}) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {Array.from({ length: maxPartySlots }, (_, i) => {
        const slot = i + 1;
        const unlocked = slot <= unlockedPartySlots;
        const active = slot === 1;

        return (
          <div
            key={slot}
            style={{
              width: 70,
              padding: "10px 8px",
              borderRadius: 12,
              border: active
                ? "1px solid rgba(138,180,255,0.34)"
                : unlocked
                  ? "1px solid rgba(255,255,255,0.12)"
                  : "1px solid rgba(255,255,255,0.08)",
              background: active
                ? "rgba(138,180,255,0.10)"
                : unlocked
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.02)",
              display: "grid",
              gap: 6,
              justifyItems: "center",
              opacity: unlocked ? 1 : 0.58,
            }}
          >
            <div style={{ fontSize: 18 }}>{active ? "⚔" : unlocked ? "◌" : "🔒"}</div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.3 }}>
              {active ? "Hero" : unlocked ? `Slot ${slot}` : `Locked ${slot}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
    unlockedPartySlots,
    maxPartySlots,
    completionRequiresFullFellowship,
  } = props;

  const [showDeclaredEditor, setShowDeclaredEditor] = useState(false);

  const editable = !partyLocked && !!partyDraft;
  const sourceHero = (partyDraft?.members?.[0] ?? partyMembersFallback?.[0]) as PartyMember | undefined;
  const row: PartyMember | null = sourceHero ?? null;
  const canCollapseToSummary = partyCanonicalExists && partyLocked;
  const showFullEditor = !canCollapseToSummary || showDeclaredEditor;

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

  function setPortrait(portrait: PortraitType) {
    playSfx(SFX.buttonClick, 0.52);
    setHeroField({ portrait });
  }

  function setSpecies(nextSpecies: string) {
    if (!row) return;
    const next = resolvePartyLoadout(row.className || "Warrior", nextSpecies || "Human");
    setHeroField({
      species: nextSpecies,
      traits: next.traitIds,
    });
  }

  function setClass(nextClassName: string) {
    if (!row) return;

    const next = resolvePartyLoadout(nextClassName || "Warrior", row.species || "Human");
    const resolvedClass = getResolvedClass(nextClassName || "Warrior");
    const focus = inferBuildFocus(row, getResolvedClass(row.className || "Warrior"));
    const focusedStats = applyBuildFocusToStats(getBaseStatsForClass(resolvedClass), focus);

    setHeroField({
      className: nextClassName,
      skills: next.skillIds,
      ac: focusedStats.ac,
      hpMax: focusedStats.hpMax,
      hpCurrent: focusedStats.hpMax,
      initiativeMod: focusedStats.initiativeMod,
    });
  }

  function setBuildFocus(focus: BuildFocus) {
    if (!row) return;

    const resolvedClass = getResolvedClass(row.className || "Warrior");
    const base = getBaseStatsForClass(resolvedClass);
    const nextStats = applyBuildFocusToStats(base, focus);

    playSfx(SFX.buttonClick, 0.54);
    setHeroField({
      ac: nextStats.ac,
      hpMax: nextStats.hpMax,
      hpCurrent: nextStats.hpMax,
      initiativeMod: nextStats.initiativeMod,
    });
  }

  const shellStyle: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "radial-gradient(circle at top, rgba(255,194,116,0.08), transparent 24%), linear-gradient(180deg, rgba(17,17,17,0.90), rgba(12,12,12,0.86))",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 44px rgba(0,0,0,0.24)",
    padding: 18,
  };

  const controlButtonBase: React.CSSProperties = {
    padding: "11px 14px",
    borderRadius: 12,
    fontWeight: 850,
    letterSpacing: 0.2,
    cursor: "pointer",
    transition: "transform 140ms ease, filter 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundColor: "rgba(24,24,24,0.96)",
    color: "rgba(245,236,216,0.96)",
    border: "1px solid rgba(255,255,255,0.14)",
    colorScheme: "dark",
    backgroundImage:
      'linear-gradient(45deg, transparent 50%, rgba(245,236,216,0.82) 50%), linear-gradient(135deg, rgba(245,236,216,0.82) 50%, transparent 50%)',
    backgroundPosition: "calc(100% - 18px) calc(50% - 3px), calc(100% - 12px) calc(50% - 3px)",
    backgroundSize: "6px 6px, 6px 6px",
    backgroundRepeat: "no-repeat",
    paddingRight: 34,
  };

  const tagStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 11,
    lineHeight: 1.25,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  };

  const traitTagStyle: React.CSSProperties = {
    ...tagStyle,
    background: "rgba(120,180,255,0.10)",
    border: "1px solid rgba(120,180,255,0.22)",
  };

  if (!enabled || !row) return null;

  const speciesValue = normalizeSpeciesValue(row?.species ?? "");
  const speciesIsCustom = speciesValue.length > 0 && !isKnownValue(speciesValue, SAFE_SPECIES);

  const speciesSelectValue =
    speciesValue.length === 0
      ? ""
      : speciesIsCustom
        ? "__custom__"
        : SAFE_SPECIES.find((x) => x.toLowerCase() === speciesValue.toLowerCase()) ?? "";

  const classValue = normalizeClassValue(row?.className ?? "");
  const classIsCustom =
    classValue.length > 0 && !isKnownValue(classValue, SAFE_CLASS_ARCHETYPES);

  const classSelectValue =
    classValue.length === 0
      ? ""
      : classIsCustom
        ? "__custom__"
        : SAFE_CLASS_ARCHETYPES.find((x) => x.toLowerCase() === classValue.toLowerCase()) ?? "";

  const { resolvedSpecies, resolvedClass, skillIds, traitIds } = getResolvedLoadout(row);
  const currentFocus = inferBuildFocus(row, resolvedClass);
  const portraitPath = getPortraitPath(resolvedSpecies, resolvedClass, row?.portrait ?? "Male");
  const skillLabels = skillIds.map((skillId) => getSkillDefinition(skillId)?.label ?? skillId);
  const traitLabels = traitIds.map((traitId) => getSpeciesTraitDefinition(traitId)?.label ?? traitId);
  const display = row?.name?.trim() || "The Lone Hero";

  return (
    <div style={{ scrollMarginTop: 90 }}>
      <section style={shellStyle}>
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) auto",
              gap: 14,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: 0.2 }}>
                Declare the Lone Hero
              </div>
              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.82, maxWidth: 820, lineHeight: 1.6 }}>
                The journey begins with one hero only. Identity comes first: portrait, name, species,
                class, and build focus. The rest of the fellowship remains locked in the depths until
                it is earned.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <SectionPill tone={partyCanonicalExists ? "good" : "default"}>
                  <strong>1</strong> Starting Hero
                </SectionPill>
                <SectionPill>
                  <strong>{heroSummary.resolvedClass}</strong> Class
                </SectionPill>
                <SectionPill>
                  <strong>{heroSummary.resolvedSpecies}</strong> Lineage
                </SectionPill>
                <SectionPill tone="warn">
                  <strong>{heroSummary.hpTotal}</strong> Total HP
                </SectionPill>
                <SectionPill tone={partyCanonicalExists ? "good" : "default"}>
                  {partyCanonicalExists ? "Hero canonized" : "Draft hero only"}
                </SectionPill>
                {partyLockedByCombat ? <SectionPill tone="warn">Combat lock active</SectionPill> : null}
              </div>
            </div>

            {canCollapseToSummary && showFullEditor && (
              <button
                onClick={() => {
                  if (!partyCanonicalExists) {
                    playSfx(SFX.uiFailure, 0.5);
                    return;
                  }
                  playSfx(SFX.buttonClick, 0.56);
                  setShowDeclaredEditor(false);
                }}
                style={{
                  ...controlButtonBase,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                  alignSelf: "start",
                }}
              >
                Collapse Hero
              </button>
            )}
          </div>

          <div
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 17 }}>
              Fellowship Progression
            </div>
            <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>
              The campaign begins with a single active hero. Additional fellowship slots must be earned
              through milestones, recruit opportunities, and power-versus-companionship choices.
            </div>
            <FellowshipSlots
              unlockedPartySlots={unlockedPartySlots}
              maxPartySlots={maxPartySlots}
            />
            <div style={{ fontSize: 12, opacity: 0.72, lineHeight: 1.5 }}>
              {completionRequiresFullFellowship
                ? "True completion remains blocked until all six fellowship seats are assembled."
                : "Campaign completion is not currently blocked by fellowship size."}
            </div>
          </div>

          {!showFullEditor && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.6 }}>
                The hero editor is folded away because this identity is already committed to canon.
                Later growth will unlock fellowship rather than replacing this beginning.
              </div>

              <button
                onClick={() => {
                  playSfx(SFX.buttonClick, 0.58);
                  setShowDeclaredEditor(true);
                }}
                style={{
                  ...controlButtonBase,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                }}
              >
                Review Hero
              </button>
            </div>
          )}

          {showFullEditor && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.6, maxWidth: 760 }}>
                  Commit a single starting hero to canon. Future companions and party slots will be earned
                  through the campaign rather than selected here.
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      if (partyLocked || !partyDraft) {
                        playSfx(SFX.uiFailure, 0.5);
                        return;
                      }
                      playSfx(SFX.arbiterCanonRecord, 0.78);
                      commitParty();
                    }}
                    disabled={partyLocked || !partyDraft}
                    style={{
                      ...controlButtonBase,
                      border: "1px solid rgba(255,205,126,0.28)",
                      background: editable
                        ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                        : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
                      color: editable ? "#2f1606" : "rgba(244,227,201,0.75)",
                      boxShadow: editable
                        ? "0 10px 28px rgba(255,145,42,0.18), inset 0 1px 0 rgba(255,244,220,0.72)"
                        : "none",
                      opacity: editable ? 1 : 0.62,
                      cursor: editable ? "pointer" : "not-allowed",
                    }}
                  >
                    Commit Hero to Canon
                  </button>

                  <span style={{ fontSize: 12, opacity: 0.72 }}>
                    {partyCanonicalExists ? "Canonical hero declared ✓" : "Draft hero only · not yet canonical"}
                    {partyLockedByCombat ? " · Combat lock active" : ""}
                  </span>
                </div>
              </div>

              <article
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  padding: 16,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "110px minmax(0, 1fr)",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        width: 110,
                        height: 132,
                        borderRadius: 14,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                      }}
                      title={`${resolvedSpecies} ${resolvedClass} ${row?.portrait ?? "Male"}`}
                    >
                      <img
                        src={portraitPath}
                        alt={`${display} portrait`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.src = getPortraitPath("Human", "Warrior", row?.portrait ?? "Male");
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!editable) {
                            playSfx(SFX.uiFailure, 0.5);
                            return;
                          }
                          setPortrait("Male");
                        }}
                        disabled={!editable}
                        style={{
                          ...controlButtonBase,
                          padding: "8px 0",
                          fontSize: 12,
                          border: row?.portrait === "Male"
                            ? "1px solid rgba(138,180,255,0.42)"
                            : "1px solid rgba(255,255,255,0.12)",
                          background: row?.portrait === "Male"
                            ? "rgba(138,180,255,0.12)"
                            : "rgba(255,255,255,0.04)",
                          color: "inherit",
                          opacity: editable ? 1 : 0.6,
                          cursor: editable ? "pointer" : "not-allowed",
                        }}
                      >
                        Male
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!editable) {
                            playSfx(SFX.uiFailure, 0.5);
                            return;
                          }
                          setPortrait("Female");
                        }}
                        disabled={!editable}
                        style={{
                          ...controlButtonBase,
                          padding: "8px 0",
                          fontSize: 12,
                          border: row?.portrait === "Female"
                            ? "1px solid rgba(138,180,255,0.42)"
                            : "1px solid rgba(255,255,255,0.12)",
                          background: row?.portrait === "Female"
                            ? "rgba(138,180,255,0.12)"
                            : "rgba(255,255,255,0.04)",
                          color: "inherit",
                          opacity: editable ? 1 : 0.6,
                          cursor: editable ? "pointer" : "not-allowed",
                        }}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(220px, 1.1fr) repeat(4, minmax(110px, 0.55fr))",
                        gap: 12,
                        alignItems: "end",
                      }}
                    >
                      <div>
                        <TinyLabel>Hero</TinyLabel>
                        <input
                          value={row?.name ?? ""}
                          disabled={!editable}
                          onChange={(e) => setHeroField({ name: e.target.value })}
                          placeholder="The Lone Hero"
                          style={inputStyle}
                        />
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.82 }}>
                          <strong>{display}</strong> · {resolvedSpecies} {resolvedClass}
                        </div>
                      </div>

                      <div>
                        <TinyLabel>Armor Class</TinyLabel>
                        <StatChip label="AC" value={row?.ac ?? 14} />
                      </div>

                      <div>
                        <TinyLabel>HP</TinyLabel>
                        <StatChip label="HP" value={row?.hpCurrent ?? 12} />
                      </div>

                      <div>
                        <TinyLabel>HP Max</TinyLabel>
                        <StatChip label="HP Max" value={row?.hpMax ?? 12} />
                      </div>

                      <div>
                        <TinyLabel>Initiative</TinyLabel>
                        <StatChip label="Init" value={row?.initiativeMod ?? 1} />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(180px, 1fr) minmax(180px, 1fr)",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <TinyLabel>Species</TinyLabel>
                        <select
                          value={speciesSelectValue}
                          disabled={!editable}
                          onChange={(e) => {
                            const v = e.target.value;
                            playSfx(SFX.buttonClick, 0.54);

                            if (v === "") {
                              setSpecies("");
                              return;
                            }

                            if (v === "__custom__") {
                              if (!speciesIsCustom) {
                                setHeroField({ species: "", traits: [] });
                              }
                              return;
                            }

                            setSpecies(v);
                          }}
                          style={selectStyle}
                        >
                          <option value="">—</option>
                          {SAFE_SPECIES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                          <option value="__custom__">Custom…</option>
                        </select>

                        {speciesSelectValue === "__custom__" && (
                          <input
                            value={speciesIsCustom ? speciesValue : ""}
                            disabled={!editable}
                            onChange={(e) => {
                              const nextSpecies = e.target.value;
                              setSpecies(nextSpecies);
                            }}
                            placeholder="Custom species"
                            style={{ ...inputStyle, marginTop: 8 }}
                          />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <TinyLabel>Class</TinyLabel>
                        <select
                          value={classSelectValue}
                          disabled={!editable}
                          onChange={(e) => {
                            const v = e.target.value;
                            playSfx(SFX.buttonClick, 0.54);

                            if (v === "") {
                              setClass("");
                              return;
                            }

                            if (v === "__custom__") {
                              if (!classIsCustom) {
                                setHeroField({
                                  className: "",
                                  skills: [],
                                });
                              }
                              return;
                            }

                            setClass(v);
                          }}
                          style={selectStyle}
                        >
                          <option value="">—</option>
                          {SAFE_CLASS_ARCHETYPES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="__custom__">Custom…</option>
                        </select>

                        {classSelectValue === "__custom__" && (
                          <input
                            value={classIsCustom ? classValue : ""}
                            disabled={!editable}
                            onChange={(e) => {
                              const nextClassName = e.target.value;
                              setClass(nextClassName);
                            }}
                            placeholder="Custom class"
                            style={{ ...inputStyle, marginTop: 8 }}
                          />
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <TinyLabel>Build Focus</TinyLabel>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {BUILD_FOCUS_OPTIONS.map((option) => {
                          const active = currentFocus === option.id;
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
                              }}
                              disabled={!editable}
                              title={option.hint}
                              style={{
                                ...controlButtonBase,
                                padding: "8px 10px",
                                fontSize: 12,
                                border: active
                                  ? "1px solid rgba(138,180,255,0.42)"
                                  : "1px solid rgba(255,255,255,0.12)",
                                background: active
                                  ? "rgba(138,180,255,0.12)"
                                  : "rgba(255,255,255,0.04)",
                                color: "inherit",
                                opacity: editable ? 1 : 0.6,
                                cursor: editable ? "pointer" : "not-allowed",
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.72 }}>
                        Choose one stance to shape survivability and speed without raw stat editing.
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <TinyLabel>Class Skills</TinyLabel>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 28 }}>
                          {skillLabels.length > 0 ? (
                            skillLabels.map((label, skillIdx) => (
                              <span key={`hero_skill_${label}_${skillIdx}`} style={tagStyle}>
                                {label}
                              </span>
                            ))
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>
                              No class skills
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <TinyLabel>Species Traits</TinyLabel>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 28 }}>
                          {traitLabels.length > 0 ? (
                            traitLabels.map((label, traitIdx) => (
                              <span key={`hero_trait_${label}_${traitIdx}`} style={traitTagStyle}>
                                {label}
                              </span>
                            ))
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>
                              No species traits
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 13,
                  opacity: 0.84,
                  lineHeight: 1.7,
                }}
              >
                The opening declaration now binds a single hero to the dungeon’s canon. Fellowship growth
                happens later through progression, recruitment, and consequence rather than pre-run roster assembly.
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
