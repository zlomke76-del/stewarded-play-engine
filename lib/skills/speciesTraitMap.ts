// lib/skills/speciesTraitMap.ts

import type {
  SpeciesTraitDefinition,
  SpeciesTraitDefinitionMap,
  SpeciesTraitMap,
} from "./SkillTypes";
import { normalizeSkillLookupKey } from "./SkillTypes";

export const SPECIES_TRAIT_DEFINITIONS: SpeciesTraitDefinitionMap = {
  human_resolve: {
    id: "human_resolve",
    label: "Resolve",
    species: "Human",
    category: "combat_passive",
    description: "Humans endure pressure through sheer determination and adaptability.",
    shortDescription: "Minor reroll/fear-resistance style resilience.",
    effects: [
      { type: "reroll", amount: 1, scope: "self" },
      { type: "spawn_audit_note", note: "Human resolve supports recovery under stress." },
    ],
    tags: { passive: true, combat: true, resilience: true },
  },

  human_adaptable: {
    id: "human_adaptable",
    label: "Adaptable",
    species: "Human",
    category: "exploration_passive",
    description: "Humans quickly adjust to changing situations and unknown environments.",
    shortDescription: "Small exploration flexibility bonus.",
    effects: [
      { type: "awareness_shift", amount: -1 },
      { type: "spawn_audit_note", note: "Human adaptability improved field response." },
    ],
    tags: { passive: true, exploration: true },
  },

  elf_keen_senses: {
    id: "elf_keen_senses",
    label: "Keen Senses",
    species: "Elf",
    category: "perception",
    description: "Elves notice subtleties others miss in sound, movement, and hidden structure.",
    shortDescription: "Improved reveal and detection.",
    effects: [
      { type: "reveal_tiles", amount: 1 },
      { type: "awareness_shift", amount: -1 },
    ],
    tags: { passive: true, exploration: true },
  },

  elf_grace: {
    id: "elf_grace",
    label: "Grace",
    species: "Elf",
    category: "mobility",
    description: "Elven fluidity improves positioning, timing, and battlefield movement.",
    shortDescription: "Minor initiative/mobility edge.",
    effects: [
      { type: "initiative_bonus", amount: 1, duration: "persistent" },
      { type: "spawn_audit_note", note: "Elven grace improved timing and positioning." },
    ],
    tags: { passive: true, combat: true },
  },

  dwarf_stone_resilience: {
    id: "dwarf_stone_resilience",
    label: "Stone Resilience",
    species: "Dwarf",
    category: "resistance",
    description: "Dwarves absorb punishment with stubborn physical resilience.",
    shortDescription: "Minor damage reduction.",
    effects: [{ type: "reduce_incoming_damage", amount: 1, duration: "persistent" }],
    tags: { passive: true, combat: true, resilience: true },
  },

  dwarf_tunnel_sense: {
    id: "dwarf_tunnel_sense",
    label: "Tunnel Sense",
    species: "Dwarf",
    category: "exploration_passive",
    description: "Dwarves detect structural irregularities and underground danger patterns.",
    shortDescription: "Reveal underground hazards.",
    effects: [
      { type: "reveal_tiles", amount: 1 },
      { type: "mark_zone", note: "Dwarven tunnel sense flagged structural irregularity." },
    ],
    tags: { passive: true, exploration: true },
  },

  halfling_luck: {
    id: "halfling_luck",
    label: "Luck",
    species: "Halfling",
    category: "combat_passive",
    description: "Halflings have an uncanny tendency to avoid the worst outcomes.",
    shortDescription: "Small self-reroll effect.",
    effects: [{ type: "reroll", amount: 1, scope: "self" }],
    tags: { passive: true, combat: true },
  },

  halfling_nimble: {
    id: "halfling_nimble",
    label: "Nimble",
    species: "Halfling",
    category: "mobility",
    description: "Halflings move through chaos with surprising ease.",
    shortDescription: "Small movement/escape edge.",
    effects: [{ type: "movement", amount: 1, ignoresEngagement: true }],
    tags: { passive: true, combat: true, stealth: true },
  },

  gnome_tinker_mind: {
    id: "gnome_tinker_mind",
    label: "Tinker Mind",
    species: "Gnome",
    category: "exploration_passive",
    description: "Gnomes spot mechanisms, tricks, and hidden engineered intent.",
    shortDescription: "Better tech/trap awareness.",
    effects: [
      { type: "reveal_tiles", amount: 1 },
      { type: "pressure_shift", amount: -1 },
    ],
    tags: { passive: true, exploration: true },
  },

  gnome_arcane_curiosity: {
    id: "gnome_arcane_curiosity",
    label: "Arcane Curiosity",
    species: "Gnome",
    category: "perception",
    description: "Gnomes have a knack for noticing magical oddities and unstable effects.",
    shortDescription: "Minor arcane detection bonus.",
    effects: [{ type: "mark_zone", note: "Gnomish curiosity flagged magical anomaly." }],
    tags: { passive: true, exploration: true, magical: true },
  },

  half_elf_bridge_sense: {
    id: "half_elf_bridge_sense",
    label: "Bridge Sense",
    species: "Half-Elf",
    category: "social",
    description: "Half-elves adapt between worlds and handle ambiguity well.",
    shortDescription: "Balanced awareness/flexibility edge.",
    effects: [
      { type: "awareness_shift", amount: -1 },
      { type: "reroll", amount: 1, scope: "self" },
    ],
    tags: { passive: true, exploration: true, combat: true },
  },

  half_elf_grace: {
    id: "half_elf_grace",
    label: "Mixed Grace",
    species: "Half-Elf",
    category: "mobility",
    description: "Half-elves carry some elven ease in movement and perception.",
    shortDescription: "Minor initiative bonus.",
    effects: [{ type: "initiative_bonus", amount: 1, duration: "persistent" }],
    tags: { passive: true, combat: true },
  },

  half_orc_ferocity: {
    id: "half_orc_ferocity",
    label: "Ferocity",
    species: "Half-Orc",
    category: "combat_passive",
    description: "Half-orcs hit harder and stay dangerous under pressure.",
    shortDescription: "Minor melee damage edge.",
    effects: [{ type: "damage_bonus", amount: 1, duration: "persistent" }],
    tags: { passive: true, combat: true },
  },

  half_orc_relentless: {
    id: "half_orc_relentless",
    label: "Relentless",
    species: "Half-Orc",
    category: "resistance",
    description: "Half-orcs keep moving through punishment that would stagger others.",
    shortDescription: "Minor survivability edge.",
    effects: [{ type: "temp_hp", amount: 1 }],
    tags: { passive: true, combat: true, resilience: true },
  },

  tiefling_hellspark: {
    id: "tiefling_hellspark",
    label: "Hellspark",
    species: "Tiefling",
    category: "combat_passive",
    description: "Tieflings carry infernal force that amplifies dark or fiery moments.",
    shortDescription: "Minor fire/shadow flavor bonus.",
    effects: [{ type: "damage_bonus", amount: 1, damageType: "fire", duration: "persistent" }],
    tags: { passive: true, combat: true, magical: true },
  },

  tiefling_infernal_bearing: {
    id: "tiefling_infernal_bearing",
    label: "Infernal Bearing",
    species: "Tiefling",
    category: "social",
    description: "Tieflings project a dangerous presence that unsettles enemies.",
    shortDescription: "Minor fear/intimidation synergy.",
    effects: [{ type: "spawn_audit_note", note: "Tiefling infernal bearing intensified intimidation." }],
    tags: { passive: true, combat: true, magical: true },
  },

  dragonborn_draconic_bearing: {
    id: "dragonborn_draconic_bearing",
    label: "Draconic Bearing",
    species: "Dragonborn",
    category: "combat_passive",
    description: "Dragonborn carry imposing battlefield presence and force.",
    shortDescription: "Minor pressure/intimidation edge.",
    effects: [{ type: "pressure_shift", amount: 1 }],
    tags: { passive: true, combat: true, resilience: true },
  },

  dragonborn_scale_hardiness: {
    id: "dragonborn_scale_hardiness",
    label: "Scale Hardiness",
    species: "Dragonborn",
    category: "resistance",
    description: "Dragonborn scales offer a natural layer of protection.",
    shortDescription: "Minor AC boost.",
    effects: [{ type: "ac_bonus", amount: 1, duration: "persistent" }],
    tags: { passive: true, combat: true, resilience: true },
  },
};

export const SPECIES_TRAIT_MAP: SpeciesTraitMap = {
  human: ["human_resolve", "human_adaptable"],
  elf: ["elf_keen_senses", "elf_grace"],
  dwarf: ["dwarf_stone_resilience", "dwarf_tunnel_sense"],
  halfling: ["halfling_luck", "halfling_nimble"],
  gnome: ["gnome_tinker_mind", "gnome_arcane_curiosity"],
  "half-elf": ["half_elf_bridge_sense", "half_elf_grace"],
  "half-orc": ["half_orc_ferocity", "half_orc_relentless"],
  tiefling: ["tiefling_hellspark", "tiefling_infernal_bearing"],
  dragonborn: ["dragonborn_draconic_bearing", "dragonborn_scale_hardiness"],
};

export function getSpeciesTraitDefinition(traitId: string): SpeciesTraitDefinition | null {
  return SPECIES_TRAIT_DEFINITIONS[traitId] ?? null;
}

export function getTraitsForSpecies(species: string): string[] {
  const key = normalizeSkillLookupKey(species);
  return SPECIES_TRAIT_MAP[key] ?? [];
}
