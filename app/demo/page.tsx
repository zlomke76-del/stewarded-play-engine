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
// Notes:
// - Party editing UI is intentionally deferred (we'll fill in details later).
// - Dragons-eye / flair: intentionally postponed (per request).
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
import InitialTableSection from "./components/InitialTableSection";

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

// ------------------------------------------------------------
// Onboarding UI helpers
// ------------------------------------------------------------

type ChapterKey = "mode" | "party" | "table" | "pressure" | "map" | "combat" | "action" | "resolution" | "canon" | "ledger";

function Chip({
  label,
  state,
  onClick,
}: {
  label: string;
  state: "done" | "next" | "locked" | "open";
  onClick?: () => void;
}) {
  const clickable = !!onClick && state !== "locked";
  const bg =
    state === "done"
      ? "rgba(138,180,255,0.12)"
      : state === "next"
      ? "rgba(255,255,255,0.08)"
      : state === "open"
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.03)";

  const border =
    state === "done"
      ? "1px solid rgba(138,180,255,0.35)"
      : state === "next"
      ? "1px solid rgba(255,255,255,0.18)"
      : state === "open"
      ? "1px solid rgba(255,255,255,0.12)"
      : "1px solid rgba(255,255,255,0.08)";

  const opacity = state === "locked" ? 0.55 : 1;

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      style={{
        cursor: clickable ? "pointer" : "default",
        padding: "8px 10px",
        borderRadius: 999,
        background: bg,
        border,
        color: "rgba(255,255,255,0.92)",
        opacity,
        fontSize: 12,
        letterSpacing: 0.2,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
      title={state === "locked" ? "Locked until you progress" : undefined}
    >
      <span style={{ fontWeight: 800 }}>{label}</span>
      {state === "done" ? <span style={{ opacity: 0.85 }}>✓</span> : null}
      {state === "next" ? <span style={{ opacity: 0.8 }}>→</span> : null}
    </button>
  );
}

function Toggle({
  value,
  onChange,
  leftLabel,
  rightLabel,
  disabled,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  leftLabel: string;
  rightLabel: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ fontSize: 12, opacity: disabled ? 0.6 : 0.85 }}>{leftLabel}</div>

      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={!!disabled}
        aria-label="toggle"
        style={{
          width: 54,
          height: 28,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
          padding: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: value ? 28 : 3,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "rgba(220,220,255,0.85)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
            transition: "left 160ms ease",
          }}
        />
      </button>

      <div style={{ fontSize: 12, opacity: disabled ? 0.6 : 0.85 }}>{rightLabel}</div>
    </div>
  );
}

