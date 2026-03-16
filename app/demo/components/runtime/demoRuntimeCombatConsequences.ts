"use client";

// ------------------------------------------------------------
// demoRuntimeCombatConsequences.ts
// ------------------------------------------------------------
// Combat consequence resolver for Echoes of Fate.
// Purpose:
// - convert a successful recorded resolution into actual combat state change
// - stay deterministic and grounded in existing canon event flow
// - only apply combat consequences when the selected resolution path
//   represents hostile / attack pressure
//
// Scope:
// - player-side combat consequence application only
// - enemy-side damage already has its own resolver path
// - this file does NOT narrate
// - this file does NOT roll dice
// - this file only emits canon events to be appended by the runtime
// ------------------------------------------------------------

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

type RecordedResolutionPayload = {
  description: string;
  dice: {
    mode: DiceMode;
    roll: number;
    dc: number;
    source: RollSource;
  };
  audit: string[];
};

type DerivedCombatLite = {
  combatId: string;
  round: number;
  order: string[];
  activeCombatantId: string | null;
  participants: any[];
  initiative: any[];
};

type PlayerLike = {
  id: string;
  name?: string;
  className?: string;
  species?: string;
  hpCurrent?: number;
  hpMax?: number;
  ac?: number;
  initiativeMod?: number;
  skills?: string[];
  traits?: string[];
};

type CombatConsequenceArgs = {
  payload: RecordedResolutionPayload;
  playerInput: string;
  selectedOptionDescription: string;
  derivedCombat: DerivedCombatLite | null;
  activeCombatantSpec: any | null;
  actingPlayerId: string;
  partyMembers: PlayerLike[];
  enemyTelegraphHint?: {
    enemyName: string;
    targetName: string;
    attackStyleHint: "volley" | "beam" | "charge" | "unknown";
  } | null;
};

type CanonEventDraft = {
  type: string;
  payload: Record<string, unknown>;
};

type CombatConsequenceResult = {
  applied: boolean;
  hit: boolean;
  reason:
    | "no_combat"
    | "combat_ended"
    | "not_player_turn"
    | "non_hostile_resolution"
    | "attack_missed"
    | "damage_applied";
  events: CanonEventDraft[];
  targetEnemyCombatantId: string | null;
  damageAmount: number;
};

