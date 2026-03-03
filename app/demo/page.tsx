"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// Invariants:
// - Player declares intent
// - Solace prepares initial table (non-canonical)
// - Dice decide fate
// - Solace narrates outcomes (non-authoritative)
// - Arbiter commits canon
//
// Additions in this version:
// - Grouped-enemy initiative combat loop (deterministic, replayable)
// - Turn advancement (derived, event-sourced)
//
// UI upgrades in this version:
// - Dropdowns for player count + init mods
// - Optional player names (defaults to Player 1..N)
// - Enemy groups as dropdown + add/remove chips (no comma-typing)
//
// NEW in this version:
// - Exploration + Fog-of-War Map Reveal (event-sourced)
//   - PLAYER_MOVED (arbiter-only canon)
//   - MAP_REVEALED (arbiter-only canon)
//
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { createSession, recordEvent, SessionState } from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";

import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import NextActionHint from "@/components/NextActionHint";
import WorldLedgerPanelLegacy from "@/components/world/WorldLedgerPanel.legacy";
import DungeonPressurePanel from "@/components/world/DungeonPressurePanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

import {
  CombatStartedPayload,
  CombatantSpec,
  deriveCombatState,
  findLatestCombatId,
  formatCombatantLabel,
  generateDeterministicInitiativeRolls,
  nextTurnPointer,
} from "@/lib/combat/CombatState";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type DMMode = "human" | "solace-neutral";

type OptionKind = "safe" | "environmental" | "risky" | "contested";

type InitialTable = {
  openingFrame: string;
  locationTraits: string[];
  latentFactions: {
    name: string;
    desire: string;
    pressure: string;
  }[];
  environmentalOddities: string[];
  dormantHooks: string[];
};

// Keep local dice types aligned with ResolutionDraftAdvisoryPanel
type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

// ------------------------------------------------------------
// Exploration / Map (event-sourced)
// ------------------------------------------------------------

type XY = { x: number; y: number };

type PlayerMovedPayload = {
  from: XY;
  to: XY;
};

type MapRevealedPayload = {
  tiles: XY[];
};

function keyXY(p: XY) {
  return `${p.x},${p.y}`;
}

function withinBounds(p: XY, w: number, h: number) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

function revealRadius(center: XY, radius: number, w: number, h: number): XY[] {
  const out: XY[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const p = { x: center.x + dx, y: center.y + dy };
      if (withinBounds(p, w, h)) out.push(p);
    }
  }
  return out;
}

function deriveMapState(events: any[], w: number, h: number) {
  // Deterministic start: middle of the grid
  let position: XY = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
  const discovered = new Set<string>();

  // Always reveal start tile
  discovered.add(keyXY(position));

  for (const e of events) {
    if (e?.type === "PLAYER_MOVED") {
      const p = e.payload as PlayerMovedPayload;
      if (p?.to && withinBounds(p.to, w, h)) {
        position = { x: p.to.x, y: p.to.y };
        discovered.add(keyXY(position));
      }
    }

    if (e?.type === "MAP_REVEALED") {
      const p = e.payload as MapRevealedPayload;
      const tiles = Array.isArray(p?.tiles) ? p.tiles : [];
      for (const t of tiles) {
        if (t && withinBounds(t, w, h)) discovered.add(keyXY(t));
      }
    }
  }

  return { position, discovered };
}

