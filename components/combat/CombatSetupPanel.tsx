"use client";

import { useEffect, useMemo, useState } from "react";
import CardSection from "@/components/layout/CardSection";

import {
  CombatStartedPayload,
  CombatantSpec,
  deriveCombatState,
  findLatestCombatId,
  formatCombatantLabel,
  generateDeterministicInitiativeRolls,
  nextTurnPointer,
} from "@/lib/combat/CombatState";

import {
  ENEMY_LIST,
  EnemyDefinition,
  EnemyEncounterTheme,
  getEnemyDefinitionByName,
} from "@/lib/game/EnemyDatabase";

type PartyMemberLite = {
  id: string;
  name: string;
  species?: string;
  className?: string;
  portrait?: "Male" | "Female";
  skills?: string[];
  traits?: string[];
  initiativeMod: number;
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

type Props = {
  events: readonly any[];
  onAppendCanon: (type: string, payload: any) => void;
  dmMode: "human" | "solace-neutral";
  partyMembers: PartyMemberLite[];
  pressureTier: any;
  allowDevControls: boolean;
  encounterContext?: CombatEncounterContext | null;
};

type PartyRoleInfo = {
  healers: number;
  casters: number;
  frontliners: number;
  stealthy: number;
};

type PressureBand = "low" | "medium" | "high" | "extreme";

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

function normalizeName(s: string) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function normalizeClassKey(v: string) {
  return String(v ?? "").trim().toLowerCase();
}

function computeCombatLocked(events: readonly any[]) {
  let lastStarted = -1;
  let lastEnded = -1;

  for (let i = 0; i < events.length; i++) {
    const t = events[i]?.type;
    if (t === "COMBAT_STARTED") lastStarted = i;
    if (t === "COMBAT_ENDED") lastEnded = i;
  }

  return lastStarted !== -1 && lastStarted > lastEnded;
}

function chipStyle(tone: "neutral" | "info" | "warn" | "accent" = "neutral"): React.CSSProperties {
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

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "warn" | "accent";
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        lineHeight: 1,
        ...chipStyle(tone),
      }}
    >
      {children}
    </span>
  );
}

function selectStyle(disabled?: boolean): React.CSSProperties {
  return {
    minWidth: 160,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: disabled ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.28)",
    color: "inherit",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  };
}

function buttonStyle(
  tone: "primary" | "ghost" | "danger",
  disabled?: boolean
): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    userSelect: "none",
    transition: "transform 120ms ease, background 140ms ease, border-color 140ms ease",
  };

  if (tone === "primary") {
    return {
      ...base,
      border: "1px solid rgba(138,180,255,0.28)",
      background: "linear-gradient(180deg, rgba(138,180,255,0.14), rgba(138,180,255,0.06))",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 22px rgba(0,0,0,0.22)",
    };
  }

  if (tone === "danger") {
    return {
      ...base,
      border: "1px solid rgba(255,120,120,0.24)",
      background: "linear-gradient(180deg, rgba(255,120,120,0.14), rgba(255,120,120,0.06))",
    };
  }

  return { ...base, background: "rgba(255,255,255,0.04)" };
}

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pressureBandFromTier(pressureTier: any): PressureBand {
  const t = String(pressureTier ?? "").toLowerCase();
  if (t.includes("extreme") || t.includes("tier_4") || t === "4") return "extreme";
  if (t.includes("high") || t.includes("tier_3") || t === "3") return "high";
  if (t.includes("med") || t.includes("tier_2") || t === "2") return "medium";
  return "low";
}

function inferEnemyInitModFromPressure(pressureTier: any): number {
  const band = pressureBandFromTier(pressureTier);
  if (band === "low") return 0;
  if (band === "medium") return 1;
  if (band === "high") return 2;
  return 3;
}

function getEnemyPortraitSrc(enemy: EnemyDefinition): string {
  return `/assets/V2/Enemy/${enemy.portraitKey}.png`;
}

