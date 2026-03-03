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

type Props = {
  events: readonly any[];
  onAppendCanon: (type: string, payload: any) => void;
};

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

function normalizeName(s: string) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName(): string {
  const a = [
    "Astra",
    "Kara",
    "Thorne",
    "Hex",
    "Rook",
    "Nyx",
    "Vex",
    "Dax",
    "Mara",
    "Rune",
    "Sable",
    "Orin",
    "Juno",
    "Kade",
    "Iris",
    "Zeph",
  ];
  const b = [
    "of Ember",
    "of Glass",
    "of Iron",
    "of Neon",
    "of Ash",
    "of Dawn",
    "of Night",
    "of the Grid",
    "the Quiet",
    "the Bold",
    "the Warden",
    "the Runner",
    "the Signal",
    "the Echo",
  ];
  const base = pick(a);
  const tail = pick([true, false, false]) ? ` ${pick(b)}` : "";
  return `${base}${tail}`;
}

// Locking rule (canon-based):
// - setup is editable until COMBAT_STARTED
// - stays locked until COMBAT_ENDED
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

export default function CombatSetupPanel({ events, onAppendCanon }: Props) {
  const locked = useMemo(() => computeCombatLocked(events), [events]);

  // -----------------------------
  // Setup state (owned here)
  // -----------------------------

  const [playerCount, setPlayerCount] = useState(4);

  // Always keep 6 slots; render first N
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", "", "", ""]);

  const [enemyGroups, setEnemyGroups] = useState<string[]>(["Skirmishers", "Archers"]);
  const [enemyGroupSelect, setEnemyGroupSelect] = useState<string>("Skirmishers");

  const [initModPlayers, setInitModPlayers] = useState(1);
  const [initModEnemies, setInitModEnemies] = useState(1);

  const PLAYER_COUNTS = [1, 2, 3, 4, 5, 6] as const;
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

  useEffect(() => {
    setPlayerNames((prev) => {
      const next = [...prev];
      while (next.length < 6) next.push("");
      return next.slice(0, 6);
    });
  }, []);

  function getEffectivePlayerName(i1Based: number) {
    const idx = i1Based - 1;
    const raw = playerNames[idx] ?? "";
    const name = normalizeName(raw);
    return name.length > 0 ? name : `Player ${i1Based}`;
  }

  function addEnemyGroup(name: string) {
    const v = normalizeName(name);
    if (!v) return;

    setEnemyGroups((prev) => {
      if (prev.map((x) => x.toLowerCase()).includes(v.toLowerCase())) return prev;
      if (prev.length >= 6) return prev;
      return [...prev, v];
    });
  }

  function removeEnemyGroup(name: string) {
    setEnemyGroups((prev) => prev.filter((g) => g !== name));
  }

  function clearEnemyGroups() {
    setEnemyGroups([]);
  }

  function randomizePlayerNames() {
    const pc = clampInt(playerCount, 1, 6);
    setPlayerNames((prev) => {
      const next = [...prev];
      while (next.length < 6) next.push("");

      const used = new Set<string>(next.map((x) => normalizeName(x).toLowerCase()).filter(Boolean));

      for (let i = 0; i < pc; i++) {
        const current = normalizeName(next[i] ?? "");
        if (current) continue;

        let tries = 0;
        let name = randomName();
        while (used.has(name.toLowerCase()) && tries < 12) {
          name = randomName();
          tries++;
        }
        used.add(name.toLowerCase());
        next[i] = name;
      }

      return next.slice(0, 6);
    });
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

  function startCombatDeterministic() {
    if (locked) return;

    const pc = clampInt(playerCount, 1, 6);

    const groups = enemyGroups
      .map((g) => normalizeName(g))
      .filter(Boolean)
      .slice(0, 6);

    const combatId = crypto.randomUUID();
    const seed = crypto.randomUUID(); // deterministic within this combat once committed

    const participants: CombatantSpec[] = [];

    for (let i = 1; i <= pc; i++) {
      participants.push({
        id: `player_${i}`,
        name: getEffectivePlayerName(i),
        kind: "player",
        initiativeMod: Math.trunc(initModPlayers || 0),
      });
    }

    groups.forEach((name, idx) => {
      participants.push({
        id: `enemy_group_${idx + 1}`,
        name,
        kind: "enemy_group",
        initiativeMod: Math.trunc(initModEnemies || 0),
      });
    });

    const started: CombatStartedPayload = { combatId, seed, participants };
    const initRolls = generateDeterministicInitiativeRolls(started);

    onAppendCanon("COMBAT_STARTED", started);

    for (const r of initRolls) {
      onAppendCanon("INITIATIVE_ROLLED", r);
    }

    // pointer at round 1, index 0
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
      <p className="muted" style={{ marginTop: 0 }}>
        Players roll individually. Enemy groups roll once per group. Turn order is derived from events.
      </p>

      {locked && (
        <p className="muted" style={{ marginTop: 0 }}>
          🔒 Combat is active. Setup is locked to preserve replay integrity.
        </p>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Players (1–6):
          <select
            value={playerCount}
            disabled={locked}
            onChange={(e) => setPlayerCount(clampInt(Number(e.target.value), 1, 6))}
            style={{ minWidth: 140 }}
          >
            {PLAYER_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Player init mod:
          <select
            value={initModPlayers}
            disabled={locked}
            onChange={(e) => setInitModPlayers(Math.trunc(Number(e.target.value)))}
            style={{ minWidth: 140 }}
          >
            {INIT_MODS.map((n) => (
              <option key={n} value={n}>
                {n >= 0 ? `+${n}` : `${n}`}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Enemy group init mod:
          <select
            value={initModEnemies}
            disabled={locked}
            onChange={(e) => setInitModEnemies(Math.trunc(Number(e.target.value)))}
            style={{ minWidth: 170 }}
          >
            {INIT_MODS.map((n) => (
              <option key={n} value={n}>
                {n >= 0 ? `+${n}` : `${n}`}
              </option>
            ))}
          </select>
        </label>

        <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="muted">Enemy groups</span>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={enemyGroupSelect}
              disabled={locked}
              onChange={(e) => setEnemyGroupSelect(e.target.value)}
              style={{ minWidth: 220 }}
            >
              {ENEMY_GROUP_LIBRARY.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <button onClick={() => addEnemyGroup(enemyGroupSelect)} disabled={locked}>
              Add
            </button>

            <button onClick={clearEnemyGroups} disabled={locked || enemyGroups.length === 0}>
              Clear
            </button>

            <span className="muted" style={{ fontSize: 12 }}>
              (max 6)
            </span>
          </div>

          {enemyGroups.length > 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {enemyGroups.map((g) => (
                <span
                  key={g}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  <span>{g}</span>
                  <button
                    onClick={() => removeEnemyGroup(g)}
                    disabled={locked}
                    aria-label={`Remove ${g}`}
                    style={{
                      padding: "0 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 8 }}>
              No enemy groups yet. Add one.
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <strong>Players</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={randomizePlayerNames} disabled={locked}>
              🎲 Random names
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {Array.from({ length: clampInt(playerCount, 1, 6) }, (_, idx) => {
            const i1 = idx + 1;
            const value = playerNames[idx] ?? "";
            return (
              <label key={i1} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="muted">Player {i1} name (optional)</span>
                <input
                  value={value}
                  disabled={locked}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPlayerNames((prev) => {
                      const next = [...prev];
                      while (next.length < 6) next.push("");
                      next[idx] = v;
                      return next.slice(0, 6);
                    });
                  }}
                  placeholder={`Player ${i1}`}
                />
              </label>
            );
          })}
        </div>

        <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
          Blank names will display as “Player 1…N”. Names are used for initiative labels and canon readability.
        </p>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={startCombatDeterministic} disabled={locked}>
          Start Combat (Seeded)
        </button>

        <button onClick={advanceTurn} disabled={!derivedCombat}>
          Advance Turn
        </button>

        <button onClick={endCombat} disabled={!locked}>
          End Combat
        </button>
      </div>

      {derivedCombat && (
        <div style={{ marginTop: 12 }}>
          <div className="muted">
            Combat: <strong>{derivedCombat.combatId}</strong> · Round <strong>{derivedCombat.round}</strong>
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
            {derivedCombat.order.map((id: string, idx: number) => {
              const spec = derivedCombat.participants.find((p: any) => p.id === id) ?? null;
              const roll = derivedCombat.initiative.find((r: any) => r.combatantId === id) ?? null;
              const active = derivedCombat.activeCombatantId === id;

              return (
                <div
                  key={id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: active ? "1px solid rgba(138,180,255,0.55)" : "1px solid rgba(255,255,255,0.10)",
                    background: active ? "rgba(138,180,255,0.10)" : "rgba(255,255,255,0.04)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div>
                    <strong>
                      {idx + 1}. {spec ? formatCombatantLabel(spec) : id}
                    </strong>
                    {active && <span className="muted">{"  "}← active</span>}
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
