// lib/skills/SkillTypes.ts

export type SkillActorKind = "player" | "enemy";

export type SkillCategory =
  | "attack"
  | "support"
  | "defense"
  | "control"
  | "mobility"
  | "healing"
  | "utility"
  | "exploration"
  | "passive"
  | "reaction";

export type SkillUsePhase =
  | "combat"
  | "exploration"
  | "social"
  | "any";

export type SkillTargetType =
  | "self"
  | "single_ally"
  | "single_enemy"
  | "all_allies"
  | "all_enemies"
  | "ally_group"
  | "enemy_group"
  | "tile"
  | "zone"
  | "none";

export type SkillRangeType =
  | "self"
  | "melee"
  | "near"
  | "ranged"
  | "zone"
  | "unlimited";

export type SkillDurationType =
  | "instant"
  | "end_of_turn"
  | "start_of_next_turn"
  | "rounds"
  | "scene"
  | "combat"
  | "persistent";

export type SkillUsageType =
  | "at_will"
  | "per_turn"
  | "per_combat"
  | "per_scene"
  | "charges"
  | "passive";

export type ConditionId =
  | "guarded"
  | "blessed"
  | "inspired"
  | "hidden"
  | "marked"
  | "hexed"
  | "restrained"
  | "stunned"
  | "bleeding"
  | "burning"
  | "chilled"
  | "poisoned"
  | "weakened"
  | "frightened"
  | "silenced"
  | "shielded"
  | "exposed"
  | "warded"
  | "regenerating"
  | "taunted"
  | "vulnerable"
  | "camouflaged"
  | "revealed"
  | "rooted"
  | "disarmed";

export type DamageType =
  | "physical"
  | "piercing"
  | "slashing"
  | "blunt"
  | "fire"
  | "cold"
  | "lightning"
  | "radiant"
  | "necrotic"
  | "poison"
  | "psychic"
  | "arcane"
  | "holy"
  | "shadow";

export type SkillScalingStat =
  | "ac"
  | "hpMax"
  | "hpCurrent"
  | "initiativeMod"
  | "none";

export type SkillTrigger =
  | "on_use"
  | "on_hit"
  | "on_miss"
  | "on_damage_taken"
  | "on_turn_start"
  | "on_turn_end"
  | "on_ally_downed"
  | "on_enemy_downed"
  | "on_enter_zone"
  | "passive";

export type SkillEffect =
  | {
      type: "damage";
      amount: number;
      damageType: DamageType;
      bonusIfCondition?: ConditionId;
      scaleBy?: SkillScalingStat;
    }
  | {
      type: "heal";
      amount: number;
      reviveFloor?: number;
    }
  | {
      type: "temp_hp";
      amount: number;
    }
  | {
      type: "ac_bonus";
      amount: number;
      duration: SkillDurationType;
      rounds?: number;
    }
  | {
      type: "initiative_bonus";
      amount: number;
      duration: SkillDurationType;
      rounds?: number;
    }
  | {
      type: "hit_bonus";
      amount: number;
      duration: SkillDurationType;
      rounds?: number;
    }
  | {
      type: "damage_bonus";
      amount: number;
      damageType?: DamageType;
      duration: SkillDurationType;
      rounds?: number;
    }
  | {
      type: "reduce_incoming_damage";
      amount: number;
      duration: SkillDurationType;
      rounds?: number;
    }
  | {
      type: "apply_condition";
      condition: ConditionId;
      duration: SkillDurationType;
      rounds?: number;
      potency?: number;
    }
  | {
      type: "remove_condition";
      condition: ConditionId;
    }
  | {
      type: "cleanse_conditions";
      conditions: ConditionId[] | "all_negative";
    }
  | {
      type: "reveal_tiles";
      amount: number;
    }
  | {
      type: "mark_zone";
      note: string;
    }
  | {
      type: "awareness_shift";
      amount: number;
    }
  | {
      type: "pressure_shift";
      amount: number;
    }
  | {
      type: "movement";
      amount: number;
      ignoresEngagement?: boolean;
    }
  | {
      type: "retarget";
      amount: number;
    }
  | {
      type: "reroll";
      amount: number;
      scope: "self" | "ally";
    }
  | {
      type: "resource_restore";
      amount: number;
      resource: "skill_charge" | "reaction" | "special";
    }
  | {
      type: "spawn_audit_note";
      note: string;
    };

export type SkillUsageLimit = {
  type: SkillUsageType;
  maxUses?: number;
  charges?: number;
};

export type SkillTargeting = {
  targetType: SkillTargetType;
  range: SkillRangeType;
  requiresTarget: boolean;
  canTargetSelf?: boolean;
  canTargetAllies?: boolean;
  canTargetEnemies?: boolean;
};

export type SkillTags = {
  magical?: boolean;
  martial?: boolean;
  stealth?: boolean;
  holy?: boolean;
  shadow?: boolean;
  primal?: boolean;
  arcane?: boolean;
  tech?: boolean;
  undeadOnlyBonus?: boolean;
  openerOnly?: boolean;
  finisher?: boolean;
  enemyOnly?: boolean;
  playerOnly?: boolean;
};

export type SkillDefinition = {
  id: string;
  label: string;
  actorKind: SkillActorKind | "any";
  category: SkillCategory;
  phase: SkillUsePhase;
  description: string;
  shortDescription: string;

  className?: string;
  enemyArchetype?: string;

  targeting: SkillTargeting;
  usage: SkillUsageLimit;

  trigger?: SkillTrigger;
  cooldownTurns?: number;

  hitRoll?: {
    enabled: boolean;
    baseBonus?: number;
    contestedBy?: "ac" | "none";
  };

  saveCheck?: {
    enabled: boolean;
    stat?: "none";
    dcMod?: number;
  };

  effectsOnUse?: SkillEffect[];
  effectsOnHit?: SkillEffect[];
  effectsOnMiss?: SkillEffect[];
  passiveEffects?: SkillEffect[];
  reactionEffects?: SkillEffect[];

  tags?: SkillTags;

  aiHints?: {
    preferredWhenTargetHasCondition?: ConditionId;
    preferredWhenSelfBelowHpPct?: number;
    preferredWhenMultipleEnemies?: boolean;
    preferredWhenUndeadTarget?: boolean;
    openerPriority?: number;
    finisherPriority?: number;
  };
};

export type SkillDefinitionMap = Record<string, SkillDefinition>;

export type ClassSkillMap = Record<string, string[]>;

export type EnemySkillMap = Record<string, string[]>;

export type ActorSkillLoadout = {
  actorId: string;
  actorKind: SkillActorKind;
  skillIds: string[];
};

export function normalizeSkillLookupKey(value: string): string {
  return (value ?? "").trim().toLowerCase();
}

export function isNegativeCondition(condition: ConditionId): boolean {
  return [
    "hexed",
    "restrained",
    "stunned",
    "bleeding",
    "burning",
    "chilled",
    "poisoned",
    "weakened",
    "frightened",
    "silenced",
    "exposed",
    "taunted",
    "vulnerable",
    "revealed",
    "rooted",
    "disarmed",
  ].includes(condition);
}
