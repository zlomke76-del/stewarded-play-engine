"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Upgraded toward Full Mechanical RPG)
// ------------------------------------------------------------
//
// Invariants preserved:
// - Player declares intent
// - Solace prepares initial table (non-canonical)
// - Mechanics propose (deterministic; replayable)
// - Arbiter commits canon (append-only events)
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createSession,
  recordEvent,
  SessionEvent,
  SessionState,
} from "@/lib/session/SessionState";

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
  generateNarration,
  NarrativeLens,
} from "@/lib/narration/CreativeNarrator";

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

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

type CharacterStats = {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
};

type Character = {
  actorId: string;
  name: string;
  stats: CharacterStats;
  hpMax: number;
  hp: number;
  ac: number;
};

type Entity = {
  entityId: string;
  kind: "monster" | "npc";
  name: string;
  hpMax: number;
  hp: number;
  ac: number;
  tags: string[];
};

type CombatProposal = {
  actorId: string;
  targetId: string;
  targetName: string;
  targetAc: number;

  roll: {
    die: "d20";
    natural: number;
    modifier: number;
    total: number;
    rngIndex: number;
  };

  damage?: {
    die: "d8";
    natural: number;
    modifier: number;
    total: number;
    rngIndex: number;
  } | null;

  hit: boolean;

  hpBefore: number;
  hpAfter: number;

  // editable narration
  narrationDraft: string;
};

// ------------------------------------------------------------
// Random helpers (demo-only; table is non-canonical)
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
// ------------------------------------------------------------

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
    factions.forEach((f) => {
      lines.push(`• ${f.name} want to ${f.desire} — but ${f.pressure}.`);
    });
  }

  lines.push(`${hook}.`);
  lines.push("That repetition feels deliberate. And it feels recent.");

  return lines.join("\n\n");
}

// ------------------------------------------------------------
// Difficulty inference (language-only) — still used for non-combat
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
// Deterministic RNG for mechanical resolution (replayable)
// ------------------------------------------------------------

function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rollDieFromSeed(seed: string, index: number, sides: number): number {
  const base = fnv1a32(`${seed}#${index}#d${sides}`);
  const rnd = mulberry32(base)();
  return Math.floor(rnd * sides) + 1;
}

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ------------------------------------------------------------
// Derive minimal mechanical state from events
// ------------------------------------------------------------

function deriveRngSeed(events: readonly SessionEvent[]): string | null {
  for (const e of events) {
    if (e.type === "RNG_SEEDED") {
      const s = e.payload["seed"];
      if (typeof s === "string") return s;
    }
  }
  return null;
}

function deriveLastRngIndex(events: readonly SessionEvent[]): number {
  let max = -1;
  for (const e of events) {
    if (e.type === "ROLL_RECORDED") {
      const idx = e.payload["rngIndex"];
      if (typeof idx === "number" && Number.isFinite(idx)) {
        if (idx > max) max = idx;
      }
    }
  }
  return max;
}

function deriveCharacters(events: readonly SessionEvent[]): Record<string, Character> {
  const out: Record<string, Character> = {};

  for (const e of events) {
    if (e.type === "CHARACTER_CREATED") {
      const actorId = e.payload["actorId"];
      const name = e.payload["name"];
      const stats = e.payload["stats"];
      const hpMax = e.payload["hpMax"];
      const ac = e.payload["ac"];

      if (typeof actorId !== "string" || typeof name !== "string") continue;
      if (typeof stats !== "object" || stats === null) continue;
      if (typeof hpMax !== "number" || typeof ac !== "number") continue;

      const s: any = stats;
      out[actorId] = {
        actorId,
        name,
        stats: {
          STR: Number(s.STR ?? 10),
          DEX: Number(s.DEX ?? 10),
          CON: Number(s.CON ?? 10),
          INT: Number(s.INT ?? 10),
          WIS: Number(s.WIS ?? 10),
          CHA: Number(s.CHA ?? 10),
        },
        hpMax,
        hp: hpMax,
        ac,
      };
    }
  }

  // Apply DAMAGE_APPLIED to characters if present
  for (const e of events) {
    if (e.type === "DAMAGE_APPLIED") {
      const targetId = e.payload["targetId"];
      const hpAfter = e.payload["hpAfter"];
      if (typeof targetId !== "string") continue;
      if (typeof hpAfter !== "number" || !Number.isFinite(hpAfter)) continue;
      if (!out[targetId]) continue;
      out[targetId] = { ...out[targetId], hp: hpAfter };
    }
  }

  return out;
}