function safeInt(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function clampInt(value: unknown, lo: number, hi: number) {
  const n = safeInt(value, lo);
  return Math.max(lo, Math.min(hi, n));
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeClassKey(value?: string) {
  return normalizeText(value ?? "");
}

function isCombatActive(derivedCombat: DerivedCombatLite | null) {
  return !!derivedCombat?.combatId;
}

function isPlayerTurn(activeCombatantSpec: any | null) {
  return String(activeCombatantSpec?.kind ?? "") === "player";
}

function isHostileResolution(args: {
  playerInput: string;
  selectedOptionDescription: string;
}) {
  const combined = `${args.playerInput}\n${args.selectedOptionDescription}`;
  const text = normalizeText(combined);

  if (!text) return false;

  if (
    text.includes("resolve as an attack") ||
    text.includes("hostile action") ||
    text.includes("attack") ||
    text.includes("strike") ||
    text.includes("stab") ||
    text.includes("slash") ||
    text.includes("shoot") ||
    text.includes("smite") ||
    text.includes("blast") ||
    text.includes("backstab") ||
    text.includes("cleave") ||
    text.includes("eldritch") ||
    text.includes("chaos bolt") ||
    text.includes("arc bolt") ||
    text.includes("flurry")
  ) {
    return true;
  }

  return false;
}

function marginForPayload(payload: RecordedResolutionPayload) {
  const roll = safeInt(payload?.dice?.roll, 0);
  const dc = safeInt(payload?.dice?.dc, 10);
  return roll - dc;
}

function chooseEnemyTargetId(derivedCombat: DerivedCombatLite | null) {
  if (!derivedCombat) return null;

  const activeEnemy =
    (derivedCombat.participants ?? []).find(
      (p: any) =>
        String(p?.kind ?? "") === "enemy_group" &&
        String(p?.id ?? "") === String(derivedCombat.activeCombatantId ?? "")
    ) ?? null;

  if (activeEnemy?.id) {
    return String(activeEnemy.id);
  }

  const firstLivingEnemy =
    (derivedCombat.participants ?? []).find(
      (p: any) => String(p?.kind ?? "") === "enemy_group"
    ) ?? null;

  return firstLivingEnemy?.id ? String(firstLivingEnemy.id) : null;
}

function chooseDamageKind(args: {
  playerInput: string;
  partyMembers: PlayerLike[];
  actingPlayerId: string;
}) {
  const text = normalizeText(args.playerInput);
  const actor =
    args.partyMembers.find((m) => String(m.id) === String(args.actingPlayerId)) ?? null;
  const cls = normalizeClassKey(actor?.className);

  if (
    text.includes("arc bolt") ||
    text.includes("chaos bolt") ||
    text.includes("eldritch") ||
    text.includes("blast") ||
    cls === "mage" ||
    cls === "sorcerer" ||
    cls === "warlock"
  ) {
    return "force";
  }

  if (text.includes("smite")) return "radiant";
  if (text.includes("backstab") || text.includes("stab")) return "piercing";
  if (text.includes("slash") || text.includes("cleave")) return "slashing";
  if (text.includes("flurry") || text.includes("strike")) return "bludgeoning";

  if (cls === "rogue" || cls === "ranger") return "piercing";
  if (cls === "paladin") return "radiant";
  if (cls === "warrior" || cls === "barbarian") return "slashing";
  if (cls === "monk") return "bludgeoning";

  return "mixed";
}

function baseDamageForClass(className?: string) {
  const cls = normalizeClassKey(className);

  if (cls === "rogue") return 6;
  if (cls === "warrior") return 7;
  if (cls === "barbarian") return 8;
  if (cls === "paladin") return 7;
  if (cls === "ranger") return 6;
  if (cls === "mage") return 7;
  if (cls === "sorcerer") return 7;
  if (cls === "warlock") return 7;
  if (cls === "monk") return 6;
  if (cls === "cleric") return 5;
  if (cls === "bard") return 5;
  if (cls === "druid") return 6;
  if (cls === "artificer") return 6;

  return 5;
}

function skillBonusDamage(playerInput: string) {
  const text = normalizeText(playerInput);

  if (text.includes("backstab")) return 2;
  if (text.includes("smite")) return 2;
  if (text.includes("chaos bolt")) return 2;
  if (text.includes("eldritch blast")) return 1;
  if (text.includes("arc bolt")) return 1;
  if (text.includes("flurry")) return 1;
  if (text.includes("reckless strike")) return 2;
  if (text.includes("cleave")) return 1;

  return 0;
}

function marginBonusDamage(margin: number) {
  if (margin >= 8) return 3;
  if (margin >= 5) return 2;
  if (margin >= 2) return 1;
  return 0;
}

function computePlayerDamage(args: {
  payload: RecordedResolutionPayload;
  playerInput: string;
  partyMembers: PlayerLike[];
  actingPlayerId: string;
}) {
  const actor =
    args.partyMembers.find((m) => String(m.id) === String(args.actingPlayerId)) ?? null;

  const base = baseDamageForClass(actor?.className);
  const skill = skillBonusDamage(args.playerInput);
  const margin = marginForPayload(args.payload);
  const bonus = marginBonusDamage(margin);

  return clampInt(base + skill + bonus, 1, 18);
}

export function buildPlayerCombatConsequence(
  args: CombatConsequenceArgs
): CombatConsequenceResult {
  const {
    payload,
    playerInput,
    selectedOptionDescription,
    derivedCombat,
    activeCombatantSpec,
    actingPlayerId,
    partyMembers,
  } = args;

  if (!isCombatActive(derivedCombat)) {
    return {
      applied: false,
      hit: false,
      reason: "no_combat",
      events: [],
      targetEnemyCombatantId: null,
      damageAmount: 0,
    };
  }

  if (!isPlayerTurn(activeCombatantSpec)) {
    return {
      applied: false,
      hit: false,
      reason: "not_player_turn",
      events: [],
      targetEnemyCombatantId: null,
      damageAmount: 0,
    };
  }

  if (
    !isHostileResolution({
      playerInput,
      selectedOptionDescription,
    })
  ) {
    return {
      applied: false,
      hit: false,
      reason: "non_hostile_resolution",
      events: [],
      targetEnemyCombatantId: null,
      damageAmount: 0,
    };
  }

  const roll = safeInt(payload?.dice?.roll, 0);
  const dc = safeInt(payload?.dice?.dc, 10);
  const hit = roll >= dc;

  if (!hit) {
    return {
      applied: false,
      hit: false,
      reason: "attack_missed",
      events: [],
      targetEnemyCombatantId: null,
      damageAmount: 0,
    };
  }

  const combatId = String(derivedCombat?.combatId ?? "").trim();
  const sourceCombatantId = String(actingPlayerId ?? "").trim();
  const targetEnemyCombatantId = chooseEnemyTargetId(derivedCombat);

  if (!combatId || !sourceCombatantId || !targetEnemyCombatantId) {
    return {
      applied: false,
      hit: true,
      reason: "no_combat",
      events: [],
      targetEnemyCombatantId: targetEnemyCombatantId ?? null,
      damageAmount: 0,
    };
  }

  const damageAmount = computePlayerDamage({
    payload,
    playerInput,
    partyMembers,
    actingPlayerId,
  });

  const damageKind = chooseDamageKind({
    playerInput,
    partyMembers,
    actingPlayerId,
  });

  const events: CanonEventDraft[] = [
    {
      type: "COMBATANT_DAMAGED",
      payload: {
        combatId,
        sourceCombatantId,
        targetCombatantId: targetEnemyCombatantId,
        amount: damageAmount,
        kind: damageKind,
      },
    },
  ];

  return {
    applied: true,
    hit: true,
    reason: "damage_applied",
    events,
    targetEnemyCombatantId,
    damageAmount,
  };
}
