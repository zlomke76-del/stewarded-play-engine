// app/demo/page.tsx
"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// This file is now the *orchestrator* only.
// UI is broken into components under app/demo/components.
//
// (Upgraded toward "real game" direction)
//
// Session-level truth:
// - Party roster is declared ONCE per session (append-only event: PARTY_DECLARED)
// - After PARTY_DECLARED exists, party editing is LOCKED for the session
// - Combat participants draw from the party roster
//
// Combat-level truth:
// - Turn order is per-combat (derived from COMBAT_STARTED + INITIATIVE_ROLLED + TURN_ADVANCED)
// - Combat setup is locked while combat is active
//
// Governance direction:
// - In Solace-neutral, the *player* should not author enemy groups or start combat from here.
//   Combat begins from hostile player action + pressure gating (handled by orchestration rules).
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
import ExplorationMapPanel from "@/components/world/ExplorationMapPanel";
import CombatRendererPanel from "@/components/world/CombatRendererPanel";
import EnemyTurnResolverPanel from "@/components/combat/EnemyTurnResolverPanel";
import CombatSetupPanel from "@/components/combat/CombatSetupPanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";

import {
  deriveCombatState,
  findLatestCombatId,
  formatCombatantLabel,
  nextTurnPointer,
} from "@/lib/combat/CombatState";

import AmbientBackground from "./components/AmbientBackground";
import DemoHero from "./components/DemoHero";
import InitialTableSection from "./components/InitialTableSection";
import PartySetupSection from "./components/PartySetupSection";

import {
  DMMode,
  DemoSectionId,
  DiceMode,
  RollSource,
  InitialTable,
  ExplorationDraft,
} from "./demoTypes";

import {
  anchorId,
  scrollToSection,
  clampInt,
  normalizeName,
  randomName,
  generateInitialTable,
  renderInitialTableNarration,
  inferOptionKind,
  withinBounds,
  deriveCurrentPosition,
  revealRadius,
  inferDirection,
  stepFrom,
  textSuggestsDoor,
  textSuggestsLocked,
  isCombatEndedForId,
} from "./demoUtils";

// ------------------------------------------------------------
// Party (Session-level truth)
// ------------------------------------------------------------

type PartyMember = {
  id: string; // stable per session (ex: "player_1")
  name: string;
  className: string;
  ac: number;
  hpMax: number;
  hpCurrent: number;
  initiativeMod: number;
};

type PartyDeclaredPayload = {
  partyId: string;
  members: PartyMember[];
};

function safeInt(n: unknown, fallback: number, lo: number, hi: number) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : fallback;
  return Math.max(lo, Math.min(hi, x));
}

function displayName(m: PartyMember, i1: number) {
  const n = normalizeName(m.name || "");
  return n.length > 0 ? n : `Player ${i1}`;
}

function defaultParty(count: number): PartyDeclaredPayload {
  const n = clampInt(count, 1, 6);
  return {
    partyId: crypto.randomUUID(),
    members: Array.from({ length: n }, (_, i) => {
      const idx = i + 1;
      return {
        id: `player_${idx}`,
        name: "",
        className: "",
        ac: 14,
        hpMax: 12,
        hpCurrent: 12,
        initiativeMod: 1,
      };
    }),
  };
}

function deriveLatestParty(events: readonly any[]): PartyDeclaredPayload | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e?.type !== "PARTY_DECLARED") continue;
    const p = e?.payload as PartyDeclaredPayload;
    if (!p || !Array.isArray(p.members)) continue;
    return p;
  }
  return null;
}

type PressureTier = "low" | "medium" | "high";

function inferPressureTier(outcomesCount: number): PressureTier {
  // Simple demo heuristic (swap later for real pressure model):
  // 0–1: low, 2–5: medium, 6+: high
  if (outcomesCount <= 1) return "low";
  if (outcomesCount <= 5) return "medium";
  return "high";
}

// ------------------------------------------------------------
// Zone derivation helpers (must match DungeonPressurePanel semantics)
// ------------------------------------------------------------

const ZONE_SIZE_TILES = 4;

function zoneIdFromTileXY(x: number, y: number) {
  const zx = Math.floor(x / ZONE_SIZE_TILES);
  const zy = Math.floor(y / ZONE_SIZE_TILES);
  return `${zx},${zy}`;
}