function deriveEntities(events: readonly SessionEvent[]): Record<string, Entity> {
  const out: Record<string, Entity> = {};

  for (const e of events) {
    if (e.type === "ENTITY_SPAWNED") {
      const entityId = e.payload["entityId"];
      const kind = e.payload["kind"];
      const name = e.payload["name"];
      const hpMax = e.payload["hpMax"];
      const ac = e.payload["ac"];
      const tags = e.payload["tags"];

      if (typeof entityId !== "string") continue;
      if (kind !== "monster" && kind !== "npc") continue;
      if (typeof name !== "string") continue;
      if (typeof hpMax !== "number" || typeof ac !== "number") continue;

      out[entityId] = {
        entityId,
        kind,
        name,
        hpMax,
        hp: hpMax,
        ac,
        tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [],
      };
    }
  }

  // Apply DAMAGE_APPLIED to entities if present
  for (const e of events) {
    if (e.type === "DAMAGE_APPLIED") {
      const targetId = e.payload["targetId"];
      const hpAfter = e.payload["hpAfter"];
      if (typeof targetId !== "string") continue;
      if (typeof hpAfter !== "number" || !Number.isFinite(hpAfter)) continue;
      if (!out[targetId]) continue;
      out[targetId] = { ...out[targetId], hp: hpAfter };
    }
  }

  return out;
}

