"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// FIXED EXPLORATION GOVERNANCE:
// - Map is read-only (canon view)
// - After player intent + option selection, we AUTO-DRAFT exploration canon:
//     PLAYER_MOVED / MAP_REVEALED / MAP_MARKED
// - Arbiter commits the bundle alongside OUTCOME (one click)
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
import ExplorationMapPanel, { MapMarkKind } from "@/components/world/ExplorationMapPanel";

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

type XY = { x: number; y: number };

// ------------------------------------------------------------
// CanonEventsPanel (inline; non-OUTCOME canon ledger)
// ------------------------------------------------------------

type CanonPanelProps = {
  events: readonly any[];
};

function fmtXY(xy: any) {
  if (!xy || typeof xy.x !== "number" || typeof xy.y !== "number") return "(?,?)";
  return `(${xy.x},${xy.y})`;
}

function renderCanonEventLine(e: any) {
  const p: any = e?.payload;

  switch (e?.type) {
    case "PLAYER_MOVED": {
      const from = fmtXY(p?.from);
      const to = fmtXY(p?.to);
      return `🧭 Move ${from} → ${to}`;
    }
    case "MAP_REVEALED": {
      const tiles = Array.isArray(p?.tiles) ? p.tiles : [];
      const n = tiles.length;
      return `🗺️ Reveal ${n} tile${n === 1 ? "" : "s"}`;
    }
    case "MAP_MARKED": {
      const at = fmtXY(p?.at);
      const kind = typeof p?.kind === "string" ? p.kind : "mark";
      const note = typeof p?.note === "string" && p.note.trim() ? ` — ${p.note.trim()}` : "";
      return `📍 Mark ${kind} at ${at}${note}`;
    }
    case "COMBAT_STARTED": {
      const combatId = p?.combatId ? String(p.combatId) : "(unknown)";
      const participants = Array.isArray(p?.participants) ? p.participants.length : 0;
      return `⚔️ Combat started (${combatId}) — ${participants} participants`;
    }
    case "INITIATIVE_ROLLED": {
      const who = p?.combatantId ? String(p.combatantId) : "(combatant)";
      const total = typeof p?.total === "number" ? p.total : "?";
      const natural = typeof p?.natural === "number" ? p.natural : "?";
      const mod = typeof p?.modifier === "number" ? p.modifier : "?";
      return `🎲 Initiative ${who}: ${total} (d20 ${natural} + ${mod})`;
    }
    case "TURN_ADVANCED": {
      const combatId = p?.combatId ? String(p.combatId) : "(combat)";
      const round = typeof p?.round === "number" ? p.round : "?";
      const index = typeof p?.index === "number" ? p.index : "?";
      return `⏭️ Turn advanced — ${combatId} (round ${round}, index ${index})`;
    }
    default: {
      const safe = (() => {
        try {
          return JSON.stringify(p ?? {}, null, 0);
        } catch {
          return "{}";
        }
      })();
      return `• ${String(e?.type ?? "UNKNOWN")} ${safe !== "{}" ? `— ${safe}` : ""}`;
    }
  }
}

