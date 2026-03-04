// app/demo/page.tsx
"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// UX UPGRADES (requested):
// 1) Move Facilitation Mode selector up into the hero empty space
// 2) Hide the Initial Table section until a facilitator mode is explicitly selected
//    - Once selected, reveal the Initial Table area and auto-scroll to it
//
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { createSession, recordEvent, SessionState } from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";
import CanonEventsPanel from "@/components/world/CanonEventsPanel";

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

// Keep local dice types aligned with ResolutionDraftAdvisoryPanel
type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

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

type XY = { x: number; y: number };
type Direction = "north" | "south" | "east" | "west";

type ExplorationDraft = {
  enableMove: boolean;
  direction: Direction | "none";
  enableReveal: boolean;
  revealRadius: 0 | 1 | 2;
  enableMark: boolean;
  markKind: MapMarkKind;
  markNote: string;
};

type DemoSectionId =
  | "mode"
  | "table"
  | "pressure"
  | "map"
  | "combat"
  | "action"
  | "resolution"
  | "canon"
  | "ledger";

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
// Initial table helpers
// ------------------------------------------------------------

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
  lines.push(
    `The place feels ${traitA}, and the air carries the stink of ${traitB}.`
  );

  if (/footsteps echo twice/i.test(oddity)) {
    lines.push(
      "Every step answers itself — once, then again — like the street remembers you a beat too late."
    );
  } else if (/lantern/i.test(oddity.toLowerCase())) {
    lines.push(
      "Lanternlight can’t decide what it wants to be — steady one second, starving the next."
    );
  } else if (/absorb sound/i.test(oddity.toLowerCase())) {
    lines.push(
      "Sound doesn’t travel right. Words die early, like the walls are swallowing them."
    );
  } else if (/whispers/i.test(oddity.toLowerCase())) {
    lines.push(
      "You keep catching whispers at the edge of hearing — not loud enough to understand, not quiet enough to ignore."
    );
  } else {
    lines.push(`${oddity}.`);
  }

  if (factions.length > 0) {
    lines.push("There are pressures under the surface:");
    factions.forEach((f) =>
      lines.push(`• ${f.name} want to ${f.desire} — but ${f.pressure}.`)
    );
  }

  lines.push(`${hook}.`);
  lines.push("That repetition feels deliberate. And it feels recent.");

  return lines.join("\n\n");
}

function inferOptionKind(description: string): OptionKind {
  const text = description.toLowerCase();
  if (
    text.includes("attack") ||
    text.includes("fight") ||
    text.includes("oppose") ||
    text.includes("contest")
  )
    return "contested";
  if (
    text.includes("climb") ||
    text.includes("cross") ||
    text.includes("navigate") ||
    text.includes("environment")
  )
    return "environmental";
  if (text.includes("steal") || text.includes("sneak") || text.includes("risk"))
    return "risky";
  return "safe";
}

// ------------------------------------------------------------
// Exploration helpers
// ------------------------------------------------------------

function withinBounds(p: XY, w: number, h: number) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