function clamp01to100(n: number) {
  const x = Math.round(n);
  return Math.max(0, Math.min(100, x));
}

function pressureDeltaFor(kind: ReturnType<typeof inferOptionKind>, success: boolean) {
  // Deterministic, advisory-friendly escalation:
  // - time always advances a little
  // - failures spike more than successes
  // - contested/risky actions are "louder"
  const base = 1;
  const byKind =
    kind === "contested" ? 4 : kind === "risky" ? 3 : kind === "environmental" ? 2 : 1;
  const byResult = success ? 1 : 6;
  return base + byKind + byResult;
}

function awarenessDeltaFor(kind: ReturnType<typeof inferOptionKind>, success: boolean) {
  // Awareness is a "tripwire" meter: contested + failure draws attention.
  const base = 0;
  const byKind = kind === "contested" ? 8 : kind === "risky" ? 5 : kind === "environmental" ? 2 : 1;
  const byResult = success ? 1 : 10;
  return base + byKind + byResult;
}

// ------------------------------------------------------------

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));

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

  // Which party member is acting (player must choose / default)
  const [actingPlayerId, setActingPlayerId] = useState<string>("player_1");

  // Combat renderer trigger (parent-driven)
  const [enemyPlayNonce, setEnemyPlayNonce] = useState(0);

  // Enemy telegraph metadata (Solace-neutral only; visual only + narration anchor)
  const [enemyTelegraphHint, setEnemyTelegraphHint] = useState<{
    enemyName: string;
    targetName: string;
    attackStyleHint: "volley" | "beam" | "charge" | "unknown";
  } | null>(null);

  // ----------------------------------------------------------
  // Counts (must be declared before derived values that depend on them)
  // ----------------------------------------------------------

  const outcomesCount = useMemo(
    () => state.events.filter((e: any) => e?.type === "OUTCOME").length,
    [state.events]
  );

  const canonCount = useMemo(
    () => state.events.filter((e: any) => e?.type && e?.type !== "OUTCOME").length,
    [state.events]
  );

  // ----------------------------------------------------------
  // Party sheet (session-level)
  // ----------------------------------------------------------

  const partyCanonical = useMemo(() => deriveLatestParty(state.events as any[]) ?? null, [state.events]);

  // Draft editor lives in session UI; only becomes canon when Arbiter commits (PARTY_DECLARED).
  const [partyDraft, setPartyDraft] = useState<PartyDeclaredPayload | null>(null);

  // Ensure a draft exists once mode is selected (so Party Setup appears immediately after mode)
  useEffect(() => {
    if (dmMode === null) return;

    // If canonical exists, mirror it into draft for display consistency (still locked).
    if (partyCanonical) {
      setPartyDraft((prev) => prev ?? partyCanonical);
      return;
    }

    // Otherwise create a default draft once.
    setPartyDraft((prev) => prev ?? defaultParty(4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmMode, partyCanonical?.partyId]);

  // Effective party is canonical if present, otherwise draft.
  const partyEffective: PartyDeclaredPayload | null = partyCanonical ?? partyDraft;
  const partyMembers = partyEffective?.members ?? [];

  const effectivePlayerNames = useMemo(() => {
    return partyMembers.map((m, idx) => displayName(m, idx + 1));
  }, [partyMembers]);

  // Keep actingPlayerId valid as party changes
  useEffect(() => {
    if (!partyMembers.length) {
      setActingPlayerId("player_1");
      return;
    }
    const exists = partyMembers.some((m) => String(m.id) === String(actingPlayerId));
    if (exists) return;

    setActingPlayerId(String(partyMembers[0].id ?? "player_1"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyMembers.map((m) => m.id).join("|")]);

  // ----------------------------------------------------------
  // Combat state (derived + ended-aware)
  // ----------------------------------------------------------

  const latestCombatId = useMemo(() => findLatestCombatId(state.events as any) ?? null, [state.events]);

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
    return derivedCombat.participants.find((p: any) => p.id === derivedCombat.activeCombatantId) ?? null;
  }, [derivedCombat]);

  const isEnemyTurn = combatActive && activeCombatantSpec?.kind === "enemy_group";
  const isPlayerTurn = combatActive && activeCombatantSpec?.kind === "player";

  // Party lock rules:
  // - once PARTY_DECLARED exists => locked for session
  // - also locked while combat is active (even for draft)
  const partyLockedByCanon = !!partyCanonical;
  const partyLockedByCombat = combatActive;
  const partyLocked = partyLockedByCanon || partyLockedByCombat;

  function setPartySize(nextCount: number) {
    const n = clampInt(nextCount, 1, 6);

    setPartyDraft((prev) => {
      const base = prev ?? defaultParty(n);
      const members = [...(base.members || [])];

      if (members.length === n) return base;

      if (members.length > n) {
        return { ...base, members: members.slice(0, n) };
      }

      // Grow
      const startIdx = members.length;
      for (let i = startIdx; i < n; i++) {
        const i1 = i + 1;
        members.push({
          id: `player_${i1}`,
          name: "",
          className: "",
          ac: 14,
          hpMax: 12,
          hpCurrent: 12,
          initiativeMod: 1,
        });
      }

      return { ...base, members };
    });
  }

  function randomizePartyNames() {
    if (!partyDraft) return;

    setPartyDraft((prev) => {
      if (!prev) return prev;

      const used = new Set<string>(
        prev.members.map((m) => normalizeName(m.name || "").toLowerCase()).filter(Boolean)
      );

      const next: PartyDeclaredPayload = {
        ...prev,
        members: prev.members.map((m) => ({ ...m })),
      };

      for (let i = 0; i < next.members.length; i++) {
        const current = normalizeName(next.members[i].name || "");
        if (current) continue;

        let tries = 0;
        let name = randomName();
        while (used.has(name.toLowerCase()) && tries < 12) {
          name = randomName();
          tries++;
        }
        used.add(name.toLowerCase());
        next.members[i].name = name;
      }

      return next;
    });
  }

  function commitParty() {
    if (!partyDraft) return;
    if (partyLocked) return;

    const cleaned: PartyDeclaredPayload = {
      partyId: partyDraft.partyId || crypto.randomUUID(),
      members: (partyDraft.members || [])
        .slice(0, 6)
        .map((m, idx) => {
          const i1 = idx + 1;
          const id = normalizeName(m.id || `player_${i1}`) || `player_${i1}`;
          const hpMax = safeInt(m.hpMax, 12, 1, 999);
          const hpCurrent = safeInt(m.hpCurrent, hpMax, 0, 999);

          return {
            id,
            name: normalizeName(m.name || ""),
            className: normalizeName(m.className || ""),
            ac: safeInt(m.ac, 14, 1, 40),
            hpMax,
            hpCurrent: Math.min(hpCurrent, hpMax),
            initiativeMod: safeInt(m.initiativeMod, 1, -10, 20),
          };
        }),
    };

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "PARTY_DECLARED",
        payload: cleaned as any,
      })
    );
  }

  // ----------------------------------------------------------
  // Exploration draft (auto-prepared AFTER intent + option)
  // ----------------------------------------------------------

  const currentPos = useMemo(() => deriveCurrentPosition(state.events as any[], MAP_W, MAP_H), [state.events]);

  const [explorationDraft, setExplorationDraft] = useState<ExplorationDraft>({
    enableMove: false,
    direction: "none",
    enableReveal: true,
    revealRadius: 1,
    enableMark: false,
    markKind: "door",
    markNote: "",
  });

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
  // Canon append helper (for components)
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
  // Player submits action (intent)
  // ----------------------------------------------------------

  const pressureTier = useMemo(() => inferPressureTier(outcomesCount), [outcomesCount]);

  const isWrongPlayerForTurn =
    combatActive &&
    isPlayerTurn &&
    dmMode !== "human" &&
    !!activeCombatantSpec?.id &&
    String(activeCombatantSpec.id) !== String(actingPlayerId);

  const canPlayerSubmitIntent =
    dmMode !== null &&
    // In Solace-neutral, block intent on enemy turns, and require correct player's turn during player turns.
    ((dmMode === "human" && true) ||
      (!combatActive && !isEnemyTurn) ||
      (combatActive && !isEnemyTurn && !isWrongPlayerForTurn));

  function handlePlayerAction() {
    if (!playerInput.trim()) return;
    if (!canPlayerSubmitIntent) return;

    const actorId = normalizeName(actingPlayerId || "player_1") || "player_1";

    const parsedAction = parseAction(actorId, playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);

    // Nudge flow forward
    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }

  // Solace-neutral auto-select first option
  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;
    setSelectedOption(options[0]);

    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // Turn controls
  // ----------------------------------------------------------

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

  function passTurn() {
    // Governed: passing is just advancing the turn pointer (no fabricated OUTCOME).
    if (!combatActive) return;
    if (dmMode !== "human" && isEnemyTurn) return;
    if (dmMode !== "human" && isPlayerTurn && isWrongPlayerForTurn) return;
    advanceTurn();
  }

  // ----------------------------------------------------------
  // Record canon (OUTCOME + optional exploration bundle)
  // ----------------------------------------------------------

  function commitExplorationBundle(nextState: SessionState) {
    const d = explorationDraft;
    let next = nextState;

    const here = deriveCurrentPosition(next.events as any[], MAP_W, MAP_H);
    const to = d.enableMove && d.direction !== "none" ? stepFrom(here, d.direction) : null;
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
          payload: { tiles: revealRadius(to, d.revealRadius, MAP_W, MAP_H) } as any,
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
  }

  function handleRecord(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  }) {
    // Determine kind using BOTH intent + option text (prevents "everything safe")
    const selectedText = selectedOption?.description ?? "";
    const combinedText = `${playerInput}\n${selectedText}`.trim();
    const kind = inferOptionKind(combinedText.length ? combinedText : selectedText);

    setState((prev) => {
      // Determine zone at commit time from canon position + intended movement (if any)
      const here = deriveCurrentPosition(prev.events as any[], MAP_W, MAP_H);

      // If this outcome includes a governed movement (as drafted), apply pressure to the destination zone.
      const d = explorationDraft;
      const to =
        d.enableMove && d.direction !== "none" ? stepFrom(here, d.direction) : null;
      const canMove = to ? withinBounds(to, MAP_W, MAP_H) : false;

      const posForZone = d.enableMove && canMove && to ? to : here;
      const zoneId = zoneIdFromTileXY(posForZone.x, posForZone.y);

      const roll = Number(payload?.dice?.roll ?? 0);
      const dc = Number(payload?.dice?.dc ?? 0);
      const success = Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;

      const pressureDelta = pressureDeltaFor(kind, success);
      const awarenessDelta = awarenessDeltaFor(kind, success);

      // Enrich OUTCOME payload without breaking consumers (extra fields are safe to ignore)
      const enrichedOutcome = {
        ...payload,
        meta: {
          ...(payload as any)?.meta,
          optionKind: kind,
          optionDescription: selectedText,
          intent: playerInput,
          zoneId,
          success,
        },
      };

      let next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: enrichedOutcome as any,
      });

      // Canonical escalation events (what DungeonPressurePanel actually listens for)
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "ZONE_PRESSURE_CHANGED",
        payload: { zoneId, delta: clamp01to100(pressureDelta) } as any,
      });

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "ZONE_AWARENESS_CHANGED",
        payload: { zoneId, delta: clamp01to100(awarenessDelta) } as any,
      });

      // Exploration bundle remains governed + append-only
      next = commitExplorationBundle(next);
      return next;
    });

    // Reset draft pipeline + return to next intent
    setPlayerInput("");
    setParsed(null);
    setOptions(null);
    setSelectedOption(null);

    setActiveSection("action");
    queueMicrotask(() => scrollToSection("action"));
  }

  // Enemy outcomes should NOT auto-commit exploration movement/reveal/marks.
  function handleRecordOutcomeOnly(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
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

    setActiveSection("canon");
    queueMicrotask(() => scrollToSection("canon"));
  }

  function shareCanon() {
    navigator.clipboard.writeText(exportCanon(state.events));
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------

  const chapterButtons: { id: DemoSectionId; hint: string }[] = useMemo(
    () => [
      { id: "mode", hint: "Choose facilitator mode" },
      { id: "table", hint: "Start scene + accept table" },
      { id: "pressure", hint: "Advisory state" },
      { id: "map", hint: "Canon view of space" },
      { id: "combat", hint: "Turn order + governance" },
      { id: "action", hint: "Player intent (+ actor)" },
      { id: "resolution", hint: "Roll + record OUTCOME" },
      { id: "canon", hint: "Non-outcome canon log" },
      { id: "ledger", hint: "Outcome narration only" },
    ],
    []
  );

  function selectMode(nextMode: DMMode) {
    setDmMode(nextMode);

    // After mode: we want party setup immediately available, then table.
    setActiveSection("table");
    queueMicrotask(() => scrollToSection("table"));
  }

  // Enemy overlay only when:
  // - combat is active
  // - it's an enemy group's turn
  // - and we're not in Human DM (Solace-neutral expects Solace to run enemy action)
  const activeEnemyOverlayName =
    dmMode !== "human" && combatActive && isEnemyTurn ? String(activeCombatantSpec?.name ?? "") : null;

  const activeEnemyOverlayId =
    dmMode !== "human" && combatActive && isEnemyTurn ? String(activeCombatantSpec?.id ?? "") : null;

  const solaceNeutralEnemyTurnEnabled =
    dmMode === "solace-neutral" &&
    combatActive &&
    isEnemyTurn &&
    !!activeEnemyOverlayName &&
    !!activeEnemyOverlayId;

  // Map demo DMMode -> Resolution panel dmMode (scoped fix: only Solace-neutral locks narration)
  const resolutionDmMode = useMemo(() => (dmMode === "solace-neutral" ? "solace_neutral" : "human"), [dmMode]);

  return (
    <AmbientBackground>
      <div style={{ position: "relative", zIndex: 1 }}>
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

          <DemoHero
            dmMode={dmMode}
            tableAccepted={tableAccepted}
            activeSection={activeSection}
            outcomesCount={outcomesCount}
            canonCount={canonCount}
            chapterButtons={chapterButtons}
            onStartHere={() => {
              setActiveSection("mode");
              scrollToSection("mode");
            }}
            onPlayJump={() => {
              setActiveSection("action");
              scrollToSection("action");
            }}
            onSelectMode={selectMode}
            onNavigate={(id) => {
              setActiveSection(id);
              scrollToSection(id);
            }}
          />

          {/* PARTY SETUP (broken out into component; appears immediately after mode) */}
          {dmMode !== null && (
            <CardSection title="Party Setup (Session Truth)">
              <PartySetupSection
                enabled={true}
                partyDraft={partyDraft}
                partyMembersFallback={partyMembers}
                partyCanonicalExists={!!partyCanonical}
                partyLocked={partyLocked}
                partyLockedByCombat={partyLockedByCombat}
                setPartySize={setPartySize}
                randomizePartyNames={randomizePartyNames}
                commitParty={commitParty}
                safeInt={safeInt}
                setPartyDraft={setPartyDraft}
              />
            </CardSection>
          )}

          {/* TABLE (hidden until mode selected) */}
          <div id={anchorId("table")} style={{ scrollMarginTop: 90 }}>
            <InitialTableSection
              dmMode={dmMode}
              initialTable={initialTable}
              tableAccepted={tableAccepted}
              tableDraftText={tableDraftText}
              setTableDraftText={setTableDraftText}
              onAccept={() => {
                setTableAccepted(true);
                setActiveSection("pressure");
                queueMicrotask(() => scrollToSection("pressure"));
              }}
            />
          </div>

          {(dmMode !== null && (dmMode === "human" || tableAccepted)) && (
            <>
              {/* PRESSURE */}
              <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
                <DungeonPressurePanel turn={outcomesCount} events={state.events} />
              </div>

              {/* MAP */}
              <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
                <div style={{ position: "relative" }}>
                  <ExplorationMapPanel events={state.events} mapW={MAP_W} mapH={MAP_H} />

                  {/* Visual-only combat theater overlay */}
                  <CombatRendererPanel
                    events={state.events}
                    mapW={MAP_W}
                    mapH={MAP_H}
                    activeEnemyGroupName={activeEnemyOverlayName}
                    hideControls={true}
                    playSignal={enemyPlayNonce}
                  />
                </div>
              </div>

              {/* COMBAT */}
              <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
                <CombatSetupPanel
                  events={state.events as any[]}
                  onAppendCanon={appendCanon}
                  // NOTE: If your CombatSetupPanel doesn’t accept these props yet,
                  // remove them and keep only {events, onAppendCanon}.
                  dmMode={dmMode}
                  partyMembers={partyMembers.map((m, idx) => ({
                    id: String(m.id),
                    name: displayName(m, idx + 1),
                    initiativeMod: m.initiativeMod,
                  }))}
                  pressureTier={pressureTier}
                  allowDevControls={false}
                />

                {/* Enemy turn resolver (Solace-neutral) */}
                {solaceNeutralEnemyTurnEnabled && (
                  <CardSection title="Enemy Turn Resolution (Solace-neutral)">
                    <EnemyTurnResolverPanel
                      enabled={true}
                      activeEnemyGroupName={activeEnemyOverlayName}
                      activeEnemyGroupId={activeEnemyOverlayId}
                      playerNames={effectivePlayerNames}
                      onTelegraph={(info) => {
                        setEnemyTelegraphHint(info);
                        setEnemyPlayNonce((n) => n + 1);
                      }}
                      onCommitOutcome={(payload) => handleRecordOutcomeOnly(payload)}
                      onAdvanceTurn={advanceTurn}
                    />

                    {enemyTelegraphHint && (
                      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                        Telegraph hint: <strong>{enemyTelegraphHint.attackStyleHint}</strong> · Target{" "}
                        <strong>{enemyTelegraphHint.targetName}</strong>
                      </div>
                    )}
                  </CardSection>
                )}

                {derivedCombat && (
                  <CardSection title="Derived Turn Order">
                    <div className="muted">
                      Combat: <strong>{derivedCombat.combatId}</strong> · Round{" "}
                      <strong>{derivedCombat.round}</strong>
                      {activeCombatantSpec && (
                        <>
                          {" "}
                          · Active: <strong>{formatCombatantLabel(activeCombatantSpec)}</strong>
                        </>
                      )}
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
                              border: active
                                ? "1px solid rgba(138,180,255,0.55)"
                                : "1px solid rgba(255,255,255,0.10)",
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

                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={advanceTurn}
                        disabled={!derivedCombat || combatEnded || (dmMode === "solace-neutral" && isEnemyTurn)}
                      >
                        Advance Turn
                      </button>

                      <button
                        onClick={passTurn}
                        disabled={!combatActive || (dmMode === "solace-neutral" && isEnemyTurn) || isWrongPlayerForTurn}
                      >
                        Pass / End Turn
                      </button>

                      <button onClick={endCombat} disabled={!derivedCombat || combatEnded}>
                        End Combat
                      </button>
                    </div>
                  </CardSection>
                )}
              </div>

              {/* ACTION */}
              <div id={anchorId("action")} style={{ scrollMarginTop: 90 }}>
                <CardSection title="Player Action">
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                      marginBottom: 10,
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      Acting player:
                      <select
                        value={actingPlayerId}
                        onChange={(e) => setActingPlayerId(e.target.value)}
                        disabled={!partyMembers.length}
                        style={{ minWidth: 240 }}
                      >
                        {partyMembers.length ? (
                          partyMembers.map((m, idx) => (
                            <option key={m.id} value={m.id}>
                              {displayName(m, idx + 1)} ({m.id})
                            </option>
                          ))
                        ) : (
                          <option value="player_1">Player 1 (player_1)</option>
                        )}
                      </select>
                    </label>

                    <button
                      onClick={passTurn}
                      disabled={!combatActive || (dmMode === "solace-neutral" && isEnemyTurn) || isWrongPlayerForTurn}
                    >
                      Pass / End Turn
                    </button>
                  </div>

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
                    <button onClick={handlePlayerAction} disabled={!canPlayerSubmitIntent}>
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
              {options && dmMode === "human" && (
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
                  <ResolutionDraftAdvisoryPanel
                    role={role}
                    dmMode={resolutionDmMode}
                    context={{
                      optionDescription: selectedOption.description,
                      // IMPORTANT: infer from combined intent+option to avoid "everything safe"
                      optionKind: inferOptionKind(`${playerInput}\n${selectedOption.description}`.trim()),
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
        </StewardedShell>
      </div>
    </AmbientBackground>
  );
}
