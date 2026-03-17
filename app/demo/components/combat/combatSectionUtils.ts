"use client";

import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import { getEnemyDefinitionByName } from "@/lib/game/EnemyDatabase";
import type {
  DerivedCombatLite,
  EnemyRosterCard,
  HpState,
  PartyMemberLite,
  PressureTone,
  TurnTone,
  CombatEncounterContext,
} from "./combatSectionTypes";

export function playSfx(src: string, volume = 0.72) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // fail silent
  }
}

export function normalizeClassValue(v?: string) {
  return String(v ?? "").trim();
}

export function normalizeSpeciesValue(v?: string) {
  return String(v ?? "").trim();
}

export function normalizeName(v?: string | null) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

export function getResolvedSpecies(member: PartyMemberLite) {
  const species = normalizeSpeciesValue(member.species);
  return species || "Human";
}

export function getResolvedClass(member: PartyMemberLite) {
  const className = normalizeClassValue(member.className);
  return className || "Warrior";
}

export function portraitSrcFor(member: PartyMemberLite) {
  return getPortraitPath(
    getResolvedSpecies(member),
    getResolvedClass(member),
    member.portrait === "Female" ? "Female" : "Male"
  );
}

export function normalizeClassKey(v: string) {
  return (v || "").trim().toLowerCase();
}

export function isHealerCapable(className: string) {
  const k = normalizeClassKey(className);
  return (
    k === "cleric" ||
    k === "paladin" ||
    k === "druid" ||
    k === "bard" ||
    k === "artificer"
  );
}

export function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function hpPercent(hpCurrent: number, hpMax: number) {
  const max = Math.max(1, Number(hpMax) || 1);
  const cur = Math.max(0, Number(hpCurrent) || 0);
  return clamp01(cur / max);
}

export function fmtHp(hpCurrent: number, hpMax: number) {
  const max = Math.max(1, Number(hpMax) || 1);
  const cur = Math.max(0, Number(hpCurrent) || 0);
  return `${cur} / ${max}`;
}

export function nameKey(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function clampInt(n: unknown, lo: number, hi: number) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : lo;
  return Math.max(lo, Math.min(hi, x));
}

