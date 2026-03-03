"use client";

import { useMemo } from "react";
import CardSection from "@/components/layout/CardSection";
import { clampInt } from "@/lib/utils/clampInt"; // If you don't have this util, delete this import + use local clamp below.

// NOTE: If you don't have "@/lib/utils/clampInt", replace with this local helper:
// function clampInt(n: number, min: number, max: number) {
//   const x = Number.isFinite(n) ? Math.trunc(n) : min;
//   return Math.max(min, Math.min(max, x));
// }

type Props = {
  locked: boolean;

  playerCount: number;
  setPlayerCount: (n: number) => void;

  playerNames: string[];
  setPlayerNames: (next: string[]) => void;
  randomizePlayerNames: () => void;

  enemyGroups: string[];
  enemyGroupSelect: string;
  setEnemyGroupSelect: (v: string) => void;
  addEnemyGroup: (name: string) => void;
  removeEnemyGroup: (name: string) => void;
  clearEnemyGroups: () => void;

  initModPlayers: number;
  setInitModPlayers: (n: number) => void;

  initModEnemies: number;
  setInitModEnemies: (n: number) => void;

  PLAYER_COUNTS: readonly number[];
  INIT_MODS: readonly number[];
  ENEMY_GROUP_LIBRARY: readonly string[];

  onStartCombat: () => void;
  onAdvanceTurn: () => void;
  onEndCombat: () => void;

  derivedCombat: any | null;

  formatCombatantLabel: (spec: any) => string;
};

function localClampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

export default function CombatSetupPanel(props: Props) {
  const {
    locked,
    playerCount,
    setPlayerCount,
    playerNames,
    setPlayerNames,
    randomizePlayerNames,
    enemyGroups,
    enemyGroupSelect,
    setEnemyGroupSelect,
    addEnemyGroup,
    removeEnemyGroup,
    clearEnemyGroups,
    initModPlayers,
    setInitModPlayers,
    initModEnemies,
    setInitModEnemies,
    PLAYER_COUNTS,
    INIT_MODS,
    ENEMY_GROUP_LIBRARY,
    onStartCombat,
    onAdvanceTurn,
    onEndCombat,
    derivedCombat,
    formatCombatantLabel,
  } = props;

  // In case clampInt util isn’t present, fall back.
  const clamp = useMemo(() => {
    try {
      return clampInt;
    } catch {
      return localClampInt;
    }
  }, []);

  const pc = clamp(playerCount, 1, 6);

  return (
    <CardSection title="Combat (Deterministic, Grouped Enemies)">
      <p className="muted" style={{ marginTop: 0 }}>
        Players roll individually. Enemy groups roll once per group. Turn order is derived from events.
      </p>

      {locked && (
        <p className="muted" style={{ marginTop: 0 }}>
          🔒 Combat is active. Setup is locked to preserve replay integrity. End combat to reconfigure.
        </p>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Players (1–6):
          <select
            value={playerCount}
            disabled={locked}
            onChange={(e) => setPlayerCount(clamp(Number(e.target.value), 1, 6))}
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

      {/* Player Names */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <strong>Players</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={randomizePlayerNames} disabled={locked}>
              🎲 Random names
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {Array.from({ length: pc }, (_, idx) => {
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
                    setPlayerNames(
                      (() => {
                        const next = [...playerNames];
                        next[idx] = v;
                        while (next.length < 6) next.push("");
                        return next.slice(0, 6);
                      })()
                    );
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
        <button onClick={onStartCombat} disabled={locked}>
          Start Combat (Seeded)
        </button>
        <button onClick={onAdvanceTurn} disabled={!derivedCombat}>
          Advance Turn
        </button>
        <button onClick={onEndCombat} disabled={!locked}>
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
                  <div className="muted">{roll ? `Init ${roll.total} (d20 ${roll.natural} + ${roll.modifier})` : "Init —"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CardSection>
  );
}
