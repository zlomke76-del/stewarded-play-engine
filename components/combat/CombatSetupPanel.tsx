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

  // NEW (to match app/demo/page.tsx usage)
  dmMode: "human" | "solace-neutral";
  partyMembers: PartyMemberLite[];
  pressureTier: any; // kept permissive to avoid type coupling across folders
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

function ControlLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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

function buttonStyle(
  tone: "primary" | "ghost" | "danger",
  disabled?: boolean
): React.CSSProperties {
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
      background:
        "linear-gradient(180deg, rgba(138,180,255,0.14), rgba(138,180,255,0.06))",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 22px rgba(0,0,0,0.22)",
    };
  }

  if (tone === "danger") {
    return {
      ...base,
      border: "1px solid rgba(255,120,120,0.24)",
      background:
        "linear-gradient(180deg, rgba(255,120,120,0.14), rgba(255,120,120,0.06))",
    };
  }

  return {
    ...base,
    background: "rgba(255,255,255,0.04)",
  };
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

function uniqCaseInsensitive(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = normalizeName(raw);
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

// Pressure -> mild init mod heuristic (kept intentionally simple)
function inferEnemyInitModFromPressure(pressureTier: any): number {
  const t = String(pressureTier ?? "").toLowerCase();

  if (t.includes("low") || t.includes("calm") || t.includes("tier_1") || t === "1") return 0;
  if (t.includes("med") || t.includes("tier_2") || t === "2") return 1;
  if (t.includes("high") || t.includes("tier_3") || t === "3") return 2;
  if (t.includes("extreme") || t.includes("tier_4") || t === "4") return 3;

  // default
  return 1;
}

// Pressure -> enemy theme pool (implicit difficulty flavor)
function enemyPoolForPressure(pressureTier: any) {
  const t = String(pressureTier ?? "").toLowerCase();

  const low = ["Skirmishers", "Archers", "Shields", "Stalkers", "Sentries", "Neon Hounds"];
  const med = ["Brutes", "Skirmishers", "Archers", "Casters", "Drones", "Grid Knights"];
  const high = ["Wraiths", "Firewall Wardens", "Casters", "Drones", "Grid Knights", "Brutes"];

  if (t.includes("low") || t.includes("calm") || t.includes("tier_1") || t === "1") return low;
  if (t.includes("med") || t.includes("tier_2") || t === "2") return med;
  if (t.includes("high") || t.includes("tier_3") || t === "3") return high;
  if (t.includes("extreme") || t.includes("tier_4") || t === "4") return [...high, "Wraiths", "Firewall Wardens"];

  return med;
}

function pickDeterministicUnique(pool: string[], count: number, seed: string): string[] {
  const p = uniqCaseInsensitive(pool);
  const n = clampInt(count, 0, 6);
  if (n === 0) return [];

  // Deterministic “shuffle” by sorting with seeded hash
  const keyed = p.map((name, idx) => {
    const h = hash32(`${seed}::${idx}::${name.toLowerCase()}`);
    return { name, h };
  });

  keyed.sort((a, b) => a.h - b.h);

  // If pool is smaller than requested, we wrap with a second pass using a different key
  const out: string[] = [];
  let pass = 0;
  while (out.length < n && pass < 3) {
    for (const k of keyed) {
      if (out.length >= n) break;
      if (!out.map((x) => x.toLowerCase()).includes(k.name.toLowerCase())) out.push(k.name);
    }
    pass++;
    // diversify a bit if we had to wrap
    if (out.length < n) {
      keyed.forEach((k) => (k.h = hash32(`${seed}::pass${pass}::${k.name.toLowerCase()}`)));
      keyed.sort((a, b) => a.h - b.h);
    }
  }

  return out.slice(0, n);
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

  const INIT_MODS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

  const ENEMY_GROUP_LIBRARY = useMemo(
    () => [
      "Skirmishers",
      "Archers",
      "Brutes",
      "Shields",
      "Stalkers",
      "Casters",
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
    // keep stable enough for a session: pressureTier + outcomes count + party size
    const outcomes = events.filter((e: any) => e?.type === "OUTCOME").length;
    return `pressure=${String(pressureTier ?? "unknown")}::outcomes=${outcomes}::party=${partySize}`;
  }, [events, partySize, pressureTier]);

  // -----------------------------
  // Enemy groups (Solace-owned unless Human/Dev)
  // -----------------------------

  const [enemyGroups, setEnemyGroups] = useState<string[]>(["Skirmishers", "Archers"]);
  const [enemyGroupSelect, setEnemyGroupSelect] = useState<string>("Skirmishers");

  const [initModEnemies, setInitModEnemies] = useState<number>(1);

  // Solace: implicit difficulty → init mod + 1:1 groups to party size.
  useEffect(() => {
    if (isHuman && !allowDevControls) return;

    // In Solace-neutral (or dev), infer a suggested init mod from pressure.
    const inferred = inferEnemyInitModFromPressure(pressureTier);
    setInitModEnemies((prev) => {
      // Only auto-set when not actively being edited in human mode.
      if (isHuman && allowDevControls) return prev;
      return inferred;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressureTier, isHuman, allowDevControls]);

  useEffect(() => {
    if (isHuman && !allowDevControls) return;

    // Solace-neutral: always keep groups 1:1 with party size (0..6),
    // picked deterministically from a pressure-themed pool.
    const desired = clampInt(partySize, 0, 6);

    const pool = enemyPoolForPressure(pressureTier);
    const picked = pickDeterministicUnique(pool.length ? pool : ENEMY_GROUP_LIBRARY, desired, pressureSeed);

    setEnemyGroups((prev) => {
      // If human dev controls are allowed, don’t stomp their choices.
      if (isHuman && allowDevControls) return prev;
      return picked;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partySize, pressureTier, pressureSeed, isHuman, allowDevControls, ENEMY_GROUP_LIBRARY.join("|")]);

  function addEnemyGroup(name: string) {
    if (!canEdit) return;
    const v = normalizeName(name);
    if (!v) return;

    setEnemyGroups((prev) => {
      const next = uniqCaseInsensitive([...prev, v]);
      return next.slice(0, 6);
    });
  }

  function removeEnemyGroup(name: string) {
    if (!canEdit) return;
    const v = normalizeName(name);
    setEnemyGroups((prev) => prev.filter((g) => g.toLowerCase() !== v.toLowerCase()));
  }

  function clearEnemyGroups() {
    if (!canEdit) return;
    setEnemyGroups([]);
  }

  // -----------------------------
  // Derived combat display
  // -----------------------------

  const latestCombatId = useMemo(() => {
    return findLatestCombatId(events as any) ?? null;
  }, [events]);

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

  // Governance:
  // - In Solace-neutral, the PLAYER should not be manually “building combat”.
  // - Combat should be triggered by pressure + hostile intent elsewhere.
  // This panel supports dev-mode start, and human DM start.
  const canStartCombat = !locked && (isHuman || allowDevControls);

  function startCombatDeterministic() {
    if (!canStartCombat) return;

    const members = (partyMembers ?? []).slice(0, 6);
    if (members.length === 0) return;

    const desiredGroups = clampInt(members.length, 1, 6);
    const groups = uniqCaseInsensitive(enemyGroups).slice(0, desiredGroups);

    // If somehow empty, fall back to deterministic pick
    const ensuredGroups =
      groups.length > 0
        ? groups
        : pickDeterministicUnique(enemyPoolForPressure(pressureTier), desiredGroups, pressureSeed);

    const combatId = crypto.randomUUID();
    const seed = crypto.randomUUID();

    const participants: CombatantSpec[] = [];

    // Players come from PARTY (session truth)
    members.forEach((m, idx) => {
      const i1 = idx + 1;
      participants.push({
        id: normalizeName(m.id || `player_${i1}`) || `player_${i1}`,
        name: normalizeName(m.name || "") || `Player ${i1}`,
        kind: "player",
        initiativeMod: Math.trunc(Number(m.initiativeMod ?? 0)),
      });
    });

    // Enemy groups (Solace-owned unless human/dev)
    ensuredGroups.forEach((name, idx) => {
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
  // UI
  // -----------------------------

  return (
    <CardSection title="Combat (Deterministic, Grouped Enemies)">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
        <Pill tone="info">Event-sourced turn order</Pill>
        {locked ? <Pill tone="warn">🔒 Combat active — setup locked</Pill> : <Pill>Setup ready</Pill>}
        {!isHuman && !allowDevControls && <Pill tone="warn">Solace-owned setup</Pill>}
      </div>

      <p className="muted" style={{ marginTop: 10 }}>
        Players roll individually. Enemy groups roll once per group. Turn order is derived from events.
      </p>

      {!isHuman && !allowDevControls && (
        <div className="muted" style={{ marginTop: 10 }}>
          Combat materialization is derived from <strong>pressure + hostile intent</strong>. This panel shows the{" "}
          <strong>implicit</strong> setup Solace would use (1:1 enemy groups to party size), but does not allow manual
          “Start Combat” unless dev controls are enabled.
        </div>
      )}

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

          <ControlLabel label="Enemy group init mod (pressure-derived)">
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

          <div style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              Enemy groups{" "}
              <span className="muted" style={{ fontSize: 12 }}>
                (1:1 with party size)
              </span>
            </span>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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

              <button
                onClick={() => addEnemyGroup(enemyGroupSelect)}
                disabled={!canEdit}
                style={buttonStyle("primary", !canEdit)}
                title={!canEdit ? "Solace-owned (or combat locked)" : "Add enemy group"}
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

              <span className="muted" style={{ fontSize: 12 }}>
                (max 6)
              </span>
            </div>

            {enemyGroups.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
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
            ) : (
              <div className="muted" style={{ marginTop: 10 }}>
                No enemy groups. (Solace will normally pick these automatically.)
              </div>
            )}

            <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
              Pressure tier signal: <strong>{String(pressureTier ?? "unknown")}</strong>
            </div>
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

        <button
          onClick={advanceTurn}
          disabled={!derivedCombat}
          style={buttonStyle("ghost", !derivedCombat)}
        >
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
            Combat: <strong>{derivedCombat.combatId}</strong> · Round{" "}
            <strong>{derivedCombat.round}</strong>
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
