// lib/skills/classSkillMap.ts

import type { ClassSkillMap, EnemySkillMap } from "./SkillTypes";
import { normalizeSkillLookupKey } from "./SkillTypes";

export const CLASS_SKILL_MAP: ClassSkillMap = {
  warrior: ["guard_break", "shield_wall", "second_wind"],
  rogue: ["backstab", "shadowstep", "disarm_trap"],
  mage: ["arc_bolt", "frost_bind", "detect_arcana"],
  cleric: ["heal", "bless", "turn_undead"],
  ranger: ["mark_target", "volley", "track"],
  paladin: ["smite", "protect", "rally"],
  bard: ["inspire", "distract", "soothing_verse"],
  druid: ["vinesnare", "wild_shape", "nature_sense"],
  monk: ["flurry", "deflect", "center_self"],
  artificer: ["gadget_trap", "infuse_weapon", "deploy_device"],
  sorcerer: ["chaos_bolt", "surge", "quickened_cast"],
  warlock: ["hex", "eldritch_blast", "pact_ward"],

  // optional aliases for future-proofing
  fighter: ["guard_break", "shield_wall", "second_wind"],
  wizard: ["arc_bolt", "frost_bind", "detect_arcana"],
};

export const ENEMY_SKILL_MAP: EnemySkillMap = {
  "orc raider": ["raider_cleave", "raider_frenzy"],
  "goblin skirmisher": ["skirmisher_harass", "skirmisher_smoke"],
  "dark cultist": ["cultist_hex", "cultist_drain"],
  "undead knight": ["undead_slash", "deathless_march"],
  "bandit archer": ["bandit_volley", "suppressing_fire"],
  "shadow assassin": ["shadow_strike", "vanish"],
};

export function getSkillsForClass(className: string): string[] {
  const key = normalizeSkillLookupKey(className);
  return CLASS_SKILL_MAP[key] ?? [];
}

export function getSkillsForEnemyArchetype(enemyArchetype: string): string[] {
  const key = normalizeSkillLookupKey(enemyArchetype);
  return ENEMY_SKILL_MAP[key] ?? [];
}
