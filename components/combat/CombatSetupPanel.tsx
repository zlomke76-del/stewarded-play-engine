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

type PartyMemberLite = {
  id: string;
  name: string;
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

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

function normalizeName(s: string) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
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

// Pressure -> mild init mod heuristic (kept intentionally simple)
function inferEnemyInitModFromPressure(pressureTier: any): number {
  const band = pressureBandFromTier(pressureTier);
  if (band === "low") return 0;
  if (band === "medium") return 1;
  if (band === "high") return 2;
  return 3;
}

// Pressure -> per-enemy HP (avoid squared scaling; count already matches party size)
function inferEnemyHpPerEnemyFromPressure(pressureTier: any): number {
  const band = pressureBandFromTier(pressureTier);
  if (band === "low") return 12;
  if (band === "medium") return 14;
  if (band === "high") return 16;
  return 18;
}

// Pressure -> 50/50 enemy archetypes (difficulty via “quality”, not quantity)
function enemyTypesForPressure(pressureTier: any): [string, string] {
  const band = pressureBandFromTier(pressureTier);

  if (band === "low") return ["Archers", "Shields"];
  if (band === "medium") return ["Skirmishers", "Shields"];
  if (band === "high") return ["Casters", "Brutes"];
  return ["Wraiths", "Firewall Wardens"];
}

function makeInstanceLabel(base: string, idx1: number) {
  // Keep it readable + stable, and still match asset resolver (includes("archer"), etc.)
  return `${base} #${idx1}`;
}

function shouldFirstTypeGetExtra(seed: string): boolean {
  // deterministic: 0/1 based on hash
  return (hash32(seed) & 1) === 1;
}

function buildBalancedRoster(
  pressureTier: any,
  partySize: number,
  seed: string
): { labels: string[]; counts: { a: number; b: number }; types: [string, string] } {
  const n = clampInt(partySize, 0, 6);
  const types = enemyTypesForPressure(pressureTier);
  const [A, B] = types;

  if (n === 0) return { labels: [], counts: { a: 0, b: 0 }, types };

  // Base 50/50 split.
  let a = Math.floor(n / 2);
  let b = n - a;

  // If odd, deterministically choose which side gets the extra (variety without RNG).
  if (n % 2 === 1) {
    const aGetsExtra = shouldFirstTypeGetExtra(`${seed}::odd_split::${String(pressureTier ?? "")}`);
    if (aGetsExtra) {
      a = Math.ceil(n / 2);
      b = n - a;
    } else {
      a = Math.floor(n / 2);
      b = n - a;
    }
  }

  const labels: string[] = [];
  for (let i = 1; i <= a; i++) labels.push(makeInstanceLabel(A, i));
  for (let i = 1; i <= b; i++) labels.push(makeInstanceLabel(B, i));

  // Deterministic order shuffle-lite: keep it stable, but avoid “all archers then all shields” sometimes.
  // We interleave based on a deterministic bit.
  const interleave = shouldFirstTypeGetExtra(`${seed}::interleave::${A}::${B}`);
  if (interleave && labels.length > 1) {
    const aLabels = labels.filter((x) => x.toLowerCase().includes(A.toLowerCase().split(" ")[0]));
    const bLabels = labels.filter((x) => x.toLowerCase().includes(B.toLowerCase().split(" ")[0]));
    const out: string[] = [];
    let ia = 0,
      ib = 0;
    while (out.length < labels.length) {
      if (ia < aLabels.length) out.push(aLabels[ia++]);
      if (ib < bLabels.length) out.push(bLabels[ib++]);
    }
    return { labels: out.slice(0, n), counts: { a, b }, types };
  }

  return { labels: labels.slice(0, n), counts: { a, b }, types };
}

function enemyAssetForGroupName(name: string): string {
  const n = String(name ?? "").toLowerCase().trim();

  // Prefer explicit group art when you have it; fall back to base.
  if (n.includes("archer")) return "/assets/v1/enemy_archers.png";
  if (n.includes("brute")) return "/assets/v1/enemy_brutes.png";
  if (n.includes("shield")) return "/assets/v1/enemy_shields.png";
  if (n.includes("skirmish")) return "/assets/v1/enemy_skirmishers.png";
  if (n.includes("stalker")) return "/assets/v1/enemy_stalkers.png";
  if (n.includes("drone")) return "/assets/v1/enemy_drones.png";
  if (n.includes("sentr")) return "/assets/v1/enemy_sentries.png";
  if (n.includes("wraith")) return "/assets/v1/enemy_wraiths.png";
  if (n.includes("grid")) return "/assets/v1/enemy_grid_knights.png";
  if (n.includes("firewall")) return "/assets/v1/enemy_firewall_warden.png";
  if (n.includes("hound")) return "/assets/v1/enemy_unknown.png";
  if (n.includes("caster")) return "/assets/v1/enemy_unknown.png";

  return "/assets/v1/enemy_unknown.png";
}

function EnemyCard({
  name,
  initMod,
  hpLabel,
  stateLabel,
}: {
  name: string;
  initMod: number;
  hpLabel: string;
  stateLabel: string;
}) {
  const src = enemyAssetForGroupName(name);

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
          width: 44,
          height: 44,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
          flex: "0 0 auto",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={44}
          height={44}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</strong>
        </div>

        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          enemy · init mod {initMod >= 0 ? `+${initMod}` : `${initMod}`}
        </div>

        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {hpLabel} · {stateLabel}
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

  // In Solace-neutral (no dev), hide the visual-noise “builder” controls.
  const showBuilderControls = isHuman || allowDevControls;

  const INIT_MODS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

  const ENEMY_GROUP_LIBRARY = useMemo(
    () => [
      "Archers",
      "Shields",
      "Skirmishers",
      "Brutes",
      "Casters",
      "Stalkers",
      "Drones",
      "Sentries",
      "Wraiths",
      "Grid Knights",
      "Firewall Wardens",
      "Neon Hounds",
    ],
    []
  );

  const partySize = useMemo(() => clampInt(partyMembers?.length ?? 0, 0, 6), [partyMembers]);

  const pressureSeed = useMemo(() => {
    const outcomes = (events as any[]).filter((e) => e?.type === "OUTCOME").length;
    return `pressure=${String(pressureTier ?? "unknown")}::outcomes=${outcomes}::party=${partySize}`;
  }, [events, partySize, pressureTier]);

  // -----------------------------
  // Enemy list (instances) + knobs
  // -----------------------------

  const [enemyGroups, setEnemyGroups] = useState<string[]>([
    makeInstanceLabel("Archers", 1),
    makeInstanceLabel("Shields", 1),
  ]);

  const [enemyGroupSelect, setEnemyGroupSelect] = useState<string>("Archers");
  const [initModEnemies, setInitModEnemies] = useState<number>(1);

  // Solace-owned: pressure -> init mod (quality)
  useEffect(() => {
    if (isHuman && !allowDevControls) return;

    const inferred = inferEnemyInitModFromPressure(pressureTier);
    setInitModEnemies((prev) => {
      if (isHuman && allowDevControls) return prev; // don’t stomp dev edits
      return inferred;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressureTier, isHuman, allowDevControls]);

  // Solace-owned: 1:1 enemies to party size, 50/50 composition, pressure drives *type*
  useEffect(() => {
    if (isHuman && !allowDevControls) return;

    const desired = clampInt(partySize, 0, 6);
    const roster = buildBalancedRoster(pressureTier, desired, pressureSeed);

    setEnemyGroups((prev) => {
      if (isHuman && allowDevControls) return prev; // dev can override
      return roster.labels;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partySize, pressureTier, pressureSeed, isHuman, allowDevControls]);

  function nextInstanceIndexForBase(base: string, existing: string[]) {
    const b = String(base ?? "").toLowerCase().trim();
    let max = 0;
    for (const label of existing) {
      const s = String(label ?? "").toLowerCase();
      if (!s.includes(b)) continue;
      const m = /#\s*(\d+)\s*$/.exec(label);
      if (m?.[1]) max = Math.max(max, Number(m[1]));
    }
    return max + 1;
  }

  function addEnemyGroup(baseName: string) {
    if (!canEdit) return;
    const base = normalizeName(baseName);
    if (!base) return;

    setEnemyGroups((prev) => {
      if (prev.length >= 6) return prev;
      const idx = nextInstanceIndexForBase(base, prev);
      return [...prev, makeInstanceLabel(base, idx)].slice(0, 6);
    });
  }

  function removeEnemyGroup(label: string) {
    if (!canEdit) return;
    const v = normalizeName(label);
    setEnemyGroups((prev) => prev.filter((g) => g !== v));
  }

  function clearEnemyGroups() {
    if (!canEdit) return;
    setEnemyGroups([]);
  }

  // -----------------------------
  // Derived combat display
  // -----------------------------

  const latestCombatId = useMemo(() => findLatestCombatId(events as any) ?? null, [events]);

  const derivedCombat = useMemo(() => {
    if (!latestCombatId) return null;
    try {
      return deriveCombatState(latestCombatId, events as any);
    } catch {
      return null;
    }
  }, [latestCombatId, events]);

  // -----------------------------
  // Canon actions
  // -----------------------------

  const canStartCombat = !locked && (isHuman || allowDevControls);

  function startCombatDeterministic() {
    if (!canStartCombat) return;

    const members = (partyMembers ?? []).slice(0, 6);
    if (members.length === 0) return;

    const desiredGroups = clampInt(members.length, 1, 6);

    // Use exactly N enemies (1:1 with party size). If empty, rebuild from Solace roster.
    const ensuredLabels =
      enemyGroups.length > 0
        ? enemyGroups.slice(0, desiredGroups)
        : buildBalancedRoster(pressureTier, desiredGroups, pressureSeed).labels;

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

    ensuredLabels.forEach((name, idx) => {
      participants.push({
        id: `enemy_group_${idx + 1}`,
        name,
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

  // -----------------------------
  // Enemy cards (no squared math)
  // -----------------------------

  const enemyCards = useMemo(() => {
    const n = clampInt(partySize, 0, 6);
    const labels = enemyGroups.slice(0, n);

    // Key fix: HP is PER ENEMY, not multiplied by party size.
    const hpPerEnemy = inferEnemyHpPerEnemyFromPressure(pressureTier);
    const hpLabel = `HP ${hpPerEnemy}/${hpPerEnemy}`;
    const stateLabel = locked ? "In combat" : "Deployed (Solace-owned)";

    return labels.map((name) => ({
      name,
      initMod: Math.trunc(Number(initModEnemies ?? 0)),
      hpLabel,
      stateLabel,
    }));
  }, [enemyGroups, initModEnemies, locked, partySize, pressureTier]);

  const rosterInfo = useMemo(() => {
    const roster = buildBalancedRoster(pressureTier, clampInt(partySize, 0, 6), pressureSeed);
    const [A, B] = roster.types;
    const hp = inferEnemyHpPerEnemyFromPressure(pressureTier);
    const band = pressureBandFromTier(pressureTier);
    return { A, B, a: roster.counts.a, b: roster.counts.b, hp, band };
  }, [partySize, pressureTier, pressureSeed]);

  return (
    <CardSection title="Combat (Deterministic, Grouped Enemies)">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
        <Pill tone="info">Event-sourced turn order</Pill>
        {locked ? <Pill tone="warn">🔒 Combat active — setup locked</Pill> : <Pill>Setup ready</Pill>}
        {!isHuman && !allowDevControls && <Pill tone="warn">Solace-owned setup</Pill>}
      </div>

      <p className="muted" style={{ marginTop: 10 }}>
        Players roll individually. Enemies roll once per enemy. Turn order is derived from events.
      </p>

      {/* Setup console */}
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
        {/* Row 1: compact controls */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <ControlLabel label="Party size (session truth)">
            <div style={{ ...selectStyle(true), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

          {/* Optional builder controls stay up top in human/dev to avoid pushing the enemy grid right. */}
          {showBuilderControls && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <ControlLabel label="Enemy group (builder)">
                <select
                  value={enemyGroupSelect}
                  disabled={!canEdit}
                  onChange={(e) => setEnemyGroupSelect(e.target.value)}
                  style={{ ...selectStyle(!canEdit), minWidth: 240 }}
                >
                  {ENEMY_GROUP_LIBRARY.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </ControlLabel>

              <button
                onClick={() => addEnemyGroup(enemyGroupSelect)}
                disabled={!canEdit || enemyGroups.length >= 6}
                style={buttonStyle("primary", !canEdit || enemyGroups.length >= 6)}
                title={!canEdit ? "Solace-owned (or combat locked)" : "Add enemy"}
              >
                Add
              </button>

              <button
                onClick={clearEnemyGroups}
                disabled={!canEdit || enemyGroups.length === 0}
                style={buttonStyle("ghost", !canEdit || enemyGroups.length === 0)}
              >
                Clear
              </button>

              <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
                (max 6)
              </span>
            </div>
          )}
        </div>

        {/* Row 2: enemy area FULL WIDTH (fixes the left dead-space in your screenshot) */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 12 }}>
              Enemies <span className="muted">(1:1 with party size · 50/50 mix)</span>
            </span>

            <span className="muted" style={{ fontSize: 12 }}>
              Pressure tier: <strong>{String(pressureTier ?? "unknown")}</strong> · Band <strong>{rosterInfo.band}</strong> · HP{" "}
              <strong>{rosterInfo.hp}</strong>
            </span>
          </div>

          <div className="muted" style={{ fontSize: 12 }}>
            Roster: <strong>{rosterInfo.a}</strong>× {rosterInfo.A} · <strong>{rosterInfo.b}</strong>× {rosterInfo.B}
          </div>

          {/* Cards */}
          {enemyCards.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
                marginTop: 4,
                width: "100%",
              }}
            >
              {enemyCards.map((c) => (
                <EnemyCard key={c.name} name={c.name} initMod={c.initMod} hpLabel={c.hpLabel} stateLabel={c.stateLabel} />
              ))}
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 6 }}>
              No enemies.
            </div>
          )}

          {/* If we’re showing builder controls (human/dev), keep removable chips too. */}
          {showBuilderControls && enemyGroups.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {enemyGroups.slice(0, 6).map((g) => (
                <span
                  key={g}
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
                  <span>{g}</span>
                  <button
                    onClick={() => removeEnemyGroup(g)}
                    disabled={!canEdit}
                    aria-label={`Remove ${g}`}
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

      {/* Actions */}
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

      {/* Derived order */}
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
