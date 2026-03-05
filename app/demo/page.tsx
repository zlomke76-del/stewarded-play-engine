// app/demo/page.tsx
"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// Orchestrator only.
// UI sections are composed here.
//
// Recent focus upgrades implemented in this file:
// - New top-of-page onboarding: "Echoes of Fate" + consequence hook
// - Play Style: Human vs Solace as a toggle (no heavy explanation up front)
// - Party Size selection up-front + simple party visual (⚔ icons)
// - "Enter the Dungeon" as the singular primary CTA into the next section
// - Chapters grid simplified early (progressive disclosure)
// - Canonical escalation events emitted on OUTCOME:
//     ZONE_PRESSURE_CHANGED + ZONE_AWARENESS_CHANGED
//   (DungeonPressurePanel now updates deterministically)
// - OptionKind inference uses combined intent + option text (fixes "everything safe")
//
// Updated flow requirement (this change):
// - After Accept Table, user must DECLARE PLAYERS (PartySetupSection)
// - Pressure/Map/Combat/Action stay locked until PARTY_DECLARED exists
// - Chapters "Party" represents PARTY_DECLARED (not just party size)
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { createSession, recordEvent, SessionState } from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";

import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import NextActionHint from "@/components/NextActionHint";
import DungeonPressurePanel from "@/components/world/DungeonPressurePanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";

import { deriveCombatState, findLatestCombatId, nextTurnPointer } from "@/lib/combat/CombatState";

import AmbientBackground from "./components/AmbientBackground";
import InitialTableSection from "./components/InitialTableSection";

import HeroOnboarding from "./components/HeroOnboarding";
import PartySetupSection from "./components/PartySetupSection";
import MapSection from "./components/MapSection";
import ActionSection from "./components/ActionSection";
import CombatSection from "./components/CombatSection";
import CanonChronicleSection from "./components/CanonChronicleSection";

import { DMMode, DemoSectionId, DiceMode, RollSource, InitialTable, ExplorationDraft } from "./demoTypes";

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
  portrait: "Male" | "Female";
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
        portrait: "Male",
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
  if (outcomesCount <= 1) return "low";
  if (outcomesCount <= 5) return "medium";
  return "high";
}

// ------------------------------------------------------------
// Injury / Downed (event-derived, safe default)
// ------------------------------------------------------------

function deriveInjuryStacksForPlayer(events: readonly any[], playerId: string): number {
  const pid = String(playerId ?? "").trim();
  if (!pid) return 0;

  let stacks = 0;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const t = e?.type;

    const p = e?.payload ?? {};

    if (t === "INJURY_APPLIED") {
      const ppid = String(p?.playerId ?? "");
      if (ppid === pid) {
        if (Number.isFinite(Number(p?.stacks))) stacks = Math.max(0, Math.trunc(Number(p.stacks)));
        else if (Number.isFinite(Number(p?.delta))) stacks = Math.max(0, stacks + Math.trunc(Number(p.delta)));
        else stacks = Math.max(0, stacks + 1);
      }
      continue;
    }

    if (t === "INJURY_STACK_CHANGED") {
      const ppid = String(p?.playerId ?? "");
      if (ppid === pid) {
        const d = Number.isFinite(Number(p?.delta)) ? Math.trunc(Number(p.delta)) : 0;
        stacks = Math.max(0, stacks + d);
      }
      continue;
    }

    if (t === "PLAYER_DOWNED") {
      const ppid = String(p?.playerId ?? "");
      if (ppid === pid) stacks = Math.max(0, stacks + 1);
      continue;
    }

    if (t === "DAMAGE_APPLIED") {
      const targetId = String(p?.targetId ?? "");
      if (targetId === pid && p?.downed === true) stacks = Math.max(0, stacks + 1);
      continue;
    }
  }

  return stacks;
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
  const base = 1;
  const byKind = kind === "contested" ? 4 : kind === "risky" ? 3 : kind === "environmental" ? 2 : 1;
  const byResult = success ? 1 : 6;
  return base + byKind + byResult;
}