function prettyRole(v: string) {
  return String(v ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function prettyFaction(v: string) {
  return prettyRole(v);
}

function prettyTheme(v?: string | null) {
  if (!v) return "Unknown";
  return String(v)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildEnemyRoleFactionLabel(enemy: EnemyDefinition) {
  const roleLabel = prettyRole(enemy.role);
  const factionLabel = prettyFaction(enemy.faction);
  if (roleLabel.trim().toLowerCase() === factionLabel.trim().toLowerCase()) return roleLabel;
  return `${roleLabel} · ${factionLabel}`;
}

function classifyPartyRoles(partyMembers: PartyMemberLite[]) {
  let healers = 0;
  let casters = 0;
  let frontliners = 0;
  let stealthy = 0;

  for (const m of partyMembers) {
    const k = normalizeClassKey(m.className ?? "");

    if (k === "cleric" || k === "paladin" || k === "druid" || k === "bard" || k === "artificer") {
      healers += 1;
    }

    if (k === "mage" || k === "sorcerer" || k === "warlock" || k === "cleric" || k === "druid") {
      casters += 1;
    }

    if (k === "warrior" || k === "barbarian" || k === "paladin" || k === "monk") {
      frontliners += 1;
    }

    if (k === "rogue" || k === "ranger" || k === "bard") {
      stealthy += 1;
    }
  }

  return { healers, casters, frontliners, stealthy };
}

function sortEnemyLibrary(a: EnemyDefinition, b: EnemyDefinition) {
  if (a.pressureBand !== b.pressureBand) return a.pressureBand.localeCompare(b.pressureBand);
  if (a.tier !== b.tier) return a.tier.localeCompare(b.tier);
  return a.name.localeCompare(b.name);
}

function pickUniqueDeterministic<T>(items: T[], count: number, seed: string): T[] {
  const arr = items.slice();
  const out: T[] = [];
  let salt = 0;

  while (arr.length > 0 && out.length < count) {
    const idx = hash32(`${seed}::${salt}`) % arr.length;
    out.push(arr[idx]);
    arr.splice(idx, 1);
    salt += 1;
  }

  return out;
}

function repeatDeterministic<T>(items: T[], count: number, seed: string): T[] {
  if (items.length === 0 || count <= 0) return [];
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const idx = hash32(`${seed}::repeat::${i}`) % items.length;
    out.push(items[idx]);
  }
  return out;
}

function namesToDefs(names: string[]): EnemyDefinition[] {
  return names
    .map((name) => getEnemyDefinitionByName(name))
    .filter((e): e is EnemyDefinition => !!e);
}

function getBasePoolForPressure(band: PressureBand): EnemyDefinition[] {
  const namesByBand: Record<PressureBand, string[]> = {
    low: [
      "Bandit Archer",
      "Bandit Warrior",
      "Goblin Archer",
      "Goblin Skirmisher",
      "Zombie",
      "Wolf",
    ],
    medium: [
      "Bandit Rogue",
      "Bandit Captain",
      "Hobgoblin Soldier",
      "Orc Raider",
      "Skeleton Warrior",
      "Skeleton Archer",
      "Cultist Acolyte",
      "Giant Spider",
      "Dire Wolf",
    ],
    high: [
      "Orc Warlord",
      "Ghoul",
      "Wraith",
      "Cult Assassin",
      "Cult Knight",
      "Cult Priest",
      "Arcane Sentinel",
      "Hellhound",
      "Stone Golem",
    ],
    extreme: [
      "Ancient Warden",
      "Void Horror",
      "Iron Guardian",
      "Wraith",
      "Cult Priest",
      "Arcane Sentinel",
    ],
  };

  return namesToDefs(namesByBand[band]);
}

function dedupeEnemies(items: EnemyDefinition[]): EnemyDefinition[] {
  const seen = new Set<string>();
  const out: EnemyDefinition[] = [];

  for (const e of items) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }

  return out;
}

function filterByRole(items: EnemyDefinition[], roles: string[]): EnemyDefinition[] {
  const roleSet = new Set(roles.map((r) => String(r).toLowerCase()));
  return items.filter((e) => roleSet.has(String(e.role).toLowerCase()));
}

function filterByBehavior(
  items: EnemyDefinition[],
  predicate: (enemy: EnemyDefinition) => boolean
): EnemyDefinition[] {
  return items.filter(predicate);
}

function filterByEncounterTheme(
  items: EnemyDefinition[],
  zoneTheme?: EnemyEncounterTheme | null
): EnemyDefinition[] {
  if (!zoneTheme) return [];
  return items.filter((enemy) => {
    const themes = enemy.ecology?.preferredThemes;
    return Array.isArray(themes) && themes.includes(zoneTheme);
  });
}

function getAdaptiveCandidates(band: PressureBand, partyRoleInfo: PartyRoleInfo): EnemyDefinition[] {
  const base = getBasePoolForPressure(band);

  const rangedPressure = filterByRole(base, ["archer", "caster", "support", "controller"]);
  const antiBackline = filterByBehavior(
    base,
    (e) =>
      !!e.behavior.prefersBackline ||
      !!e.behavior.prefersWeakTargets ||
      e.role === "assassin" ||
      e.role === "skirmisher"
  );
  const supportPunish = filterByRole(base, ["support", "soldier", "controller", "caster"]);
  const stealthResponse = filterByBehavior(
    base,
    (e) => e.role === "beast" || e.role === "skirmisher" || !!e.behavior.prefersWeakTargets
  );

  const extras: EnemyDefinition[] = [];

  if (partyRoleInfo.frontliners >= 2) extras.push(...rangedPressure);
  if (partyRoleInfo.casters >= 2) extras.push(...antiBackline);
  if (partyRoleInfo.healers >= 1) extras.push(...supportPunish);
  if (partyRoleInfo.stealthy >= 2) extras.push(...stealthResponse);

  return dedupeEnemies([...base, ...extras]);
}

function buildRecommendedEnemyRoster(
  pressureTier: any,
  partySize: number,
  seed: string,
  partyRoleInfo: PartyRoleInfo,
  zoneTheme?: EnemyEncounterTheme | null
): EnemyDefinition[] {
  const n = clampInt(partySize, 0, 6);
  if (n <= 0) return [];

  const band = pressureBandFromTier(pressureTier);
  const basePool = getBasePoolForPressure(band);
  const adaptivePool = getAdaptiveCandidates(band, partyRoleInfo);
  const themedPool = dedupeEnemies([
    ...filterByEncounterTheme(adaptivePool, zoneTheme),
    ...filterByEncounterTheme(basePool, zoneTheme),
  ]);

  const primaryPool = themedPool.length > 0 ? themedPool : adaptivePool;

  const pickedAdaptive = pickUniqueDeterministic(
    primaryPool,
    Math.min(n, primaryPool.length),
    `${seed}::adaptive`
  );

  if (pickedAdaptive.length >= n) {
    return pickedAdaptive.slice(0, n);
  }

  const remainingNeeded = n - pickedAdaptive.length;
  const remainingBase = adaptivePool.filter((e) => !pickedAdaptive.some((x) => x.id === e.id));

  const uniqueFill = pickUniqueDeterministic(
    remainingBase,
    Math.min(remainingNeeded, remainingBase.length),
    `${seed}::base_unique`
  );

  if (pickedAdaptive.length + uniqueFill.length >= n) {
    return [...pickedAdaptive, ...uniqueFill].slice(0, n);
  }

  const stillNeeded = n - pickedAdaptive.length - uniqueFill.length;
  const repeatPool =
    primaryPool.length > 0 ? primaryPool : basePool.length > 0 ? basePool : adaptivePool;
  const repeatFill = repeatDeterministic(repeatPool, stillNeeded, `${seed}::base_repeat`);

  return [...pickedAdaptive, ...uniqueFill, ...repeatFill].slice(0, n);
}

function nextEnemyInstanceIndex(enemyName: string, existing: EnemyDefinition[]) {
  const key = normalizeName(enemyName).toLowerCase();
  let count = 0;
  for (const e of existing) {
    if (normalizeName(e.name).toLowerCase() === key) count += 1;
  }
  return count + 1;
}

function buildEnemyCardLabel(enemy: EnemyDefinition, all: EnemyDefinition[]) {
  const idx = nextEnemyInstanceIndex(
    enemy.name,
    all.filter((e) => e.id === enemy.id || e.name === enemy.name)
  );
  const total = all.filter((e) => e.name === enemy.name).length;
  if (total <= 1) return enemy.name;

  let seen = 0;
  for (const e of all) {
    if (e.name !== enemy.name) continue;
    seen += 1;
    if (e === enemy) return `${enemy.name} #${seen}`;
  }

  return `${enemy.name} #${idx}`;
}

function enemyMatchesName(enemy: EnemyDefinition, name?: string | null) {
  if (!name) return false;
  return normalizeName(enemy.name).toLowerCase() === normalizeName(name).toLowerCase();
}

function SectionShell(props: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            opacity: 0.58,
          }}
        >
          {props.title}
        </div>
        {props.hint ? (
          <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(228,232,240,0.74)" }}>
            {props.hint}
          </div>
        ) : null}
      </div>
      {props.children}
    </div>
  );
}

