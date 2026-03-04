"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// Upgrades included in this file:
// ✅ Combat setup broken out into <CombatSetupPanel /> (locks once COMBAT_STARTED)
// ✅ Turn-aware action entry (enemy turns are Arbiter-authored; player turns are player-authored)
// ✅ Exploration map is canon-only view (derived from events)
// ✅ After intent + option selection, we auto-draft exploration canon (move/reveal/mark)
// ✅ On Record Outcome, we commit OUTCOME + exploration bundle atomically (single append-only transaction)
// ✅ MAP_MARKED supported (auto-suggest door/locked based on text)
// ✅ Proposed movement uses a DIRECTION DROPDOWN (no raw To X/Y by default; optional custom)
// ✅ CanonEventsPanel lists non-OUTCOME canon events (movement/map/combat)
//
// Invariants remain:
// - Player declares intent.
// - Solace drafts options/narration (non-authoritative).
// - Dice decide success/failure.
// - Arbiter is the only authority that commits canon.
// - Canon is append-only events; no silent mutation.
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

import CombatSetupPanel from "@/components/combat/CombatSetupPanel";
import { deriveCombatState, findLatestCombatId, formatCombatantLabel } from "@/lib/combat/CombatState";

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

type Direction = "north" | "south" | "east" | "west";
type MoveMode = "direction" | "custom";