export function titleCase(v: string) {
  return String(v ?? "")
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function derivePlayerHpFromCanon(args: {
  events: readonly any[];
  combatId: string | null;
  partyMembers: PartyMemberLite[];
}): Record<string, HpState> {
  const { events, combatId, partyMembers } = args;

  const base: Record<string, HpState> = {};
  for (const m of partyMembers) {
    const hpMax = Math.max(1, Number(m.hpMax) || 1);
    const hpCur = clampInt(m.hpCurrent, 0, hpMax);
    base[String(m.id)] = { hpMax, hpCurrent: hpCur, downed: hpCur <= 0 };
  }

  if (!combatId) return base;

  for (const e of events) {
    if (e?.type !== "COMBATANT_HP_INITIALIZED") continue;
    const p = e?.payload ?? {};
    if (String(p.combatId ?? "") !== String(combatId)) continue;

    const id = String(p.combatantId ?? "");
    if (!id) continue;

    const hpMax = Math.max(1, Number(p.hpMax) || 1);
    const hpCur = clampInt(p.hpCurrent, 0, hpMax);

    base[id] = { hpMax, hpCurrent: hpCur, downed: hpCur <= 0 };
  }

  for (const e of events) {
    const t = e?.type;
    const p = e?.payload ?? {};
    if (!combatId || String(p.combatId ?? "") !== String(combatId)) continue;

    if (t === "COMBATANT_DAMAGED") {
      const targetId = String(p.targetCombatantId ?? "");
      const amount = Math.max(0, Math.trunc(Number(p.amount ?? 0)));
      if (!targetId || amount <= 0) continue;

      const cur = base[targetId] ?? { hpMax: 12, hpCurrent: 12, downed: false };
      const nextCur = Math.max(0, (Number(cur.hpCurrent) || 0) - amount);
      base[targetId] = {
        ...cur,
        hpCurrent: nextCur,
        downed: cur.downed || nextCur <= 0,
      };
    }

    if (t === "COMBATANT_HEALED") {
      const targetId = String(p.targetCombatantId ?? "");
      const amount = Math.max(0, Math.trunc(Number(p.amount ?? 0)));
      if (!targetId || amount <= 0) continue;

      const cur = base[targetId] ?? { hpMax: 12, hpCurrent: 0, downed: true };
      const max = Math.max(1, Number(cur.hpMax) || 1);
      const nextCur = Math.min(max, (Number(cur.hpCurrent) || 0) + amount);
      base[targetId] = { ...cur, hpCurrent: nextCur, downed: nextCur <= 0 };
    }

    if (t === "COMBATANT_DOWNED") {
      const id = String(p.combatantId ?? "");
      if (!id) continue;
      const cur = base[id] ?? { hpMax: 12, hpCurrent: 0, downed: true };
      base[id] = {
        ...cur,
        hpCurrent: Math.max(0, Number(cur.hpCurrent) || 0),
        downed: true,
      };
    }
  }

  return base;
}

export function deriveEnemyHpFromCanon(args: {
  events: readonly any[];
  combatId: string | null;
  derivedCombat: DerivedCombatLite | null;
}): Record<string, HpState> {
  const { events, combatId, derivedCombat } = args;
  const base: Record<string, HpState> = {};

  if (!combatId || !derivedCombat) return base;

  for (const participant of derivedCombat.participants ?? []) {
    if (String(participant?.kind ?? "") !== "enemy_group") continue;

    const combatantId = String(participant?.id ?? "").trim();
    const enemyName = String(participant?.name ?? "").trim();
    if (!combatantId) continue;

    const def = getEnemyDefinitionByName(enemyName);
    const hpMax = Math.max(1, Number(def?.defenses?.hp ?? 12) || 12);

    base[combatantId] = {
      hpMax,
      hpCurrent: hpMax,
      downed: false,
    };
  }

  for (const e of events) {
    if (e?.type !== "COMBATANT_HP_INITIALIZED") continue;
    const p = e?.payload ?? {};
    if (String(p.combatId ?? "") !== String(combatId)) continue;

    const id = String(p.combatantId ?? "");
    if (!id || !base[id]) continue;

    const hpMax = Math.max(1, Number(p.hpMax) || base[id].hpMax);
    const hpCur = clampInt(p.hpCurrent, 0, hpMax);

    base[id] = { hpMax, hpCurrent: hpCur, downed: hpCur <= 0 };
  }

  for (const e of events) {
    const t = e?.type;
    const p = e?.payload ?? {};
    if (String(p.combatId ?? "") !== String(combatId)) continue;

    if (t === "COMBATANT_DAMAGED") {
      const targetId = String(p.targetCombatantId ?? "");
      const amount = Math.max(0, Math.trunc(Number(p.amount ?? 0)));
      if (!targetId || amount <= 0 || !base[targetId]) continue;

      const cur = base[targetId];
      const nextCur = Math.max(0, cur.hpCurrent - amount);
      base[targetId] = {
        ...cur,
        hpCurrent: nextCur,
        downed: cur.downed || nextCur <= 0,
      };
    }

    if (t === "COMBATANT_HEALED") {
      const targetId = String(p.targetCombatantId ?? "");
      const amount = Math.max(0, Math.trunc(Number(p.amount ?? 0)));
      if (!targetId || amount <= 0 || !base[targetId]) continue;

      const cur = base[targetId];
      const nextCur = Math.min(cur.hpMax, cur.hpCurrent + amount);
      base[targetId] = {
        ...cur,
        hpCurrent: nextCur,
        downed: nextCur <= 0,
      };
    }

    if (t === "COMBATANT_DOWNED") {
      const id = String(p.combatantId ?? "");
      if (!id || !base[id]) continue;
      base[id] = {
        ...base[id],
        hpCurrent: Math.max(0, base[id].hpCurrent),
        downed: true,
      };
    }
  }

  return base;
}

export function inferDamageStyleFromPayload(
  payload: any
): "volley" | "beam" | "charge" | "unknown" {
  const text = String(payload?.description ?? "").toLowerCase();
  if (text.includes("volley") || text.includes("arrows")) return "volley";
  if (
    text.includes("spell") ||
    text.includes("beam") ||
    text.includes("force") ||
    text.includes("burn")
  ) {
    return "beam";
  }
  if (text.includes("charge") || text.includes("smash") || text.includes("strike")) {
    return "charge";
  }
  return "unknown";
}

export function computeDeterministicDamage(args: {
  roll: number;
  dc: number;
  style: "volley" | "beam" | "charge" | "unknown";
}) {
  const rollValue = Math.trunc(Number(args.roll) || 0);
  const dcValue = Math.trunc(Number(args.dc) || 0);
  const margin = rollValue - dcValue;

  const base =
    args.style === "beam"
      ? 6
      : args.style === "charge"
        ? 5
        : args.style === "volley"
          ? 4
          : 4;
  const bonus = Math.max(0, Math.floor(margin / 5));
  const raw = base + bonus;

  return clampInt(raw, 1, 12);
}

export function enemyPortraitSrc(enemyName: string) {
  const def = getEnemyDefinitionByName(enemyName);
  if (def?.portraitKey) return `/assets/V2/Enemy/${def.portraitKey}.png`;
  return "/assets/V2/Enemy/Enemy_Bandit_Warrior.png";
}

export function enemyMatchesName(enemyName: string, value?: string | null) {
  if (!value) return false;
  return normalizeName(enemyName).toLowerCase() === normalizeName(value).toLowerCase();
}

export function chipStyle(
  tone: "neutral" | "info" | "warn" | "accent" = "neutral"
): React.CSSProperties {
  if (tone === "info") {
    return {
      border: "1px solid rgba(138,180,255,0.22)",
      background: "rgba(138,180,255,0.08)",
    };
  }

  if (tone === "warn") {
    return {
      border: "1px solid rgba(255,200,140,0.22)",
      background: "rgba(255,200,140,0.08)",
    };
  }

  if (tone === "accent") {
    return {
      border: "1px solid rgba(180,220,160,0.22)",
      background: "rgba(180,220,160,0.08)",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  };
}

export function actionButtonStyle(
  tone: "primary" | "secondary" | "warn" = "secondary"
): React.CSSProperties {
  if (tone === "primary") {
    return {
      border: "1px solid rgba(214,188,120,0.28)",
      background:
        "linear-gradient(180deg, rgba(214,188,120,0.14), rgba(214,188,120,0.06))",
      color: "rgba(245,236,216,0.98)",
    };
  }

  if (tone === "warn") {
    return {
      border: "1px solid rgba(214,110,110,0.28)",
      background:
        "linear-gradient(180deg, rgba(214,110,110,0.14), rgba(214,110,110,0.06))",
      color: "rgba(255,224,224,0.96)",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(236,239,244,0.94)",
  };
}

export function renderPressureTone(
  pressureTier: "low" | "medium" | "high"
): PressureTone {
  if (pressureTier === "high") {
    return {
      border: "rgba(214,110,110,0.24)",
      bg: "rgba(214,110,110,0.08)",
    };
  }

  if (pressureTier === "medium") {
    return {
      border: "rgba(214,188,120,0.24)",
      bg: "rgba(214,188,120,0.08)",
    };
  }

  return {
    border: "rgba(120,160,214,0.22)",
    bg: "rgba(120,160,214,0.08)",
  };
}

export function renderTurnTone(args: {
  combatEnded: boolean;
  isEnemyTurn: boolean;
  isWrongPlayerForTurn: boolean;
}): TurnTone {
  if (args.combatEnded) {
    return {
      label: "Combat Ended",
      border: "rgba(118,188,132,0.24)",
      bg: "rgba(118,188,132,0.08)",
      text: "rgba(202,240,210,0.95)",
    };
  }

  if (args.isEnemyTurn) {
    return {
      label: "Enemy Turn",
      border: "rgba(214,110,110,0.28)",
      bg: "rgba(214,110,110,0.10)",
      text: "rgba(255,214,214,0.95)",
    };
  }

  if (args.isWrongPlayerForTurn) {
    return {
      label: "Turn Locked",
      border: "rgba(180,180,180,0.20)",
      bg: "rgba(255,255,255,0.05)",
      text: "rgba(235,235,235,0.90)",
    };
  }

  return {
    label: "Your Turn",
    border: "rgba(214,188,120,0.28)",
    bg: "rgba(214,188,120,0.10)",
    text: "rgba(245,236,216,0.96)",
  };
}

export function deriveEnemyRoster(args: {
  derivedCombat: DerivedCombatLite | null;
  enemyHpById: Record<string, HpState>;
  encounterContext?: CombatEncounterContext | null;
}): EnemyRosterCard[] {
  const { derivedCombat, enemyHpById, encounterContext } = args;
  if (!derivedCombat) return [];

  const duplicatesByName: Record<string, number> = {};
  const totalsByName: Record<string, number> = {};

  for (const p of derivedCombat.participants ?? []) {
    if (String(p?.kind ?? "") !== "enemy_group") continue;
    const name = normalizeName(String(p?.name ?? ""));
    if (!name) continue;
    totalsByName[name] = (totalsByName[name] ?? 0) + 1;
  }

  const cards: EnemyRosterCard[] = [];

  for (const p of derivedCombat.participants ?? []) {
    if (String(p?.kind ?? "") !== "enemy_group") continue;

    const combatantId = String(p?.id ?? "").trim();
    const enemyName = normalizeName(String(p?.name ?? "").trim()) || "Enemy";
    const def = getEnemyDefinitionByName(enemyName);
    const hp = enemyHpById[combatantId];
    const ac = Math.max(1, Number(def?.defenses?.ac ?? 10) || 10);
    const initMod = Math.trunc(Number(p?.initiativeMod ?? 0));

    duplicatesByName[enemyName] = (duplicatesByName[enemyName] ?? 0) + 1;
    const idx = duplicatesByName[enemyName];
    const total = totalsByName[enemyName] ?? 1;
    const label = total > 1 ? `${enemyName} #${idx}` : enemyName;

    cards.push({
      combatantId,
      enemyName,
      label,
      hpMax: hp?.hpMax ?? Math.max(1, Number(def?.defenses?.hp ?? 12) || 12),
      hpCurrent: hp?.hpCurrent ?? Math.max(1, Number(def?.defenses?.hp ?? 12) || 12),
      ac,
      defeated: hp?.downed ?? false,
      initiativeMod: initMod,
      portraitSrc: enemyPortraitSrc(enemyName),
      portraitKey: def?.portraitKey ?? null,
      factionLabel: titleCase(String(def?.faction ?? "unknown")),
      roleLabel: titleCase(String(def?.role ?? "enemy")),
      isActive: String(derivedCombat.activeCombatantId ?? "") === combatantId,
      isKeybearer: enemyMatchesName(enemyName, encounterContext?.keyEnemyName),
      isRelicBearer: enemyMatchesName(enemyName, encounterContext?.relicEnemyName),
      isCacheGuard: enemyMatchesName(enemyName, encounterContext?.cacheGuardEnemyName),
    });
  }

  return cards;
}
