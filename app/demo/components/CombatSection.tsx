"use client";

// ------------------------------------------------------------
// CombatSection.tsx
// ------------------------------------------------------------
// Player-facing combat surface for Echoes of Fate.
//
// Combat cockpit goals:
// - battlefield always renders first and stays visible
// - command sits immediately below the battlefield
// - adjudication stays tightly coupled to command
// - supporting systems remain collapsed by default
// ------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "@/components/layout/CardSection";
import CombatSetupPanel from "@/components/combat/CombatSetupPanel";
import EnemyTurnResolverPanel from "@/components/combat/EnemyTurnResolverPanel";
import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import CombatStage from "./CombatStage";
import ActionSection from "./ActionSection";
import { formatCombatantLabel } from "@/lib/combat/CombatState";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import { getSkillDefinition } from "@/lib/skills/skillDefinitions";
import { getSpeciesTraitDefinition } from "@/lib/skills/speciesTraitMap";
import {
  getEnemyDefinitionByName,
  type EnemyEncounterTheme,
} from "@/lib/game/EnemyDatabase";
import { inferOptionKind } from "../demoUtils";

type PartyMemberLite = {
  id: string;
  name: string;
  species?: string;
  className: string;
  portrait: "Male" | "Female";
  skills?: string[];
  traits?: string[];
  ac: number;
  hpMax: number;
  hpCurrent: number;
  initiativeMod: number;
};

type EnemyTelegraphHint = {
  enemyName: string;
  targetName: string;
  attackStyleHint: "volley" | "beam" | "charge" | "unknown";
};

type DerivedCombatLite = {
  combatId: string;
  round: number;
  order: string[];
  activeCombatantId: string | null;
  participants: any[];
  initiative: any[];
};

type CombatEncounterContext = {
  zoneId?: string | null;
  zoneTheme?: EnemyEncounterTheme | null;
  objective?: string | null;
  lockState?: string | null;
  rewardHint?: string | null;
  keyEnemyName?: string | null;
  relicEnemyName?: string | null;
  cacheGuardEnemyName?: string | null;
};

type ActionSurfacePartyMember = {
  id: string;
  label: string;
  species?: string;
  className?: string;
  portrait?: "Male" | "Female";
  skills?: string[];
  traits?: string[];
  ac?: number;
  hpMax?: number;
  hpCurrent?: number;
  initiativeMod?: number;
};

type ActionSurfaceProps = {
  partyMembers: ActionSurfacePartyMember[];
  actingPlayerId: string;
  onSetActingPlayerId: (id: string) => void;
  playerInput: string;
  onSetPlayerInput: (v: string) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  onPassTurn: () => void;
  onRecord: (payload: any) => void;
  options: any[] | null;
  selectedOption: any | null;
  onSetSelectedOption: (option: any | null) => void;
  dmMode: "human" | "solace-neutral" | null;
  role: string;
  resolutionDmMode: string;
  currentRoomTitle?: string;
  roomSummary?: string;
  resolutionMovement?: {
    from?: { x: number; y: number } | null;
    to?: { x: number; y: number } | null;
    direction?: "north" | "south" | "east" | "west" | "none" | null;
  } | null;
  resolutionCombat?: {
    activeEnemyGroupName?: string | null;
    isEnemyTurn?: boolean;
    attackStyleHint?: "volley" | "beam" | "charge" | "unknown";
  } | null;
  actingRollModifier?: number;
  actingPlayerInjuryStacks?: number;
  title?: string;
  eyebrow?: string;
  description?: string;
  inputPlaceholder?: string;
};

type Props = {
  events: any[];
  dmMode: "human" | "solace-neutral" | null;

  onAppendCanon: (type: string, payload: any) => void;

  openingCombatRound?: number;
  canAttemptCombatRetreat?: boolean;
  openingBattleFinisherAvailable?: boolean;
  openingBattleFinisherSkillLabel?: string | null;
  isOpeningThresholdCombat?: boolean;

  partyMembers: PartyMemberLite[];
  pressureTier: "low" | "medium" | "high";
  allowDevControls: boolean;

  encounterContext?: CombatEncounterContext | null;

  showEnemyResolver: boolean;
  activeEnemyGroupName: string | null;
  activeEnemyGroupId: string | null;
  playerNames: string[];
  onTelegraph: (info: EnemyTelegraphHint) => void;
  onCommitOutcomeOnly: (payload: any) => void;
  onAdvanceTurn: () => void;
  enemyTelegraphHint: EnemyTelegraphHint | null;

  derivedCombat: DerivedCombatLite | null;
  activeCombatantSpec: any | null;
  combatEnded: boolean;
  isEnemyTurn: boolean;
  isWrongPlayerForTurn: boolean;

  onAdvanceTurnBtn: () => void;
  onPassTurnBtn: () => void;
  onEndCombatBtn: () => void;

  actionSurface: ActionSurfaceProps;
};

const SFX = {
  uiClick: "/assets/audio/sfx_button_click_01.mp3",
  combatHit: "/assets/audio/sfx_sword_hit_01.mp3",
  enemyDeath: "/assets/audio/sfx_monster_dying_01.mp3",
  enemyTelegraph: "/assets/audio/sfx_goblin_attack_01.mp3",
  combatAdvance: "/assets/audio/sfx_button_click_01.mp3",
} as const;

function playSfx(src: string, volume = 0.72) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // fail silent
  }
}

function normalizeClassValue(v?: string) {
  return String(v ?? "").trim();
}