function CanonEventsPanel({ events }: CanonPanelProps) {
  const canon = (events ?? []).filter((e: any) => e?.type !== "OUTCOME");

  return (
    <CardSection title="Canon Events">
      {canon.length === 0 ? (
        <p className="muted">No canon events yet.</p>
      ) : (
        <ul>
          {canon.map((e: any) => (
            <li key={e.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{renderCanonEventLine(e)}</strong>
                  <div className="muted" style={{ marginTop: 4 }}>
                    actor: {e.actor} · type: {e.type}
                  </div>
                </div>
                <div className="muted" style={{ whiteSpace: "nowrap" }}>
                  {typeof e.timestamp === "number" ? new Date(e.timestamp).toLocaleTimeString() : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}

// ------------------------------------------------------------
// Random helpers
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

// ------------------------------------------------------------
// Exploration derivation + drafting helpers (local to demo)
// ------------------------------------------------------------

function withinBounds(p: XY, w: number, h: number) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

function deriveCurrentPosition(events: readonly any[], w: number, h: number): XY {
  let pos: XY = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
  for (const e of events) {
    if (e?.type === "PLAYER_MOVED") {
      const to = e?.payload?.to;
      if (to && typeof to.x === "number" && typeof to.y === "number" && withinBounds(to, w, h)) {
        pos = { x: to.x, y: to.y };
      }
    }
  }
  return pos;
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

function inferDirection(text: string): "north" | "south" | "east" | "west" | null {
  const t = text.toLowerCase();
  if (/\b(north|up|forward|ahead)\b/.test(t)) return "north";
  if (/\b(south|down|back|backward)\b/.test(t)) return "south";
  if (/\b(east|right)\b/.test(t)) return "east";
  if (/\b(west|left)\b/.test(t)) return "west";
  return null;
}

function stepFrom(pos: XY, dir: "north" | "south" | "east" | "west"): XY {
  switch (dir) {
    case "north":
      return { x: pos.x, y: pos.y - 1 };
    case "south":
      return { x: pos.x, y: pos.y + 1 };
    case "east":
      return { x: pos.x + 1, y: pos.y };
    case "west":
      return { x: pos.x - 1, y: pos.y };
  }
}

function textSuggestsDoor(text: string) {
  const t = text.toLowerCase();
  return /\b(door|gate|hatch|threshold|archway)\b/.test(t);
}

function textSuggestsLocked(text: string) {
  const t = text.toLowerCase();
  return /\b(locked|sealed|barred|jammed)\b/.test(t);
}

type ExplorationDraft = {
  enableMove: boolean;
  to: XY | null;

  enableReveal: boolean;
  revealRadius: 0 | 1 | 2;

  enableMark: boolean;
  markKind: MapMarkKind;
  markNote: string;
};

// ------------------------------------------------------------
// Initial table helpers
// ------------------------------------------------------------

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

  const factionCount = pick([2, 3, 3]);
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

function renderInitialTableNarration(t: InitialTable): string {
  const [traitA, traitB] = t.locationTraits;
  const oddity = t.environmentalOddities[0] ?? "Something feels off";
  const hook = t.dormantHooks[0] ?? "A sign repeats";
  const factions = t.latentFactions;

  const lines: string[] = [];
  lines.push(t.openingFrame);
  lines.push(`The place feels ${traitA}, and the air carries the stink of ${traitB}.`);

  if (/footsteps echo twice/i.test(oddity)) {
    lines.push("Every step answers itself — once, then again — like the street remembers you a beat too late.");
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

  if (factions.length > 0) {
    lines.push("There are pressures under the surface:");
    factions.forEach((f) => lines.push(`• ${f.name} want to ${f.desire} — but ${f.pressure}.`));
  }

  lines.push(`${hook}.`);
  lines.push("That repetition feels deliberate. And it feels recent.");

  return lines.join("\n\n");
}

function inferOptionKind(description: string): OptionKind {
  const text = description.toLowerCase();

  if (text.includes("attack") || text.includes("fight") || text.includes("oppose") || text.includes("contest")) {
    return "contested";
  }
  if (text.includes("climb") || text.includes("cross") || text.includes("navigate") || text.includes("environment")) {
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

  const MAP_W = 13;
  const MAP_H = 9;

  // Initial Table Gate
  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);

  const [tableDraftText, setTableDraftText] = useState("");

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  // ----------------------------------------------------------
  // Exploration draft (auto-prepared AFTER intent)
  // ----------------------------------------------------------

  const currentPos = useMemo(() => deriveCurrentPosition(state.events as any[], MAP_W, MAP_H), [state.events]);

  const [explorationDraft, setExplorationDraft] = useState<ExplorationDraft>({
    enableMove: false,
    to: null,
    enableReveal: true,
    revealRadius: 1,
    enableMark: false,
    markKind: "door",
    markNote: "",
  });

  // When an option is selected (i.e., we are about to resolve), auto-draft exploration.
  useEffect(() => {
    if (!selectedOption) return;

    const intentText = `${playerInput}\n${selectedOption.description}`.trim();
    const dir = inferDirection(intentText);
    const to = dir ? stepFrom(currentPos, dir) : null;

    const canMove = to ? withinBounds(to, MAP_W, MAP_H) : false;

    const door = textSuggestsDoor(intentText);
    const locked = textSuggestsLocked(intentText);

    setExplorationDraft((prev) => ({
      ...prev,
      enableMove: canMove,
      to: canMove ? to : null,

      // reveal is cheap + feels good; keep on by default
      enableReveal: true,
      revealRadius: 1,

      // mark is only a suggestion; default on only if door was mentioned
      enableMark: door,
      markKind: "door",
      markNote: door ? (locked ? "locked" : prev.markNote || "") : prev.markNote,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption?.id]);

  // ----------------------------------------------------------
  // Generate table ONCE per session
  // ----------------------------------------------------------

  useEffect(() => {
    if (initialTable) return;
    if (dmMode === "solace-neutral" || dmMode === "human") setInitialTable(generateInitialTable());
  }, [dmMode, initialTable]);

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  useEffect(() => {
    if (!initialTable) return;
    if (tableDraftText.trim() === "") setTableDraftText(renderedTableNarration);
  }, [initialTable, renderedTableNarration, tableDraftText]);

  useEffect(() => {
    if (dmMode === "solace-neutral") setTableAccepted(false);
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

  // Solace selects an option in neutral facilitator mode
  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;
    setSelectedOption(options[0]);
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // Record canon (OUTCOME + optional exploration bundle)
  // ----------------------------------------------------------

  function commitExplorationBundle() {
    const d = explorationDraft;

    setState((prev) => {
      let next = prev;

      // Movement is the resolution of intent → only commit if enabled + valid
      if (d.enableMove && d.to && withinBounds(d.to, MAP_W, MAP_H)) {
        const from = deriveCurrentPosition(next.events as any[], MAP_W, MAP_H);
        const to = { x: d.to.x, y: d.to.y };

        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "PLAYER_MOVED",
          payload: { from, to } as any,
        });

        if (d.enableReveal && d.revealRadius > 0) {
          next = recordEvent(next, {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            actor: "arbiter",
            type: "MAP_REVEALED",
            payload: { tiles: revealRadius(to, d.revealRadius, MAP_W, MAP_H) } as any,
          });
        }

        // Mark at the destination (e.g., “you arrive at a locked door”)
        if (d.enableMark) {
          const note = d.markNote.trim() ? d.markNote.trim() : null;
          next = recordEvent(next, {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            actor: "arbiter",
            type: "MAP_MARKED",
            payload: { at: to, kind: d.markKind, note } as any,
          });
        }

        return next;
      }

      // No move: allow reveal/mark at current tile ONLY if explicitly enabled.
      // (This supports “I inspect the room / I listen at the door” without moving.)
      const here = deriveCurrentPosition(next.events as any[], MAP_W, MAP_H);

      if (d.enableReveal && d.revealRadius > 0) {
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_REVEALED",
          payload: { tiles: revealRadius(here, d.revealRadius, MAP_W, MAP_H) } as any,
        });
      }

      if (d.enableMark) {
        const note = d.markNote.trim() ? d.markNote.trim() : null;
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_MARKED",
          payload: { at: here, kind: d.markKind, note } as any,
        });
      }

      return next;
    });
  }

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
    // OUTCOME is canon first…
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload,
      })
    );

    // …then we commit the exploration bundle (still append-only, still arbiter-gated)
    commitExplorationBundle();
  }

  function shareCanon() {
    navigator.clipboard.writeText(exportCanon(state.events));
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------
  // Combat demo inputs
  // ----------------------------------------------------------

  const [playerCount, setPlayerCount] = useState(4);
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
      if (prev.length === 6) return prev;
      const next = [...prev];
      while (next.length < 6) next.push("");
      return next.slice(0, 6);
    });
  }, []);

  const latestCombatId = useMemo(() => findLatestCombatId(state.events as any) ?? null, [state.events]);

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

    const groups = enemyGroups.map(normalizeName).filter(Boolean).slice(0, 6);

    const combatId = crypto.randomUUID();
    const seed = crypto.randomUUID();

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

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "TURN_ADVANCED",
        payload: { combatId, round: 1, index: 0 } as any,
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

      <CardSection title="Facilitation Mode">
        <label>
          <input type="radio" checked={dmMode === "human"} onChange={() => setDmMode("human")} /> Human DM (options
          visible + editable setup)
        </label>
        <br />
        <label>
          <input type="radio" checked={dmMode === "solace-neutral"} onChange={() => setDmMode("solace-neutral")} /> Solace
          (Neutral Facilitator)
        </label>
      </CardSection>

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

      {dmMode === "human" && initialTable && !tableAccepted && (
        <CardSection title="Solace Setup Helper (Optional)">
          <p className="muted" style={{ marginTop: 0 }}>
            If you want a fast-start table, edit it, then run the game.
          </p>

          <textarea rows={10} value={tableDraftText} onChange={(e) => setTableDraftText(e.target.value)} style={{ width: "100%" }} />

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

      {dmMode === "solace-neutral" && !tableAccepted && <Disclaimer />}

      {(dmMode === "human" || tableAccepted) && (
        <>
          <DungeonPressurePanel turn={state.events.filter((e) => e.type === "OUTCOME").length} events={state.events} />

          {/* Map is canon-only view */}
          <ExplorationMapPanel events={state.events} mapW={MAP_W} mapH={MAP_H} />

          {/* COMBAT (unchanged) */}
          <CardSection title="Combat (Deterministic, Grouped Enemies)">
            <p className="muted" style={{ marginTop: 0 }}>
              Players roll individually. Enemy groups roll once per group. Turn order is derived from events.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                Players (1–6):
                <select value={playerCount} onChange={(e) => setPlayerCount(clampInt(Number(e.target.value), 1, 6))} style={{ minWidth: 140 }}>
                  {PLAYER_COUNTS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                Player init mod:
                <select value={initModPlayers} onChange={(e) => setInitModPlayers(Math.trunc(Number(e.target.value)))} style={{ minWidth: 140 }}>
                  {INIT_MODS.map((n) => (
                    <option key={n} value={n}>
                      {n >= 0 ? `+${n}` : `${n}`}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                Enemy group init mod:
                <select value={initModEnemies} onChange={(e) => setInitModEnemies(Math.trunc(Number(e.target.value)))} style={{ minWidth: 170 }}>
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
                  <select value={enemyGroupSelect} onChange={(e) => setEnemyGroupSelect(e.target.value)} style={{ minWidth: 220 }}>
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
                          style={{ padding: "0 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)" }}
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
                  <button onClick={randomizePlayerNames}>🎲 Random names</button>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
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
                Blank names will display as “Player 1…N”. Names are used for initiative labels and canon readability.
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
                  Combat: <strong>{derivedCombat.combatId}</strong> · Round <strong>{derivedCombat.round}</strong>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
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

          <CardSection title="Player Action">
            <textarea
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              placeholder="Describe what your character does…"
              style={{ width: "100%", minHeight: "120px", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }}
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

          {/* Drafted exploration bundle (only after intent -> option selected) */}
          {selectedOption && (
            <CardSection title="Proposed Exploration Canon (Draft)">
              <p className="muted" style={{ marginTop: 0 }}>
                These are auto-suggested based on intent text. They are NOT canon until you record the outcome.
              </p>

              <div className="muted" style={{ marginBottom: 10 }}>
                Current canon position: <strong>({currentPos.x},{currentPos.y})</strong>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={explorationDraft.enableMove}
                    onChange={(e) => setExplorationDraft((p) => ({ ...p, enableMove: e.target.checked }))}
                  />
                  Commit movement (PLAYER_MOVED)
                </label>

                {explorationDraft.enableMove && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      To X:
                      <input
                        value={explorationDraft.to?.x ?? ""}
                        onChange={(e) => {
                          const x = Number(e.target.value);
                          setExplorationDraft((p) => ({
                            ...p,
                            to: { x: Number.isFinite(x) ? Math.trunc(x) : currentPos.x, y: p.to?.y ?? currentPos.y },
                          }));
                        }}
                        style={{ width: 100 }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      To Y:
                      <input
                        value={explorationDraft.to?.y ?? ""}
                        onChange={(e) => {
                          const y = Number(e.target.value);
                          setExplorationDraft((p) => ({
                            ...p,
                            to: { x: p.to?.x ?? currentPos.x, y: Number.isFinite(y) ? Math.trunc(y) : currentPos.y },
                          }));
                        }}
                        style={{ width: 100 }}
                      />
                    </label>

                    <span className="muted">
                      (Bounds: 0..{MAP_W - 1} / 0..{MAP_H - 1})
                    </span>
                  </div>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={explorationDraft.enableReveal}
                    onChange={(e) => setExplorationDraft((p) => ({ ...p, enableReveal: e.target.checked }))}
                  />
                  Reveal tiles (MAP_REVEALED)
                </label>

                {explorationDraft.enableReveal && (
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 220 }}>
                    Reveal radius:
                    <select
                      value={explorationDraft.revealRadius}
                      onChange={(e) => setExplorationDraft((p) => ({ ...p, revealRadius: Number(e.target.value) as any }))}
                    >
                      <option value={0}>0 (none)</option>
                      <option value={1}>1 (tight)</option>
                      <option value={2}>2 (wide)</option>
                    </select>
                  </label>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={explorationDraft.enableMark}
                    onChange={(e) => setExplorationDraft((p) => ({ ...p, enableMark: e.target.checked }))}
                  />
                  Mark tile (MAP_MARKED)
                </label>

                {explorationDraft.enableMark && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      Kind:
                      <select
                        value={explorationDraft.markKind}
                        onChange={(e) => setExplorationDraft((p) => ({ ...p, markKind: e.target.value as MapMarkKind }))}
                      >
                        <option value="door">door 🚪</option>
                        <option value="stairs">stairs ⬇️</option>
                        <option value="altar">altar ✶</option>
                        <option value="cache">cache ⬚</option>
                        <option value="hazard">hazard ⚠️</option>
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 220px" }}>
                      Note (optional):
                      <input
                        value={explorationDraft.markNote}
                        onChange={(e) => setExplorationDraft((p) => ({ ...p, markNote: e.target.value }))}
                        placeholder="e.g., locked / sealed / humming / glyph"
                      />
                    </label>

                    <span className="muted">
                      (Mark applies to destination if moving; otherwise current tile.)
                    </span>
                  </div>
                )}
              </div>
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
          <CanonEventsPanel events={state.events as any[]} />
          <WorldLedgerPanelLegacy events={state.events} />
        </>
      )}

      <Disclaimer />
    </StewardedShell>
  );
}