// ------------------------------------------------------------

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(
    createSession("demo-session", "demo")
  );

  const [dmMode, setDmMode] = useState<DMMode>("solace-neutral");

  // Initial Table Gate
  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);

  // Editable narration buffer (DM-controlled)
  const [tableDraftText, setTableDraftText] = useState("");

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);

  // Options (non-mechanical) remain for now
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  // Mechanical selection
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  // Combat proposal
  const [combatProposal, setCombatProposal] = useState<CombatProposal | null>(
    null
  );
  const committedProposalRef = useRef(false);

  // ----------------------------------------------------------
  // Derived mechanical state
  // ----------------------------------------------------------

  const rngSeed = useMemo(() => deriveRngSeed(state.events), [state.events]);
  const lastRngIndex = useMemo(
    () => deriveLastRngIndex(state.events),
    [state.events]
  );
  const characters = useMemo(
    () => deriveCharacters(state.events),
    [state.events]
  );
  const entities = useMemo(() => deriveEntities(state.events), [state.events]);

  const player = characters["player_1"] ?? null;

  const entitiesAlive = useMemo(() => {
    return Object.values(entities).filter((e) => e.hp > 0);
  }, [entities]);

  // ----------------------------------------------------------
  // Generate table ONCE per session (non-canonical)
  // ----------------------------------------------------------

  useEffect(() => {
    if (initialTable) return;
    if (dmMode === "solace-neutral" || dmMode === "human") {
      setInitialTable(generateInitialTable());
    }
  }, [dmMode, initialTable]);

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  useEffect(() => {
    if (!initialTable) return;
    if (tableDraftText.trim() === "") {
      setTableDraftText(renderedTableNarration);
    }
  }, [initialTable, renderedTableNarration, tableDraftText]);

  useEffect(() => {
    if (dmMode === "solace-neutral") {
      setTableAccepted(false);
    }
  }, [dmMode]);

  // ----------------------------------------------------------
  // Initialize mechanics (human-committed)
  // ----------------------------------------------------------

  function hasEvent(type: string) {
    return state.events.some((e) => e.type === type);
  }

  function initializeMechanics() {
    // Explicit human action -> commits seed + character + enemy spawn.
    const now = Date.now();
    const seed = crypto.randomUUID();

    const evs: SessionEvent[] = [];

    if (!hasEvent("RNG_SEEDED")) {
      evs.push({
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "arbiter",
        type: "RNG_SEEDED",
        payload: { seed },
      });
    }

    if (!hasEvent("CHARACTER_CREATED")) {
      evs.push({
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "arbiter",
        type: "CHARACTER_CREATED",
        payload: {
          actorId: "player_1",
          name: "Player One",
          stats: { STR: 14, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 10 },
          hpMax: 18,
          ac: 13,
        },
      });
    }

    if (!hasEvent("ENTITY_SPAWNED")) {
      evs.push({
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "arbiter",
        type: "ENTITY_SPAWNED",
        payload: {
          entityId: crypto.randomUUID(),
          kind: "monster",
          name: "Sewer Goblin",
          hpMax: 11,
          ac: 12,
          tags: ["humanoid", "goblin"],
        },
      });
    }

    if (evs.length === 0) return;

    setState((prev) => {
      let next = prev;
      for (const e of evs) next = recordEvent(next, e);
      return next;
    });
  }

  const mechanicsReady = !!rngSeed && !!player && Object.keys(entities).length > 0;

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

    // Reset combat proposal on each new action
    setCombatProposal(null);
    committedProposalRef.current = false;

    // If this is combat, try to infer a target automatically
    if (parsedAction.category === "combat") {
      // Best-effort: if target text matches an entity name
      const targetText = (parsedAction.target ?? "").toLowerCase().trim();
      if (targetText) {
        const match = entitiesAlive.find((en) =>
          en.name.toLowerCase().includes(targetText)
        );
        if (match) {
          setSelectedTargetId(match.entityId);
        }
      }
    }
  }

  // ----------------------------------------------------------
  // Solace silently selects option when facilitating (UX only)
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;
    setSelectedOption(options[0]);
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // Build a deterministic combat proposal (no auto-commit)
  // ----------------------------------------------------------

  function proposeCombat() {
    if (!mechanicsReady) return;
    if (!parsed || parsed.category !== "combat") return;
    if (!selectedTargetId) return;

    const seed = rngSeed!;
    const actor = player!;
    const target = entities[selectedTargetId] ?? null;
    if (!target) return;

    const baseIndex = lastRngIndex + 1;

    const nat = rollDieFromSeed(seed, baseIndex, 20);
    const mod = abilityMod(actor.stats.STR); // v1 STR melee
    const total = nat + mod;
    const hit = total >= target.ac;

    const dmgIndex = baseIndex + 1;
    const dmgNat = rollDieFromSeed(seed, dmgIndex, 8);
    const dmgTotal = hit ? Math.max(1, dmgNat + mod) : 0;

    const hpBefore = target.hp;
    const hpAfter = Math.max(0, hpBefore - dmgTotal);

    // Seed narration draft from mechanical margin
    const margin = total - target.ac;
    const narrationDraft = generateNarration({
      intentText: `Attack ${target.name}`,
      margin,
      lens: "heroic" as NarrativeLens,
    });

    setCombatProposal({
      actorId: actor.actorId,
      targetId: target.entityId,
      targetName: target.name,
      targetAc: target.ac,
      roll: { die: "d20", natural: nat, modifier: mod, total, rngIndex: baseIndex },
      damage: hit
        ? { die: "d8", natural: dmgNat, modifier: mod, total: dmgTotal, rngIndex: dmgIndex }
        : null,
      hit,
      hpBefore,
      hpAfter,
      narrationDraft,
    });
  }

  // ----------------------------------------------------------
  // Commit combat proposal (human-only)
  // ----------------------------------------------------------

  function commitCombatProposal() {
    if (!combatProposal || committedProposalRef.current) return;
    committedProposalRef.current = true;

    const now = Date.now();
    const rollId = crypto.randomUUID();
    const dmgRollId = crypto.randomUUID();

    const events: SessionEvent[] = [
      {
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "player_1",
        type: "ACTION_DECLARED",
        payload: {
          actorId: "player_1",
          action: {
            kind: "attack",
            targetId: combatProposal.targetId,
            intentText: playerInput,
          },
        },
      },
      {
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "system",
        type: "ROLL_RECORDED",
        payload: {
          rollId,
          die: "d20",
          natural: combatProposal.roll.natural,
          modifiers: [{ name: "STR", value: combatProposal.roll.modifier }],
          total: combatProposal.roll.total,
          dcOrAc: combatProposal.targetAc,
          rngIndex: combatProposal.roll.rngIndex,
          source: "solace" as RollSource,
        },
      },
      {
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "system",
        type: "ATTACK_RESOLVED",
        payload: {
          actorId: "player_1",
          targetId: combatProposal.targetId,
          rollId,
          hit: combatProposal.hit,
        },
      },
    ];

    if (combatProposal.hit && combatProposal.damage) {
      events.push(
        {
          id: crypto.randomUUID(),
          timestamp: now,
          actor: "system",
          type: "ROLL_RECORDED",
          payload: {
            rollId: dmgRollId,
            die: "d8",
            natural: combatProposal.damage.natural,
            modifiers: [{ name: "STR", value: combatProposal.damage.modifier }],
            total: combatProposal.damage.total,
            dcOrAc: null,
            rngIndex: combatProposal.damage.rngIndex,
            source: "solace" as RollSource,
          },
        },
        {
          id: crypto.randomUUID(),
          timestamp: now,
          actor: "system",
          type: "DAMAGE_APPLIED",
          payload: {
            targetId: combatProposal.targetId,
            amount: combatProposal.damage.total,
            hpBefore: combatProposal.hpBefore,
            hpAfter: combatProposal.hpAfter,
            damageType: "physical",
          },
        }
      );
    }

    // Keep your OUTCOME event for legacy panels/export (narration-first)
    // but now it's backed by mechanical events above.
    events.push({
      id: crypto.randomUUID(),
      timestamp: now,
      actor: "arbiter",
      type: "OUTCOME",
      payload: {
        description: combatProposal.narrationDraft.trim(),
        dice: {
          mode: "d20" as DiceMode,
          roll: combatProposal.roll.natural,
          dc: combatProposal.targetAc, // AC for combat
          source: "solace" as RollSource,
        },
        audit: [
          "Mechanics proposed deterministically (seed + index)",
          "Narration drafted by CreativeNarrator",
          "Edited by Arbiter (optional)",
          "Committed by Arbiter",
        ],
      },
    });

    setState((prev) => {
      let next = prev;
      for (const e of events) next = recordEvent(next, e);
      return next;
    });

    // Clear input for next turn
    setPlayerInput("");
    setParsed(null);
    setOptions(null);
    setSelectedOption(null);
    setCombatProposal(null);
    setSelectedTargetId("");
  }

  // ----------------------------------------------------------
  // Record canon (non-combat legacy path)
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
  // UI
  // ----------------------------------------------------------

  const turnCount = state.events.filter((e) => e.type === "OUTCOME").length;

  return (
    <StewardedShell>
      <ModeHeader
        title="Stewarded Play — Full Flow (Mechanical Kernel)"
        onShare={shareCanon}
        roles={[
          { label: "Player", description: "Declares intent" },
          {
            label: "Solace",
            description: "Prepares non-canonical drafts + deterministic proposals",
          },
          {
            label: "Arbiter",
            description: "Commits canon",
          },
        ]}
      />

      <CardSection title="Facilitation Mode">
        <label>
          <input
            type="radio"
            checked={dmMode === "human"}
            onChange={() => setDmMode("human")}
          />{" "}
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
            <button onClick={() => setTableAccepted(true)}>Accept Table</button>
          </div>
        </CardSection>
      )}

      {/* HUMAN DM: editable table */}
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
            <button onClick={() => setTableAccepted(true)}>Accept Table</button>
          </div>
        </CardSection>
      )}

      {/* BLOCK PLAY UNTIL ACCEPTED */}
      {dmMode === "solace-neutral" && !tableAccepted && <Disclaimer />}

      {/* GAME FLOW */}
      {(dmMode === "human" || tableAccepted) && (
        <>
          <DungeonPressurePanel turn={turnCount} events={state.events} />

          {/* Mechanics Setup */}
          <CardSection title="Mechanics Setup (Human Commit)">
            <p className="muted" style={{ marginTop: 0 }}>
              To make this a real mechanical RPG kernel, we seed deterministic RNG
              and spawn a starter character + enemy as canonical events.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={initializeMechanics} disabled={mechanicsReady}>
                {mechanicsReady ? "Mechanics Ready" : "Initialize Mechanics"}
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <p className="muted" style={{ margin: 0 }}>
                RNG seeded: <strong>{rngSeed ? "Yes" : "No"}</strong> · Player:{" "}
                <strong>{player ? `${player.name} (HP ${player.hp}/${player.hpMax}, AC ${player.ac})` : "None"}</strong>{" "}
                · Enemies: <strong>{Object.keys(entities).length}</strong>
              </p>
            </div>
          </CardSection>

          <CardSection title="Player Action">
            <textarea
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              placeholder="Describe what your character does… (e.g., 'attack the goblin')"
              style={{
                width: "100%",
                minHeight: "120px",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
            <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={handlePlayerAction}>Submit Action</button>
            </div>
          </CardSection>

          {parsed && (
            <CardSection title="Parsed Action">
              <pre>{JSON.stringify(parsed, null, 2)}</pre>
            </CardSection>
          )}

          {/* If combat, show target selection + proposal */}
          {parsed?.category === "combat" && (
            <CardSection title="Combat (Mechanical Proposal)">
              {!mechanicsReady ? (
                <p className="muted">
                  Initialize mechanics first (seed RNG + character + enemy).
                </p>
              ) : (
                <>
                  <p className="muted" style={{ marginTop: 0 }}>
                    Choose a target, then generate a deterministic proposal. The Arbiter commits canon.
                  </p>

                  <label className="muted">
                    Target:
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      style={{ marginLeft: 8 }}
                    >
                      <option value="">— select —</option>
                      {entitiesAlive.map((en) => (
                        <option key={en.entityId} value={en.entityId}>
                          {en.name} (HP {en.hp}/{en.hpMax}, AC {en.ac})
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={proposeCombat} disabled={!selectedTargetId}>
                      Propose Combat Resolution
                    </button>
                  </div>

                  {combatProposal && (
                    <div style={{ marginTop: 12, border: "1px dashed #666", padding: 12 }}>
                      <h3 style={{ marginTop: 0 }}>Proposed Resolution (Deterministic)</h3>
                      <p className="muted" style={{ marginTop: 0 }}>
                        Derived from seed + roll index (replayable). No mutable flags.
                      </p>

                      <p>
                        🎯 Target: <strong>{combatProposal.targetName}</strong> (AC{" "}
                        <strong>{combatProposal.targetAc}</strong>)
                      </p>

                      <p>
                        🎲 d20 natural <strong>{combatProposal.roll.natural}</strong> + STR{" "}
                        <strong>{combatProposal.roll.modifier}</strong> ={" "}
                        <strong>{combatProposal.roll.total}</strong>{" "}
                        {combatProposal.hit ? "✅ HIT" : "❌ MISS"}{" "}
                        <span className="muted">(rngIndex {combatProposal.roll.rngIndex})</span>
                      </p>

                      {combatProposal.hit && combatProposal.damage ? (
                        <>
                          <p>
                            🗡️ Damage: d8 natural <strong>{combatProposal.damage.natural}</strong> + STR{" "}
                            <strong>{combatProposal.damage.modifier}</strong> ={" "}
                            <strong>{combatProposal.damage.total}</strong>{" "}
                            <span className="muted">(rngIndex {combatProposal.damage.rngIndex})</span>
                          </p>
                          <p>
                            ❤️ HP: <strong>{combatProposal.hpBefore}</strong> →{" "}
                            <strong>{combatProposal.hpAfter}</strong>
                          </p>
                        </>
                      ) : (
                        <p className="muted">No damage (miss).</p>
                      )}

                      <label className="muted">Narration (editable)</label>
                      <textarea
                        rows={4}
                        value={combatProposal.narrationDraft}
                        onChange={(e) =>
                          setCombatProposal((prev) =>
                            prev ? { ...prev, narrationDraft: e.target.value } : prev
                          )
                        }
                        style={{ width: "100%" }}
                      />

                      <div style={{ marginTop: 10 }}>
                        <button onClick={commitCombatProposal}>Commit Combat Outcome</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardSection>
          )}

          {/* Options remain for non-combat (UX support) */}
          {options && dmMode === "human" && parsed?.category !== "combat" && (
            <CardSection title="Options">
              <ul>
                {options.map((opt) => (
                  <li key={opt.id}>
                    <button onClick={() => setSelectedOption(opt)}>
                      {opt.description}
                    </button>
                  </li>
                ))}
              </ul>
            </CardSection>
          )}

          {/* Non-combat resolution panel (legacy path) */}
          {selectedOption && parsed?.category !== "combat" && (
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