function normalizeSpeciesValue(v?: string) {
  return String(v ?? "").trim();
}

function normalizeName(v?: string | null) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function getResolvedSpecies(member: PartyMemberLite) {
  const species = normalizeSpeciesValue(member.species);
  return species || "Human";
}

function getResolvedClass(member: PartyMemberLite) {
  const className = normalizeClassValue(member.className);
  return className || "Warrior";
}

function portraitSrcFor(member: PartyMemberLite) {
  return getPortraitPath(
    getResolvedSpecies(member),
    getResolvedClass(member),
    member.portrait === "Female" ? "Female" : "Male"
  );
}

function normalizeClassKey(v: string) {
  return (v || "").trim().toLowerCase();
}

function isHealerCapable(className: string) {
  const k = normalizeClassKey(className);
  return (
    k === "cleric" ||
    k === "paladin" ||
    k === "druid" ||
    k === "bard" ||
    k === "artificer"
  );
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function hpPercent(hpCurrent: number, hpMax: number) {
  const max = Math.max(1, Number(hpMax) || 1);
  const cur = Math.max(0, Number(hpCurrent) || 0);
  return clamp01(cur / max);
}

function fmtHp(hpCurrent: number, hpMax: number) {
  const max = Math.max(1, Number(hpMax) || 1);
  const cur = Math.max(0, Number(hpCurrent) || 0);
  return `${cur} / ${max}`;
}

function nameKey(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function clampInt(n: unknown, lo: number, hi: number) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : lo;
  return Math.max(lo, Math.min(hi, x));
}

function titleCase(v: string) {
  return String(v ?? "")
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type HpState = {
  hpMax: number;
  hpCurrent: number;
  downed: boolean;
};

type EnemyRosterCard = {
  combatantId: string;
  enemyName: string;
  label: string;
  hpMax: number;
  hpCurrent: number;
  ac: number;
  defeated: boolean;
  initiativeMod: number;
  portraitSrc: string;
  portraitKey: string | null;
  factionLabel: string;
  roleLabel: string;
  isActive: boolean;
  isKeybearer: boolean;
  isRelicBearer: boolean;
  isCacheGuard: boolean;
};

function derivePlayerHpFromCanon(args: {
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

function deriveEnemyHpFromCanon(args: {
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

function inferDamageStyleFromPayload(
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

function computeDeterministicDamage(args: {
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

function enemyPortraitSrc(enemyName: string) {
  const def = getEnemyDefinitionByName(enemyName);
  if (def?.portraitKey) return `/assets/V2/Enemy/${def.portraitKey}.png`;
  return "/assets/V2/Enemy/Enemy_Bandit_Warrior.png";
}

function enemyMatchesName(enemyName: string, value?: string | null) {
  if (!value) return false;
  return normalizeName(enemyName).toLowerCase() === normalizeName(value).toLowerCase();
}

function chipStyle(
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

function actionButtonStyle(
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

function renderPressureTone(pressureTier: "low" | "medium" | "high") {
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

function renderTurnTone(args: {
  combatEnded: boolean;
  isEnemyTurn: boolean;
  isWrongPlayerForTurn: boolean;
}) {
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

function InfoPill(props: {
  label: string;
  tone?: "neutral" | "info" | "warn" | "accent";
}) {
  return (
    <span
      style={{
        ...chipStyle(props.tone ?? "neutral"),
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 11,
        lineHeight: 1,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {props.label}
    </span>
  );
}

function optionId(option: any, idx: number) {
  const explicit = String(option?.id ?? "").trim();
  if (explicit) return explicit;
  return `option_${idx}_${String(option?.description ?? option?.label ?? "choice")}`;
}

function optionDescription(option: any) {
  return String(option?.description ?? option?.label ?? "Unknown resolution path").trim();
}

function OpeningCombatPrompt(props: {
  round?: number;
  canRetreat?: boolean;
  finisherAvailable?: boolean;
  finisherSkill?: string | null;
  isOpeningThresholdCombat?: boolean;
}) {
  const { round, canRetreat, finisherAvailable, finisherSkill, isOpeningThresholdCombat } = props;

  if (!isOpeningThresholdCombat) return null;
  if (!canRetreat && !finisherAvailable) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.20))",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          opacity: 0.62,
        }}
      >
        Opening Battle{round ? ` · Round ${round}` : ""}
      </div>

      {canRetreat ? (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(232,236,244,0.88)",
          }}
        >
          You can now attempt to <strong>evade</strong>, <strong>withdraw</strong>, or{" "}
          <strong>break away</strong>.
        </div>
      ) : null}

      {finisherAvailable ? (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(255,215,168,0.96)",
            fontWeight: 700,
          }}
        >
          The enemy is exposed. A decisive <strong>{finisherSkill ?? "class skill"}</strong>{" "}
          could end the fight — but your weapon may not survive the strike.
        </div>
      ) : null}
    </div>
  );
}

export default function CombatSection({
  events,
  dmMode,
  onAppendCanon,
  openingCombatRound,
  canAttemptCombatRetreat,
  openingBattleFinisherAvailable,
  openingBattleFinisherSkillLabel,
  isOpeningThresholdCombat,
  partyMembers,
  pressureTier,
  allowDevControls,
  encounterContext = null,
  showEnemyResolver,
  activeEnemyGroupName,
  activeEnemyGroupId,
  playerNames,
  onTelegraph,
  onCommitOutcomeOnly,
  onAdvanceTurn,
  enemyTelegraphHint,
  derivedCombat,
  activeCombatantSpec,
  combatEnded,
  isEnemyTurn,
  isWrongPlayerForTurn,
  onAdvanceTurnBtn,
  onPassTurnBtn,
  onEndCombatBtn,
  actionSurface,
}: Props) {
  const combatId = derivedCombat?.combatId ?? null;
  const prevTelegraphKeyRef = useRef<string>("");
  const [showInspector, setShowInspector] = useState(false);
  const [showSupportingSystems, setShowSupportingSystems] = useState(false);

  const playerHpById = useMemo(
    () => derivePlayerHpFromCanon({ events, combatId, partyMembers }),
    [events, combatId, partyMembers]
  );

  const enemyHpById = useMemo(
    () => deriveEnemyHpFromCanon({ events, combatId, derivedCombat }),
    [events, combatId, derivedCombat]
  );

  const partyMembersForDisplay = useMemo(() => {
    return partyMembers.map((m) => {
      const hp = playerHpById[String(m.id)];
      if (!hp) return m;
      return { ...m, hpMax: hp.hpMax, hpCurrent: hp.hpCurrent };
    });
  }, [partyMembers, playerHpById]);

  const activePlayerId = useMemo(() => {
    if (!activeCombatantSpec) return null;
    if (String(activeCombatantSpec?.kind ?? "") !== "player") return null;
    const id = String(activeCombatantSpec?.id ?? "").trim();
    return id || null;
  }, [activeCombatantSpec]);

  const telegraphTargetKey = useMemo(() => {
    const targetName = enemyTelegraphHint?.targetName ? nameKey(enemyTelegraphHint.targetName) : "";
    return targetName || null;
  }, [enemyTelegraphHint?.targetName]);

  useEffect(() => {
    const key = enemyTelegraphHint
      ? `${enemyTelegraphHint.enemyName}|${enemyTelegraphHint.targetName}|${enemyTelegraphHint.attackStyleHint}`
      : "";

    if (!key) {
      prevTelegraphKeyRef.current = "";
      return;
    }

    if (prevTelegraphKeyRef.current && prevTelegraphKeyRef.current !== key) {
      playSfx(SFX.enemyTelegraph, 0.42);
    }

    if (!prevTelegraphKeyRef.current) {
      prevTelegraphKeyRef.current = key;
      return;
    }

    prevTelegraphKeyRef.current = key;
  }, [enemyTelegraphHint]);

  const skillChipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 11,
    lineHeight: 1.3,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  };

  const traitChipStyle: React.CSSProperties = {
    ...skillChipStyle,
    background: "rgba(120,180,255,0.10)",
    border: "1px solid rgba(120,180,255,0.22)",
  };

  const enemyRoster = useMemo<EnemyRosterCard[]>(() => {
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
  }, [derivedCombat, enemyHpById, encounterContext]);

  const activeEnemyCard = useMemo(() => {
    if (activeEnemyGroupId) {
      const byId = enemyRoster.find((e) => e.combatantId === activeEnemyGroupId);
      if (byId) return byId;
    }

    if (activeEnemyGroupName) {
      const byName = enemyRoster.find(
        (e) => nameKey(e.enemyName) === nameKey(activeEnemyGroupName)
      );
      if (byName) return byName;
    }

    return enemyRoster.find((e) => !e.defeated) ?? enemyRoster[0] ?? null;
  }, [enemyRoster, activeEnemyGroupId, activeEnemyGroupName]);

  const turnTone = useMemo(
    () =>
      renderTurnTone({
        combatEnded,
        isEnemyTurn,
        isWrongPlayerForTurn,
      }),
    [combatEnded, isEnemyTurn, isWrongPlayerForTurn]
  );

  const pressureTone = useMemo(() => renderPressureTone(pressureTier), [pressureTier]);

  const stageHero = useMemo(() => {
    const preferred =
      (activePlayerId
        ? partyMembersForDisplay.find((m) => String(m.id) === String(activePlayerId))
        : null) ??
      partyMembersForDisplay[0] ??
      null;

    if (!preferred) return null;

    const hpState = playerHpById[String(preferred.id)];
    const downed = hpState ? hpState.downed : (Number(preferred.hpCurrent) || 0) <= 0;
    const src = portraitSrcFor(preferred);

    return {
      name: preferred.name || "Hero",
      species: getResolvedSpecies(preferred),
      className: getResolvedClass(preferred),
      portrait: preferred.portrait,
      imageSrc: src,
      fallbackImageSrc: src,
      modelSrc: null,
      hpCurrent: hpState?.hpCurrent ?? preferred.hpCurrent,
      hpMax: hpState?.hpMax ?? preferred.hpMax,
      ac: preferred.ac,
      defeated: downed,
      active: !combatEnded && !isEnemyTurn,
    };
  }, [partyMembersForDisplay, activePlayerId, playerHpById, combatEnded, isEnemyTurn]);

  const stageEnemy = useMemo(() => {
    if (!activeEnemyCard) return null;

    return {
      name: activeEnemyCard.label,
      className: activeEnemyCard.roleLabel,
      imageSrc: activeEnemyCard.portraitSrc,
      fallbackImageSrc: activeEnemyCard.portraitSrc,
      modelSrc: null,
      hpCurrent: activeEnemyCard.hpCurrent,
      hpMax: activeEnemyCard.hpMax,
      ac: activeEnemyCard.ac,
      defeated: activeEnemyCard.defeated,
      active: !combatEnded && isEnemyTurn && activeEnemyCard.isActive,
    };
  }, [activeEnemyCard, combatEnded, isEnemyTurn]);

  function chooseTargetCombatantId(): string | null {
    const hintedName = enemyTelegraphHint?.targetName
      ? nameKey(enemyTelegraphHint.targetName)
      : "";
    const living = partyMembersForDisplay.filter((m) => (Number(m.hpCurrent) || 0) > 0);

    if (hintedName) {
      const byName = living.find((m) => nameKey(m.name) === hintedName);
      if (byName) return String(byName.id);

      const byContains = living.find(
        (m) => nameKey(m.name).includes(hintedName) || hintedName.includes(nameKey(m.name))
      );
      if (byContains) return String(byContains.id);
    }

    if (living.length > 0) return String(living[0].id);
    return partyMembersForDisplay.length > 0 ? String(partyMembersForDisplay[0].id) : null;
  }

  function handleEnemyCommitOutcomeAndDamage(payload: any) {
    onCommitOutcomeOnly(payload);

    if (!combatId) return;

    const rollValue = Math.trunc(Number(payload?.dice?.roll ?? 0));
    const dcValue = Math.trunc(Number(payload?.dice?.dc ?? 0));
    const hit = Number.isFinite(rollValue) && Number.isFinite(dcValue) ? rollValue >= dcValue : false;
    if (!hit) return;

    const styleFromTelegraph =
      enemyTelegraphHint?.enemyName && activeEnemyGroupName
        ? nameKey(enemyTelegraphHint.enemyName) === nameKey(activeEnemyGroupName)
          ? enemyTelegraphHint.attackStyleHint
          : null
        : null;

    const style = (styleFromTelegraph ?? inferDamageStyleFromPayload(payload)) as
      | "volley"
      | "beam"
      | "charge"
      | "unknown";

    const targetCombatantId = chooseTargetCombatantId();
    if (!targetCombatantId) return;

    const amount = computeDeterministicDamage({ roll: rollValue, dc: dcValue, style });

    onAppendCanon("COMBATANT_DAMAGED", {
      combatId,
      sourceCombatantId: String(activeEnemyGroupId ?? activeEnemyGroupName ?? "enemy"),
      targetCombatantId,
      amount,
      kind: style,
    });

    playSfx(SFX.combatHit, 0.74);

    const before = playerHpById[targetCombatantId];
    const beforeCur =
      before?.hpCurrent ??
      clampInt(
        partyMembersForDisplay.find((m) => String(m.id) === targetCombatantId)?.hpCurrent,
        0,
        999
      );

    const afterCur = Math.max(0, (Number(beforeCur) || 0) - amount);

    if (afterCur <= 0) {
      onAppendCanon("COMBATANT_DOWNED", {
        combatId,
        combatantId: targetCombatantId,
        reason: "hp_zero",
      });
      playSfx(SFX.enemyDeath, 0.76);
    }
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gap: 10,
          padding: 0,
          minHeight: 0,
          alignContent: "start",
        }}
      >
        <div
          style={{
            minHeight: 280,
            height: "clamp(280px, 42vh, 390px)",
            maxHeight: "42vh",
            minWidth: 0,
          }}
        >
          <CombatStage
            hero={stageHero}
            enemy={stageEnemy}
            battlefieldImageSrc={null}
            isEnemyTurn={isEnemyTurn}
            combatEnded={combatEnded}
            telegraphHint={
              enemyTelegraphHint
                ? {
                    attackStyleHint: enemyTelegraphHint.attackStyleHint,
                    targetName: enemyTelegraphHint.targetName,
                  }
                : null
            }
            height={360}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${turnTone.border}`,
              background: turnTone.bg,
              color: turnTone.text,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {turnTone.label}
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${pressureTone.border}`,
              background: pressureTone.bg,
              color: "rgba(235,238,244,0.92)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Pressure · {pressureTier}
          </span>

          {stageHero ? (
            <InfoPill
              label={`${stageHero.name} HP ${fmtHp(stageHero.hpCurrent ?? 0, stageHero.hpMax ?? 1)}`}
              tone="info"
            />
          ) : null}

          {stageEnemy ? (
            <InfoPill
              label={`${stageEnemy.name} HP ${fmtHp(stageEnemy.hpCurrent ?? 0, stageEnemy.hpMax ?? 1)}`}
              tone="accent"
            />
          ) : null}
        </div>

        <OpeningCombatPrompt
          round={openingCombatRound}
          canRetreat={canAttemptCombatRetreat}
          finisherAvailable={openingBattleFinisherAvailable}
          finisherSkill={openingBattleFinisherSkillLabel}
          isOpeningThresholdCombat={isOpeningThresholdCombat}
        />

        <ActionSection
          partyMembers={actionSurface.partyMembers}
          actingPlayerId={actionSurface.actingPlayerId}
          onSetActingPlayerId={actionSurface.onSetActingPlayerId}
          playerInput={actionSurface.playerInput}
          onSetPlayerInput={actionSurface.onSetPlayerInput}
          canSubmit={actionSurface.canSubmit}
          onSubmit={actionSurface.onSubmit}
          combatActive={true}
          passDisabled={(dmMode === "solace-neutral" && isEnemyTurn) || isWrongPlayerForTurn}
          onPassTurn={actionSurface.onPassTurn}
          dmMode={actionSurface.dmMode}
          isEnemyTurn={isEnemyTurn}
          isWrongPlayerForTurn={isWrongPlayerForTurn}
          activeTurnLabel={
            String(activeCombatantSpec?.name ?? activeCombatantSpec?.id ?? "") || null
          }
          showPartyButtons={false}
          commitDisabled
          title={actionSurface.title ?? "Combat Command"}
          eyebrow={actionSurface.eyebrow ?? "Command"}
          description={
            actionSurface.description ??
            "Describe what your character actually does. This command is the move."
          }
          inputPlaceholder={
            actionSurface.inputPlaceholder ??
            "Describe your move in full: target, movement, tactic, and intent..."
          }
          showTurnCards
          showLoadoutDetails
        />

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: "rgba(228,232,240,0.74)",
            }}
          >
            Turn flow controls stay here. Everything else is tucked below.
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                if (!derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn)) {
                  return;
                }
                playSfx(SFX.combatAdvance, 0.64);
                onAdvanceTurnBtn();
              }}
              disabled={
                !derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn)
              }
              style={{
                ...actionButtonStyle("secondary"),
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Advance Turn
            </button>

            <button
              onClick={() => {
                if (
                  !derivedCombat ||
                  combatEnded ||
                  (dmMode === "solace-neutral" && isEnemyTurn) ||
                  isWrongPlayerForTurn
                ) {
                  return;
                }
                playSfx(SFX.uiClick, 0.64);
                onPassTurnBtn();
              }}
              disabled={
                !derivedCombat ||
                combatEnded ||
                (dmMode === "solace-neutral" && isEnemyTurn) ||
                isWrongPlayerForTurn
              }
              style={{
                ...actionButtonStyle("secondary"),
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              End My Turn
            </button>

            <button
              onClick={() => {
                if (!derivedCombat || combatEnded) return;
                playSfx(SFX.uiClick, 0.66);
                onEndCombatBtn();
              }}
              disabled={!derivedCombat || combatEnded}
              style={{
                ...actionButtonStyle("warn"),
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              End Combat
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            padding: "14px",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
          }}
        >
          <div style={{ display: "grid", gap: 5 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Adjudication
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "rgba(228,232,240,0.78)",
              }}
            >
              Resolve the typed command here in combat. Choose the best interpretation, then use
              the real fate panel below.
            </div>
          </div>

          {actionSurface.options && actionSurface.options.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Resolution Paths
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {actionSurface.options.map((opt, idx) => {
                  const active = actionSurface.selectedOption?.id
                    ? actionSurface.selectedOption?.id === opt?.id
                    : actionSurface.selectedOption === opt;

                  return (
                    <button
                      key={optionId(opt, idx)}
                      type="button"
                      onClick={() => {
                        playSfx(SFX.uiClick, 0.58);
                        actionSurface.onSetSelectedOption(opt);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "13px 14px",
                        borderRadius: 14,
                        border: active
                          ? "1px solid rgba(214,188,120,0.28)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: active
                          ? "linear-gradient(180deg, rgba(214,188,120,0.10), rgba(255,255,255,0.03))"
                          : "rgba(255,255,255,0.03)",
                        color: "inherit",
                        cursor: "pointer",
                        lineHeight: 1.55,
                        fontWeight: active ? 800 : 600,
                      }}
                    >
                      {optionDescription(opt)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "rgba(228,232,240,0.72)",
              }}
            >
              {actionSurface.playerInput.trim().length > 0
                ? "Click Resolve Action above and the combat interpretations will appear here."
                : "Type your command above to begin the combat adjudication loop."}
            </div>
          )}

          {actionSurface.selectedOption ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Roll Fate
              </div>

              <ResolutionDraftAdvisoryPanel
                context={{
                  optionDescription: actionSurface.selectedOption.description,
                  optionKind: inferOptionKind(
                    `${actionSurface.playerInput}\n${actionSurface.selectedOption.description}`.trim()
                  ),
                }}
                role={actionSurface.role as any}
                dmMode={actionSurface.resolutionDmMode as any}
                setupText={`${actionSurface.playerInput}\n\nCurrent Room: ${actionSurface.currentRoomTitle}\n\n${actionSurface.roomSummary}`}
                movement={actionSurface.resolutionMovement}
                combat={
                  actionSurface.resolutionCombat
                    ? {
                        ...actionSurface.resolutionCombat,
                        attackStyleHint:
                          actionSurface.resolutionCombat.attackStyleHint ?? undefined,
                      }
                    : null
                }
                rollModifier={actionSurface.actingRollModifier}
                rollModifierLabel={
                  (actionSurface.actingPlayerInjuryStacks ?? 0) > 0
                    ? `Injury stacks: ${actionSurface.actingPlayerInjuryStacks}`
                    : null
                }
                onRecord={actionSurface.onRecord}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.uiClick, 0.56);
                    actionSurface.onSetSelectedOption(null);
                  }}
                  style={{
                    ...actionButtonStyle("secondary"),
                    padding: "9px 12px",
                    borderRadius: 12,
                    fontWeight: 800,
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {(encounterContext?.objective ||
          encounterContext?.rewardHint ||
          encounterContext?.zoneTheme ||
          encounterContext?.lockState) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {encounterContext?.zoneTheme ? (
              <InfoPill
                label={`Theme: ${titleCase(String(encounterContext.zoneTheme))}`}
                tone="info"
              />
            ) : null}

            {encounterContext?.lockState ? (
              <InfoPill label={`Lock: ${encounterContext.lockState}`} tone="warn" />
            ) : null}

            {encounterContext?.rewardHint ? (
              <InfoPill label={`Reward: ${encounterContext.rewardHint}`} tone="accent" />
            ) : null}

            {encounterContext?.objective ? (
              <InfoPill label={`Objective: ${encounterContext.objective}`} tone="neutral" />
            ) : null}
          </div>
        )}
      </div>

      <CardSection title="Supporting Systems">
        <div style={{ display: "grid", gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowSupportingSystems((prev) => !prev)}
            style={{
              justifySelf: "start",
              ...actionButtonStyle(showSupportingSystems ? "warn" : "secondary"),
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {showSupportingSystems ? "Hide Supporting Systems" : "Show Supporting Systems"}
          </button>

          {!showSupportingSystems ? (
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.55,
                color: "rgba(228,232,240,0.66)",
              }}
            >
              Party panels, enemy roster, resolver details, and inspector tools stay collapsed so the
              battlefield remains primary.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {partyMembersForDisplay.length > 0 && (
                <CardSection title="Your Side">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {partyMembersForDisplay.map((m) => {
                      const src = portraitSrcFor(m);
                      const healer = isHealerCapable(m.className);

                      const hpState = playerHpById[String(m.id)];
                      const downed = hpState ? hpState.downed : (Number(m.hpCurrent) || 0) <= 0;

                      const pct = hpPercent(m.hpCurrent, m.hpMax);

                      const isActiveTurnOwner =
                        !!activePlayerId && String(activePlayerId) === String(m.id);
                      const isTelegraphTarget =
                        !!telegraphTargetKey &&
                        telegraphTargetKey.length > 0 &&
                        nameKey(m.name) === telegraphTargetKey;

                      const border = downed
                        ? "1px solid rgba(255,120,120,0.28)"
                        : isActiveTurnOwner
                          ? "1px solid rgba(214,188,120,0.40)"
                          : isTelegraphTarget
                            ? "1px solid rgba(255,255,255,0.18)"
                            : "1px solid rgba(255,255,255,0.12)";

                      const background = downed
                        ? "rgba(255,120,120,0.06)"
                        : isActiveTurnOwner
                          ? "rgba(214,188,120,0.08)"
                          : isTelegraphTarget
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(255,255,255,0.04)";

                      const boxShadow = isActiveTurnOwner
                        ? "0 14px 34px rgba(0,0,0,0.28)"
                        : "0 10px 26px rgba(0,0,0,0.22)";

                      const skillLabels = (Array.isArray(m.skills) ? m.skills : [])
                        .map((id) => getSkillDefinition(id)?.label ?? id)
                        .filter(Boolean);

                      const traitLabels = (Array.isArray(m.traits) ? m.traits : [])
                        .map((id) => getSpeciesTraitDefinition(id)?.label ?? id)
                        .filter(Boolean);

                      const resolvedSpecies = getResolvedSpecies(m);
                      const resolvedClass = getResolvedClass(m);

                      return (
                        <div
                          key={m.id}
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                            padding: "12px 12px",
                            borderRadius: 12,
                            border,
                            background,
                            boxShadow,
                            opacity: downed ? 0.72 : 1,
                          }}
                        >
                          {isActiveTurnOwner && (
                            <div
                              style={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                padding: "4px 8px",
                                borderRadius: 999,
                                border: "1px solid rgba(214,188,120,0.45)",
                                background: "rgba(214,188,120,0.12)",
                                fontSize: 11,
                                letterSpacing: 0.6,
                                textTransform: "uppercase",
                                opacity: 0.98,
                                userSelect: "none",
                              }}
                            >
                              Active Turn
                            </div>
                          )}

                          {healer && (
                            <div
                              title="Healer-capable"
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                width: 24,
                                height: 24,
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.18)",
                                background: "rgba(255,255,255,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                lineHeight: 1,
                                opacity: 0.95,
                                userSelect: "none",
                              }}
                            >
                              ✚
                            </div>
                          )}

                          {downed && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: 10,
                                right: 10,
                                padding: "4px 8px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,120,120,0.35)",
                                background: "rgba(255,120,120,0.10)",
                                fontSize: 11,
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                                opacity: 0.95,
                              }}
                            >
                              Downed
                            </div>
                          )}

                          {isEnemyTurn && isTelegraphTarget && !downed && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: 10,
                                left: 10,
                                padding: "4px 8px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.18)",
                                background: "rgba(0,0,0,0.26)",
                                fontSize: 11,
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                                opacity: 0.95,
                              }}
                            >
                              Targeted
                            </div>
                          )}

                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: 14,
                              overflow: "hidden",
                              border: isActiveTurnOwner
                                ? "1px solid rgba(214,188,120,0.45)"
                                : "1px solid rgba(255,255,255,0.16)",
                              background: "rgba(0,0,0,0.28)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              marginTop: isActiveTurnOwner ? 24 : 0,
                            }}
                            title={`${resolvedSpecies} ${resolvedClass} ${m.portrait}`}
                          >
                            <img
                              src={src}
                              alt={`${resolvedSpecies} ${resolvedClass} ${m.portrait}`}
                              width={64}
                              height={64}
                              style={{
                                width: 64,
                                height: 64,
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                const el = e.currentTarget;
                                el.onerror = null;
                                el.src = getPortraitPath(
                                  "Human",
                                  "Warrior",
                                  m.portrait === "Female" ? "Female" : "Male"
                                );
                              }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <strong style={{ fontSize: 15, lineHeight: 1.2 }}>
                                {m.name || "Unnamed"}
                              </strong>
                              <span className="muted" style={{ fontSize: 12 }}>
                                AC {Number(m.ac) || 0} · init{" "}
                                {m.initiativeMod >= 0 ? `+${m.initiativeMod}` : m.initiativeMod}
                              </span>
                            </div>

                            <div style={{ marginTop: 8 }}>
                              <div
                                style={{
                                  height: 7,
                                  borderRadius: 999,
                                  background: "rgba(0,0,0,0.36)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  overflow: "hidden",
                                }}
                                aria-label={`HP ${fmtHp(m.hpCurrent, m.hpMax)}`}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${Math.round(pct * 100)}%`,
                                    background: downed
                                      ? "rgba(255,120,120,0.65)"
                                      : "rgba(160,220,255,0.55)",
                                    boxShadow: downed
                                      ? "none"
                                      : "0 0 12px rgba(160,220,255,0.22)",
                                  }}
                                />
                              </div>

                              <div
                                className="muted"
                                style={{
                                  marginTop: 6,
                                  fontSize: 12,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 10,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span>
                                  HP <strong>{fmtHp(m.hpCurrent, m.hpMax)}</strong>
                                </span>
                                <span>
                                  <strong>{resolvedSpecies}</strong> · <strong>{resolvedClass}</strong>
                                </span>
                              </div>
                            </div>

                            {(skillLabels.length > 0 || traitLabels.length > 0) && (
                              <div
                                style={{
                                  marginTop: 8,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                {skillLabels.length > 0 && (
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {skillLabels.map((label, idx) => (
                                      <span key={`${m.id}_skill_${label}_${idx}`} style={skillChipStyle}>
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {traitLabels.length > 0 && (
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {traitLabels.map((label, idx) => (
                                      <span key={`${m.id}_trait_${label}_${idx}`} style={traitChipStyle}>
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardSection>
              )}

              {enemyRoster.length > 0 && (
                <CardSection title="Enemy Roster">
                  <div style={{ display: "grid", gap: 10 }}>
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                      Track the enemy line here. Focus on who is still standing and whose turn is active.
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {enemyRoster.map((enemy) => {
                        const pct = hpPercent(enemy.hpCurrent, enemy.hpMax);
                        const border = enemy.defeated
                          ? "1px solid rgba(255,120,120,0.28)"
                          : enemy.isActive
                            ? "1px solid rgba(214,188,120,0.45)"
                            : "1px solid rgba(255,255,255,0.10)";
                        const background = enemy.defeated
                          ? "rgba(255,120,120,0.06)"
                          : enemy.isActive
                            ? "rgba(214,188,120,0.08)"
                            : "rgba(255,255,255,0.04)";

                        return (
                          <div
                            key={enemy.combatantId}
                            style={{
                              position: "relative",
                              display: "flex",
                              gap: 12,
                              alignItems: "flex-start",
                              padding: "12px",
                              borderRadius: 14,
                              border,
                              background,
                              opacity: enemy.defeated ? 0.72 : 1,
                            }}
                          >
                            {enemy.isActive && !enemy.defeated && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 10,
                                  left: 10,
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  border: "1px solid rgba(214,188,120,0.45)",
                                  background: "rgba(214,188,120,0.12)",
                                  fontSize: 11,
                                  letterSpacing: 0.5,
                                  textTransform: "uppercase",
                                }}
                              >
                                Active
                              </div>
                            )}

                            {enemy.defeated && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 10,
                                  right: 10,
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  border: "1px solid rgba(255,120,120,0.35)",
                                  background: "rgba(255,120,120,0.10)",
                                  fontSize: 11,
                                  letterSpacing: 0.5,
                                  textTransform: "uppercase",
                                }}
                              >
                                Defeated
                              </div>
                            )}

                            <div
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 14,
                                overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.14)",
                                background: "rgba(0,0,0,0.24)",
                                flexShrink: 0,
                                marginTop: enemy.isActive && !enemy.defeated ? 24 : 0,
                              }}
                            >
                              <img
                                src={enemy.portraitSrc}
                                alt={enemy.enemyName}
                                width={64}
                                height={64}
                                style={{
                                  width: 64,
                                  height: 64,
                                  objectFit: "cover",
                                  display: "block",
                                }}
                                onError={(e) => {
                                  const el = e.currentTarget;
                                  el.onerror = null;
                                  el.src = "/assets/V2/Enemy/Enemy_Bandit_Warrior.png";
                                }}
                              />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  flexWrap: "wrap",
                                  alignItems: "baseline",
                                }}
                              >
                                <strong style={{ fontSize: 15 }}>{enemy.label}</strong>
                                <span className="muted" style={{ fontSize: 12 }}>
                                  AC {enemy.ac} · init{" "}
                                  {enemy.initiativeMod >= 0
                                    ? `+${enemy.initiativeMod}`
                                    : enemy.initiativeMod}
                                </span>
                              </div>

                              <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                                {enemy.roleLabel} · {enemy.factionLabel}
                              </div>

                              <div style={{ marginTop: 8 }}>
                                <div
                                  style={{
                                    height: 7,
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,0.36)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                    overflow: "hidden",
                                  }}
                                  aria-label={`Enemy HP ${fmtHp(enemy.hpCurrent, enemy.hpMax)}`}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${Math.round(pct * 100)}%`,
                                      background: enemy.defeated
                                        ? "rgba(255,120,120,0.65)"
                                        : "rgba(255,196,118,0.58)",
                                      boxShadow: enemy.defeated
                                        ? "none"
                                        : "0 0 12px rgba(255,196,118,0.18)",
                                    }}
                                  />
                                </div>

                                <div
                                  className="muted"
                                  style={{
                                    marginTop: 6,
                                    fontSize: 12,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span>
                                    HP <strong>{fmtHp(enemy.hpCurrent, enemy.hpMax)}</strong>
                                  </span>
                                  <span>{enemy.combatantId}</span>
                                </div>
                              </div>

                              {(enemy.isKeybearer || enemy.isRelicBearer || enemy.isCacheGuard) && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                                  {enemy.isKeybearer ? (
                                    <InfoPill label="Keybearer" tone="warn" />
                                  ) : null}
                                  {enemy.isRelicBearer ? (
                                    <InfoPill label="Relic Bearer" tone="accent" />
                                  ) : null}
                                  {enemy.isCacheGuard ? (
                                    <InfoPill label="Guards Cache" tone="info" />
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardSection>
              )}

              {showEnemyResolver && (
                <CardSection title="Enemy Turn">
                  <div style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "rgba(228,232,240,0.78)",
                      }}
                    >
                      Solace is resolving the enemy action. Watch the telegraph and damage outcome here.
                    </div>

                    <EnemyTurnResolverPanel
                      enabled={true}
                      activeEnemyGroupName={activeEnemyGroupName ?? ""}
                      activeEnemyGroupId={activeEnemyGroupId ?? ""}
                      playerNames={playerNames}
                      onTelegraph={(info) => {
                        playSfx(SFX.enemyTelegraph, 0.42);
                        onTelegraph(info);
                      }}
                      onCommitOutcome={handleEnemyCommitOutcomeAndDamage}
                      onAdvanceTurn={onAdvanceTurn}
                    />

                    {enemyTelegraphHint ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        Telegraph hint: <strong>{enemyTelegraphHint.attackStyleHint}</strong> · Target{" "}
                        <strong>{enemyTelegraphHint.targetName}</strong>
                      </div>
                    ) : null}
                  </div>
                </CardSection>
              )}

              <CardSection title="Combat Inspector">
                <div style={{ display: "grid", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowInspector((prev) => !prev)}
                    style={{
                      justifySelf: "start",
                      ...actionButtonStyle(showInspector ? "warn" : "secondary"),
                      padding: "8px 12px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {showInspector ? "Hide Combat Inspector" : "Show Combat Inspector"}
                  </button>

                  {!showInspector ? (
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: 1.55,
                        color: "rgba(228,232,240,0.66)",
                      }}
                    >
                      Setup logic, derived order internals, and workshop surfaces are hidden by default so
                      the battlefield reads like a game instead of a tool.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                      <CombatSetupPanel
                        events={events as any[]}
                        onAppendCanon={onAppendCanon}
                        dmMode={dmMode as any}
                        partyMembers={partyMembers as any}
                        pressureTier={pressureTier as any}
                        allowDevControls={allowDevControls}
                        encounterContext={encounterContext}
                      />

                      {derivedCombat && (
                        <CardSection title="Derived Turn Order">
                          <div className="muted">
                            Combat: <strong>{derivedCombat.combatId}</strong> · Round{" "}
                            <strong>{derivedCombat.round}</strong>
                            {activeCombatantSpec && (
                              <>
                                {" "}
                                · Active: <strong>{formatCombatantLabel(activeCombatantSpec)}</strong>
                              </>
                            )}
                          </div>

                          <div
                            style={{
                              marginTop: 10,
                              display: "grid",
                              gridTemplateColumns: "1fr",
                              gap: 6,
                            }}
                          >
                            {derivedCombat.order.map((id: string, idx: number) => {
                              const spec =
                                derivedCombat.participants.find((p: any) => p.id === id) ?? null;
                              const roll =
                                derivedCombat.initiative.find((r: any) => r.combatantId === id) ?? null;
                              const active = derivedCombat.activeCombatantId === id;
                              const isEnemy = String(spec?.kind ?? "") === "enemy_group";
                              const isPlayer = String(spec?.kind ?? "") === "player";

                              const enemyHp = isEnemy ? enemyHpById[String(id)] : null;
                              const playerHp = isPlayer ? playerHpById[String(id)] : null;
                              const defeated = Boolean(enemyHp?.downed || playerHp?.downed);

                              return (
                                <div
                                  key={id}
                                  style={{
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    border: defeated
                                      ? "1px solid rgba(255,120,120,0.28)"
                                      : active
                                        ? "1px solid rgba(138,180,255,0.55)"
                                        : "1px solid rgba(255,255,255,0.10)",
                                    background: defeated
                                      ? "rgba(255,120,120,0.06)"
                                      : active
                                        ? "rgba(138,180,255,0.10)"
                                        : "rgba(255,255,255,0.04)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 10,
                                    opacity: defeated ? 0.68 : 1,
                                  }}
                                >
                                  <div>
                                    <strong>
                                      {idx + 1}. {spec ? formatCombatantLabel(spec) : id}
                                    </strong>
                                    {active && !defeated && <span className="muted">{"  "}← active</span>}
                                    {defeated && <span className="muted">{"  "}· defeated</span>}
                                  </div>
                                  <div className="muted">
                                    {roll
                                      ? `Init ${roll.total} (d20 ${roll.natural} + ${roll.modifier})`
                                      : "Init —"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardSection>
                      )}
                    </div>
                  )}
                </div>
              </CardSection>
            </div>
          )}
        </div>
      </CardSection>
    </>
  );
}