type ExplorationDraft = {
  enableMove: boolean;
  moveMode: MoveMode;
  direction: Direction;
  to: XY | null;

  enableReveal: boolean;
  revealRadius: 0 | 1 | 2;

  enableMark: boolean;
  markKind: MapMarkKind;
  markNote: string;
};

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
    case "COMBAT_ENDED": {
      const combatId = p?.combatId ? String(p.combatId) : "(unknown)";
      return `🏁 Combat ended (${combatId})`;
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

  const factionCount = pick([2, 3, 3]); // bias slightly toward 3
  const chosenNames = pickManyUnique(factionNames, factionCount);

  return {
    openingFrame: pick([
      "A low fog coils between narrow streets as evening bells fade.",
      "Rain-dark stone reflects lanternlight in uneasy patterns.",
      "Voices echo where they shouldn’t, carrying fragments of argument.",
      "The city hums, unaware of the pressure building beneath it.",
    ]),
    locationTraits: [pick(["crowded", "echoing", "claustrophobic", "uneasily quiet"]), pick(["ancient stone", "rotting wood", "slick cobblestone"])],
    latentFactions: chosenNames.map((name) => ({
      name,
      desire: pick(desires),
      pressure: pick(pressures),
    })),
    environmentalOddities: [
      pick(["Lantern flames gutter without wind", "Stone walls seem to absorb sound", "Whispers surface near old drains", "Footsteps echo twice"]),
    ],
    dormantHooks: [pick(["A name scratched into stone repeats across districts", "A missing city clerk last seen near the underways", "A sealed door recently disturbed"])],
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
  lines.push(`The place feels ${traitA}, and the air carries the stink of ${traitB}.`);

  if (/footsteps echo twice/i.test(oddity)) {
    lines.push("Every step answers itself — once, then again — like the street remembers you a beat too late.");
  } else if (/lantern/i.test(oddity.toLowerCase())) {
    lines.push("Lanternlight can’t decide what it wants to be — steady one second, starving the next.");
  } else if (/absorb sound/i.test(oddity.toLowerCase())) {
    lines.push("Sound doesn’t travel right. Words die early, like the walls are swallowing them.");
  } else if (/whispers/i.test(oddity.toLowerCase())) {
    lines.push("You keep catching whispers at the edge of hearing — not loud enough to understand, not quiet enough to ignore.");
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

// ------------------------------------------------------------
// Difficulty inference (language-only)
// ------------------------------------------------------------

function inferOptionKind(description: string): OptionKind {
  const text = description.toLowerCase();

  if (text.includes("attack") || text.includes("fight") || text.includes("oppose") || text.includes("contest")) return "contested";
  if (text.includes("climb") || text.includes("cross") || text.includes("navigate") || text.includes("environment")) return "environmental";
  if (text.includes("steal") || text.includes("sneak") || text.includes("risk")) return "risky";

  return "safe";
}

// ------------------------------------------------------------
// Turn + role helpers (combat-aware)
// ------------------------------------------------------------

function isEnemyActorId(actorId: string) {
  return actorId.startsWith("enemy_") || actorId.startsWith("enemy_group_");
}

function describeActorForUI(actorId: string, derivedCombat: any | null) {
  if (!derivedCombat) return { label: "Player 1", kind: "player" as const };

  const spec = derivedCombat.participants?.find((p: any) => p.id === actorId) ?? null;
  if (spec) {
    return {
      label: formatCombatantLabel(spec),
      kind: spec.kind === "enemy_group" ? ("enemy" as const) : ("player" as const),
    };
  }

  // fallback
  return {
    label: actorId,
    kind: isEnemyActorId(actorId) ? ("enemy" as const) : ("player" as const),
  };
}

// ------------------------------------------------------------

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));
  const [dmMode, setDmMode] = useState<DMMode>("solace-neutral");

  // Map size (matches your ExplorationMapPanel MVP assumptions)
  const MAP_W = 13;
  const MAP_H = 9;

  // Initial Table Gate
  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);

  // Editable narration buffer (DM-controlled)
  const [tableDraftText, setTableDraftText] = useState("");

  // Intent + resolution flow
  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  // ----------------------------------------------------------
  // Canon append helper (used by broken-out panels)
  // ----------------------------------------------------------

  function appendCanon(type: string, payload: any) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type,
        payload,
      })
    );
  }

  // ----------------------------------------------------------
  // Combat derived state (for turn-aware input labeling)
  // ----------------------------------------------------------

  const latestCombatId = useMemo(() => findLatestCombatId(state.events as any) ?? null, [state.events]);

  const derivedCombat = useMemo(() => {
    if (!latestCombatId) return null;
    try {
      return deriveCombatState(latestCombatId, state.events as any);
    } catch {
      return null;
    }
  }, [latestCombatId, state.events]);

  const activeActorId = useMemo(() => {
    if (derivedCombat?.activeCombatantId) return String(derivedCombat.activeCombatantId);
    return "player_1";
  }, [derivedCombat]);

  const activeActorUI = useMemo(() => {
    return describeActorForUI(activeActorId, derivedCombat);
  }, [activeActorId, derivedCombat]);

  // ----------------------------------------------------------
  // Exploration draft (auto-prepared AFTER intent -> option selection)
  // ----------------------------------------------------------

  const currentPos = useMemo(() => deriveCurrentPosition(state.events as any[], MAP_W, MAP_H), [state.events]);

  const [explorationDraft, setExplorationDraft] = useState<ExplorationDraft>({
    enableMove: false,
    moveMode: "direction",
    direction: "north",
    to: null,

    enableReveal: true,
    revealRadius: 1,

    enableMark: false,
    markKind: "door",
    markNote: "",
  });

  // Auto-draft exploration once an option is selected (we now have intent + a concrete proposed resolution)
  useEffect(() => {
    if (!selectedOption) return;

    const intentText = `${playerInput}\n${selectedOption.description}`.trim();
    const inferred = inferDirection(intentText);

    const dir: Direction = inferred ?? "north";
    const step = stepFrom(currentPos, dir);
    const canMove = withinBounds(step, MAP_W, MAP_H);

    const door = textSuggestsDoor(intentText);
    const locked = textSuggestsLocked(intentText);

    setExplorationDraft((prev) => ({
      ...prev,
      enableMove: canMove,
      moveMode: "direction",
      direction: dir,
      to: canMove ? step : null,

      enableReveal: true,
      revealRadius: 1,

      enableMark: door,
      markKind: "door",
      markNote: door ? (locked ? "locked" : prev.markNote || "") : prev.markNote,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption?.id]);

  // Keep draft.to synced if user is in direction mode and changes direction
  useEffect(() => {
    if (!selectedOption) return;
    if (!explorationDraft.enableMove) return;
    if (explorationDraft.moveMode !== "direction") return;

    const nextTo = stepFrom(currentPos, explorationDraft.direction);
    const canMove = withinBounds(nextTo, MAP_W, MAP_H);

    setExplorationDraft((p) => ({
      ...p,
      to: canMove ? nextTo : null,
      enableMove: canMove,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorationDraft.direction, explorationDraft.moveMode, currentPos.x, currentPos.y, selectedOption?.id]);

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

  // If user switches modes:
  // - Solace: gate applies
  // - Human: DO NOT auto-accept
  useEffect(() => {
    if (dmMode === "solace-neutral") setTableAccepted(false);
  }, [dmMode]);

  // ----------------------------------------------------------
  // Player/Arbiter submits action (turn-aware)
  // ----------------------------------------------------------

  function handleActionSubmit() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction(activeActorId, playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
  }

  // Solace silently selects option when facilitating (neutral mode)
  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;
    setSelectedOption(options[0]);
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // Record canon atomically (OUTCOME + exploration bundle)
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
    const d = explorationDraft;

    setState((prev) => {
      let next = prev;

      // 1) OUTCOME is canon
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload,
      });

      // 2) Exploration bundle (append-only; arbiter-only)
      //    Movement is a consequence of intent resolution, not a pre-move UI action.
      const here = deriveCurrentPosition(next.events as any[], MAP_W, MAP_H);

      // Determine destination
      let destination: XY | null = null;

      if (d.enableMove) {
        if (d.moveMode === "direction") {
          const to = stepFrom(here, d.direction);
          destination = withinBounds(to, MAP_W, MAP_H) ? to : null;
        } else {
          if (d.to && withinBounds(d.to, MAP_W, MAP_H)) destination = { x: d.to.x, y: d.to.y };
        }
      }

      // PLAYER_MOVED (only if we have a valid destination)
      if (destination) {
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "PLAYER_MOVED",
          payload: { from: here, to: destination } as any,
        });
      }

      // MAP_REVEALED (reveal around destination if moved, else reveal around here)
      if (d.enableReveal && d.revealRadius > 0) {
        const center = destination ?? here;
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_REVEALED",
          payload: { tiles: revealRadius(center, d.revealRadius, MAP_W, MAP_H) } as any,
        });
      }

      // MAP_MARKED (mark at destination if moved, else current tile)
      if (d.enableMark) {
        const at = destination ?? here;
        const note = d.markNote.trim() ? d.markNote.trim() : null;
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_MARKED",
          payload: { at, kind: d.markKind, note } as any,
        });
      }

      return next;
    });
  }

  // ----------------------------------------------------------
  // Share canon
  // ----------------------------------------------------------

  function shareCanon() {
    navigator.clipboard.writeText(exportCanon(state.events));
    alert("Canon copied to clipboard.");
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
          <input type="radio" checked={dmMode === "human"} onChange={() => setDmMode("human")} />{" "}
          Human DM (options visible + editable setup)
        </label>
        <br />
        <label>
          <input type="radio" checked={dmMode === "solace-neutral"} onChange={() => setDmMode("solace-neutral")} />{" "}
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

          {/* Map is canon-only view */}
          <ExplorationMapPanel events={state.events} mapW={MAP_W} mapH={MAP_H} />

          {/* Combat (broken out, locked by canon) */}
          <CombatSetupPanel events={state.events as any[]} onAppendCanon={appendCanon} />

          {/* Turn-aware action banner */}
          <CardSection title="Current Turn">
            {derivedCombat ? (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div className="muted">Active combatant</div>
                  <div style={{ marginTop: 4 }}>
                    <strong>{activeActorUI.label}</strong>{" "}
                    <span className="muted">({activeActorUI.kind === "enemy" ? "enemy (arbiter-authored)" : "player"})</span>
                  </div>
                </div>
                <div className="muted" style={{ alignSelf: "flex-end" }}>
                  Round {derivedCombat.round}
                </div>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 0 }}>
                No combat active. Default actor is Player 1.
              </p>
            )}
          </CardSection>

          <CardSection title={activeActorUI.kind === "enemy" ? "Arbiter Action (Enemy Turn)" : "Player Action"}>
            <textarea
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              placeholder={
                activeActorUI.kind === "enemy"
                  ? `As Arbiter, describe what ${activeActorUI.label} does…`
                  : "Describe what your character does…"
              }
              style={{
                width: "100%",
                minHeight: "120px",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
            <div style={{ marginTop: 8 }}>
              <button onClick={handleActionSubmit}>Submit Action</button>
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
                These are auto-suggested based on intent + selected option. They are NOT canon until you record the outcome.
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
                    onChange={(e) => setExplorationDraft((p) => ({ ...p, enableMove: e.target.checked }))}
                  />
                  Commit movement (PLAYER_MOVED)
                </label>

                {explorationDraft.enableMove && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
                      Move mode:
                      <select
                        value={explorationDraft.moveMode}
                        onChange={(e) =>
                          setExplorationDraft((p) => ({
                            ...p,
                            moveMode: e.target.value as MoveMode,
                            // if switching to direction, immediately re-derive
                            to:
                              e.target.value === "direction"
                                ? withinBounds(stepFrom(currentPos, p.direction), MAP_W, MAP_H)
                                  ? stepFrom(currentPos, p.direction)
                                  : null
                                : p.to,
                          }))
                        }
                      >
                        <option value="direction">Direction (recommended)</option>
                        <option value="custom">Custom coordinate</option>
                      </select>
                    </label>

                    {explorationDraft.moveMode === "direction" ? (
                      <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
                        Direction:
                        <select
                          value={explorationDraft.direction}
                          onChange={(e) => setExplorationDraft((p) => ({ ...p, direction: e.target.value as Direction }))}
                        >
                          <option value="north">North (↑)</option>
                          <option value="east">East (→)</option>
                          <option value="south">South (↓)</option>
                          <option value="west">West (←)</option>
                        </select>
                      </label>
                    ) : (
                      <>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          To X:
                          <input
                            value={explorationDraft.to?.x ?? ""}
                            onChange={(e) => {
                              const x = Number(e.target.value);
                              setExplorationDraft((p) => ({
                                ...p,
                                to: {
                                  x: Number.isFinite(x) ? Math.trunc(x) : currentPos.x,
                                  y: p.to?.y ?? currentPos.y,
                                },
                              }));
                            }}
                            style={{ width: 120 }}
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
                                to: {
                                  x: p.to?.x ?? currentPos.x,
                                  y: Number.isFinite(y) ? Math.trunc(y) : currentPos.y,
                                },
                              }));
                            }}
                            style={{ width: 120 }}
                          />
                        </label>
                      </>
                    )}

                    <span className="muted">
                      (Bounds: 0..{MAP_W - 1} / 0..{MAP_H - 1})
                    </span>

                    <span className="muted" style={{ marginLeft: "auto" }}>
                      Suggested destination:{" "}
                      <strong>
                        {explorationDraft.enableMove && explorationDraft.to
                          ? `(${explorationDraft.to.x},${explorationDraft.to.y})`
                          : "(none)"}
                      </strong>
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
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 240 }}>
                    Reveal radius:
                    <select
                      value={explorationDraft.revealRadius}
                      onChange={(e) =>
                        setExplorationDraft((p) => ({ ...p, revealRadius: Number(e.target.value) as any }))
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

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 240px" }}>
                      Note (optional):
                      <input
                        value={explorationDraft.markNote}
                        onChange={(e) => setExplorationDraft((p) => ({ ...p, markNote: e.target.value }))}
                        placeholder="e.g., locked / sealed / humming / glyph"
                      />
                    </label>

                    <span className="muted">
                      (Mark applies to destination if moved; otherwise current tile.)
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
