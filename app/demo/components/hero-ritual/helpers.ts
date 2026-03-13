import { resolvePartyLoadout } from "@/lib/skills/loadoutResolver";
import type { BuildFocus, PartyMember } from "./types";
import { SAFE_CLASS_ARCHETYPES, SAFE_SPECIES } from "./types";

export const SFX = {
  buttonClick: "/assets/audio/sfx_button_click_01.mp3",
  uiSuccess: "/assets/audio/sfx_success_01.mp3",
  uiFailure: "/assets/audio/sfx_failure_01.mp3",
  arbiterCanonRecord: "/assets/audio/sfx_arbiter_cannon_record_01.mp3",
  heroSelectionLoop: "/assets/audio/sfx_hero_selection_01.mp3",
} as const;

export const ELF_WARRIOR_FEMALE_GLB = "/assets/hero3d/elf_warrior_female.glb";
export const ELF_WARRIOR_MALE_GLB = "/assets/hero3d/elf_warrior_male.glb";

export function playSfx(src: string, volume = 0.66) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // fail silently
  }
}

export function normalizeClassValue(v: string) {
  return (v ?? "").trim();
}

export function normalizeSpeciesValue(v: string) {
  return (v ?? "").trim();
}

export function getResolvedSpecies(value?: string) {
  const normalized = normalizeSpeciesValue(value ?? "");
  if (!normalized) return "Human";
  return (
    SAFE_SPECIES.find((x) => x.toLowerCase() === normalized.toLowerCase()) ??
    normalized
  );
}

export function getResolvedClass(value?: string) {
  const normalized = normalizeClassValue(value ?? "");
  if (!normalized) return "Warrior";
  return (
    SAFE_CLASS_ARCHETYPES.find((x) => x.toLowerCase() === normalized.toLowerCase()) ??
    normalized
  );
}

export function getResolvedLoadout(row: PartyMember) {
  const resolvedClass = getResolvedClass(row.className);
  const resolvedSpecies = getResolvedSpecies(row.species);

  const canonical = resolvePartyLoadout(resolvedClass, resolvedSpecies);

  return {
    skillIds:
      Array.isArray(row.skills) && row.skills.length > 0
        ? row.skills
        : canonical.skillIds,
    traitIds:
      Array.isArray(row.traits) && row.traits.length > 0
        ? row.traits
        : canonical.traitIds,
    resolvedClass,
    resolvedSpecies,
  };
}

export function getBaseStatsForClass(className: string) {
  const table: Record<
    string,
    { ac: number; hpMax: number; initiativeMod: number }
  > = {
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

export function applyBuildFocusToStats(
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

export function inferBuildFocus(
  row: PartyMember,
  resolvedClass: string
): BuildFocus {
  const base = getBaseStatsForClass(resolvedClass);

  if (row.initiativeMod >= base.initiativeMod + 2) return "swift";
  if (row.hpMax >= base.hpMax + 2) return "hardy";
  if (
    row.ac >= base.ac + 1 &&
    row.initiativeMod <= base.initiativeMod - 1
  ) {
    return "guardian";
  }

  return "balanced";
}

export function getPortraitObjectPosition(
  kind: "intro" | "card" | "name" | "oath" | "thumb"
) {
  if (kind === "intro") return "center 12%";
  if (kind === "oath") return "center 14%";
  if (kind === "name") return "center 16%";
  if (kind === "thumb") return "center 16%";
  return "center 18%";
}

export function getGlbPathForPortrait(
  species: string,
  className: string,
  portrait: "Male" | "Female"
) {
  const resolvedSpecies = getResolvedSpecies(species);
  const resolvedClass = getResolvedClass(className);

  if (resolvedSpecies === "Elf" && resolvedClass === "Warrior") {
    if (portrait === "Female") return ELF_WARRIOR_FEMALE_GLB;
    if (portrait === "Male") return ELF_WARRIOR_MALE_GLB;
  }

  return null;
}

export function getFocusPalette(focus: BuildFocus, active: boolean) {
  const palettes: Record<
    BuildFocus,
    { border: string; background: string; shadow: string }
  > = {
    balanced: {
      border: active
        ? "1px solid rgba(160,180,210,0.42)"
        : "1px solid rgba(160,180,210,0.22)",
      background: active
        ? "linear-gradient(180deg, rgba(140,165,200,0.16), rgba(255,255,255,0.03))"
        : "linear-gradient(180deg, rgba(140,165,200,0.08), rgba(255,255,255,0.02))",
      shadow: active ? "0 12px 28px rgba(120,145,180,0.16)" : "none",
    },
    guardian: {
      border: active
        ? "1px solid rgba(255,196,118,0.44)"
        : "1px solid rgba(255,196,118,0.24)",
      background: active
        ? "linear-gradient(180deg, rgba(255,190,90,0.16), rgba(255,255,255,0.03))"
        : "linear-gradient(180deg, rgba(255,180,80,0.09), rgba(255,255,255,0.02))",
      shadow: active ? "0 12px 28px rgba(255,170,60,0.18)" : "none",
    },
    swift: {
      border: active
        ? "1px solid rgba(98,210,220,0.44)"
        : "1px solid rgba(98,210,220,0.24)",
      background: active
        ? "linear-gradient(180deg, rgba(70,200,215,0.15), rgba(255,255,255,0.03))"
        : "linear-gradient(180deg, rgba(70,200,215,0.08), rgba(255,255,255,0.02))",
      shadow: active ? "0 12px 28px rgba(60,180,200,0.16)" : "none",
    },
    hardy: {
      border: active
        ? "1px solid rgba(220,110,110,0.42)"
        : "1px solid rgba(220,110,110,0.22)",
      background: active
        ? "linear-gradient(180deg, rgba(170,70,70,0.16), rgba(255,255,255,0.03))"
        : "linear-gradient(180deg, rgba(170,70,70,0.08), rgba(255,255,255,0.02))",
      shadow: active ? "0 12px 28px rgba(140,50,50,0.16)" : "none",
    },
  };

  return palettes[focus];
}

export function getFocusTitleColor(focus: BuildFocus) {
  if (focus === "guardian") return "rgba(255,214,140,0.96)";
  if (focus === "swift") return "rgba(150,235,245,0.96)";
  if (focus === "hardy") return "rgba(235,150,150,0.96)";
  return "rgba(220,228,240,0.96)";
}