function awarenessDeltaFor(kind: ReturnType<typeof inferOptionKind>, success: boolean) {
  const base = 0;
  const byKind = kind === "contested" ? 8 : kind === "risky" ? 5 : kind === "environmental" ? 2 : 1;
  const byResult = success ? 1 : 10;
  return base + byKind + byResult;
}

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));

  // mode must be explicitly selected
  const [dmMode, setDmMode] = useState<DMMode | null>(null);

  const MAP_W = 13;
  const MAP_H = 9;

  // Hero image
  const HERO_IMAGE_SRC = "/Hero_dungeon.png";
  const [heroImageOk, setHeroImageOk] = useState(true);

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

  // Which party member is acting
  const [actingPlayerId, setActingPlayerId] = useState<string>("player_1");

  // Combat renderer trigger
  const [enemyPlayNonce, setEnemyPlayNonce] = useState(0);

  // Enemy telegraph metadata
  const [enemyTelegraphHint, setEnemyTelegraphHint] = useState<{
    enemyName: string;
    targetName: string;
    attackStyleHint: "volley" | "beam" | "charge" | "unknown";
  } | null>(null);

  // ----------------------------------------------------------
  // Counts
  // ----------------------------------------------------------

  const outcomesCount = useMemo(() => state.events.filter((e: any) => e?.type === "OUTCOME").length, [state.events]);

  const canonCount = useMemo(
    () => state.events.filter((e: any) => e?.type && e?.type !== "OUTCOME").length,
    [state.events]
  );

  // ----------------------------------------------------------
  // Party sheet (session-level)
  // ----------------------------------------------------------

  const partyCanonical = useMemo(() => deriveLatestParty(state.events as any[]) ?? null, [state.events]);
  const [partyDraft, setPartyDraft] = useState<PartyDeclaredPayload | null>(null);

  useEffect(() => {
    if (dmMode === null) return;

    if (partyCanonical) {
      setPartyDraft((prev) => prev ?? partyCanonical);
      return;
    }

    setPartyDraft((prev) => prev ?? defaultParty(4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmMode, partyCanonical?.partyId]);

  const partyEffective: PartyDeclaredPayload | null = partyCanonical ?? partyDraft;
  const partyMembers = partyEffective?.members ?? [];
  const partySize = clampInt(partyMembers.length || 4, 1, 6);

  const effectivePlayerNames = useMemo(() => partyMembers.map((m, idx) => displayName(m, idx + 1)), [partyMembers]);

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
  // Combat derived + party lock
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

  const partyLockedByCanon = !!partyCanonical;
  const partyLockedByCombat = combatActive;
  const partyLocked = partyLockedByCanon || partyLockedByCombat;

  const activeCombatantSpec = useMemo(() => {
    if (!derivedCombat?.activeCombatantId) return null;
    return derivedCombat.participants.find((p: any) => p.id === derivedCombat.activeCombatantId) ?? null;
  }, [derivedCombat]);

  const isEnemyTurn = combatActive && activeCombatantSpec?.kind === "enemy_group";
  const isPlayerTurn = combatActive && activeCombatantSpec?.kind === "player";

  // NEW: a clean label for UI turn anchoring
  const activeTurnLabel = useMemo(() => {
    if (!combatActive || !activeCombatantSpec) return null;
    const name = String((activeCombatantSpec as any)?.name ?? "").trim();
    const id = String((activeCombatantSpec as any)?.id ?? "").trim();
    if (name) return name;
    if (id) return id;
    return null;
  }, [combatActive, activeCombatantSpec]);

  // ----------------------------------------------------------
  // Injury modifier (applies to Resolution checks)
  // ----------------------------------------------------------

  const actingPlayerInjuryStacks = useMemo(() => {
    const pid = String(actingPlayerId ?? "").trim();
    return deriveInjuryStacksForPlayer(state.events as any[], pid);
  }, [state.events, actingPlayerId]);

  const actingRollModifier = useMemo(() => {
    const s = Math.max(0, Math.min(20, Math.trunc(Number(actingPlayerInjuryStacks ?? 0))));
    return -2 * s;
  }, [actingPlayerInjuryStacks]);

  // ----------------------------------------------------------
  // Party operations
  // ----------------------------------------------------------

  function setPartySize(nextCount: number) {
    const n = clampInt(nextCount, 1, 6);

    if (!partyDraft && !partyCanonical) {
      setPartyDraft(defaultParty(n));
      return;
    }

    setPartyDraft((prev) => {
      const base = prev ?? defaultParty(n);
      const members = [...(base.members || [])];

      if (members.length === n) return base;

      if (members.length > n) {
        return { ...base, members: members.slice(0, n) };
      }

      const startIdx = members.length;
      for (let i = startIdx; i < n; i++) {
        const i1 = i + 1;
        members.push({
          id: `player_${i1}`,
          name: "",
          className: "",
          portrait: "Male",
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

      const used = new Set<string>(prev.members.map((m) => normalizeName(m.name || "").toLowerCase()).filter(Boolean));
      const next: PartyDeclaredPayload = { ...prev, members: prev.members.map((m) => ({ ...m })) };

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
            portrait: (m as any).portrait === "Female" ? "Female" : "Male",
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

    if (tableAccepted) {
      setActiveSection("pressure");
      queueMicrotask(() => scrollToSection("pressure"));
    }
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

    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }

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
    const selectedText = selectedOption?.description ?? "";
    const combinedText = `${playerInput}\n${selectedText}`.trim();
    const kind = inferOptionKind(combinedText.length ? combinedText : selectedText);

    setState((prev) => {
      const here = deriveCurrentPosition(prev.events as any[], MAP_W, MAP_H);

      const d = explorationDraft;
      const to = d.enableMove && d.direction !== "none" ? stepFrom(here, d.direction) : null;
      const canMove = to ? withinBounds(to, MAP_W, MAP_H) : false;

      const posForZone = d.enableMove && canMove && to ? to : here;
      const zoneId = zoneIdFromTileXY(posForZone.x, posForZone.y);

      const roll = Number(payload?.dice?.roll ?? 0);
      const dc = Number(payload?.dice?.dc ?? 0);
      const success = Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;

      const pressureDelta = pressureDeltaFor(kind, success);
      const awarenessDelta = awarenessDeltaFor(kind, success);

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

      next = commitExplorationBundle(next);
      return next;
    });

    setPlayerInput("");
    setParsed(null);
    setOptions(null);
    setSelectedOption(null);

    setActiveSection("action");
    queueMicrotask(() => scrollToSection("action"));
  }

function handleRecordOutcomeOnly(payload: {
  description: string;
  dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
  audit: string[];
}) {
  setState((prev) => {
    // Enemy-turn outcomes still happen "in a zone"
    const here = deriveCurrentPosition(prev.events as any[], MAP_W, MAP_H);
    const zoneId = zoneIdFromTileXY(here.x, here.y);

    const roll = Number(payload?.dice?.roll ?? 0);
    const dc = Number(payload?.dice?.dc ?? 0);
    const success = Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;

    // Enemy-turn resolutions are effectively contested pressure.
    const kind = "contested" as ReturnType<typeof inferOptionKind>;

    const pressureDelta = pressureDeltaFor(kind, success);
    const awarenessDelta = awarenessDeltaFor(kind, success);

    const enrichedOutcome = {
      ...payload,
      meta: {
        ...(payload as any)?.meta,
        optionKind: kind,
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

    return next;
  });

  setActiveSection("canon");
  queueMicrotask(() => scrollToSection("canon"));
}

  // ----------------------------------------------------------
  // Onboarding / Chapters
  // ----------------------------------------------------------

  const canEnterDungeon = dmMode !== null;

  const partyCanonicalExists = !!partyCanonical;

  const chapterState = useMemo(() => {
    const doneMode = dmMode !== null;
    const doneTable = tableAccepted;
    const doneParty = partyCanonicalExists;

    return {
      mode: doneMode ? ("done" as const) : ("next" as const),
      party: doneParty ? ("done" as const) : doneTable ? ("next" as const) : ("locked" as const),
      table: doneTable ? ("done" as const) : doneMode ? ("next" as const) : ("locked" as const),
      pressure: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      map: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      combat: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      action: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      resolution: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      canon: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      ledger: doneTable && doneParty ? ("open" as const) : ("locked" as const),
    };
  }, [dmMode, tableAccepted, partyCanonicalExists]);

  function enterDungeon() {
    if (!canEnterDungeon) return;
    setActiveSection("table");
    queueMicrotask(() => scrollToSection("table"));
  }

  function jumpTo(key: any) {
    setActiveSection(key as DemoSectionId);
    scrollToSection(key as DemoSectionId);
  }

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

  const resolutionDmMode = useMemo(() => (dmMode === "solace-neutral" ? "solace_neutral" : "human"), [dmMode]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  const allowGameplay = dmMode !== null && tableAccepted && partyCanonicalExists;

  return (
    <AmbientBackground>
      <div style={{ position: "relative", zIndex: 1 }}>
        <StewardedShell>
          <ModeHeader title="Echoes of Fate" onShare={shareCanon} showTitle={false} showRoles={false} showShare={false} />

          {/* HERO / ONBOARDING */}
          <div id={anchorId("mode")} style={{ scrollMarginTop: 90 }}>
            <HeroOnboarding
              heroTitle="Echoes of Fate"
              heroSubtitle="Every action leaves an echo."
              dmMode={dmMode}
              onSetDmMode={(nextMode) => {
                setDmMode(nextMode);
                setActiveSection("mode");
                setPartyDraft((prev) => prev ?? defaultParty(partySize));
              }}
              partySize={partySize}
              partyLocked={partyLocked}
              onSetPartySize={(n) => {
                if (dmMode === null) return;
                setPartySize(n);
              }}
              onEnter={enterDungeon}
              canEnter={canEnterDungeon}
              heroImageSrc={HERO_IMAGE_SRC}
              heroImageOk={heroImageOk}
              onHeroImageError={() => setHeroImageOk(false)}
              chapterState={chapterState as any}
              onJump={(k) => jumpTo(k)}
              outcomesCount={outcomesCount}
              canonCount={canonCount}
            />
          </div>

          {/* TABLE */}
          <div id={anchorId("table")} style={{ scrollMarginTop: 90, marginTop: 16 }}>
            <InitialTableSection
              dmMode={dmMode}
              initialTable={initialTable}
              tableAccepted={tableAccepted}
              tableDraftText={tableDraftText}
              setTableDraftText={setTableDraftText}
              onAccept={() => {
                setTableAccepted(true);
                setActiveSection("party");
                queueMicrotask(() => scrollToSection("party"));
              }}
            />
          </div>

          {/* PARTY DECLARATION */}
          <div id={anchorId("party")} style={{ scrollMarginTop: 90, marginTop: 16 }}>
            <PartySetupSection
              enabled={dmMode !== null && tableAccepted}
              partyDraft={partyDraft}
              partyMembersFallback={partyMembers}
              partyCanonicalExists={partyCanonicalExists}
              partyLocked={partyLocked}
              partyLockedByCombat={partyLockedByCombat}
              setPartySize={(n) => setPartySize(n)}
              randomizePartyNames={randomizePartyNames}
              commitParty={commitParty}
              safeInt={safeInt}
              setPartyDraft={setPartyDraft}
            />
          </div>

          {allowGameplay && (
            <>
              {/* PRESSURE */}
              <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
                <DungeonPressurePanel turn={outcomesCount} events={state.events} />
              </div>

              {/* MAP */}
              <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
                <MapSection
                  events={state.events as any[]}
                  mapW={MAP_W}
                  mapH={MAP_H}
                  activeEnemyGroupName={activeEnemyOverlayName}
                  playSignal={enemyPlayNonce}
                />
              </div>

              {/* COMBAT */}
              <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
                <CombatSection
                  events={state.events as any[]}
                  dmMode={dmMode}
                  onAppendCanon={appendCanon}
                  partyMembers={partyMembers.map((m, idx) => ({
                    id: String(m.id),
                    name: displayName(m, idx + 1),
                    className: m.className,
                    portrait: m.portrait ?? "Male",
                    ac: m.ac,
                    hpMax: m.hpMax,
                    hpCurrent: m.hpCurrent,
                    initiativeMod: m.initiativeMod,
                  }))}
                  pressureTier={pressureTier}
                  allowDevControls={false}
                  showEnemyResolver={solaceNeutralEnemyTurnEnabled}
                  activeEnemyGroupName={activeEnemyOverlayName}
                  activeEnemyGroupId={activeEnemyOverlayId}
                  playerNames={effectivePlayerNames}
                  onTelegraph={(info) => {
                    setEnemyTelegraphHint(info);
                    setEnemyPlayNonce((n) => n + 1);
                  }}
                  onCommitOutcomeOnly={(payload) => handleRecordOutcomeOnly(payload)}
                  onAdvanceTurn={() => advanceTurn()}
                  enemyTelegraphHint={enemyTelegraphHint}
                  derivedCombat={derivedCombat as any}
                  activeCombatantSpec={activeCombatantSpec}
                  combatEnded={combatEnded}
                  isEnemyTurn={isEnemyTurn}
                  isWrongPlayerForTurn={isWrongPlayerForTurn}
                  onAdvanceTurnBtn={() => advanceTurn()}
                  onPassTurnBtn={() => passTurn()}
                  onEndCombatBtn={() => endCombat()}
                />
              </div>

              {/* ACTION */}
              <div id={anchorId("action")} style={{ scrollMarginTop: 90 }}>
                <ActionSection
                  partyMembers={
                    partyMembers.length
                      ? partyMembers.map((m, idx) => ({
                          id: String(m.id),
                          label: `${displayName(m, idx + 1)} (${m.id})`,
                        }))
                      : []
                  }
                  actingPlayerId={actingPlayerId}
                  onSetActingPlayerId={(id) => setActingPlayerId(id)}
                  playerInput={playerInput}
                  onSetPlayerInput={(v) => setPlayerInput(v)}
                  canSubmit={canPlayerSubmitIntent}
                  onSubmit={handlePlayerAction}
                  combatActive={combatActive}
                  passDisabled={(dmMode === "solace-neutral" && isEnemyTurn) || isWrongPlayerForTurn}
                  onPassTurn={passTurn}
                  dmMode={dmMode}
                  isEnemyTurn={isEnemyTurn}
                  isWrongPlayerForTurn={isWrongPlayerForTurn}
                  activeTurnLabel={activeTurnLabel}
                  showPartyButtons={dmMode === "human" && !partyLocked && !!partyDraft}
                  onCommitParty={commitParty}
                  onRandomNames={randomizePartyNames}
                  commitDisabled={partyLocked}
                />
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
                      optionKind: inferOptionKind(`${playerInput}\n${selectedOption.description}`.trim()),
                    }}
                    rollModifier={actingRollModifier}
                    rollModifierLabel={actingPlayerInjuryStacks > 0 ? `Injury stacks: ${actingPlayerInjuryStacks}` : "Injury"}
                    onRecord={handleRecord}
                  />
                )}
              </div>

              <NextActionHint state={state} />

              {/* CANON + CHRONICLE */}
              <div id={anchorId("canon")} style={{ scrollMarginTop: 90 }}>
                <CanonChronicleSection events={state.events as any[]} />
              </div>

              <div id={anchorId("ledger")} style={{ height: 1, scrollMarginTop: 90 }} />
            </>
          )}
        </StewardedShell>
      </div>
    </AmbientBackground>
  );
}
