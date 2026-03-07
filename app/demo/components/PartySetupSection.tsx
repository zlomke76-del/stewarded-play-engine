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
    void audio.play().catch(() => {
      // fail silently; UI audio should never block editing flow
    });
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

export default function PartySetupSection(props: {
  enabled: boolean;
  partyDraft: PartyDeclaredPayload | null;
  partyMembersFallback: PartyMember[];
  partyCanonicalExists: boolean;
  partyLocked: boolean;
  partyLockedByCombat: boolean;
  setPartySize: (n: number) => void;
  randomizePartyNames: () => void;
  commitParty: () => void;
  safeInt: (n: unknown, fallback: number, lo: number, hi: number) => number;
  setPartyDraft: React.Dispatch<React.SetStateAction<PartyDeclaredPayload | null>>;
}) {
  const {
    enabled,
    partyDraft,
    partyMembersFallback,
    partyCanonicalExists,
    partyLocked,
    partyLockedByCombat,
    setPartySize,
    randomizePartyNames,
    commitParty,
    setPartyDraft,
  } = props;

  const [showDeclaredEditor, setShowDeclaredEditor] = useState(false);

  const editable = !partyLocked && !!partyDraft;
  const rows = (partyDraft?.members ?? partyMembersFallback) as PartyMember[];
  const currentCount = partyDraft?.members?.length ?? partyMembersFallback.length ?? 4;
  const canCollapseToSummary = partyCanonicalExists && partyLocked;
  const showFullEditor = !canCollapseToSummary || showDeclaredEditor;

  const rosterSummary = useMemo(() => {
    const uniqueSpecies = new Set<string>();
    const uniqueClasses = new Set<string>();

    rows.forEach((row) => {
      uniqueSpecies.add(getResolvedSpecies(row.species));
      uniqueClasses.add(getResolvedClass(row.className));
    });

    return {
      speciesCount: uniqueSpecies.size,
      classCount: uniqueClasses.size,
      hpTotal: rows.reduce((sum, row) => sum + Number(row.hpCurrent ?? 0), 0),
    };
  }, [rows]);

  function setMemberField(idx: number, patch: Partial<PartyMember>) {
    setPartyDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, members: prev.members.map((x) => ({ ...x })) };
      next.members[idx] = { ...next.members[idx], ...patch };
      return next;
    });
  }

  function setPortrait(idx: number, portrait: PortraitType) {
    playSfx(SFX.buttonClick, 0.52);
    setMemberField(idx, { portrait });
  }

  function setSpecies(idx: number, row: PartyMember, nextSpecies: string) {
    const next = resolvePartyLoadout(row.className || "Warrior", nextSpecies || "Human");
    setMemberField(idx, {
      species: nextSpecies,
      traits: next.traitIds,
    });
  }

  function setClass(idx: number, row: PartyMember, nextClassName: string) {
    const next = resolvePartyLoadout(nextClassName || "Warrior", row.species || "Human");
    const resolvedClass = getResolvedClass(nextClassName || "Warrior");
    const focus = inferBuildFocus(row, getResolvedClass(row.className || "Warrior"));
    const focusedStats = applyBuildFocusToStats(getBaseStatsForClass(resolvedClass), focus);

    setMemberField(idx, {
      className: nextClassName,
      skills: next.skillIds,
      ac: focusedStats.ac,
      hpMax: focusedStats.hpMax,
      hpCurrent: focusedStats.hpMax,
      initiativeMod: focusedStats.initiativeMod,
    });
  }

  function setBuildFocus(idx: number, row: PartyMember, focus: BuildFocus) {
    const resolvedClass = getResolvedClass(row.className || "Warrior");
    const base = getBaseStatsForClass(resolvedClass);
    const nextStats = applyBuildFocusToStats(base, focus);

    playSfx(SFX.buttonClick, 0.54);
    setMemberField(idx, {
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

  if (!enabled) return null;

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
                Assemble the Party
              </div>
              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.82, maxWidth: 820, lineHeight: 1.6 }}>
                Declare the adventurers once. Identity comes first: portrait, name, species, class, and
                build focus. Stats are then shaped through that role rather than raw freeform tuning.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <SectionPill tone={partyCanonicalExists ? "good" : "default"}>
                  <strong>{rows.length}</strong> {rows.length === 1 ? "Adventurer" : "Adventurers"}
                </SectionPill>
                <SectionPill>
                  <strong>{rosterSummary.classCount}</strong> Class{rosterSummary.classCount === 1 ? "" : "es"}
                </SectionPill>
                <SectionPill>
                  <strong>{rosterSummary.speciesCount}</strong> Species
                </SectionPill>
                <SectionPill tone="warn">
                  <strong>{rosterSummary.hpTotal}</strong> Total HP
                </SectionPill>
                <SectionPill tone={partyCanonicalExists ? "good" : "default"}>
                  {partyCanonicalExists ? "Canonical roster locked" : "Draft roster only"}
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
                Collapse Roster
              </button>
            )}
          </div>

          {!showFullEditor && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                {rows.map((row, idx) => {
                  const i1 = idx + 1;
                  const { resolvedSpecies, resolvedClass } = getResolvedLoadout(row);
                  const portraitPath = getPortraitPath(resolvedSpecies, resolvedClass, row?.portrait ?? "Male");
                  const display = row.name?.trim() || `Player ${i1}`;

                  return (
                    <div
                      key={row.id || `summary_${i1}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "52px 1fr",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 10,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.04)",
                        }}
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

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900 }}>{display}</div>
                        <div style={{ fontSize: 12, opacity: 0.74, marginTop: 2 }}>
                          {resolvedSpecies} · {resolvedClass}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                  The roster editor is folded away because the party is already committed. These adventurers
                  now define session identity and combat presence.
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
                  Review Full Roster
                </button>
              </div>
            </>
          )}

          {showFullEditor && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 220px) 1fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <TinyLabel>Party Count</TinyLabel>
                  <select
                    value={currentCount}
                    onChange={(e) => {
                      if (partyLocked) {
                        playSfx(SFX.uiFailure, 0.5);
                        return;
                      }
                      playSfx(SFX.buttonClick, 0.58);
                      setPartySize(Number(e.target.value));
                    }}
                    disabled={partyLocked}
                    style={selectStyle}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Player" : "Players"}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <button
                    onClick={() => {
                      if (partyLocked || !partyDraft) {
                        playSfx(SFX.uiFailure, 0.5);
                        return;
                      }
                      playSfx(SFX.buttonClick, 0.58);
                      randomizePartyNames();
                    }}
                    disabled={partyLocked || !partyDraft}
                    style={{
                      ...controlButtonBase,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: editable ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                      color: "inherit",
                      opacity: editable ? 1 : 0.6,
                      cursor: editable ? "pointer" : "not-allowed",
                    }}
                  >
                    🎲 Randomize Names
                  </button>

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
                    Commit Party to Canon
                  </button>

                  <span style={{ fontSize: 12, opacity: 0.72 }}>
                    {partyCanonicalExists ? "Canonical party declared ✓" : "Draft only · not yet canonical"}
                    {partyLockedByCombat ? " · Combat lock active" : ""}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {rows.map((row, idx) => {
                  const i1 = idx + 1;

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
                  const display = row?.name?.trim() || `Player ${i1}`;

                  return (
                    <article
                      key={row.id || `player_${i1}`}
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
                                setPortrait(idx, "Male");
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
                                setPortrait(idx, "Female");
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
                              <TinyLabel>Adventurer</TinyLabel>
                              <input
                                value={row?.name ?? ""}
                                disabled={!editable}
                                onChange={(e) => setMemberField(idx, { name: e.target.value })}
                                placeholder={`Player ${i1}`}
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
                                    setSpecies(idx, row, "");
                                    return;
                                  }

                                  if (v === "__custom__") {
                                    if (!speciesIsCustom) {
                                      setMemberField(idx, { species: "", traits: [] });
                                    }
                                    return;
                                  }

                                  setSpecies(idx, row, v);
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
                                    setSpecies(idx, row, nextSpecies);
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
                                    setClass(idx, row, "");
                                    return;
                                  }

                                  if (v === "__custom__") {
                                    if (!classIsCustom) {
                                      setMemberField(idx, {
                                        className: "",
                                        skills: [],
                                      });
                                    }
                                    return;
                                  }

                                  setClass(idx, row, v);
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
                                    setClass(idx, row, nextClassName);
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
                                      setBuildFocus(idx, row, option.id);
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
                                    <span key={`${row.id || i1}_skill_${label}_${skillIdx}`} style={tagStyle}>
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
                                    <span key={`${row.id || i1}_trait_${label}_${traitIdx}`} style={traitTagStyle}>
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
                  );
                })}
              </div>

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
                Combat numbers are now shaped through role focus instead of raw freeform stat entry. That
                keeps party creation readable, bounded, and more game-like while still letting the player
                meaningfully define each adventurer.
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