function deriveCurrentPosition(events: readonly any[], w: number, h: number): XY {
  let pos: XY = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
  for (const e of events) {
    if (e?.type === "PLAYER_MOVED") {
      const to = e?.payload?.to;
      if (
        to &&
        typeof to.x === "number" &&
        typeof to.y === "number" &&
        withinBounds(to, w, h)
      ) {
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

function inferDirection(text: string): Direction | null {
  const t = text.toLowerCase();
  if (/\b(north|up|forward|ahead)\b/.test(t)) return "north";
  if (/\b(south|down|back|backward)\b/.test(t)) return "south";
  if (/\b(east|right)\b/.test(t)) return "east";
  if (/\b(west|left)\b/.test(t)) return "west";
  return null;
}

function stepFrom(pos: XY, dir: Direction): XY {
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

// ------------------------------------------------------------
// Combat-ended detection (local, because deriveCombatState doesn’t account for COMBAT_ENDED)
// ------------------------------------------------------------

function isCombatEndedForId(combatId: string, events: readonly any[]) {
  let seenStart = false;

  for (const e of events) {
    if (e?.type === "COMBAT_STARTED" && e?.payload?.combatId === combatId) {
      seenStart = true;
      continue;
    }
    if (
      seenStart &&
      e?.type === "COMBAT_ENDED" &&
      e?.payload?.combatId === combatId
    ) {
      return true;
    }
  }

  return false;
}

// ------------------------------------------------------------
// UI helpers: chapter nav + anchors
// ------------------------------------------------------------

function anchorId(section: DemoSectionId) {
  return `demo-${section}`;
}

function scrollToSection(section: DemoSectionId) {
  const el = document.getElementById(anchorId(section));
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function sectionLabel(section: DemoSectionId) {
  switch (section) {
    case "mode":
      return "Mode";
    case "table":
      return "Table";
    case "pressure":
      return "Pressure";
    case "map":
      return "Map";
    case "combat":
      return "Combat";
    case "action":
      return "Action";
    case "resolution":
      return "Resolution";
    case "canon":
      return "Canon";
    case "ledger":
      return "Ledger";
  }
}

// ------------------------------------------------------------
// Ambient FX: fog + torchlight (no new files)
// ------------------------------------------------------------

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function easeInOutCubic(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function flickerValue(nowMs: number, seed: number) {
  const t = (nowMs / 1000) * (0.9 + (seed % 7) * 0.03);
  const s1 = Math.sin(t * 2.3 + seed);
  const s2 = Math.sin(t * 5.1 + seed * 1.7);
  const s3 = Math.sin(t * 9.2 + seed * 0.6);
  const raw = (s1 * 0.6 + s2 * 0.3 + s3 * 0.1) * 0.5 + 0.5;
  return easeInOutCubic(clamp01(raw));
}

// ------------------------------------------------------------

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(
    createSession("demo-session", "demo")
  );

  // IMPORTANT UX CHANGE: mode must be explicitly selected
  const [dmMode, setDmMode] = useState<DMMode | null>(null);

  const MAP_W = 13;
  const MAP_H = 9;

  // Initial Table Gate
  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);
  const [tableDraftText, setTableDraftText] = useState("");

  // Chapter UI (visual only)
  const [activeSection, setActiveSection] = useState<DemoSectionId>("mode");

  // Action parsing + options
  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  // ----------------------------------------------------------
  // Ambient FX state
  // ----------------------------------------------------------

  const [fxNow, setFxNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setFxNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fogShiftA = useMemo(() => {
    const t = fxNow / 1000;
    const x = (t * 6) % 240;
    const y = (t * 3.5) % 180;
    return { x, y };
  }, [fxNow]);

  const fogShiftB = useMemo(() => {
    const t = fxNow / 1000;
    const x = (t * 3.2 + 120) % 260;
    const y = (t * 2.1 + 80) % 200;
    return { x, y };
  }, [fxNow]);

  const torchFlicker = useMemo(() => {
    return flickerValue(fxNow, 1337);
  }, [fxNow]);

  // ----------------------------------------------------------
  // Combat state (derived + ended-aware)
  // ----------------------------------------------------------

  const latestCombatId = useMemo(
    () => findLatestCombatId(state.events as any) ?? null,
    [state.events]
  );

  const derivedCombat = useMemo(() => {
    if (!latestCombatId) return null;
    return deriveCombatState(latestCombatId, state.events as any);
  }, [latestCombatId, state.events]);

  const combatEnded = useMemo(() => {
    if (!derivedCombat?.combatId) return false;
    return isCombatEndedForId(derivedCombat.combatId, state.events as any[]);
  }, [derivedCombat?.combatId, state.events]);

  const combatActive = !!derivedCombat && !combatEnded;

  const activeCombatantSpec = useMemo(() => {
    if (!derivedCombat?.activeCombatantId) return null;
    return (
      derivedCombat.participants.find(
        (p) => p.id === derivedCombat.activeCombatantId
      ) ?? null
    );
  }, [derivedCombat]);

  const isEnemyTurn = combatActive && activeCombatantSpec?.kind === "enemy_group";

  // ----------------------------------------------------------
  // Exploration draft (auto-prepared AFTER intent + option)
  // ----------------------------------------------------------

  const currentPos = useMemo(
    () => deriveCurrentPosition(state.events as any[], MAP_W, MAP_H),
    [state.events]
  );

  const [explorationDraft, setExplorationDraft] = useState<ExplorationDraft>({
    enableMove: false,
    direction: "none",
    enableReveal: true,
    revealRadius: 1,
    enableMark: false,
    markKind: "door",
    markNote: "",
  });

  const suggestedTo = useMemo(() => {
    if (!explorationDraft.enableMove) return null;
    if (explorationDraft.direction === "none") return null;
    const to = stepFrom(currentPos, explorationDraft.direction);
    return withinBounds(to, MAP_W, MAP_H) ? to : null;
  }, [explorationDraft.enableMove, explorationDraft.direction, currentPos]);

  useEffect(() => {
    if (!selectedOption) return;

    const intentText = `${playerInput}\n${selectedOption.description}`.trim();
    const dir = inferDirection(intentText);
    const door = textSuggestsDoor(intentText);
    const locked = textSuggestsLocked(intentText);

    setExplorationDraft((prev) => ({
      ...prev,
      enableMove: !!dir,
      direction: dir ?? "none",
      enableReveal: true,
      revealRadius: 1,
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
    setInitialTable(generateInitialTable());
  }, [initialTable]);

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  useEffect(() => {
    if (!initialTable) return;
    if (tableDraftText.trim() === "") setTableDraftText(renderedTableNarration);
  }, [initialTable, renderedTableNarration, tableDraftText]);

  // When mode changes, reset the table acceptance
  useEffect(() => {
    if (dmMode === null) return;
    setTableAccepted(false);
  }, [dmMode]);

  // ----------------------------------------------------------
  // Player submits action (intent)
  // ----------------------------------------------------------

  const canPlayerSubmitIntent =
    dmMode !== null && ((!combatActive || !isEnemyTurn) || dmMode === "human");

  function handlePlayerAction() {
    if (!playerInput.trim()) return;
    if (!canPlayerSubmitIntent) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);

    // Nudge flow forward
    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;
    setSelectedOption(options[0]);

    // Nudge flow forward
    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // Record canon (OUTCOME + optional exploration bundle)
  // ----------------------------------------------------------

  function commitExplorationBundle(nextState: SessionState) {
    const d = explorationDraft;
    let next = nextState;

    const here = deriveCurrentPosition(next.events as any[], MAP_W, MAP_H);

    const to =
      d.enableMove && d.direction !== "none" ? stepFrom(here, d.direction) : null;

    const canMove = to ? withinBounds(to, MAP_W, MAP_H) : false;

    if (d.enableMove && canMove && to) {
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "PLAYER_MOVED",
        payload: { from: here, to } as any,
      });

      if (d.enableReveal && d.revealRadius > 0) {
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_REVEALED",
          payload: {
            tiles: revealRadius(to, d.revealRadius, MAP_W, MAP_H),
          } as any,
        });
      }

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

    if (d.enableReveal && d.revealRadius > 0) {
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "MAP_REVEALED",
        payload: {
          tiles: revealRadius(here, d.revealRadius, MAP_W, MAP_H),
        } as any,
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
  }

  function handleRecord(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  }) {
    setState((prev) => {
      let next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload,
      });

      next = commitExplorationBundle(next);
      return next;
    });

    // Nudge flow forward
    setActiveSection("canon");
    queueMicrotask(() => scrollToSection("canon"));
  }

  function shareCanon() {
    navigator.clipboard.writeText(exportCanon(state.events));
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------
  // Combat setup inputs (locked while combatActive)
  // ----------------------------------------------------------

  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [enemyGroups, setEnemyGroups] = useState<string[]>([
    "Skirmishers",
    "Archers",
  ]);
  const [enemyGroupSelect, setEnemyGroupSelect] =
    useState<string>("Skirmishers");

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

  function getEffectivePlayerName(i1Based: number) {
    const idx = i1Based - 1;
    const raw = playerNames[idx] ?? "";
    const name = normalizeName(raw);
    return name.length > 0 ? name : `Player ${i1Based}`;
  }

  function startCombatDeterministic() {
    if (combatActive) return;

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

    setActiveSection("combat");
  }

  function advanceTurn() {
    if (!derivedCombat) return;
    if (combatEnded) return;

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

  function endCombat() {
    if (!derivedCombat) return;
    if (combatEnded) return;

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "COMBAT_ENDED",
        payload: { combatId: derivedCombat.combatId } as any,
      })
    );
  }

  function addEnemyGroup(name: string) {
    if (combatActive) return;

    const v = normalizeName(name);
    if (!v) return;

    setEnemyGroups((prev) => {
      if (prev.map((x) => x.toLowerCase()).includes(v.toLowerCase()))
        return prev;
      if (prev.length >= 6) return prev;
      return [...prev, v];
    });
  }

  function removeEnemyGroup(name: string) {
    if (combatActive) return;
    setEnemyGroups((prev) => prev.filter((g) => g !== name));
  }

  function clearEnemyGroups() {
    if (combatActive) return;
    setEnemyGroups([]);
  }

  function randomizePlayerNames() {
    if (combatActive) return;

    const pc = clampInt(playerCount, 1, 6);
    setPlayerNames((prev) => {
      const next = [...prev];
      const used = new Set<string>(
        next.map((x) => normalizeName(x).toLowerCase()).filter(Boolean)
      );

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

  const outcomesCount = useMemo(
    () => state.events.filter((e: any) => e?.type === "OUTCOME").length,
    [state.events]
  );
  const canonCount = useMemo(
    () =>
      state.events.filter((e: any) => e?.type && e?.type !== "OUTCOME").length,
    [state.events]
  );

  const chapterButtons: { id: DemoSectionId; hint: string }[] = useMemo(
    () => [
      { id: "mode", hint: "Choose facilitator mode" },
      { id: "table", hint: "Start scene + accept table" },
      { id: "pressure", hint: "Advisory state" },
      { id: "map", hint: "Canon view of space" },
      { id: "combat", hint: "Deterministic turn order" },
      { id: "action", hint: "Player intent" },
      { id: "resolution", hint: "Roll + record OUTCOME" },
      { id: "canon", hint: "Non-outcome canon log" },
      { id: "ledger", hint: "Outcome narration only" },
    ],
    []
  );

  const torchAlphaLeft = lerp(0.10, 0.22, torchFlicker);
  const torchAlphaRight = lerp(0.08, 0.19, torchFlicker);

  function selectMode(nextMode: DMMode) {
    setDmMode(nextMode);
    setActiveSection("table");
    queueMicrotask(() => scrollToSection("table"));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/dungeon_background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Base readability overlay + subtle blur */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.84) 40%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.65) 100%)",
          backdropFilter: "blur(2px)",
          pointerEvents: "none",
        }}
      />

      {/* Torchlight flicker */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: [
            `radial-gradient(520px 820px at 8% 55%, rgba(255,170,90,${torchAlphaLeft.toFixed(
              3
            )}), transparent 62%)`,
            `radial-gradient(460px 760px at 92% 60%, rgba(255,150,70,${torchAlphaRight.toFixed(
              3
            )}), transparent 60%)`,
            "radial-gradient(700px 520px at 50% 110%, rgba(255,140,80,0.06), transparent 65%)",
          ].join(", "),
          mixBlendMode: "screen",
          opacity: 0.85,
        }}
      />

      {/* Fog drift */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.22,
          filter: "blur(10px)",
          background: [
            `radial-gradient(600px 380px at ${
              30 + (fogShiftA.x % 40)
            }% ${30 + (fogShiftA.y % 30)}%, rgba(255,255,255,0.12), transparent 68%)`,
            `radial-gradient(780px 520px at ${
              60 + (fogShiftB.x % 35)
            }% ${55 + (fogShiftB.y % 25)}%, rgba(255,255,255,0.10), transparent 70%)`,
            "radial-gradient(900px 600px at 50% 40%, rgba(255,255,255,0.06), transparent 72%)",
          ].join(", "),
          transform: `translate3d(${(fogShiftA.x % 120) - 60}px, ${
            (fogShiftA.y % 80) - 40
          }px, 0)`,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <StewardedShell>
          <ModeHeader
            title="Stewarded Play — Full Flow"
            onShare={shareCanon}
            roles={[
              { label: "Player", description: "Declares intent" },
              {
                label: "Solace",
                description: "Prepares the resolution and narrates outcome",
              },
              { label: "Arbiter", description: "Commits canon" },
            ]}
          />

          {/* HERO + DUNGEON IMAGE + CHAPTER NAV + MODE SELECTOR (moved up) */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background:
                "radial-gradient(1200px 240px at 20% 0%, rgba(138,180,255,0.20), transparent 60%), radial-gradient(900px 220px at 80% 20%, rgba(255,120,120,0.12), transparent 55%), rgba(255,255,255,0.03)",
              padding: 18,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(260px, 1.1fr) minmax(260px, 0.9fr)",
                gap: 14,
                alignItems: "stretch",
              }}
            >
              {/* LEFT */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, letterSpacing: 0.6, opacity: 0.85 }}>
                  EVENT-SOURCED PLAY · FAIL-CLOSED CANON
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 22,
                    fontWeight: 800,
                    lineHeight: 1.15,
                  }}
                >
                  A governed tabletop loop: intent → resolution → canon.
                </div>

                <div
                  className="muted"
                  style={{
                    marginTop: 10,
                    maxWidth: 760,
                    lineHeight: 1.55,
                  }}
                >
                  This page is a working demo. It’s long by nature — so it’s
                  organized into “chapters.” Nothing here rewrites the world:
                  the UI only renders what the event log contains.
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveSection("mode");
                      scrollToSection("mode");
                    }}
                  >
                    Start here
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection("action");
                      scrollToSection("action");
                    }}
                    disabled={dmMode === null || !tableAccepted}
                    title={
                      dmMode === null
                        ? "Choose a facilitator mode first"
                        : !tableAccepted
                        ? "Accept the initial table first"
                        : "Jump to Player Action"
                    }
                  >
                    Play me
                  </button>

                  <div className="muted" style={{ fontSize: 12 }}>
                    outcomes: <strong>{outcomesCount}</strong> · canon events:{" "}
                    <strong>{canonCount}</strong>
                  </div>
                </div>

                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                  Pro-tip: choose a mode, accept the table, then submit an
                  action and record an outcome.
                </div>

                {/* MODE (moved into hero empty space) */}
                <div
                  id={anchorId("mode")}
                  style={{
                    scrollMarginTop: 90,
                    marginTop: 14,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.22)",
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    Facilitation Mode
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Select who is allowed to declare intent and how options are
                    chosen.
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="radio"
                        checked={dmMode === "human"}
                        onChange={() => selectMode("human")}
                      />
                      <span>
                        <strong>Human DM</strong>{" "}
                        <span className="muted">
                          (options visible + editable setup)
                        </span>
                      </span>
                    </label>

                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="radio"
                        checked={dmMode === "solace-neutral"}
                        onChange={() => selectMode("solace-neutral")}
                      />
                      <span>
                        <strong>Solace</strong>{" "}
                        <span className="muted">(Neutral Facilitator)</span>
                      </span>
                    </label>

                    {dmMode === null && (
                      <div
                        className="muted"
                        style={{
                          fontSize: 12,
                          marginTop: 6,
                          padding: "10px 10px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        Choose a mode to reveal the Initial Table.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div style={{ minWidth: 0, display: "grid", gap: 10 }}>
                {/* Image */}
                <div
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.22)",
                    position: "relative",
                    minHeight: 190,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: "url('/Hero_dungeon.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "contrast(1.05) saturate(1.05)",
                      transform: "scale(1.02)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.70), rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.65))",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      padding: 12,
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>
                        Enter the dungeon
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        You declare intent. The world remembers only what canon records.
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveSection("action");
                        scrollToSection("action");
                      }}
                      disabled={dmMode === null || !tableAccepted}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        whiteSpace: "nowrap",
                      }}
                      title={
                        dmMode === null
                          ? "Choose a facilitator mode first"
                          : !tableAccepted
                          ? "Accept the initial table first"
                          : "Jump to Player Action"
                      }
                    >
                      ▶ Play
                    </button>
                  </div>
                </div>

                {/* Chapters */}
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                    Chapters
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    {chapterButtons.map((b) => {
                      const active = activeSection === b.id;
                      const disabled =
                        (b.id === "action" || b.id === "resolution" || b.id === "pressure" || b.id === "map" || b.id === "combat" || b.id === "canon" || b.id === "ledger") &&
                        (dmMode === null || !tableAccepted);

                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            setActiveSection(b.id);
                            scrollToSection(b.id);
                          }}
                          disabled={disabled}
                          style={{
                            padding: "10px 10px",
                            borderRadius: 10,
                            border: active
                              ? "1px solid rgba(138,180,255,0.55)"
                              : "1px solid rgba(255,255,255,0.10)",
                            background: active
                              ? "rgba(138,180,255,0.10)"
                              : "rgba(255,255,255,0.04)",
                            textAlign: "left",
                            opacity: disabled ? 0.55 : 1,
                          }}
                          aria-label={`Go to ${sectionLabel(b.id)}`}
                          title={
                            disabled
                              ? "Choose a mode and accept the table first"
                              : b.hint
                          }
                        >
                          <div style={{ fontWeight: 800, fontSize: 12 }}>
                            {sectionLabel(b.id)}
                          </div>
                          <div
                            className="muted"
                            style={{
                              fontSize: 11,
                              marginTop: 4,
                              lineHeight: 1.2,
                            }}
                          >
                            {b.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE (hidden until mode selected) */}
          <div id={anchorId("table")} style={{ scrollMarginTop: 90 }}>
            {dmMode === null && <Disclaimer />}

            {dmMode !== null && dmMode === "solace-neutral" && initialTable && !tableAccepted && (
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

                <details style={{ marginTop: 12 }} open>
                  <summary className="muted">Show underlying table signals</summary>
                  <div style={{ marginTop: 10 }}>
                    <p>{initialTable.openingFrame}</p>
                    <p className="muted">
                      Traits: {initialTable.locationTraits.join(", ")}
                    </p>
                    <ul>
                      {initialTable.latentFactions.map((f, i) => (
                        <li key={i}>
                          <strong>{f.name}</strong> — {f.desire} ({f.pressure})
                        </li>
                      ))}
                    </ul>
                    <p className="muted">
                      Oddity: {initialTable.environmentalOddities.join(", ")}
                    </p>
                    <p className="muted">
                      Hook: {initialTable.dormantHooks.join(", ")}
                    </p>
                  </div>
                </details>

                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => {
                      setTableAccepted(true);
                      setActiveSection("pressure");
                      queueMicrotask(() => scrollToSection("pressure"));
                    }}
                  >
                    Accept Table
                  </button>
                </div>
              </CardSection>
            )}

            {dmMode !== null && dmMode === "human" && initialTable && !tableAccepted && (
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

                <details style={{ marginTop: 12 }} open>
                  <summary className="muted">Show underlying table signals</summary>
                  <div style={{ marginTop: 10 }}>
                    <p>{initialTable.openingFrame}</p>
                    <p className="muted">
                      Traits: {initialTable.locationTraits.join(", ")}
                    </p>
                    <ul>
                      {initialTable.latentFactions.map((f, i) => (
                        <li key={i}>
                          <strong>{f.name}</strong> — {f.desire} ({f.pressure})
                        </li>
                      ))}
                    </ul>
                    <p className="muted">
                      Oddity: {initialTable.environmentalOddities.join(", ")}
                    </p>
                    <p className="muted">
                      Hook: {initialTable.dormantHooks.join(", ")}
                    </p>
                  </div>
                </details>

                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => {
                      setTableAccepted(true);
                      setActiveSection("pressure");
                      queueMicrotask(() => scrollToSection("pressure"));
                    }}
                  >
                    Accept Table
                  </button>
                </div>
              </CardSection>
            )}
          </div>

          {(dmMode !== null && (dmMode === "human" || tableAccepted)) && (
            <>
              {/* PRESSURE */}
              <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
                <DungeonPressurePanel turn={outcomesCount} events={state.events} />
              </div>

              {/* MAP */}
              <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
                <ExplorationMapPanel events={state.events} mapW={MAP_W} mapH={MAP_H} />
              </div>

              {/* COMBAT */}
              <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
                <CardSection title="Combat (Deterministic, Grouped Enemies)">
                  <p className="muted" style={{ marginTop: 0 }}>
                    Players roll individually. Enemy groups roll once per group. Turn order is derived from events.
                  </p>

                  {combatActive && (
                    <div className="muted" style={{ marginTop: 8 }}>
                      🔒 Combat is active. Setup is locked to preserve replay integrity.
                    </div>
                  )}

                  {combatEnded && derivedCombat && (
                    <div className="muted" style={{ marginTop: 8 }}>
                      🏁 Combat ended. You can start a new combat (new combatId) if you want.
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      Players (1–6):
                      <select
                        value={playerCount}
                        onChange={(e) =>
                          setPlayerCount(clampInt(Number(e.target.value), 1, 6))
                        }
                        style={{ minWidth: 140 }}
                        disabled={combatActive}
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
                        onChange={(e) =>
                          setInitModPlayers(Math.trunc(Number(e.target.value)))
                        }
                        style={{ minWidth: 140 }}
                        disabled={combatActive}
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
                        onChange={(e) =>
                          setInitModEnemies(Math.trunc(Number(e.target.value)))
                        }
                        style={{ minWidth: 170 }}
                        disabled={combatActive}
                      >
                        {INIT_MODS.map((n) => (
                          <option key={n} value={n}>
                            {n >= 0 ? `+${n}` : `${n}`}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div
                      style={{
                        flex: "1 1 320px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <span className="muted">Enemy groups</span>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <select
                          value={enemyGroupSelect}
                          onChange={(e) => setEnemyGroupSelect(e.target.value)}
                          style={{ minWidth: 220 }}
                          disabled={combatActive}
                        >
                          {ENEMY_GROUP_LIBRARY.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => addEnemyGroup(enemyGroupSelect)}
                          disabled={combatActive}
                        >
                          Add
                        </button>
                        <button
                          onClick={clearEnemyGroups}
                          disabled={combatActive || enemyGroups.length === 0}
                        >
                          Clear
                        </button>
                        <span className="muted" style={{ fontSize: 12 }}>
                          (max 6)
                        </span>
                      </div>

                      {enemyGroups.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginTop: 8,
                          }}
                        >
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
                                disabled={combatActive}
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
                        <button onClick={randomizePlayerNames} disabled={combatActive}>
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
                      {Array.from(
                        { length: clampInt(playerCount, 1, 6) },
                        (_, idx) => {
                          const i1 = idx + 1;
                          const value = playerNames[idx] ?? "";
                          return (
                            <label
                              key={i1}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              <span className="muted">Player {i1} name (optional)</span>
                              <input
                                value={value}
                                disabled={combatActive}
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
                        }
                      )}
                    </div>

                    <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
                      Blank names will display as “Player 1…N”. Names are used for initiative labels and canon readability.
                    </p>
                  </div>

                  <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={startCombatDeterministic} disabled={combatActive}>
                      Start Combat (Seeded)
                    </button>
                    <button onClick={advanceTurn} disabled={!derivedCombat || combatEnded}>
                      Advance Turn
                    </button>
                    <button onClick={endCombat} disabled={!derivedCombat || combatEnded}>
                      End Combat
                    </button>
                  </div>

                  {derivedCombat && (
                    <div style={{ marginTop: 12 }}>
                      <div className="muted">
                        Combat: <strong>{derivedCombat.combatId}</strong> · Round{" "}
                        <strong>{derivedCombat.round}</strong>
                        {activeCombatantSpec && (
                          <>
                            {" "}
                            · Active:{" "}
                            <strong>{formatCombatantLabel(activeCombatantSpec)}</strong>
                          </>
                        )}
                      </div>

                      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                        {derivedCombat.order.map((id, idx) => {
                          const spec =
                            derivedCombat.participants.find((p) => p.id === id) ??
                            null;
                          const roll =
                            derivedCombat.initiative.find((r) => r.combatantId === id) ??
                            null;
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
                                {roll
                                  ? `Init ${roll.total} (d20 ${roll.natural} + ${roll.modifier})`
                                  : "Init —"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardSection>
              </div>

              {/* ACTION */}
              <div id={anchorId("action")} style={{ scrollMarginTop: 90 }}>
                <CardSection title="Player Action">
                  {combatActive && isEnemyTurn && dmMode !== "human" && (
                    <p className="muted" style={{ marginTop: 0 }}>
                      Enemy turn. In Solace-neutral, the player cannot declare enemy
                      intent. Switch to Human DM to enter enemy intent.
                    </p>
                  )}

                  <textarea
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    placeholder="Describe what your character does…"
                    disabled={!canPlayerSubmitIntent}
                    style={{
                      width: "100%",
                      minHeight: "120px",
                      resize: "vertical",
                      boxSizing: "border-box",
                      lineHeight: 1.5,
                    }}
                  />
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={handlePlayerAction}
                      disabled={!canPlayerSubmitIntent}
                    >
                      Submit Action
                    </button>
                    <span className="muted" style={{ fontSize: 12 }}>
                      Tip: After you submit, the page jumps to Resolution automatically.
                    </span>
                  </div>
                </CardSection>
              </div>

              {/* PARSED */}
              {parsed && (
                <CardSection title="Parsed Action">
                  <pre>{JSON.stringify(parsed, null, 2)}</pre>
                </CardSection>
              )}

              {/* OPTIONS (Human DM) */}
              {options && isHumanDM && (
                <CardSection title="Options">
                  <ul>
                    {options.map((opt) => (
                      <li key={opt.id}>
                        <button
                          onClick={() => {
                            setSelectedOption(opt);
                            setActiveSection("resolution");
                            queueMicrotask(() => scrollToSection("resolution"));
                          }}
                        >
                          {opt.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardSection>
              )}

              {/* RESOLUTION */}
              <div id={anchorId("resolution")} style={{ scrollMarginTop: 90 }}>
                {selectedOption && (
                  <CardSection title="Proposed Exploration Canon (Draft)">
                    <p className="muted" style={{ marginTop: 0 }}>
                      Auto-suggested from intent text. Not canon until you record the outcome.
                    </p>

                    <div className="muted" style={{ marginBottom: 10 }}>
                      Current canon position:{" "}
                      <strong>
                        ({currentPos.x},{currentPos.y})
                      </strong>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={explorationDraft.enableMove}
                          onChange={(e) =>
                            setExplorationDraft((p) => ({
                              ...p,
                              enableMove: e.target.checked,
                              direction: e.target.checked ? p.direction : "none",
                            }))
                          }
                        />
                        Commit movement (PLAYER_MOVED)
                      </label>

                      {explorationDraft.enableMove && (
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
                            Direction (recommended):
                            <select
                              value={explorationDraft.direction}
                              onChange={(e) =>
                                setExplorationDraft((p) => ({
                                  ...p,
                                  direction: e.target.value as any,
                                }))
                              }
                            >
                              <option value="none">None</option>
                              <option value="north">North (↑)</option>
                              <option value="east">East (→)</option>
                              <option value="south">South (↓)</option>
                              <option value="west">West (←)</option>
                            </select>
                          </label>

                          <div className="muted" style={{ paddingBottom: 4 }}>
                            Bounds: <strong>0..{MAP_W - 1}</strong> /{" "}
                            <strong>0..{MAP_H - 1}</strong> · Suggested destination:{" "}
                            <strong>
                              {suggestedTo
                                ? `(${suggestedTo.x},${suggestedTo.y})`
                                : "(out of bounds / none)"}
                            </strong>
                          </div>
                        </div>
                      )}

                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={explorationDraft.enableReveal}
                          onChange={(e) =>
                            setExplorationDraft((p) => ({
                              ...p,
                              enableReveal: e.target.checked,
                            }))
                          }
                        />
                        Reveal tiles (MAP_REVEALED)
                      </label>

                      {explorationDraft.enableReveal && (
                        <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 220 }}>
                          Reveal radius:
                          <select
                            value={explorationDraft.revealRadius}
                            onChange={(e) =>
                              setExplorationDraft((p) => ({
                                ...p,
                                revealRadius: Number(e.target.value) as any,
                              }))
                            }
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
                          onChange={(e) =>
                            setExplorationDraft((p) => ({
                              ...p,
                              enableMark: e.target.checked,
                            }))
                          }
                        />
                        Mark tile (MAP_MARKED)
                      </label>

                      {explorationDraft.enableMark && (
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            Kind:
                            <select
                              value={explorationDraft.markKind}
                              onChange={(e) =>
                                setExplorationDraft((p) => ({
                                  ...p,
                                  markKind: e.target.value as MapMarkKind,
                                }))
                              }
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
                              onChange={(e) =>
                                setExplorationDraft((p) => ({
                                  ...p,
                                  markNote: e.target.value,
                                }))
                              }
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
              </div>

              <NextActionHint state={state} />

              {/* CANON */}
              <div id={anchorId("canon")} style={{ scrollMarginTop: 90 }}>
                <CanonEventsPanel events={state.events as any[]} />
              </div>

              {/* LEDGER */}
              <div id={anchorId("ledger")} style={{ scrollMarginTop: 90 }}>
                <WorldLedgerPanelLegacy events={state.events} />
              </div>
            </>
          )}

          <Disclaimer />
        </StewardedShell>
      </div>
    </div>
  );
}
