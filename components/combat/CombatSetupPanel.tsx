// components/combat/CombatSetupPanel.tsx
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
  EnemyPressureBand,
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

type Props = {
  events: readonly any[];
  onAppendCanon: (type: string, payload: any) => void;

  // to match app/demo/page.tsx usage
  dmMode: "human" | "solace-neutral";
  partyMembers: PartyMemberLite[];
  pressureTier: any; // intentionally permissive to avoid type coupling across folders
  allowDevControls: boolean;
};

type PartyRoleInfo = {
  healers: number;
  casters: number;
  frontliners: number;
  stealthy: number;
};

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

function shouldFirstTypeGetExtra(seed: string): boolean {
  return (hash32(seed) & 1) === 1;
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

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "warn";
}) {
  const toneStyle =
    tone === "info"
      ? {
          border: "1px solid rgba(138,180,255,0.22)",
          background: "rgba(138,180,255,0.08)",
        }
      : tone === "warn"
        ? {
            border: "1px solid rgba(255,200,140,0.22)",
            background: "rgba(255,200,140,0.08)",
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
        padding: "6px 10px",
        borderRadius: 999,
        ...toneStyle,
      }}
    >
      {children}
    </span>
  );
}

function ControlLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="muted" style={{ fontSize: 12 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function selectStyle(disabled?: boolean): React.CSSProperties {
  return {
    minWidth: 160,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: disabled ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.28)",
    color: "inherit",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  };
}

function buttonStyle(tone: "primary" | "ghost" | "danger", disabled?: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
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

// Small deterministic hash -> [0, 2^32)
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type PressureBand = "low" | "medium" | "high" | "extreme";

function pressureBandFromTier(pressureTier: any): PressureBand {
  const t = String(pressureTier ?? "").toLowerCase();
  if (t.includes("extreme") || t.includes("tier_4") || t === "4") return "extreme";
  if (t.includes("high") || t.includes("tier_3") || t === "3") return "high";
  if (t.includes("med") || t.includes("tier_2") || t === "2") return "medium";
  return "low";
}

// Pressure -> mild init mod heuristic
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

function getAdaptiveCandidates(band: PressureBand, partyRoleInfo: PartyRoleInfo): EnemyDefinition[] {
  const base = getBasePoolForPressure(band);
  const extraNames: string[] = [];

  if (partyRoleInfo.frontliners >= 2) {
    extraNames.push("Bandit Archer", "Goblin Archer", "Cultist Acolyte", "Arcane Sentinel");
  }

  if (partyRoleInfo.casters >= 2) {
    extraNames.push("Goblin Skirmisher", "Bandit Rogue", "Cult Assassin", "Wraith");
  }

  if (partyRoleInfo.healers >= 1) {
    extraNames.push("Cult Priest", "Bandit Captain", "Hobgoblin Soldier");
  }

  if (partyRoleInfo.stealthy >= 2) {
    extraNames.push("Wolf", "Dire Wolf", "Giant Spider", "Cult Assassin");
  }

  const extras = namesToDefs(extraNames);
  const merged = [...base, ...extras];

  const seen = new Set<string>();
  const unique: EnemyDefinition[] = [];
  for (const e of merged) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    unique.push(e);
  }

  return unique;
}

function buildRecommendedEnemyRoster(
  pressureTier: any,
  partySize: number,
  seed: string,
  partyRoleInfo: PartyRoleInfo
): EnemyDefinition[] {
  const n = clampInt(partySize, 0, 6);
  if (n <= 0) return [];

  const band = pressureBandFromTier(pressureTier);
  const adaptive = getAdaptiveCandidates(band, partyRoleInfo);

  if (adaptive.length >= n) {
    return pickUniqueDeterministic(adaptive, n, `${seed}::adaptive`);
  }

  const fillerPool = getBasePoolForPressure(band);
  const picked = pickUniqueDeterministic(adaptive, adaptive.length, `${seed}::adaptive`);
  const needed = n - picked.length;
  const filler = repeatDeterministic(fillerPool.length > 0 ? fillerPool : adaptive, needed, `${seed}::filler`);

  return [...picked, ...filler].slice(0, n);
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

function EnemyCard({
  enemy,
  label,
  initMod,
  stateLabel,
}: {
  enemy: EnemyDefinition;
  label: string;
  initMod: number;
  stateLabel: string;
}) {
  const src = getEnemyPortraitSrc(enemy);

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

      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</strong>
        </div>

        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {prettyRole(enemy.role)} · {prettyFaction(enemy.faction)} · init mod {initMod >= 0 ? `+${initMod}` : `${initMod}`}
        </div>

        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          HP {enemy.defenses.hp}/{enemy.defenses.hp} · AC {enemy.defenses.ac} · {stateLabel}
        </div>
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
    return `pressure=${String(pressureTier ?? "unknown")}::outcomes=${outcomes}::party=${partySize}`;
  }, [events, partySize, pressureTier]);

  const [selectedEnemies, setSelectedEnemies] = useState<EnemyDefinition[]>(() =>
    buildRecommendedEnemyRoster("low", 2, "initial", {
      healers: 0,
      casters: 0,
      frontliners: 0,
      stealthy: 0,
    })
  );

  const [enemySelectName, setEnemySelectName] = useState<string>(() => ENEMY_LIBRARY[0]?.name ?? "Bandit Archer");
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
    const roster = buildRecommendedEnemyRoster(pressureTier, desired, pressureSeed, partyRoleInfo);

    setSelectedEnemies((prev) => {
      if (isHuman && allowDevControls) return prev;
      return roster;
    });
  }, [partySize, pressureTier, pressureSeed, partyRoleInfo, isHuman, allowDevControls]);

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
        : buildRecommendedEnemyRoster(pressureTier, desiredCount, pressureSeed, partyRoleInfo);

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

    onAppendCanon("COMBAT_STARTED", started);
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
    const stateLabel = locked ? "In combat" : "Deployed (database-backed)";

    return enemies.map((enemy, idx, all) => ({
      key: `${enemy.id}_${idx}`,
      enemy,
      label: buildEnemyCardLabel(enemy, all),
      initMod: Math.trunc(Number(initModEnemies ?? 0)),
      stateLabel,
    }));
  }, [selectedEnemies, initModEnemies, locked, partySize]);

  const rosterInfo = useMemo(() => {
    const band = pressureBandFromTier(pressureTier);
    const recommended = buildRecommendedEnemyRoster(pressureTier, clampInt(partySize, 0, 6), pressureSeed, partyRoleInfo);

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
  }, [partySize, pressureTier, pressureSeed, partyRoleInfo]);

  return (
    <CardSection title="Combat (Deterministic, Database-Backed Enemies)">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
        <Pill tone="info">Event-sourced turn order</Pill>
        {locked ? <Pill tone="warn">🔒 Combat active — setup locked</Pill> : <Pill>Setup ready</Pill>}
        {!isHuman && !allowDevControls && <Pill tone="warn">Solace-owned setup</Pill>}
      </div>

      <p className="muted" style={{ marginTop: 10 }}>
        Players roll individually. Enemies roll once per enemy. Turn order is derived from events.
      </p>

      <div
        style={{
          marginTop: 12,
          padding: 14,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.10))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <ControlLabel label="Party size (session truth)">
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
          </ControlLabel>

          <ControlLabel label="Enemy init mod (pressure-derived)">
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
          </ControlLabel>

          {showBuilderControls && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <ControlLabel label="Enemy definition (builder)">
                <select
                  value={enemySelectName}
                  disabled={!canEdit}
                  onChange={(e) => setEnemySelectName(e.target.value)}
                  style={{ ...selectStyle(!canEdit), minWidth: 260 }}
                >
                  {ENEMY_LIBRARY.map((enemy) => (
                    <option key={enemy.id} value={enemy.name}>
                      {enemy.name} · {prettyFaction(enemy.faction)} · {prettyRole(enemy.role)}
                    </option>
                  ))}
                </select>
              </ControlLabel>

              <button
                onClick={() => addEnemyByName(enemySelectName)}
                disabled={!canEdit || selectedEnemies.length >= 6}
                style={buttonStyle("primary", !canEdit || selectedEnemies.length >= 6)}
                title={!canEdit ? "Solace-owned (or combat locked)" : "Add enemy"}
              >
                Add
              </button>

              <button
                onClick={clearEnemies}
                disabled={!canEdit || selectedEnemies.length === 0}
                style={buttonStyle("ghost", !canEdit || selectedEnemies.length === 0)}
              >
                Clear
              </button>

              <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
                (max 6)
              </span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span className="muted" style={{ fontSize: 12 }}>
              Enemies <span className="muted">(1:1 with party size · real EnemyDatabase definitions)</span>
            </span>

            <span className="muted" style={{ fontSize: 12 }}>
              Pressure tier: <strong>{String(pressureTier ?? "unknown")}</strong> · Band{" "}
              <strong>{rosterInfo.band}</strong>
            </span>
          </div>

          <div className="muted" style={{ fontSize: 12 }}>
            Recommended pool: {rosterInfo.factionSummary || "—"}
          </div>

          <div className="muted" style={{ fontSize: 12 }}>
            Party profile: <strong>{partyRoleInfo.frontliners}</strong> frontliner
            {partyRoleInfo.frontliners === 1 ? "" : "s"} · <strong>{partyRoleInfo.healers}</strong> healer
            {partyRoleInfo.healers === 1 ? "" : "s"} · <strong>{partyRoleInfo.casters}</strong> caster
            {partyRoleInfo.casters === 1 ? "" : "s"} · <strong>{partyRoleInfo.stealthy}</strong> stealth
            {partyRoleInfo.stealthy === 1 ? "" : "y"} role
            {partyRoleInfo.stealthy === 1 ? "" : "s"}
          </div>

          {enemyCards.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 10,
                marginTop: 4,
                width: "100%",
              }}
            >
              {enemyCards.map((c) => (
                <EnemyCard
                  key={c.key}
                  enemy={c.enemy}
                  label={c.label}
                  initMod={c.initMod}
                  stateLabel={c.stateLabel}
                />
              ))}
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 6 }}>
              No enemies.
            </div>
          )}

          {showBuilderControls && selectedEnemies.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
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
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={startCombatDeterministic}
          disabled={!canStartCombat || partySize === 0}
          style={buttonStyle("primary", !canStartCombat || partySize === 0)}
          title={
            !canStartCombat && !isHuman && !allowDevControls
              ? "Combat is derived from pressure + hostile intent (dev controls required to force-start)."
              : undefined
          }
        >
          Start Combat (Seeded)
        </button>

        <button onClick={advanceTurn} disabled={!derivedCombat} style={buttonStyle("ghost", !derivedCombat)}>
          Advance Turn
        </button>

        <button onClick={endCombat} disabled={!locked} style={buttonStyle("danger", !locked)}>
          End Combat
        </button>

        {partySize === 0 && (
          <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
            Declare party first.
          </span>
        )}
      </div>

      {derivedCombat && (
        <div style={{ marginTop: 14 }}>
          <div className="muted">
            Combat: <strong>{derivedCombat.combatId}</strong> · Round <strong>{derivedCombat.round}</strong>
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
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
                    border: active ? "1px solid rgba(138,180,255,0.35)" : "1px solid rgba(255,255,255,0.10)",
                    background: active
                      ? "linear-gradient(180deg, rgba(138,180,255,0.10), rgba(0,0,0,0.10))"
                      : "rgba(255,255,255,0.04)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: active ? "0 10px 22px rgba(0,0,0,0.22)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      aria-hidden
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        border: active ? "1px solid rgba(138,180,255,0.60)" : "1px solid rgba(255,255,255,0.16)",
                        background: active ? "rgba(138,180,255,0.18)" : "rgba(255,255,255,0.05)",
                        boxShadow: active ? "0 0 14px rgba(138,180,255,0.25)" : "none",
                      }}
                    />
                    <div>
                      <strong>
                        {idx + 1}. {spec ? formatCombatantLabel(spec) : id}
                      </strong>
                      {active && (
                        <span className="muted" style={{ marginLeft: 8 }}>
                          ← active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="muted">
                    {roll ? `Init ${roll.total} (d20 ${roll.natural} + ${roll.modifier})` : "Init —"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CardSection>
  );
}
