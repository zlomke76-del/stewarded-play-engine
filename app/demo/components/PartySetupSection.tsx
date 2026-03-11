"use client";

import React, { useMemo, useState } from "react";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import { getSkillDefinition } from "@/lib/skills/skillDefinitions";
import { getSpeciesTraitDefinition } from "@/lib/skills/speciesTraitMap";
import { resolvePartyLoadout } from "@/lib/skills/loadoutResolver";

type PortraitType = "Male" | "Female";
type BuildFocus = "balanced" | "guardian" | "swift" | "hardy";
type HeroCreationStep = "intro" | "species" | "class" | "focus" | "name" | "confirm";

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

type RitualProgress = {
  speciesConfirmed: boolean;
  classConfirmed: boolean;
  focusConfirmed: boolean;
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

const CLASS_DESCRIPTIONS: Record<string, string> = {
  Warrior: "Frontline steel and steady resolve.",
  Rogue: "Quick hands, sharp instincts, deadly timing.",
  Mage: "Arcane force shaped through discipline and will.",
  Cleric: "Faith, protection, and guiding light.",
  Ranger: "Tracker, scout, and patient hunter.",
  Paladin: "Oath-bound defender with relentless conviction.",
  Bard: "Charm, rhythm, and subtle battlefield influence.",
  Druid: "Nature's keeper, patient and adaptable.",
  Monk: "Discipline, motion, and controlled force.",
  Artificer: "Inventive craft turned into battlefield advantage.",
  Barbarian: "Fury, endurance, and brutal momentum.",
  Sorcerer: "Raw power carried in the blood.",
  Warlock: "Dark bargains and dangerous command.",
};

const SPECIES_DESCRIPTIONS: Record<string, string> = {
  Human: "Adaptable, driven, and stubborn in the dark.",
  Elf: "Grace, perception, and ancient poise.",
  Dwarf: "Stone-hearted endurance and iron discipline.",
  Halfling: "Small frame, steady nerve, uncanny luck.",
  Gnome: "Quick wit, curiosity, and clever hands.",
  "Half-Elf": "Bridging worlds with charm and versatility.",
  "Half-Orc": "Raw force, grit, and intimidating presence.",
  Tiefling: "Marked by omen, power, and defiance.",
  Dragonborn: "Ancestral pride and draconic bearing.",
};

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

function RitualFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article
      style={{
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(circle at top, rgba(255,188,112,0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        padding: 22,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        maxWidth: 1050,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              opacity: 0.62,
              fontWeight: 900,
            }}
          >
            Hero Creation Ritual
          </div>
          <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: 0.2 }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 14, opacity: 0.84, lineHeight: 1.7, maxWidth: 760 }}>{subtitle}</div>
          ) : null}
        </div>

        {children}

        {footer ? (
          <div
            style={{
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RitualChoiceCard({
  title,
  subtitle,
  imageSrc,
  onClick,
  selected = false,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  imageSrc: string;
  onClick: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 0,
        borderRadius: 18,
        overflow: "hidden",
        border: selected
          ? "1px solid rgba(255,205,126,0.36)"
          : "1px solid rgba(255,255,255,0.10)",
        background: selected
          ? "linear-gradient(180deg, rgba(255,206,128,0.08), rgba(255,255,255,0.03))"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.58 : 1,
        boxShadow: selected ? "0 16px 38px rgba(255,145,42,0.12)" : "none",
        transition: "transform 140ms ease, filter 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
      }}
    >
      <div
        style={{
          height: 210,
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <img
          src={imageSrc}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div style={{ padding: 16, display: "grid", gap: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 13, opacity: 0.76, lineHeight: 1.6 }}>{subtitle}</div> : null}
      </div>
    </button>
  );
}

function RitualStepPills({
  currentStep,
}: {
  currentStep: HeroCreationStep;
}) {
  const order: HeroCreationStep[] = ["intro", "species", "class", "focus", "name", "confirm"];
  const labels: Record<HeroCreationStep, string> = {
    intro: "Opening",
    species: "Species",
    class: "Class",
    focus: "Focus",
    name: "Name",
    confirm: "Oath",
  };
  const currentIndex = order.indexOf(currentStep);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {order.map((step, idx) => {
        const active = step === currentStep;
        const complete = idx < currentIndex;

        return (
          <SectionPill key={step} tone={active ? "warn" : complete ? "good" : "default"}>
            <strong>{idx + 1}</strong> {labels[step]}
          </SectionPill>
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
  const [heroCreationStep, setHeroCreationStep] = useState<HeroCreationStep>("intro");
  const [ritualProgress, setRitualProgress] = useState<RitualProgress>({
    speciesConfirmed: false,
    classConfirmed: false,
    focusConfirmed: false,
  });

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

  function resetRitualFlow() {
    setHeroCreationStep("intro");
    setRitualProgress({
      speciesConfirmed: false,
      classConfirmed: false,
      focusConfirmed: false,
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

  const { resolvedSpecies, resolvedClass, skillIds, traitIds } = getResolvedLoadout(row);
  const currentFocus = inferBuildFocus(row, resolvedClass);
  const portraitPath = getPortraitPath(resolvedSpecies, resolvedClass, row?.portrait ?? "Male");
  const fallbackPortraitPath = getPortraitPath("Human", "Warrior", row?.portrait ?? "Male");
  const skillLabels = skillIds.map((skillId) => getSkillDefinition(skillId)?.label ?? skillId);
  const traitLabels = traitIds.map((traitId) => getSpeciesTraitDefinition(traitId)?.label ?? traitId);
  const display = row?.name?.trim() || "The Lone Hero";
  const hasValidHeroName = (row?.name ?? "").trim().length > 0;

  const canContinueFromName = editable && hasValidHeroName;
  const canEnterChronicle =
    editable &&
    ritualProgress.speciesConfirmed &&
    ritualProgress.classConfirmed &&
    ritualProgress.focusConfirmed &&
    hasValidHeroName;

  function goToPreviousStep() {
    setHeroCreationStep((prev) => {
      if (prev === "confirm") return "name";
      if (prev === "name") return "focus";
      if (prev === "focus") return "class";
      if (prev === "class") return "species";
      if (prev === "species") return "intro";
      return "intro";
    });
  }

  function renderCreationFlow() {
    switch (heroCreationStep) {
      case "intro":
        return (
          <div key="ritual-intro" style={{ transition: "opacity 260ms ease", opacity: 1 }}>
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
                      setHeroCreationStep("species");
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
              <div style={{ display: "grid", gap: 16 }}>
                <RitualStepPills currentStep={heroCreationStep} />

                <div
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    gap: 18,
                    padding: "10px 0 6px",
                  }}
                >
                  <div
                    style={{
                      width: "min(100%, 720px)",
                      borderRadius: 20,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.03)",
                      boxShadow: "0 18px 46px rgba(0,0,0,0.24)",
                    }}
                  >
                    <img
                      src="/assets/V3/Tavern/tavern_01.png"
                      alt="The tavern grows quiet"
                      style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = fallbackPortraitPath;
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 14, opacity: 0.78, maxWidth: 700, textAlign: "center", lineHeight: 1.7 }}>
                    The first name set into canon will carry forward into every future descent. Choose slowly.
                  </div>
                </div>
              </div>
            </RitualFrame>
          </div>
        );

      case "species":
        return (
          <div key="ritual-species" style={{ transition: "opacity 260ms ease", opacity: 1 }}>
            <RitualFrame
              title="Choose a Species"
              subtitle="Identity begins with lineage. Select the form your first hero will carry into the Chronicle."
              footer={
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
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

                  <div style={{ fontSize: 12, opacity: 0.72, alignSelf: "center" }}>
                    Select a lineage to continue.
                  </div>
                </div>
              }
            >
              <div style={{ display: "grid", gap: 16 }}>
                <RitualStepPills currentStep={heroCreationStep} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 14,
                  }}
                >
                  {SAFE_SPECIES.map((species) => {
                    const imageSrc = getPortraitPath(species, resolvedClass, row?.portrait ?? "Male");
                    const selected = resolvedSpecies.toLowerCase() === species.toLowerCase();

                    return (
                      <RitualChoiceCard
                        key={species}
                        title={species}
                        subtitle={SPECIES_DESCRIPTIONS[species] ?? "A path into the dark."}
                        imageSrc={imageSrc}
                        selected={selected}
                        disabled={!editable}
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
          <div key="ritual-class" style={{ transition: "opacity 260ms ease", opacity: 1 }}>
            <RitualFrame
              title="Choose a Class"
              subtitle="A hero's role is not just a weapon. It is the shape of their will under pressure."
              footer={
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
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

                  <div style={{ fontSize: 12, opacity: 0.72, alignSelf: "center" }}>
                    Select a calling to continue.
                  </div>
                </div>
              }
            >
              <div style={{ display: "grid", gap: 16 }}>
                <RitualStepPills currentStep={heroCreationStep} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 14,
                  }}
                >
                  {SAFE_CLASS_ARCHETYPES.map((className) => {
                    const imageSrc = getPortraitPath(resolvedSpecies, className, row?.portrait ?? "Male");
                    const selected = resolvedClass.toLowerCase() === className.toLowerCase();

                    return (
                      <RitualChoiceCard
                        key={className}
                        title={className}
                        subtitle={CLASS_DESCRIPTIONS[className] ?? "A calling forged for the depths."}
                        imageSrc={imageSrc}
                        selected={selected}
                        disabled={!editable}
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
          <div key="ritual-focus" style={{ transition: "opacity 260ms ease", opacity: 1 }}>
            <RitualFrame
              title="Choose a Focus"
              subtitle="This is not raw stat editing. It is the stance your hero carries into danger."
              footer={
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
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

                  <div style={{ fontSize: 12, opacity: 0.72, alignSelf: "center" }}>
                    Select a stance to continue.
                  </div>
                </div>
              }
            >
              <div style={{ display: "grid", gap: 16 }}>
                <RitualStepPills currentStep={heroCreationStep} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 14,
                  }}
                >
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
                          border: active
                            ? "1px solid rgba(255,205,126,0.32)"
                            : "1px solid rgba(255,255,255,0.10)",
                          background: active
                            ? "linear-gradient(180deg, rgba(255,205,126,0.08), rgba(255,255,255,0.03))"
                            : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                          color: "inherit",
                          cursor: editable ? "pointer" : "not-allowed",
                          opacity: editable ? 1 : 0.6,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 900 }}>{option.label}</div>
                        <div style={{ fontSize: 13, opacity: 0.76, lineHeight: 1.6 }}>{option.hint}</div>
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
          <div key="ritual-name" style={{ transition: "opacity 260ms ease", opacity: 1 }}>
            <RitualFrame
              title="Name the Hero"
              subtitle="A name binds memory to fate. This is the first voice the Chronicle will remember."
              footer={
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
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
                      color: canContinueFromName ? "#2f1606" : "rgba(244,227,201,0.75)",
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
              <div style={{ display: "grid", gap: 16 }}>
                <RitualStepPills currentStep={heroCreationStep} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 280px)",
                    gap: 18,
                    alignItems: "start",
                  }}
                >
                  <div style={{ display: "grid", gap: 10 }}>
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
                    <div style={{ fontSize: 13, opacity: 0.74, lineHeight: 1.6 }}>
                      {(row?.name ?? "").trim().length > 0 ? (
                        <>
                          Current Chronicle entry: <strong>{display}</strong>
                        </>
                      ) : (
                        <>Choose a true name before continuing.</>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <img
                      src={portraitPath}
                      alt={`${display} portrait`}
                      style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = fallbackPortraitPath;
                      }}
                    />
                  </div>
                </div>
              </div>
            </RitualFrame>
          </div>
        );

      case "confirm":
        return (
          <div key="ritual-confirm" style={{ transition: "opacity 260ms ease", opacity: 1 }}>
            <RitualFrame
              title="The Oath"
              subtitle="A new name enters the Chronicle."
              footer={
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
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

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      onClick={() => {
                        if (!canEnterChronicle || partyLocked || !partyDraft) {
                          playSfx(SFX.uiFailure, 0.5);
                          return;
                        }
                        playSfx(SFX.arbiterCanonRecord, 0.78);
                        commitParty();
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
                        opacity: canEnterChronicle && !partyLocked && !!partyDraft ? 1 : 0.62,
                        cursor: canEnterChronicle && !partyLocked && !!partyDraft ? "pointer" : "not-allowed",
                        minWidth: 210,
                      }}
                    >
                      Enter the Chronicle
                    </button>

                    <span style={{ fontSize: 12, opacity: 0.72 }}>
                      {canEnterChronicle
                        ? "Ritual complete"
                        : "Choose species, class, focus, and enter a name to continue"}
                      {partyLockedByCombat ? " · Combat lock active" : ""}
                    </span>
                  </div>
                </div>
              }
            >
              <div style={{ display: "grid", gap: 16 }}>
                <RitualStepPills currentStep={heroCreationStep} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(220px, 280px) minmax(0, 1fr)",
                    gap: 20,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.03)",
                      boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
                    }}
                  >
                    <img
                      src={portraitPath}
                      alt={`${display} portrait`}
                      style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = fallbackPortraitPath;
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 950, lineHeight: 1.05 }}>{display}</div>
                      <div style={{ marginTop: 8, fontSize: 16, opacity: 0.82 }}>
                        {resolvedSpecies} {resolvedClass}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <SectionPill>
                        <strong>Focus</strong>{" "}
                        {BUILD_FOCUS_OPTIONS.find((x) => x.id === currentFocus)?.label ?? "Balanced"}
                      </SectionPill>
                      <SectionPill>
                        <strong>Portrait</strong> {row?.portrait ?? "Male"}
                      </SectionPill>
                    </div>

                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        fontSize: 14,
                        opacity: 0.82,
                        lineHeight: 1.7,
                        maxWidth: 760,
                      }}
                    >
                      Once entered into canon, this hero becomes the beginning of the branch. Future fellowship growth
                      is earned through the campaign rather than chosen here.
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
                {partyCanonicalExists ? "The Lone Hero" : "Declare the Lone Hero"}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.82, maxWidth: 820, lineHeight: 1.6 }}>
                The journey begins with one hero only. This opening should feel like the start of a Chronicle, not a
                control panel.
              </div>

              {!partyCanonicalExists && (
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
                  <SectionPill tone={partyCanonicalExists ? "good" : "default"}>
                    {partyCanonicalExists ? "Hero canonized" : "Draft hero only"}
                  </SectionPill>
                  {partyLockedByCombat ? <SectionPill tone="warn">Combat lock active</SectionPill> : null}
                </div>
              )}
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

          {!partyCanonicalExists && showFullEditor && renderCreationFlow()}

          {partyCanonicalExists && !showFullEditor && (
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
                The hero editor is folded away because this identity is already committed to canon. Later growth will
                unlock fellowship rather than replacing this beginning.
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

          {partyCanonicalExists && showFullEditor && (
            <>
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
                <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 17 }}>Fellowship Progression</div>
                <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>
                  The campaign begins with a single active hero. Additional fellowship slots must be earned through
                  milestones, recruit opportunities, and power-versus-companionship choices.
                </div>
                <FellowshipSlots unlockedPartySlots={unlockedPartySlots} maxPartySlots={maxPartySlots} />
                <div style={{ fontSize: 12, opacity: 0.72, lineHeight: 1.5 }}>
                  {completionRequiresFullFellowship
                    ? "True completion remains blocked until all six fellowship seats are assembled."
                    : "Campaign completion is not currently blocked by fellowship size."}
                </div>
              </div>

              <article
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
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
                          img.src = fallbackPortraitPath;
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
                          border:
                            row?.portrait === "Male"
                              ? "1px solid rgba(138,180,255,0.42)"
                              : "1px solid rgba(255,255,255,0.12)",
                          background:
                            row?.portrait === "Male"
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
                          border:
                            row?.portrait === "Female"
                              ? "1px solid rgba(138,180,255,0.42)"
                              : "1px solid rgba(255,255,255,0.12)",
                          background:
                            row?.portrait === "Female"
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
                The opening declaration now binds a single hero to the dungeon’s canon. Fellowship growth happens later
                through progression, recruitment, and consequence rather than pre-run roster assembly.
              </div>
            </>
          )}

          {!partyCanonicalExists && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => {
                  if (partyCanonicalExists) return;
                  playSfx(SFX.buttonClick, 0.54);
                  resetRitualFlow();
                }}
                style={{
                  ...controlButtonBase,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                }}
              >
                Restart Ritual
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