// ------------------------------------------------------------
// Random helpers (deterministic per load, different each time)
// ------------------------------------------------------------

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickManyUnique<T>(arr: T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (pool.length > 0 && out.length < count) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

function normalizeName(s: string) {
  return s.replace(/\s+/g, " ").trim();
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

function generateInitialTable(): InitialTable {
  const factionNames = [
    "The Whisperers",
    "The Vaultwardens",
    "The Ash Circle",
    "The Night Ledger",
    "The Bell-Silent",
    "The Cobble Court",
  ];

  const desires = [
    "control what sleeps below",
    "seal the vaults forever",
    "profit from forbidden knowledge",
    "redeem an ancient failure",
    "expose the truth no matter the cost",
    "keep the city calm at any price",
  ];

  const pressures = [
    "time is running out",
    "someone is leaking secrets",
    "an old oath is failing",
    "a rival faction is moving first",
    "witnesses keep vanishing",
    "the city above is starting to notice",
  ];

  const factionCount = pick([2, 3, 3]); // bias slightly toward 3
  const chosenNames = pickManyUnique(factionNames, factionCount);

  return {
    openingFrame: pick([
      "A low fog coils between narrow streets as evening bells fade.",
      "Rain-dark stone reflects lanternlight in uneasy patterns.",
      "Voices echo where they shouldn’t, carrying fragments of argument.",
      "The city hums, unaware of the pressure building beneath it.",
    ]),
    locationTraits: [
      pick(["crowded", "echoing", "claustrophobic", "uneasily quiet"]),
      pick(["ancient stone", "rotting wood", "slick cobblestone"]),
    ],
    latentFactions: chosenNames.map((name) => ({
      name,
      desire: pick(desires),
      pressure: pick(pressures),
    })),
    environmentalOddities: [
      pick([
        "Lantern flames gutter without wind",
        "Stone walls seem to absorb sound",
        "Whispers surface near old drains",
        "Footsteps echo twice",
      ]),
    ],
    dormantHooks: [
      pick([
        "A name scratched into stone repeats across districts",
        "A missing city clerk last seen near the underways",
        "A sealed door recently disturbed",
      ]),
    ],
  };
}

// ------------------------------------------------------------
// Table narration renderer (NON-CANONICAL)
// - Uses ONLY provided table signals
// - Adds connective tissue / table-play voice
// - Does NOT add new facts (no new NPCs, no new places, no new events)
// ------------------------------------------------------------

function renderInitialTableNarration(t: InitialTable): string {
  const [traitA, traitB] = t.locationTraits;
  const oddity = t.environmentalOddities[0] ?? "Something feels off";
  const hook = t.dormantHooks[0] ?? "A sign repeats";
  const factions = t.latentFactions;

  const lines: string[] = [];

  // Opening (keep the exact first line, then make it playable)
  lines.push(t.openingFrame);

  // Traits become sensory framing (no new facts; just voice)
  lines.push(`The place feels ${traitA}, and the air carries the stink of ${traitB}.`);

  // Oddity becomes immediate table tension
  if (/footsteps echo twice/i.test(oddity)) {
    lines.push(
      "Every step answers itself — once, then again — like the street remembers you a beat too late."
    );
  } else if (/lantern/i.test(oddity.toLowerCase())) {
    lines.push("Lanternlight can’t decide what it wants to be — steady one second, starving the next.");
  } else if (/absorb sound/i.test(oddity.toLowerCase())) {
    lines.push("Sound doesn’t travel right. Words die early, like the walls are swallowing them.");
  } else if (/whispers/i.test(oddity.toLowerCase())) {
    lines.push(
      "You keep catching whispers at the edge of hearing — not loud enough to understand, not quiet enough to ignore."
    );
  } else {
    lines.push(`${oddity}.`);
  }

  // Factions (multiple) — presented as pressure vectors
  if (factions.length > 0) {
    lines.push("There are pressures under the surface:");
    factions.forEach((f) => {
      lines.push(`• ${f.name} want to ${f.desire} — but ${f.pressure}.`);
    });
  }

  // Hook as the “why now”
  lines.push(`${hook}.`);
  lines.push("That repetition feels deliberate. And it feels recent.");

  return lines.join("\n\n");
}

// ------------------------------------------------------------
// Difficulty inference (language-only)
// ------------------------------------------------------------

function inferOptionKind(description: string): OptionKind {
  const text = description.toLowerCase();

  if (
    text.includes("attack") ||
    text.includes("fight") ||
    text.includes("oppose") ||
    text.includes("contest")
  ) {
    return "contested";
  }

  if (
    text.includes("climb") ||
    text.includes("cross") ||
    text.includes("navigate") ||
    text.includes("environment")
  ) {
    return "environmental";
  }

  if (text.includes("steal") || text.includes("sneak") || text.includes("risk")) {
    return "risky";
  }

  return "safe";
}

// ------------------------------------------------------------

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));

  const [dmMode, setDmMode] = useState<DMMode>("solace-neutral");

  // Initial Table Gate
  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);

  // Editable narration buffer (DM-controlled)
  const [tableDraftText, setTableDraftText] = useState("");

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  // ----------------------------------------------------------
  // Exploration map (MVP)
  // ----------------------------------------------------------

  const MAP_W = 13;
  const MAP_H = 9;

  const derivedMap = useMemo(() => {
    return deriveMapState(state.events as any[], MAP_W, MAP_H);
  }, [state.events]);

  function recordPlayerMoved(to: XY) {
    const from = derivedMap.position;

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "PLAYER_MOVED",
        payload: {
          from,
          to,
        } as PlayerMovedPayload,
      })
    );
  }

  function recordMapRevealed(tiles: XY[]) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "MAP_REVEALED",
        payload: {
          tiles,
        } as MapRevealedPayload,
      })
    );
  }

  function moveAndReveal(to: XY) {
    recordPlayerMoved(to);
    recordMapRevealed(revealRadius(to, 1, MAP_W, MAP_H));
  }

  // ----------------------------------------------------------
  // Combat demo inputs (upgraded UX)
  // ----------------------------------------------------------

  const [playerCount, setPlayerCount] = useState(4);

  // Player names indexed 0..5 (we render only first N)
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", "", "", ""]);

  // Enemy groups as chips
  const [enemyGroups, setEnemyGroups] = useState<string[]>(["Skirmishers", "Archers"]);
  const [enemyGroupSelect, setEnemyGroupSelect] = useState<string>("Skirmishers");

  // Init mods
  const [initModPlayers, setInitModPlayers] = useState(1);
  const [initModEnemies, setInitModEnemies] = useState(1);

  const PLAYER_COUNTS = [1, 2, 3, 4, 5, 6] as const;
  const INIT_MODS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

  // Enemy group archetypes (classic + Tron-ish)
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

  // Ensure playerNames always has length 6
  useEffect(() => {
    setPlayerNames((prev) => {
      if (prev.length === 6) return prev;
      const next = [...prev];
      while (next.length < 6) next.push("");
      return next.slice(0, 6);
    });
  }, []);

  // ----------------------------------------------------------
  // Generate table ONCE per session
  // ----------------------------------------------------------

  useEffect(() => {
    if (initialTable) return;

    // Generate for BOTH modes
    if (dmMode === "solace-neutral" || dmMode === "human") {
      setInitialTable(generateInitialTable());
    }
  }, [dmMode, initialTable]);

  // ----------------------------------------------------------
  // When table exists, generate playable narration (once),
  // then allow DM edits.
  // ----------------------------------------------------------

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  useEffect(() => {
    if (!initialTable) return;

    // Seed editable draft only if empty (no overwriting DM edits)
    if (tableDraftText.trim() === "") {
      setTableDraftText(renderedTableNarration);
    }
  }, [initialTable, renderedTableNarration, tableDraftText]);

  // ----------------------------------------------------------
  // If user switches modes:
  // - Solace: gate applies
  // - Human: DO NOT auto-accept
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode === "solace-neutral") {
      setTableAccepted(false);
    }
    // ❗ intentionally no auto-accept for human
  }, [dmMode]);

  // ----------------------------------------------------------
  // Player submits action
  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
  }

  // ----------------------------------------------------------
  // Solace silently selects option when facilitating
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;

    setSelectedOption(options[0]);
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // Record canon
  // ----------------------------------------------------------

  function handleRecord(payload: {
    description: string;
    dice: {
      mode: DiceMode;
      roll: number;
      dc: number;
      source: RollSource;
    };
    audit: string[];
  }) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload,
      })
    );
  }

  // ----------------------------------------------------------
  // Share canon
  // ----------------------------------------------------------

  function shareCanon() {
    navigator.clipboard.writeText(exportCanon(state.events));
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------
  // Combat helpers (demo)
  // ----------------------------------------------------------

  const latestCombatId = useMemo(() => {
    return findLatestCombatId(state.events as any) ?? null;
  }, [state.events]);

  const derivedCombat = useMemo(() => {
    if (!latestCombatId) return null;
    return deriveCombatState(latestCombatId, state.events as any);
  }, [latestCombatId, state.events]);

  function getEffectivePlayerName(i1Based: number) {
    const idx = i1Based - 1;
    const raw = playerNames[idx] ?? "";
    const name = normalizeName(raw);
    return name.length > 0 ? name : `Player ${i1Based}`;
  }

  function startCombatDeterministic() {
    const pc = clampInt(playerCount, 1, 6);

    const groups = enemyGroups
      .map((g) => normalizeName(g))
      .filter(Boolean)
      .slice(0, 6);

    const combatId = crypto.randomUUID();
    const seed = crypto.randomUUID(); // deterministic within-combat once committed

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
      const id = `enemy_group_${idx + 1}`;
      participants.push({
        id,
        name,
        kind: "enemy_group",
        initiativeMod: Math.trunc(initModEnemies || 0),
      });
    });

    const started: CombatStartedPayload = {
      combatId,
      seed,
      participants,
    };

    const initRolls = generateDeterministicInitiativeRolls(started);

    setState((prev) => {
      let next = prev;

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "COMBAT_STARTED",
        payload: started as any,
      });

      for (const r of initRolls) {
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "INITIATIVE_ROLLED",
          payload: r as any,
        });
      }

      // Initialize pointer at round 1, index 0
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "TURN_ADVANCED",
        payload: {
          combatId,
          round: 1,
          index: 0,
        } as any,
      });

      return next;
    });
  }

  function advanceTurn() {
    if (!derivedCombat) return;
    const payload = nextTurnPointer(derivedCombat);

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "TURN_ADVANCED",
        payload: payload as any,
      })
    );
  }

  // Enemy group builder actions
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
      const used = new Set<string>(next.map((x) => normalizeName(x).toLowerCase()).filter(Boolean));

      for (let i = 0; i < pc; i++) {
        const current = normalizeName(next[i] ?? "");
        if (current) continue;

        // Avoid duplicates (best-effort)
        let tries = 0;
        let name = randomName();
        while (used.has(name.toLowerCase()) && tries < 12) {
          name = randomName();
          tries++;
        }
        used.add(name.toLowerCase());
        next[i] = name;
      }

      // Leave remaining slots untouched (for when pc increases later)
      return next.slice(0, 6);
    });
  }

  const isHumanDM = dmMode === "human";

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <StewardedShell>
      <ModeHeader
        title="Stewarded Play — Full Flow"
        onShare={shareCanon}
        roles={[
          { label: "Player", description: "Declares intent" },
          { label: "Solace", description: "Prepares the resolution and narrates outcome" },
          { label: "Arbiter", description: "Commits canon" },
        ]}
      />

      {/* FACILITATION MODE */}
      <CardSection title="Facilitation Mode">
        <label>
          <input type="radio" checked={dmMode === "human"} onChange={() => setDmMode("human")} />{" "}
          Human DM (options visible + editable setup)
        </label>
        <br />
        <label>
          <input
            type="radio"
            checked={dmMode === "solace-neutral"}
            onChange={() => setDmMode("solace-neutral")}
          />{" "}
          Solace (Neutral Facilitator)
        </label>
      </CardSection>

      {/* INITIAL TABLE GATE — SOLACE */}
      {dmMode === "solace-neutral" && initialTable && !tableAccepted && (
        <CardSection title="Initial Table (Solace)">
          <p className="muted" style={{ marginBottom: 8 }}>
            Table-play narration (finalized):
          </p>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              background: "rgba(0,0,0,0.25)",
              padding: "16px",
              borderRadius: "6px",
            }}
          >
            {tableDraftText}
          </div>

          <details style={{ marginTop: 12 }}>
            <summary className="muted">Show underlying table signals</summary>
            <div style={{ marginTop: 10 }}>
              <p>{initialTable.openingFrame}</p>

              <p className="muted">Traits: {initialTable.locationTraits.join(", ")}</p>

              <ul>
                {initialTable.latentFactions.map((f, i) => (
                  <li key={i}>
                    <strong>{f.name}</strong> — {f.desire} ({f.pressure})
                  </li>
                ))}
              </ul>

              <p className="muted">Oddity: {initialTable.environmentalOddities.join(", ")}</p>

              <p className="muted">Hook: {initialTable.dormantHooks.join(", ")}</p>
            </div>
          </details>

          <div style={{ marginTop: 10 }}>
            <button onClick={() => setTableAccepted(true)}>Accept Table</button>
          </div>
        </CardSection>
      )}

      {/* HUMAN DM: editable table (AUTO-GENERATED) */}
      {dmMode === "human" && initialTable && !tableAccepted && (
        <CardSection title="Solace Setup Helper (Optional)">
          <p className="muted" style={{ marginTop: 0 }}>
            If you want a fast-start table, edit it, then run the game.
          </p>

          <textarea
            rows={10}
            value={tableDraftText}
            onChange={(e) => setTableDraftText(e.target.value)}
            style={{ width: "100%" }}
          />

          <details style={{ marginTop: 12 }}>
            <summary className="muted">Show underlying table signals</summary>
            <div style={{ marginTop: 10 }}>
              <p>{initialTable.openingFrame}</p>

              <p className="muted">Traits: {initialTable.locationTraits.join(", ")}</p>

              <ul>
                {initialTable.latentFactions.map((f, i) => (
                  <li key={i}>
                    <strong>{f.name}</strong> — {f.desire} ({f.pressure})
                  </li>
                ))}
              </ul>

              <p className="muted">Oddity: {initialTable.environmentalOddities.join(", ")}</p>

              <p className="muted">Hook: {initialTable.dormantHooks.join(", ")}</p>
            </div>
          </details>

          <div style={{ marginTop: 10 }}>
            <button onClick={() => setTableAccepted(true)}>Accept Table</button>
          </div>
        </CardSection>
      )}

      {/* BLOCK PLAY UNTIL ACCEPTED */}
      {dmMode === "solace-neutral" && !tableAccepted && <Disclaimer />}

      {/* GAME FLOW */}
      {(dmMode === "human" || tableAccepted) && (
        <>
          <DungeonPressurePanel
            turn={state.events.filter((e) => e.type === "OUTCOME").length}
            events={state.events}
          />

          {/* EXPLORATION MAP (MVP) */}
          <CardSection title="Exploration Map (Fog-of-War)">
            <p className="muted" style={{ marginTop: 0 }}>
              Arbiter-only: movement + reveal are canon events (append-only). The map is derived from events.
            </p>

            <div className="muted" style={{ marginBottom: 10 }}>
              Position: <strong>({derivedMap.position.x},{derivedMap.position.y})</strong> · Discovered:{" "}
              <strong>{derivedMap.discovered.size}</strong>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              {/* Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${MAP_W}, 22px)`,
                  gap: 4,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                {Array.from({ length: MAP_W * MAP_H }, (_, i) => {
                  const x = i % MAP_W;
                  const y = Math.floor(i / MAP_W);
                  const here = derivedMap.position.x === x && derivedMap.position.y === y;
                  const seen = derivedMap.discovered.has(`${x},${y}`);

                  return (
                    <div
                      key={`${x},${y}`}
                      title={seen ? `(${x},${y})` : "Unknown"}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: here
                          ? "1px solid rgba(138,180,255,0.65)"
                          : "1px solid rgba(255,255,255,0.10)",
                        background: !seen
                          ? "rgba(0,0,0,0.55)" // fog
                          : here
                            ? "rgba(138,180,255,0.18)"
                            : "rgba(255,255,255,0.06)",
                      }}
                    />
                  );
                })}
              </div>

              {/* Controls */}
              <div style={{ minWidth: 260 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => recordMapRevealed(revealRadius(derivedMap.position, 1, MAP_W, MAP_H))}
                  >
                    Reveal (radius 1)
                  </button>
                  <button
                    onClick={() => recordMapRevealed(revealRadius(derivedMap.position, 2, MAP_W, MAP_H))}
                  >
                    Reveal (radius 2)
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="muted" style={{ marginBottom: 8 }}>
                    Move (commits PLAYER_MOVED + MAP_REVEALED radius 1)
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 70px)", gap: 8 }}>
                    <span />
                    <button
                      onClick={() => {
                        const to = { x: derivedMap.position.x, y: derivedMap.position.y - 1 };
                        if (withinBounds(to, MAP_W, MAP_H)) moveAndReveal(to);
                      }}
                    >
                      ↑
                    </button>
                    <span />

                    <button
                      onClick={() => {
                        const to = { x: derivedMap.position.x - 1, y: derivedMap.position.y };
                        if (withinBounds(to, MAP_W, MAP_H)) moveAndReveal(to);
                      }}
                    >
                      ←
                    </button>

                    <button disabled style={{ opacity: 0.5 }}>
                      •
                    </button>

                    <button
                      onClick={() => {
                        const to = { x: derivedMap.position.x + 1, y: derivedMap.position.y };
                        if (withinBounds(to, MAP_W, MAP_H)) moveAndReveal(to);
                      }}
                    >
                      →
                    </button>

                    <span />
                    <button
                      onClick={() => {
                        const to = { x: derivedMap.position.x, y: derivedMap.position.y + 1 };
                        if (withinBounds(to, MAP_W, MAP_H)) moveAndReveal(to);
                      }}
                    >
                      ↓
                    </button>
                    <span />
                  </div>

                  <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
                    MVP grid now. Later we can evolve to rooms + corridors or a node graph without breaking replay.
                  </p>
                </div>
              </div>
            </div>
          </CardSection>

          {/* COMBAT (DEMO) */}
          <CardSection title="Combat (Deterministic, Grouped Enemies)">
            <p className="muted" style={{ marginTop: 0 }}>
              Players roll individually. Enemy groups roll once per group. Turn order is derived from events.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                Players (1–6):
                <select
                  value={playerCount}
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
                    onChange={(e) => setEnemyGroupSelect(e.target.value)}
                    style={{ minWidth: 220 }}
                  >
                    {ENEMY_GROUP_LIBRARY.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => addEnemyGroup(enemyGroupSelect)}>Add</button>
                  <button onClick={clearEnemyGroups} disabled={enemyGroups.length === 0}>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <strong>Players</strong>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={randomizePlayerNames}>🎲 Random names</button>
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
                        onChange={(e) => {
                          const v = e.target.value;
                          setPlayerNames((prev) => {
                            const next = [...prev];
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
                Blank names will display as “Player 1…N”. Names are used for initiative labels and canon
                readability.
              </p>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button onClick={startCombatDeterministic}>Start Combat (Seeded)</button>
              <button onClick={advanceTurn} disabled={!derivedCombat}>
                Advance Turn
              </button>
            </div>

            {derivedCombat && (
              <div style={{ marginTop: 12 }}>
                <div className="muted">
                  Combat: <strong>{derivedCombat.combatId}</strong> · Round{" "}
                  <strong>{derivedCombat.round}</strong>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 6,
                  }}
                >
                  {derivedCombat.order.map((id, idx) => {
                    const spec = derivedCombat.participants.find((p) => p.id === id) ?? null;
                    const roll = derivedCombat.initiative.find((r) => r.combatantId === id) ?? null;

                    const active = derivedCombat.activeCombatantId === id;

                    return (
                      <div
                        key={id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: active
                            ? "1px solid rgba(138,180,255,0.55)"
                            : "1px solid rgba(255,255,255,0.10)",
                          background: active
                            ? "rgba(138,180,255,0.10)"
                            : "rgba(255,255,255,0.04)",
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

          <CardSection title="Player Action">
            <textarea
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              placeholder="Describe what your character does…"
              style={{
                width: "100%",
                minHeight: "120px",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
            <div style={{ marginTop: 8 }}>
              <button onClick={handlePlayerAction}>Submit Action</button>
            </div>
          </CardSection>

          {parsed && (
            <CardSection title="Parsed Action">
              <pre>{JSON.stringify(parsed, null, 2)}</pre>
            </CardSection>
          )}

          {options && isHumanDM && (
            <CardSection title="Options">
              <ul>
                {options.map((opt) => (
                  <li key={opt.id}>
                    <button onClick={() => setSelectedOption(opt)}>{opt.description}</button>
                  </li>
                ))}
              </ul>
            </CardSection>
          )}

          {selectedOption && (
            <ResolutionDraftAdvisoryPanel
              role={role}
              context={{
                optionDescription: selectedOption.description,
                optionKind: inferOptionKind(selectedOption.description),
              }}
              onRecord={handleRecord}
            />
          )}

          <NextActionHint state={state} />
          <WorldLedgerPanelLegacy events={state.events} />
        </>
      )}

      <Disclaimer />
    </StewardedShell>
  );
}
