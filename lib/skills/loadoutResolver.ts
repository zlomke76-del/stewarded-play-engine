// lib/skills/loadoutResolver.ts

import type { ResolvedPartyLoadout } from "./SkillTypes";
import { getSkillsForClass } from "./classSkillMap";
import { getTraitsForSpecies } from "./speciesTraitMap";

export function resolvePartyLoadout(className?: string, species?: string): ResolvedPartyLoadout {
  const resolvedClass = (className ?? "").trim() || "Warrior";
  const resolvedSpecies = (species ?? "").trim() || "Human";

  return {
    className: resolvedClass,
    species: resolvedSpecies,
    skillIds: getSkillsForClass(resolvedClass),
    traitIds: getTraitsForSpecies(resolvedSpecies),
  };
}