function PartyPips({ count }: { count: number }) {
  const n = clampInt(count, 1, 6);
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            fontSize: 16,
          }}
          title={`Adventurer ${i + 1}`}
        >
          ⚔
        </span>
      ))}
    </div>
  );
}

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));

  // IMPORTANT UX CHANGE: mode must be explicitly selected
  const [dmMode, setDmMode] = useState<DMMode | null>(null);

  const MAP_W = 13;
  const MAP_H = 9;

  // Hero image (cinematic tile)
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

  // Draft editor lives in session UI; only becomes canon when Arbiter commits (PARTY_DECLARED).
  const [partyDraft, setPartyDraft] = useState<PartyDeclaredPayload | null>(null);

  // Ensure a draft exists once mode is selected (so party sizing is available immediately)
  useEffect(() => {
    if (dmMode === null) return;

    if (partyCanonical) {
      setPartyDraft((prev) => prev ?? partyCanonical);
      return;
    }

    setPartyDraft((prev) => prev ?? defaultParty(4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmMode, partyCanonical?.partyId]);

  // Effective party is canonical if present, otherwise draft.
  const partyEffective: PartyDeclaredPayload | null = partyCanonical ?? partyDraft;
  const partyMembers = partyEffective?.members ?? [];
  const partySize = clampInt(partyMembers.length || 4, 1, 6);

  const effectivePlayerNames = useMemo(() => partyMembers.map((m, idx) => displayName(m, idx + 1)), [partyMembers]);

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

  const activeCombatantSpec = useMemo(() => {
    if (!derivedCombat?.activeCombatantId) return null;
    return derivedCombat.participants.find((p: any) => p.id === derivedCombat.activeCombatantId) ?? null;
  }, [derivedCombat]);

  const isEnemyTurn = combatActive && activeCombatantSpec?.kind === "enemy_group";
  const isPlayerTurn = combatActive && activeCombatantSpec?.kind === "player";

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
    ((dmMode === "human" && true) || (!combatActive && !isEnemyTurn) || (combatActive && !isEnemyTurn && !isWrongPlayerForTurn));

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
  // Onboarding state + Chapters (simplified early)
  // ----------------------------------------------------------

  const canEnterDungeon = dmMode !== null;

  const chapterState: Record<ChapterKey, "done" | "next" | "locked" | "open"> = useMemo(() => {
    const doneMode = dmMode !== null;
    const doneParty = doneMode && partySize >= 1;
    const doneTable = tableAccepted;

    return {
      mode: doneMode ? "done" : "next",
      party: doneParty ? "done" : doneMode ? "next" : "locked",
      table: doneTable ? "done" : doneParty ? "next" : "locked",

      pressure: doneTable ? "open" : "locked",
      map: doneTable ? "open" : "locked",
      combat: doneTable ? "open" : "locked",
      action: doneTable ? "open" : "locked",
      resolution: doneTable ? "open" : "locked",
      canon: doneTable ? "open" : "locked",
      ledger: doneTable ? "open" : "locked",
    };
  }, [dmMode, partySize, tableAccepted]);

  function enterDungeon() {
    if (!canEnterDungeon) return;
    setActiveSection("table");
    queueMicrotask(() => scrollToSection("table"));
  }

  // Enemy overlay only when:
  // - combat is active
  // - it's an enemy group's turn
  // - and we're not in Human DM
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

  return (
    <AmbientBackground>
      <div style={{ position: "relative", zIndex: 1 }}>
        <StewardedShell>
          <ModeHeader
            title="Echoes of Fate"
            onShare={shareCanon}
            roles={[
              { label: "Player", description: "Declares intent" },
              { label: "Solace", description: "Prepares the resolution and narrates outcome" },
              { label: "Arbiter", description: "Commits canon" },
            ]}
          />

          {/* -------------------------------------------------- */}
          {/* ONBOARDING HERO */}
          {/* -------------------------------------------------- */}
          <div id={anchorId("mode")} style={{ scrollMarginTop: 90 }}>
            <section
              className="card"
              style={{
                background: "rgba(17,17,17,0.82)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: 0.2 }}>Echoes of Fate</div>
                  <div style={{ marginTop: 6, fontSize: 14, opacity: 0.86 }}>Every action leaves an echo.</div>
                </div>

                {/* Two-column hero: onboarding + cinematic tile */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 0.9fr",
                    gap: 12,
                    alignItems: "stretch",
                  }}
                >
                  {/* LEFT */}
                  <div style={{ display: "grid", gap: 12 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 10,
                        padding: 12,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    >
                      <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Choose Your Play Style</div>

                      <Toggle
                        value={dmMode === "solace-neutral"}
                        onChange={(next) => {
                          const nextMode: DMMode = next ? "solace-neutral" : "human";
                          setDmMode(nextMode);
                          setActiveSection("mode");
                          setPartyDraft((prev) => prev ?? defaultParty(partySize));
                        }}
                        leftLabel="Human"
                        rightLabel="Solace"
                      />

                      <div style={{ fontSize: 12, opacity: 0.78 }}>
                        {dmMode === "solace-neutral"
                          ? "Solace keeps the adventure moving."
                          : dmMode === "human"
                          ? "You choose how each action resolves."
                          : "Pick a style to begin."}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 10,
                        padding: 12,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        opacity: dmMode === null ? 0.75 : 1,
                      }}
                    >
                      <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Party Size</div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {([1, 2, 3, 4, 5, 6] as const).map((n) => {
                          const active = partySize === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                if (dmMode === null) return;
                                setPartySize(n);
                              }}
                              disabled={dmMode === null || partyLocked}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: active ? "1px solid rgba(138,180,255,0.55)" : "1px solid rgba(255,255,255,0.12)",
                                background: active ? "rgba(138,180,255,0.10)" : "rgba(255,255,255,0.04)",
                                cursor: dmMode === null || partyLocked ? "not-allowed" : "pointer",
                                opacity: dmMode === null || partyLocked ? 0.6 : 1,
                                minWidth: 36,
                                textAlign: "center",
                                fontWeight: 850,
                              }}
                              title={partyLocked ? "Party locked by canon/combat" : undefined}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontSize: 12, opacity: 0.78 }}>
                          {partyLocked ? "Party locked for this session." : "Quick start — details come next."}
                        </div>

                        <div>
                          <div style={{ fontWeight: 900, letterSpacing: 0.2, marginBottom: 6 }}>Assemble Your Party</div>
                          <div style={{ fontSize: 12, opacity: 0.78, marginBottom: 10 }}>
                            These are the adventurers entering the dungeon.
                          </div>
                          <PartyPips count={partySize} />
                        </div>
                      </div>
                    </div>

                    {/* Simplified Chapters */}
                    <div
                      style={{
                        marginTop: 2,
                        paddingTop: 10,
                        borderTop: "1px solid rgba(255,255,255,0.10)",
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Chapters</div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Chip
                          label="Mode"
                          state={chapterState.mode}
                          onClick={() => {
                            setActiveSection("mode");
                            scrollToSection("mode");
                          }}
                        />
                        <Chip
                          label="Party"
                          state={chapterState.party}
                          onClick={() => {
                            setActiveSection("mode");
                            scrollToSection("mode");
                          }}
                        />
                        <Chip
                          label="Table"
                          state={chapterState.table}
                          onClick={() => {
                            setActiveSection("table");
                            scrollToSection("table");
                          }}
                        />
                        <Chip
                          label="Pressure"
                          state={chapterState.pressure}
                          onClick={() => {
                            setActiveSection("pressure");
                            scrollToSection("pressure");
                          }}
                        />
                        <Chip
                          label="Map"
                          state={chapterState.map}
                          onClick={() => {
                            setActiveSection("map");
                            scrollToSection("map");
                          }}
                        />
                        <Chip
                          label="Combat"
                          state={chapterState.combat}
                          onClick={() => {
                            setActiveSection("combat");
                            scrollToSection("combat");
                          }}
                        />
                        <Chip
                          label="Action"
                          state={chapterState.action}
                          onClick={() => {
                            setActiveSection("action");
                            scrollToSection("action");
                          }}
                        />
                        <Chip
                          label="Resolution"
                          state={chapterState.resolution}
                          onClick={() => {
                            setActiveSection("resolution");
                            scrollToSection("resolution");
                          }}
                        />
                        <Chip
                          label="Canon"
                          state={chapterState.canon}
                          onClick={() => {
                            setActiveSection("canon");
                            scrollToSection("canon");
                          }}
                        />
                        <Chip
                          label="Chronicle"
                          state={chapterState.ledger}
                          onClick={() => {
                            setActiveSection("ledger");
                            scrollToSection("ledger");
                          }}
                        />
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.70 }}>Progress unlocks the deeper chapters.</div>
                    </div>
                  </div>

                  {/* RIGHT: cinematic tile */}
                  <div
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.40)",
                      position: "relative",
                      minHeight: 320,
                    }}
                  >
                    {/* hero image */}
                    {heroImageOk ? (
                      <img
                        src={HERO_IMAGE_SRC}
                        alt="Enter the dungeon"
                        onError={() => setHeroImageOk(false)}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          opacity: 0.88,
                          filter: "brightness(0.90) contrast(1.08) saturate(1.08)",
                          transform: "scale(1.02)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "radial-gradient(1200px 600px at 70% 40%, rgba(255,190,120,0.12), rgba(0,0,0,0) 60%), radial-gradient(900px 500px at 40% 65%, rgba(140,170,255,0.10), rgba(0,0,0,0) 55%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.10))",
                        }}
                      />
                    )}

                    {/* vignette + glass overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.35) 32%, rgba(0,0,0,0.35) 68%, rgba(0,0,0,0.68) 100%), radial-gradient(120% 95% at 50% 55%, rgba(0,0,0,0.05), rgba(0,0,0,0.78))",
                        pointerEvents: "none",
                      }}
                    />

                    {/* subtle torch/ember bloom */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "radial-gradient(700px 360px at 65% 35%, rgba(255,170,90,0.10), rgba(0,0,0,0) 62%), radial-gradient(520px 280px at 35% 70%, rgba(120,150,255,0.08), rgba(0,0,0,0) 60%)",
                        mixBlendMode: "screen",
                        pointerEvents: "none",
                        opacity: 0.9,
                      }}
                    />

                    {/* copy + CTA */}
                    <div
                      style={{
                        position: "absolute",
                        left: 14,
                        right: 14,
                        bottom: 14,
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "linear-gradient(180deg, rgba(10,10,10,0.35), rgba(10,10,10,0.62))",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                      }}
                    >
                      <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: 0.2 }}>Enter the Dungeon</div>
                      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.80 }}>
                        You declare intent. The world remembers what you do.
                      </div>

                      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={enterDungeon}
                          disabled={!canEnterDungeon}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 12,
                            fontWeight: 950,
                            letterSpacing: 0.2,
                            border: canEnterDungeon
                              ? "1px solid rgba(255,255,255,0.24)"
                              : "1px solid rgba(255,255,255,0.18)",
                            background: canEnterDungeon ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                            cursor: canEnterDungeon ? "pointer" : "not-allowed",
                            opacity: canEnterDungeon ? 1 : 0.6,
                          }}
                        >
                          Enter
                        </button>

                        <div style={{ fontSize: 12, opacity: 0.74 }}>
                          {dmMode === null ? "Choose a play style first." : "Next: accept the scene and start acting."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    outcomes: <strong>{outcomesCount}</strong> · canon events: <strong>{canonCount}</strong>
                  </div>
                  <button type="button" onClick={shareCanon} style={{ opacity: 0.85 }}>
                    Share
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* TABLE (hidden until mode selected) */}
          <div id={anchorId("table")} style={{ scrollMarginTop: 90, marginTop: 16 }}>
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
                      Combat: <strong>{derivedCombat.combatId}</strong> · Round <strong>{derivedCombat.round}</strong>
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
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
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

                    {dmMode === "human" && !partyLocked && partyDraft && (
                      <button
                        type="button"
                        onClick={() => commitParty()}
                        title="Commit PARTY_DECLARED (canon)"
                        style={{ opacity: 0.75 }}
                      >
                        Commit Party (Canon)
                      </button>
                    )}

                    {/* dev-only (kept available, not emphasized) */}
                    {dmMode === "human" && !partyLocked && partyDraft && (
                      <button
                        type="button"
                        onClick={() => randomizePartyNames()}
                        title="Fill missing party names"
                        style={{ opacity: 0.55 }}
                      >
                        Random Names
                      </button>
                    )}
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

                  <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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