function EnemyCard({
  enemy,
  label,
  initMod,
  stateLabel,
  isKeybearer,
  isRelicBearer,
  isCacheGuard,
}: {
  enemy: EnemyDefinition;
  label: string;
  initMod: number;
  stateLabel: string;
  isKeybearer?: boolean;
  isRelicBearer?: boolean;
  isCacheGuard?: boolean;
}) {
  const src = getEnemyPortraitSrc(enemy);
  const roleFactionLabel = buildEnemyRoleFactionLabel(enemy);
  const dutyLabel = enemy.ecology?.duty ? prettyRole(enemy.ecology.duty) : null;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.22)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        minWidth: 220,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
          flex: "0 0 auto",
        }}
      >
        <img
          src={src}
          alt={enemy.name}
          width={52}
          height={52}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => {
            const el = e.currentTarget;
            el.onerror = null;
            el.src = "/assets/V2/Enemy/Enemy_Bandit_Warrior.png";
          }}
        />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </strong>
        </div>

        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {roleFactionLabel} · init mod {initMod >= 0 ? `+${initMod}` : `${initMod}`}
        </div>

        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          HP {enemy.defenses.hp}/{enemy.defenses.hp} · AC {enemy.defenses.ac} · {stateLabel}
        </div>

        {(dutyLabel || isKeybearer || isRelicBearer || isCacheGuard) ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {dutyLabel ? (
              <span
                style={{
                  ...chipStyle("neutral"),
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 7px",
                  borderRadius: 999,
                  fontSize: 10,
                  lineHeight: 1,
                }}
              >
                {dutyLabel}
              </span>
            ) : null}

            {isKeybearer ? (
              <span
                style={{
                  ...chipStyle("warn"),
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 7px",
                  borderRadius: 999,
                  fontSize: 10,
                  lineHeight: 1,
                }}
              >
                Keybearer
              </span>
            ) : null}

            {isRelicBearer ? (
              <span
                style={{
                  ...chipStyle("accent"),
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 7px",
                  borderRadius: 999,
                  fontSize: 10,
                  lineHeight: 1,
                }}
              >
                Relic Bearer
              </span>
            ) : null}

            {isCacheGuard ? (
              <span
                style={{
                  ...chipStyle("info"),
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 7px",
                  borderRadius: 999,
                  fontSize: 10,
                  lineHeight: 1,
                }}
              >
                Guards Cache
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CombatSetupPanel({
  events,
  onAppendCanon,
  dmMode,
  partyMembers,
  pressureTier,
  allowDevControls,
  encounterContext = null,
}: Props) {
  const locked = useMemo(() => computeCombatLocked(events), [events]);
  const isHuman = dmMode === "human";
  const canEdit = !locked && (isHuman || allowDevControls);
  const showBuilderControls = isHuman || allowDevControls;

  const INIT_MODS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
  const ENEMY_LIBRARY = useMemo(() => ENEMY_LIST.slice().sort(sortEnemyLibrary), []);

  const partySize = useMemo(() => clampInt(partyMembers?.length ?? 0, 0, 6), [partyMembers]);
  const partyRoleInfo = useMemo(() => classifyPartyRoles(partyMembers ?? []), [partyMembers]);

  const pressureSeed = useMemo(() => {
    const outcomes = (events as any[]).filter((e) => e?.type === "OUTCOME").length;
    const zoneTheme = encounterContext?.zoneTheme ?? "none";
    const objective = normalizeName(encounterContext?.objective ?? "") || "none";
    const rewardHint = normalizeName(encounterContext?.rewardHint ?? "") || "none";
    return `pressure=${String(pressureTier ?? "unknown")}::outcomes=${outcomes}::party=${partySize}::theme=${zoneTheme}::objective=${objective}::reward=${rewardHint}`;
  }, [
    events,
    partySize,
    pressureTier,
    encounterContext?.zoneTheme,
    encounterContext?.objective,
    encounterContext?.rewardHint,
  ]);

  const [selectedEnemies, setSelectedEnemies] = useState<EnemyDefinition[]>(() =>
    buildRecommendedEnemyRoster(
      "low",
      2,
      "initial",
      { healers: 0, casters: 0, frontliners: 0, stealthy: 0 },
      null
    )
  );

  const [enemySelectName, setEnemySelectName] = useState<string>(
    () => ENEMY_LIBRARY[0]?.name ?? "Bandit Archer"
  );
  const [initModEnemies, setInitModEnemies] = useState<number>(1);

  useEffect(() => {
    if (isHuman && !allowDevControls) return;
    const inferred = inferEnemyInitModFromPressure(pressureTier);
    setInitModEnemies((prev) => {
      if (isHuman && allowDevControls) return prev;
      return inferred;
    });
  }, [pressureTier, isHuman, allowDevControls]);

  useEffect(() => {
    if (isHuman && !allowDevControls) return;

    const desired = clampInt(partySize, 0, 6);
    const roster = buildRecommendedEnemyRoster(
      pressureTier,
      desired,
      pressureSeed,
      partyRoleInfo,
      encounterContext?.zoneTheme ?? null
    );

    setSelectedEnemies((prev) => {
      if (isHuman && allowDevControls) return prev;
      return roster;
    });
  }, [
    partySize,
    pressureTier,
    pressureSeed,
    partyRoleInfo,
    isHuman,
    allowDevControls,
    encounterContext?.zoneTheme,
  ]);

  function addEnemyByName(name: string) {
    if (!canEdit) return;
    const enemy = getEnemyDefinitionByName(name);
    if (!enemy) return;

    setSelectedEnemies((prev) => {
      if (prev.length >= 6) return prev;
      return [...prev, enemy].slice(0, 6);
    });
  }

  function removeEnemyAt(index: number) {
    if (!canEdit) return;
    setSelectedEnemies((prev) => prev.filter((_, i) => i !== index));
  }

  function clearEnemies() {
    if (!canEdit) return;
    setSelectedEnemies([]);
  }

  const latestCombatId = useMemo(() => findLatestCombatId(events as any) ?? null, [events]);

  const derivedCombat = useMemo(() => {
    if (!latestCombatId) return null;
    try {
      return deriveCombatState(latestCombatId, events as any);
    } catch {
      return null;
    }
  }, [latestCombatId, events]);

  const canStartCombat = !locked && (isHuman || allowDevControls);

  function startCombatDeterministic() {
    if (!canStartCombat) return;

    const members = (partyMembers ?? []).slice(0, 6);
    if (members.length === 0) return;

    const desiredCount = clampInt(members.length, 1, 6);
    const ensuredEnemies =
      selectedEnemies.length > 0
        ? selectedEnemies.slice(0, desiredCount)
        : buildRecommendedEnemyRoster(
            pressureTier,
            desiredCount,
            pressureSeed,
            partyRoleInfo,
            encounterContext?.zoneTheme ?? null
          );

    const combatId = crypto.randomUUID();
    const seed = crypto.randomUUID();
    const participants: CombatantSpec[] = [];

    members.forEach((m, idx) => {
      const i1 = idx + 1;
      participants.push({
        id: normalizeName(m.id || `player_${i1}`) || `player_${i1}`,
        name: normalizeName(m.name || "") || `Player ${i1}`,
        kind: "player",
        initiativeMod: Math.trunc(Number(m.initiativeMod ?? 0)),
      });
    });

    const duplicateTracker: Record<string, number> = {};

    ensuredEnemies.forEach((enemy) => {
      const slug = enemy.slug;
      duplicateTracker[slug] = (duplicateTracker[slug] ?? 0) + 1;
      const instance = duplicateTracker[slug];

      participants.push({
        id: `enemy_${slug}_${instance}`,
        name: enemy.name,
        kind: "enemy_group",
        initiativeMod: Math.trunc(Number(initModEnemies ?? 0)),
      });
    });

    const started: CombatStartedPayload = { combatId, seed, participants };
    const initRolls = generateDeterministicInitiativeRolls(started);

    onAppendCanon("COMBAT_STARTED", {
      ...started,
      encounterContext: encounterContext ?? null,
    });

    for (const r of initRolls) onAppendCanon("INITIATIVE_ROLLED", r);
    onAppendCanon("TURN_ADVANCED", { combatId, round: 1, index: 0 });
  }

  function advanceTurn() {
    if (!derivedCombat) return;
    const payload = nextTurnPointer(derivedCombat);
    onAppendCanon("TURN_ADVANCED", payload);
  }

  function endCombat() {
    if (!locked) return;

    const combatId =
      (derivedCombat?.combatId as string | undefined) ??
      (latestCombatId ? String(latestCombatId) : crypto.randomUUID());

    onAppendCanon("COMBAT_ENDED", { combatId });
  }

  const enemyCards = useMemo(() => {
    const n = clampInt(partySize, 0, 6);
    const enemies = selectedEnemies.slice(0, n);
    const stateLabel = locked ? "In combat" : "Deployed";

    return enemies.map((enemy, idx, all) => ({
      key: `${enemy.id}_${idx}`,
      enemy,
      label: buildEnemyCardLabel(enemy, all),
      initMod: Math.trunc(Number(initModEnemies ?? 0)),
      stateLabel,
      isKeybearer: enemyMatchesName(enemy, encounterContext?.keyEnemyName),
      isRelicBearer: enemyMatchesName(enemy, encounterContext?.relicEnemyName),
      isCacheGuard: enemyMatchesName(enemy, encounterContext?.cacheGuardEnemyName),
    }));
  }, [
    selectedEnemies,
    initModEnemies,
    locked,
    partySize,
    encounterContext?.keyEnemyName,
    encounterContext?.relicEnemyName,
    encounterContext?.cacheGuardEnemyName,
  ]);

  const rosterInfo = useMemo(() => {
    const band = pressureBandFromTier(pressureTier);
    const recommended = buildRecommendedEnemyRoster(
      pressureTier,
      clampInt(partySize, 0, 6),
      pressureSeed,
      partyRoleInfo,
      encounterContext?.zoneTheme ?? null
    );

    const factionCounts = new Map<string, number>();
    for (const e of recommended) {
      factionCounts.set(e.faction, (factionCounts.get(e.faction) ?? 0) + 1);
    }

    const factionSummary = Array.from(factionCounts.entries())
      .map(([faction, count]) => `${count}× ${prettyFaction(faction)}`)
      .join(" · ");

    return {
      band,
      factionSummary,
      recommendedCount: recommended.length,
    };
  }, [partySize, pressureTier, pressureSeed, partyRoleInfo, encounterContext?.zoneTheme]);

  const encounterSummary = useMemo(() => {
    const zoneTheme = encounterContext?.zoneTheme ? prettyTheme(encounterContext.zoneTheme) : null;
    const objective = normalizeName(encounterContext?.objective ?? "");
    const lockState = normalizeName(encounterContext?.lockState ?? "");
    const rewardHint = normalizeName(encounterContext?.rewardHint ?? "");
    const zoneId = normalizeName(encounterContext?.zoneId ?? "");

    return {
      zoneTheme,
      objective,
      lockState,
      rewardHint,
      zoneId,
    };
  }, [encounterContext]);

  return (
    <CardSection title="Combat Setup">
      <div style={{ display: "grid", gap: 14 }}>
        <SectionShell
          title="State"
          hint="Combat setup should stay compact: state first, roster second, controls third."
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Pill tone="info">Event-sourced turn order</Pill>
            {locked ? <Pill tone="warn">Combat active — setup locked</Pill> : <Pill>Setup ready</Pill>}
            {!isHuman && !allowDevControls ? <Pill tone="warn">Solace-owned setup</Pill> : null}
            <Pill>Party size: {partySize}</Pill>
            <Pill tone="info">Pressure band: {rosterInfo.band}</Pill>
          </div>

          {(encounterSummary.zoneTheme ||
            encounterSummary.objective ||
            encounterSummary.lockState ||
            encounterSummary.rewardHint ||
            encounterSummary.zoneId) ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {encounterSummary.zoneTheme ? (
                  <Pill tone="info">Zone Theme: {encounterSummary.zoneTheme}</Pill>
                ) : null}
                {encounterSummary.zoneId ? <Pill>Zone {encounterSummary.zoneId}</Pill> : null}
                {encounterSummary.lockState ? (
                  <Pill tone="warn">Lock State: {encounterSummary.lockState}</Pill>
                ) : null}
                {encounterSummary.rewardHint ? (
                  <Pill>Reward Signal: {encounterSummary.rewardHint}</Pill>
                ) : null}
              </div>

              {encounterSummary.objective ? (
                <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.92 }}>
                  <strong>Objective:</strong> {encounterSummary.objective}
                </div>
              ) : null}
            </div>
          ) : null}
        </SectionShell>

        <SectionShell
          title="Roster Logic"
          hint="The recommended roster is pressure-aware, party-aware, and theme-biased when a zone theme exists."
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div className="muted" style={{ fontSize: 12 }}>
              Recommended pool: {rosterInfo.factionSummary || "—"}
              {encounterSummary.zoneTheme ? (
                <>
                  {" "}
                  · Theme bias: <strong>{encounterSummary.zoneTheme}</strong>
                </>
              ) : null}
            </div>

            <div className="muted" style={{ fontSize: 12 }}>
              Party profile: <strong>{partyRoleInfo.frontliners}</strong> frontliner
              {partyRoleInfo.frontliners === 1 ? "" : "s"} · <strong>{partyRoleInfo.healers}</strong> healer
              {partyRoleInfo.healers === 1 ? "" : "s"} · <strong>{partyRoleInfo.casters}</strong> caster
              {partyRoleInfo.casters === 1 ? "" : "s"} · <strong>{partyRoleInfo.stealthy}</strong> stealth
              {partyRoleInfo.stealthy === 1 ? " role" : " roles"}
            </div>
          </div>
        </SectionShell>

        <SectionShell
          title="Builder"
          hint="This area is compact by default. It remains editable only when setup is not locked."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Party size (session truth)
              </span>
              <div
                style={{
                  ...selectStyle(true),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  <strong>{partySize}</strong> {partySize === 1 ? "member" : "members"}
                </span>
                <span className="muted" style={{ fontSize: 12 }}>
                  locked
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Enemy init mod
              </span>
              <select
                value={initModEnemies}
                disabled={!canEdit}
                onChange={(e) => setInitModEnemies(Math.trunc(Number(e.target.value)))}
                style={selectStyle(!canEdit)}
              >
                {INIT_MODS.map((n) => (
                  <option key={n} value={n}>
                    {n >= 0 ? `+${n}` : `${n}`}
                  </option>
                ))}
              </select>
            </div>

            {showBuilderControls ? (
              <>
                <div style={{ display: "grid", gap: 6 }}>
                  <span className="muted" style={{ fontSize: 12 }}>
                    Enemy definition
                  </span>
                  <select
                    value={enemySelectName}
                    disabled={!canEdit}
                    onChange={(e) => setEnemySelectName(e.target.value)}
                    style={{ ...selectStyle(!canEdit), minWidth: 240 }}
                  >
                    {ENEMY_LIBRARY.map((enemy) => (
                      <option key={enemy.id} value={enemy.name}>
                        {enemy.name} · {prettyFaction(enemy.faction)} · {prettyRole(enemy.role)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => addEnemyByName(enemySelectName)}
                    disabled={!canEdit || selectedEnemies.length >= 6}
                    style={buttonStyle("primary", !canEdit || selectedEnemies.length >= 6)}
                  >
                    Add Enemy
                  </button>

                  <button
                    onClick={clearEnemies}
                    disabled={!canEdit || selectedEnemies.length === 0}
                    style={buttonStyle("ghost", !canEdit || selectedEnemies.length === 0)}
                  >
                    Clear
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </SectionShell>

        <SectionShell
          title="Deployed Roster"
          hint="Only the deployed enemy list stays expanded. Removal controls remain secondary."
        >
          {enemyCards.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 10,
              }}
            >
              {enemyCards.map((c) => (
                <EnemyCard
                  key={c.key}
                  enemy={c.enemy}
                  label={c.label}
                  initMod={c.initMod}
                  stateLabel={c.stateLabel}
                  isKeybearer={c.isKeybearer}
                  isRelicBearer={c.isRelicBearer}
                  isCacheGuard={c.isCacheGuard}
                />
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>
              No enemies deployed.
            </div>
          )}

          {showBuilderControls && selectedEnemies.length > 0 ? (
            <details
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  padding: "11px 12px",
                  fontSize: 11,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Roster Tokens
              </summary>

              <div style={{ padding: "0 12px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedEnemies.slice(0, 6).map((enemy, idx) => (
                  <span
                    key={`${enemy.id}_${idx}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <span>{enemy.name}</span>
                    <button
                      onClick={() => removeEnemyAt(idx)}
                      disabled={!canEdit}
                      aria-label={`Remove ${enemy.name}`}
                      style={{
                        padding: "0 10px",
                        height: 24,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.22)",
                        color: "inherit",
                        opacity: !canEdit ? 0.55 : 1,
                        cursor: !canEdit ? "not-allowed" : "pointer",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </details>
          ) : null}
        </SectionShell>

        <SectionShell
          title="Combat Control"
          hint="The battlefield is seeded here, then managed through events."
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={startCombatDeterministic}
              disabled={!canStartCombat || partySize === 0}
              style={buttonStyle("primary", !canStartCombat || partySize === 0)}
              title={
                !canStartCombat && !isHuman && !allowDevControls
                  ? "Combat is derived from pressure + hostile intent."
                  : undefined
              }
            >
              Start Combat (Seeded)
            </button>

            <button
              onClick={advanceTurn}
              disabled={!derivedCombat}
              style={buttonStyle("ghost", !derivedCombat)}
            >
              Advance Turn
            </button>

            <button
              onClick={endCombat}
              disabled={!locked}
              style={buttonStyle("danger", !locked)}
            >
              End Combat
            </button>

            {partySize === 0 ? (
              <span className="muted" style={{ fontSize: 12 }}>
                Declare party first.
              </span>
            ) : null}
          </div>
        </SectionShell>

        {derivedCombat ? (
          <SectionShell
            title="Derived Turn Order"
            hint="This is the event-derived initiative state, not a manually maintained list."
          >
            <div className="muted" style={{ fontSize: 13 }}>
              Combat: <strong>{derivedCombat.combatId}</strong> · Round{" "}
              <strong>{derivedCombat.round}</strong>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {derivedCombat.order.map((id: string, idx: number) => {
                const spec = derivedCombat.participants.find((p: any) => p.id === id) ?? null;
                const roll = derivedCombat.initiative.find((r: any) => r.combatantId === id) ?? null;
                const active = derivedCombat.activeCombatantId === id;

                return (
                  <div
                    key={id}
                    style={{
                      padding: "12px 12px",
                      borderRadius: 12,
                      border: active
                        ? "1px solid rgba(138,180,255,0.35)"
                        : "1px solid rgba(255,255,255,0.10)",
                      background: active
                        ? "linear-gradient(180deg, rgba(138,180,255,0.10), rgba(0,0,0,0.10))"
                        : "rgba(255,255,255,0.04)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: active ? "0 10px 22px rgba(0,0,0,0.22)" : "none",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        aria-hidden
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          border: active
                            ? "1px solid rgba(138,180,255,0.60)"
                            : "1px solid rgba(255,255,255,0.16)",
                          background: active
                            ? "rgba(138,180,255,0.18)"
                            : "rgba(255,255,255,0.05)",
                          boxShadow: active ? "0 0 14px rgba(138,180,255,0.25)" : "none",
                        }}
                      />
                      <div>
                        <strong>
                          {idx + 1}. {spec ? formatCombatantLabel(spec) : id}
                        </strong>
                        {active ? (
                          <span className="muted" style={{ marginLeft: 8 }}>
                            ← active
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="muted">
                      {roll ? `Init ${roll.total} (d20 ${roll.natural} + ${roll.modifier})` : "Init —"}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionShell>
        ) : null}
      </div>
    </CardSection>
  );
}
