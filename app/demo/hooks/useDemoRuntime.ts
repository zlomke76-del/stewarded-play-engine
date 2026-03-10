"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSession, recordEvent, type SessionState } from "@/lib/session/SessionState";
import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, type Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";
import { deriveCombatState, findLatestCombatId, nextTurnPointer } from "@/lib/combat/CombatState";
import { resolvePartyLoadout } from "@/lib/skills/loadoutResolver";
import { generateDungeon } from "@/lib/dungeon/DungeonGenerator";
import {
  deriveCurrentDungeonLocation,
  deriveOpenedDoorIds,
  deriveReachableConnections,
  deriveUnlockedDoorIds,
  inferNeighborRoomIds,
  resolveTraversal,
  buildRoomExitPayload,
} from "@/lib/dungeon/DungeonNavigation";
import { deriveExplorationDiscoveryDrafts } from "@/lib/dungeon/ExplorationDiscovery";
import { deriveDungeonEvolution } from "@/lib/dungeon/DungeonEvolution";
import {
  resolveRoomImage,
  resolveTransitionImage,
} from "@/lib/dungeon/DungeonVisualResolver";
import {
  describeRoomEntry,
  describeRoomExits,
  describeRoomFeatures,
  describeRoomSummary,
  type OpeningChronicleSeed,
} from "@/lib/dungeon/DungeonNarration";
import type { DungeonConnection, DungeonDefinition, DungeonRoom } from "@/lib/dungeon/FloorState";
import type { EnemyEncounterTheme } from "@/lib/game/EnemyDatabase";
import type { DMMode, DemoSectionId, DiceMode, InitialTable, RollSource } from "../demoTypes";
import {
  clampInt,
  normalizeName,
  randomName,
  generateInitialTable,
  renderInitialTableNarration,
  inferOptionKind,
  isCombatEndedForId,
} from "../demoUtils";
import {
  currentRoomFeatureLite,
  extractOpeningChronicleSeed,
  inferLockState,
  inferObjective,
  inferPressureTier,
  inferRewardHint,
  summarizeRoomTitle,
  toNarrationExits,
  toNarrationFeatures,
} from "../lib/demoNarration";

export type PartyMember = {
  id: string;
  name: string;
  species?: string;
  className: string;
  portrait: "Male" | "Female";
  skills?: string[];
  traits?: string[];
  ac: number;
  hpMax: number;
  hpCurrent: number;
  initiativeMod: number;
};

export type PartyDeclaredPayload = {
  partyId: string;
  members: PartyMember[];
};

export type PresentationPhase =
  | "onboarding"
  | "chronicle"
  | "party-declaration"
  | "gameplay";

export type GameplayFocusStep = "pressure" | "map" | "action";

export type CombatEncounterContext = {
  zoneId?: string | null;
  zoneTheme?: EnemyEncounterTheme | null;
  objective?: string | null;
  lockState?: string | null;
  rewardHint?: string | null;
  keyEnemyName?: string | null;
  relicEnemyName?: string | null;
  cacheGuardEnemyName?: string | null;
};

type MusicMode = "none" | "intro" | "ambient" | "combat";

const STARTER_CLASS_PLANS: Record<1 | 2 | 3 | 4 | 5 | 6, readonly string[]> = {
  1: ["Warrior"],
  2: ["Warrior", "Cleric"],
  3: ["Warrior", "Rogue", "Mage"],
  4: ["Warrior", "Rogue", "Mage", "Cleric"],
  5: ["Warrior", "Rogue", "Mage", "Cleric", "Ranger"],
  6: ["Warrior", "Rogue", "Mage", "Cleric", "Ranger", "Paladin"],
};

const STARTER_SPECIES_PLAN = [
  "Human",
  "Elf",
  "Dwarf",
  "Tiefling",
  "Halfling",
  "Dragonborn",
] as const;

const STARTER_PORTRAIT_PLAN: ReadonlyArray<"Male" | "Female"> = [
  "Male",
  "Female",
  "Male",
  "Female",
  "Male",
  "Female",
];

const AMBIENT_TRACKS = ["/audio/music/dungeon_ambient1.mp3", "/audio/music/dungeon_ambient2.mp3"] as const;
const COMBAT_TRACKS = ["/audio/music/combat_theme1.mp3", "/audio/music/combat_theme2.mp3"] as const;

function safeInt(n: unknown, fallback: number, lo: number, hi: number) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : fallback;
  return Math.max(lo, Math.min(hi, x));
}

export function displayName(m: PartyMember, i1: number) {
  const n = normalizeName(m.name || "");
  return n.length > 0 ? n : `Player ${i1}`;
}

function buildStarterMember(slotIndex: number, partyCount: number): PartyMember {
  const count = clampInt(partyCount, 1, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const classPlan = STARTER_CLASS_PLANS[count];
  const className = classPlan[Math.min(slotIndex, classPlan.length - 1)] ?? "Warrior";
  const species = STARTER_SPECIES_PLAN[slotIndex % STARTER_SPECIES_PLAN.length] ?? "Human";
  const portrait = STARTER_PORTRAIT_PLAN[slotIndex % STARTER_PORTRAIT_PLAN.length] ?? "Male";

  const canonical = resolvePartyLoadout(className, species);

  const hpBaseByClass: Record<string, number> = {
    Warrior: 14,
    Paladin: 14,
    Barbarian: 15,
    Cleric: 12,
    Ranger: 12,
    Rogue: 11,
    Monk: 11,
    Artificer: 11,
    Bard: 10,
    Druid: 10,
    Mage: 9,
    Sorcerer: 9,
    Warlock: 10,
  };

  const acBaseByClass: Record<string, number> = {
    Warrior: 14,
    Paladin: 15,
    Barbarian: 13,
    Cleric: 13,
    Ranger: 13,
    Rogue: 13,
    Monk: 13,
    Artificer: 13,
    Bard: 12,
    Druid: 12,
    Mage: 11,
    Sorcerer: 11,
    Warlock: 12,
  };

  const initBaseByClass: Record<string, number> = {
    Warrior: 1,
    Paladin: 0,
    Barbarian: 1,
    Cleric: 0,
    Ranger: 2,
    Rogue: 3,
    Monk: 3,
    Artificer: 1,
    Bard: 2,
    Druid: 1,
    Mage: 1,
    Sorcerer: 2,
    Warlock: 1,
  };

  const hpMax = hpBaseByClass[className] ?? 12;
  const ac = acBaseByClass[className] ?? 14;
  const initiativeMod = initBaseByClass[className] ?? 1;

  return {
    id: `player_${slotIndex + 1}`,
    name: "",
    species,
    className,
    portrait,
    skills: canonical.skillIds,
    traits: canonical.traitIds,
    ac,
    hpMax,
    hpCurrent: hpMax,
    initiativeMod,
  };
}

function defaultParty(count: number): PartyDeclaredPayload {
  const n = clampInt(count, 1, 6);
  return {
    partyId: crypto.randomUUID(),
    members: Array.from({ length: n }, (_, i) => buildStarterMember(i, n)),
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

function appendEventToState(prev: SessionState, type: string, payload: any): SessionState {
  return recordEvent(prev, {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: "arbiter",
    type,
    payload,
  });
}

function hasDungeonInitialized(events: readonly any[]) {
  return events.some((e) => e?.type === "DUNGEON_INITIALIZED");
}

function chooseNextTrack(tracks: readonly string[], lastIndexRef: React.MutableRefObject<number>): string {
  if (tracks.length <= 1) {
    lastIndexRef.current = 0;
    return tracks[0] ?? "";
  }

  let nextIndex = Math.floor(Math.random() * tracks.length);
  if (nextIndex === lastIndexRef.current) {
    nextIndex = (nextIndex + 1) % tracks.length;
  }

  lastIndexRef.current = nextIndex;
  return tracks[nextIndex];
}

function inferConnectionChoiceFromText(
  room: DungeonRoom | null,
  connections: DungeonConnection[],
  dungeon: DungeonDefinition,
  floorId: string,
  text: string
): DungeonConnection | null {
  if (!room || connections.length === 0) return null;

  const t = String(text || "").toLowerCase();

  const scored = connections.map((connection) => {
    const floor = dungeon.floors.find((f) => f.id === floorId) ?? null;
    const targetRoomId =
      connection.fromRoomId === room.id ? connection.toRoomId : connection.fromRoomId;
    const targetRoom =
      floor?.rooms.find((r) => r.id === targetRoomId) ?? null;

    let score = 0;

    if (/stairs|descend|down|deeper|lower/i.test(t) && connection.type === "stairs") score += 50;
    if (/up|ascend|retreat/i.test(t) && connection.type === "stairs" && connection.note === "up") score += 50;
    if (/door|open|push|threshold|archway|gate|enter/i.test(t) && (connection.type === "door" || connection.type === "locked_door")) score += 35;
    if (/locked|barred|sealed|key|unlock|force/i.test(t) && connection.type === "locked_door") score += 40;
    if (/secret|hidden/i.test(t) && connection.type === "secret") score += 40;
    if (connection.type === "corridor") score += 10;

    if (targetRoom) {
      const label = `${targetRoom.label} ${targetRoom.roomType}`.toLowerCase();
      if (label.includes("shrine") && /shrine|altar|ritual|pray/i.test(t)) score += 45;
      if (label.includes("crypt") && /crypt|bone|grave|dead/i.test(t)) score += 45;
      if (label.includes("armory") && /armory|weapon|gear|supplies/i.test(t)) score += 40;
      if (label.includes("storage") && /cache|storage|supplies|loot/i.test(t)) score += 40;
      if (label.includes("relic") && /relic|vault|artifact|treasure/i.test(t)) score += 48;
      if (label.includes("boss") && /boss|leader|captain|warlord|priest/i.test(t)) score += 48;
      if (label.includes("beast") && /beast|den|nest|predator/i.test(t)) score += 40;
      if (label.includes("arcane") && /arcane|construct|sentinel|magic/i.test(t)) score += 40;
    }

    return { connection, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.connection ?? connections[0] ?? null;
}

export function useDemoRuntime() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));
  const [dmMode, setDmMode] = useState<DMMode | null>(null);

  const HERO_IMAGE_SRC = "/Hero_dungeon.png";
  const [heroImageOk, setHeroImageOk] = useState(true);

  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentMusicModeRef = useRef<MusicMode>("none");
  const lastAmbientIndexRef = useRef(-1);
  const lastCombatIndexRef = useRef(-1);

  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);
  const [tableDraftText, setTableDraftText] = useState("");
  const [enteredDungeon, setEnteredDungeon] = useState(false);

  const [activeSection, setActiveSection] = useState<DemoSectionId>("mode");
  const [gameplayFocusStep, setGameplayFocusStep] = useState<GameplayFocusStep>("pressure");

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const [actingPlayerId, setActingPlayerId] = useState<string>("player_1");

  const [enemyTelegraphHint, setEnemyTelegraphHint] = useState<{
    enemyName: string;
    targetName: string;
    attackStyleHint: "volley" | "beam" | "charge" | "unknown";
  } | null>(null);

  const outcomesCount = useMemo(() => state.events.filter((e: any) => e?.type === "OUTCOME").length, [state.events]);
  const canonCount = useMemo(
    () => state.events.filter((e: any) => e?.type && e?.type !== "OUTCOME").length,
    [state.events]
  );

  const partyCanonical = useMemo(() => deriveLatestParty(state.events as any[]) ?? null, [state.events]);
  const [partyDraft, setPartyDraft] = useState<PartyDeclaredPayload | null>(null);

  const dungeon = useMemo(
    () =>
      generateDungeon({
        dungeonId: "echoes_demo_dungeon",
        seed: `${state.sessionId}:room-graph-v1`,
        floorCount: 3,
      }),
    [state.sessionId]
  );

  useEffect(() => {
    if (dmMode === null) return;

    if (partyCanonical) {
      setPartyDraft((prev) => prev ?? partyCanonical);
      return;
    }

    setPartyDraft((prev) => prev ?? defaultParty(4));
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
  }, [partyMembers, actingPlayerId]);

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

  const activeTurnLabel = useMemo(() => {
    if (!combatActive || !activeCombatantSpec) return null;
    const name = String((activeCombatantSpec as any)?.name ?? "").trim();
    const id = String((activeCombatantSpec as any)?.id ?? "").trim();
    if (name) return name;
    if (id) return id;
    return null;
  }, [combatActive, activeCombatantSpec]);

  const actingPlayerInjuryStacks = useMemo(() => {
    const pid = String(actingPlayerId ?? "").trim();
    return deriveInjuryStacksForPlayer(state.events as any[], pid);
  }, [state.events, actingPlayerId]);

  const actingRollModifier = useMemo(() => {
    const s = Math.max(0, Math.min(20, Math.trunc(Number(actingPlayerInjuryStacks ?? 0))));
    return -2 * s;
  }, [actingPlayerInjuryStacks]);

  const shareCanon = () => {
    try {
      exportCanon(state.events as any);
    } catch {
      // fail-closed
    }
  };

  function pauseIntroTheme(resetTime = true) {
    const intro = introAudioRef.current;
    if (!intro) return;

    try {
      intro.pause();
      if (resetTime) intro.currentTime = 0;
    } catch {
      // fail silently
    }
  }

  function pauseBackgroundTheme() {
    const bgm = bgmAudioRef.current;
    if (!bgm) return;

    try {
      bgm.pause();
      bgm.currentTime = 0;
      bgm.removeAttribute("src");
      bgm.load();
    } catch {
      // fail silently
    }
  }

  function stopAllMusic() {
    pauseIntroTheme(true);
    pauseBackgroundTheme();
    currentMusicModeRef.current = "none";
  }

  function startLoopingTrack(src: string, volume: number, mode: Exclude<MusicMode, "none" | "intro">) {
    const bgm = bgmAudioRef.current;
    if (!bgm || !src) return;

    try {
      pauseIntroTheme(true);

      const sameSrc = bgm.getAttribute("src") === src;
      bgm.loop = true;
      bgm.volume = volume;

      if (!sameSrc) {
        bgm.src = src;
        bgm.load();
      }

      currentMusicModeRef.current = mode;
      const playPromise = bgm.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch {
      // fail silently
    }
  }

  function startAmbientTheme() {
    const src = chooseNextTrack(AMBIENT_TRACKS, lastAmbientIndexRef);
    startLoopingTrack(src, 0.36, "ambient");
  }

  function startCombatTheme() {
    const src = chooseNextTrack(COMBAT_TRACKS, lastCombatIndexRef);
    startLoopingTrack(src, 0.72, "combat");
  }

  function playIntroTheme(loop = false) {
    const intro = introAudioRef.current;
    if (!intro) return;

    try {
      pauseBackgroundTheme();

      intro.pause();
      intro.currentTime = 0;
      intro.loop = loop;
      intro.volume = 0.72;
      currentMusicModeRef.current = "intro";

      const playPromise = intro.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch {
      // fail silently
    }
  }

  useEffect(() => {
    if (enteredDungeon) return;
    stopAllMusic();
  }, [enteredDungeon]);

  useEffect(() => {
    const intro = introAudioRef.current;
    if (!intro) return;
    intro.loop = enteredDungeon && !tableAccepted;
  }, [enteredDungeon, tableAccepted]);

  useEffect(() => {
    if (!enteredDungeon) return;

    const intro = introAudioRef.current;
    const introIsPlaying = !!intro && !intro.paused && intro.currentTime > 0;

    if (!tableAccepted) {
      if (currentMusicModeRef.current !== "intro" || !introIsPlaying) {
        playIntroTheme(true);
      }
      return;
    }

    if (introIsPlaying) {
      pauseIntroTheme(true);
    }

    if (combatActive) {
      if (currentMusicModeRef.current !== "combat") {
        startCombatTheme();
      }
      return;
    }

    if (currentMusicModeRef.current !== "ambient") {
      startAmbientTheme();
    }
  }, [enteredDungeon, tableAccepted, combatActive]);

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
        members.push(buildStarterMember(i, n));
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
            species: String(m.species || "").trim() || "Human",
            className: normalizeName(m.className || ""),
            portrait: (m as any).portrait === "Female" ? "Female" : "Male",
            skills: Array.isArray((m as any).skills) ? (m as any).skills : [],
            traits: Array.isArray((m as any).traits) ? (m as any).traits : [],
            ac: safeInt(m.ac, 14, 1, 40),
            hpMax,
            hpCurrent: Math.min(hpCurrent, hpMax),
            initiativeMod: safeInt(m.initiativeMod, 1, -10, 20),
          };
        }),
    };

    setState((prev) =>
      appendEventToState(prev, "PARTY_DECLARED", cleaned as any)
    );

    if (tableAccepted) {
      setGameplayFocusStep("pressure");
      setActiveSection("pressure");
    }
  }

  useEffect(() => {
    if (initialTable) return;
    setInitialTable(generateInitialTable());
  }, [initialTable]);

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  const chronicleSeed: OpeningChronicleSeed | null = useMemo(
    () => extractOpeningChronicleSeed(initialTable),
    [initialTable]
  );

  useEffect(() => {
    if (!initialTable) return;
    if (tableDraftText.trim() === "") setTableDraftText(renderedTableNarration);
  }, [initialTable, renderedTableNarration, tableDraftText]);

  useEffect(() => {
    if (dmMode === null) return;
    setTableAccepted(false);
    setEnteredDungeon(false);
    setGameplayFocusStep("pressure");
  }, [dmMode]);

  function appendCanon(type: string, payload: any) {
    setState((prev) => appendEventToState(prev, type, payload));
  }

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
  }

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;

    setSelectedOption(options[0]);
    setActiveSection("resolution");
  }, [dmMode, options]);

  function advanceTurn() {
    if (!derivedCombat) return;
    if (combatEnded) return;

    const payload = nextTurnPointer(derivedCombat);

    setState((prev) =>
      appendEventToState(prev, "TURN_ADVANCED", payload as any)
    );
  }

  function endCombat() {
    if (!derivedCombat) return;
    if (combatEnded) return;

    setState((prev) =>
      appendEventToState(prev, "COMBAT_ENDED", { combatId: derivedCombat.combatId } as any)
    );
  }

  function passTurn() {
    if (!combatActive) return;
    if (dmMode !== "human" && isEnemyTurn) return;
    if (dmMode !== "human" && isPlayerTurn && isWrongPlayerForTurn) return;
    advanceTurn();
  }

  const location = useMemo(
    () => deriveCurrentDungeonLocation(dungeon, state.events as any[]),
    [dungeon, state.events]
  );

  const currentFloor = useMemo(
    () => dungeon.floors.find((f) => f.id === location.floorId) ?? dungeon.floors[0],
    [dungeon, location.floorId]
  );

  const currentRoom = useMemo(
    () => currentFloor.rooms.find((r) => r.id === location.roomId) ?? currentFloor.rooms[0],
    [currentFloor, location.roomId]
  );

  const reachableConnections = useMemo(
    () => deriveReachableConnections(dungeon, location),
    [dungeon, location]
  );

  const nearbyRoomIds = useMemo(
    () => inferNeighborRoomIds(dungeon, location),
    [dungeon, location]
  );

  const openedDoorIds = useMemo(
    () => deriveOpenedDoorIds(state.events as any[]),
    [state.events]
  );

  const unlockedDoorIds = useMemo(
    () => deriveUnlockedDoorIds(state.events as any[]),
    [state.events]
  );

  const dungeonEvolution = useMemo(
    () =>
      deriveDungeonEvolution({
        events: state.events as any[],
        floorId: location.floorId,
        roomId: location.roomId,
        nearbyRoomIds,
      }),
    [state.events, location.floorId, location.roomId, nearbyRoomIds]
  );

  const currentFeatures = useMemo(() => currentRoomFeatureLite(currentRoom), [currentRoom]);
  const narrationFeatures = useMemo(() => toNarrationFeatures(currentFeatures), [currentFeatures]);
  const currentRoomTitle = useMemo(() => summarizeRoomTitle(currentRoom), [currentRoom]);
  const currentRoomVisualKey = `${location.floorId}:${location.roomId}`;

  const roomImage = useMemo(() => {
    return resolveRoomImage({
      dungeonSeed: dungeon.seed,
      floorTheme: currentFloor.theme,
      room: currentRoom,
    });
  }, [dungeon.seed, currentFloor.theme, currentRoom]);

  const roomConnectionsView = useMemo(() => {
    const allRooms = dungeon.floors.flatMap((f) => f.rooms);

    return reachableConnections.map((connection) => {
      const targetRoomId =
        connection.fromRoomId === currentRoom.id ? connection.toRoomId : connection.fromRoomId;

      const targetFloor =
        dungeon.floors.find((floor) =>
          floor.rooms.some((room) => room.id === targetRoomId)
        ) ?? null;

      const targetRoom =
        currentFloor.rooms.find((r) => r.id === targetRoomId) ??
        allRooms.find((r) => r.id === targetRoomId) ??
        null;

      const previewImage =
        connection.type === "stairs"
          ? resolveTransitionImage({
              dungeonSeed: dungeon.seed,
              fromFloorTheme: currentFloor.theme,
              toFloorTheme: targetFloor?.theme ?? currentFloor.theme,
              direction: connection.note === "up" ? "up" : "down",
            })
          : resolveRoomImage({
              dungeonSeed: dungeon.seed,
              floorTheme: targetFloor?.theme ?? currentFloor.theme,
              room: targetRoom,
            });

      return {
        id: connection.id,
        type: connection.type,
        targetRoomId,
        targetLabel: targetRoom?.label ?? targetRoomId,
        targetType: targetRoom?.roomType ?? "unknown",
        locked: connection.locked === true || connection.type === "locked_door",
        note: connection.note ?? null,
        previewImage,
      };
    });
  }, [reachableConnections, currentRoom.id, currentFloor.rooms, currentFloor.theme, dungeon.floors, dungeon.seed]);

  const narrationExits = useMemo(
    () =>
      toNarrationExits({
        currentRoom,
        currentFloorRooms: currentFloor.rooms,
        allDungeonRooms: dungeon.floors.flatMap((floor) => floor.rooms),
        connections: reachableConnections,
      }),
    [currentRoom, currentFloor.rooms, dungeon.floors, reachableConnections]
  );

  useEffect(() => {
    if (!tableAccepted || !partyCanonical) return;
    if (hasDungeonInitialized(state.events as any[])) return;

    setState((prev) => {
      let next = prev;

      next = appendEventToState(next, "DUNGEON_INITIALIZED", {
        dungeonId: dungeon.dungeonId,
        seed: dungeon.seed,
        floorIds: dungeon.floors.map((f) => f.id),
        startFloorId: dungeon.startFloorId,
        startRoomId: dungeon.startRoomId,
      });

      for (const floor of dungeon.floors) {
        next = appendEventToState(next, "FLOOR_INITIALIZED", {
          dungeonId: dungeon.dungeonId,
          floorId: floor.id,
          floorIndex: floor.floorIndex,
          theme: floor.theme,
          startRoomId: floor.startRoomId,
        });
      }

      const drafts = deriveExplorationDiscoveryDrafts({
        dungeon,
        events: next.events as any[],
        floorId: dungeon.startFloorId,
        roomId: dungeon.startRoomId,
        enteredViaConnectionId: null,
        enteredFromRoomId: null,
      });

      for (const draft of drafts) {
        next = appendEventToState(next, draft.type, draft.payload as any);
      }

      return next;
    });
  }, [tableAccepted, partyCanonical, state.events, dungeon]);

  function commitDungeonTraversalBundle(args: {
    success: boolean;
    selectedText: string;
  }) {
    const combinedText = args.selectedText;
    const chosenConnection = inferConnectionChoiceFromText(
      currentRoom,
      reachableConnections,
      dungeon,
      location.floorId,
      combinedText
    );

    setState((prev) => {
      let next = prev;

      if (!chosenConnection) {
        const discoveryDrafts = deriveExplorationDiscoveryDrafts({
          dungeon,
          events: next.events as any[],
          floorId: location.floorId,
          roomId: location.roomId,
          enteredViaConnectionId: null,
          enteredFromRoomId: null,
        });

        for (const draft of discoveryDrafts) {
          next = appendEventToState(next, draft.type, draft.payload as any);
        }

        return next;
      }

      const resolved = resolveTraversal(dungeon, {
        floorId: location.floorId,
        roomId: location.roomId,
        connectionId: chosenConnection.id,
        openedDoorIds,
        unlockedDoorIds,
      });

      if (!args.success || !resolved.ok) {
        const discoveryDrafts = deriveExplorationDiscoveryDrafts({
          dungeon,
          events: next.events as any[],
          floorId: location.floorId,
          roomId: location.roomId,
          enteredViaConnectionId: null,
          enteredFromRoomId: null,
        });

        for (const draft of discoveryDrafts) {
          next = appendEventToState(next, draft.type, draft.payload as any);
        }

        return next;
      }

      next = appendEventToState(next, "ROOM_EXITED", buildRoomExitPayload({
        floorId: location.floorId,
        roomId: location.roomId,
        toRoomId: resolved.toRoom.id,
        viaConnectionId: resolved.connection.id,
      }));

      if (resolved.connection.doorId && resolved.connection.type === "locked_door") {
        if (!unlockedDoorIds.includes(resolved.connection.doorId)) {
          next = appendEventToState(next, "DOOR_UNLOCKED", {
            floorId: location.floorId,
            roomId: location.roomId,
            doorId: resolved.connection.doorId,
            connectionId: resolved.connection.id,
            method: "force",
          });
        }
      }

      if (resolved.connection.doorId) {
        next = appendEventToState(next, "DOOR_OPENED", {
          floorId: location.floorId,
          roomId: location.roomId,
          doorId: resolved.connection.doorId,
          connectionId: resolved.connection.id,
          revealedRoomId: resolved.toRoom.id,
        });
      }

      if (resolved.usedStairs && resolved.floorChanged) {
        next = appendEventToState(next, "PLAYER_USED_STAIRS", {
          fromFloorId: location.floorId,
          fromRoomId: location.roomId,
          toFloorId: resolved.nextFloorId,
          toRoomId: resolved.toRoom.id,
          direction: resolved.connection.note === "up" ? "up" : "down",
        });

        next = appendEventToState(next, "FLOOR_CHANGED", {
          fromFloorId: location.floorId,
          toFloorId: resolved.nextFloorId,
          fromRoomId: location.roomId,
          toRoomId: resolved.toRoom.id,
        });
      }

      const discoveryDrafts = deriveExplorationDiscoveryDrafts({
        dungeon,
        events: next.events as any[],
        floorId: resolved.nextFloorId,
        roomId: resolved.toRoom.id,
        enteredViaConnectionId: resolved.connection.id,
        enteredFromRoomId: location.roomId,
      });

      for (const draft of discoveryDrafts) {
        next = appendEventToState(next, draft.type, draft.payload as any);
      }

      return next;
    });
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
      const success =
        Number.isFinite(Number(payload?.dice?.roll)) &&
        Number.isFinite(Number(payload?.dice?.dc))
          ? Number(payload.dice.roll) >= Number(payload.dice.dc)
          : false;

      const enrichedOutcome = {
        ...payload,
        meta: {
          ...(payload as any)?.meta,
          optionKind: kind,
          optionDescription: selectedText,
          intent: playerInput,
          floorId: location.floorId,
          roomId: location.roomId,
          success,
        },
      };

      let next = appendEventToState(prev, "OUTCOME", enrichedOutcome as any);

      const pressureDelta =
        kind === "contested" ? (success ? 5 : 11) :
        kind === "risky" ? (success ? 4 : 9) :
        kind === "environmental" ? (success ? 3 : 7) :
        success ? 2 : 5;

      const awarenessDelta =
        kind === "contested" ? (success ? 7 : 14) :
        kind === "risky" ? (success ? 5 : 11) :
        kind === "environmental" ? (success ? 2 : 6) :
        success ? 1 : 4;

      next = appendEventToState(next, "LOCATION_PRESSURE_CHANGED", {
        floorId: location.floorId,
        roomId: location.roomId,
        delta: pressureDelta,
      });

      next = appendEventToState(next, "LOCATION_AWARENESS_CHANGED", {
        floorId: location.floorId,
        roomId: location.roomId,
        delta: awarenessDelta,
      });

      return next;
    });

    commitDungeonTraversalBundle({
      success:
        Number.isFinite(Number(payload?.dice?.roll)) &&
        Number.isFinite(Number(payload?.dice?.dc))
          ? Number(payload.dice.roll) >= Number(payload.dice.dc)
          : false,
      selectedText: combinedText,
    });

    setPlayerInput("");
    setParsed(null);
    setOptions(null);
    setSelectedOption(null);
    setGameplayFocusStep("action");
    setActiveSection("action");
  }

  function handleRecordOutcomeOnly(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  }) {
    setState((prev) => {
      const roll = Number(payload?.dice?.roll ?? 0);
      const dc = Number(payload?.dice?.dc ?? 0);
      const success = Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;

      const enrichedOutcome = {
        ...payload,
        meta: {
          ...(payload as any)?.meta,
          optionKind: "contested",
          floorId: location.floorId,
          roomId: location.roomId,
          success,
        },
      };

      let next = appendEventToState(prev, "OUTCOME", enrichedOutcome as any);

      next = appendEventToState(next, "LOCATION_PRESSURE_CHANGED", {
        floorId: location.floorId,
        roomId: location.roomId,
        delta: success ? 5 : 11,
      });

      next = appendEventToState(next, "LOCATION_AWARENESS_CHANGED", {
        floorId: location.floorId,
        roomId: location.roomId,
        delta: success ? 7 : 14,
      });

      return next;
    });

    setGameplayFocusStep("action");
    setActiveSection("canon");
  }

  const canEnterDungeon = dmMode !== null && partySize > 0;
  const partyCanonicalExists = !!partyCanonical;
  const showInitialTable = enteredDungeon && dmMode !== null && partySize > 0;

  const chapterState = useMemo(() => {
    const doneMode = dmMode !== null;
    const doneTable = tableAccepted;
    const doneParty = partyCanonicalExists;

    return {
      mode: doneMode ? ("done" as const) : ("next" as const),
      party: doneParty ? ("done" as const) : doneTable ? ("next" as const) : ("locked" as const),
      table: doneTable
        ? ("done" as const)
        : showInitialTable
          ? ("next" as const)
          : doneMode
            ? ("next" as const)
            : ("locked" as const),
      pressure: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      map: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      combat: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      action: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      resolution: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      canon: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      ledger: doneTable && doneParty ? ("open" as const) : ("locked" as const),
    };
  }, [dmMode, tableAccepted, partyCanonicalExists, showInitialTable]);

  const presentationPhase: PresentationPhase = useMemo(() => {
    if (dmMode === null || !enteredDungeon) return "onboarding";
    if (!tableAccepted) return "chronicle";
    if (!partyCanonicalExists) return "party-declaration";
    return "gameplay";
  }, [dmMode, enteredDungeon, tableAccepted, partyCanonicalExists]);

  const showFullHero = presentationPhase === "onboarding";
  const showCompactHero = presentationPhase !== "onboarding";
  const showGameplay = presentationPhase === "gameplay";

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

  const allowGameplay = dmMode !== null && tableAccepted && partyCanonicalExists;
  const gameplayAllowsPressure = showGameplay && allowGameplay;
  const gameplayAllowsMap = gameplayAllowsPressure && (gameplayFocusStep === "map" || gameplayFocusStep === "action");
  const gameplayAllowsAction = gameplayAllowsPressure && gameplayFocusStep === "action";

  const roomNarrative = useMemo(() => {
    return describeRoomEntry({
      dungeonSeed: dungeon.seed,
      floorTheme: currentFloor.theme,
      roomType: currentRoom.roomType,
      roomLabel: currentRoom.label,
      features: narrationFeatures,
      exits: narrationExits,
      lootHint: currentRoom.lootHint ?? null,
      storyHint: currentRoom.storyHint ?? null,
      chronicle: chronicleSeed,
    });
  }, [
    dungeon.seed,
    currentFloor.theme,
    currentRoom.roomType,
    currentRoom.label,
    currentRoom.lootHint,
    currentRoom.storyHint,
    narrationFeatures,
    narrationExits,
    chronicleSeed,
  ]);

  const roomFeatureNarrative = useMemo(() => {
    const lines = describeRoomFeatures({
      dungeonSeed: dungeon.seed,
      floorTheme: currentFloor.theme,
      roomType: currentRoom.roomType,
      roomLabel: currentRoom.label,
      features: narrationFeatures,
      chronicle: chronicleSeed,
    });

    if (dungeonEvolution.signals.length > 0) {
      return [...lines, ...dungeonEvolution.signals].slice(0, 6);
    }

    return lines;
  }, [
    dungeon.seed,
    currentFloor.theme,
    currentRoom.roomType,
    currentRoom.label,
    narrationFeatures,
    chronicleSeed,
    dungeonEvolution.signals,
  ]);

  const roomExitNarrative = useMemo(() => {
    return describeRoomExits({
      dungeonSeed: dungeon.seed,
      roomType: currentRoom.roomType,
      exits: narrationExits,
    });
  }, [dungeon.seed, currentRoom.roomType, narrationExits]);

  const roomSummary = useMemo(() => {
    return describeRoomSummary({
      dungeonSeed: dungeon.seed,
      floorTheme: currentFloor.theme,
      roomType: currentRoom.roomType,
      roomLabel: currentRoom.label,
      features: narrationFeatures,
      lootHint: currentRoom.lootHint ?? null,
      chronicle: chronicleSeed,
      encounterTheme: currentRoom.encounterSeed?.theme ?? null,
    });
  }, [
    dungeon.seed,
    currentFloor.theme,
    currentRoom.roomType,
    currentRoom.label,
    narrationFeatures,
    currentRoom.lootHint,
    currentRoom.encounterSeed?.theme,
    chronicleSeed,
  ]);

  const resolutionMovement = useMemo<{
    from?: { x: number; y: number } | null;
    to?: { x: number; y: number } | null;
    direction?: "north" | "south" | "east" | "west" | "none" | null;
  } | null>(() => {
    return null;
  }, []);

  const resolutionCombat = useMemo(() => {
    if (!combatActive) return null;

    return {
      activeEnemyGroupName:
        activeEnemyOverlayName ||
        enemyTelegraphHint?.enemyName ||
        String(activeCombatantSpec?.name ?? "") ||
        null,
      isEnemyTurn: !!isEnemyTurn,
      attackStyleHint: enemyTelegraphHint?.attackStyleHint ?? "unknown",
    } as const;
  }, [combatActive, activeEnemyOverlayName, enemyTelegraphHint, activeCombatantSpec, isEnemyTurn]);

  const combatEncounterContext = useMemo<CombatEncounterContext>(() => {
    const roomTheme = currentRoom?.encounterSeed?.theme ?? null;
    const lockState = inferLockState({
      room: currentRoom,
      reachableConnections,
      playerInput,
      selectedOptionDescription: selectedOption?.description ?? "",
    });

    const rewardHint = inferRewardHint({
      room: currentRoom,
      playerInput,
      selectedOptionDescription: selectedOption?.description ?? "",
    });

    const objective = inferObjective({
      room: currentRoom,
      lockState,
      rewardHint,
    });

    const enemyNames = currentRoom?.encounterSeed?.enemyNames ?? [];
    const firstEnemy = enemyNames[0] ?? null;

    return {
      zoneId: `${location.floorId}:${location.roomId}`,
      zoneTheme: roomTheme,
      objective,
      lockState,
      rewardHint,
      keyEnemyName: currentRoom?.encounterSeed?.canCarryKey ? firstEnemy : null,
      relicEnemyName: currentRoom?.encounterSeed?.canCarryRelic ? firstEnemy : null,
      cacheGuardEnemyName: currentRoom?.encounterSeed?.canGuardCache ? firstEnemy : null,
    };
  }, [
    currentRoom,
    reachableConnections,
    playerInput,
    selectedOption?.description,
    location.floorId,
    location.roomId,
  ]);

  function enterDungeon() {
    if (!canEnterDungeon) return;
    playIntroTheme(true);
    setEnteredDungeon(true);
    setActiveSection("table");
  }

  return {
    role,

    introAudioRef,
    bgmAudioRef,

    state,
    dmMode,
    setDmMode,

    HERO_IMAGE_SRC,
    heroImageOk,
    setHeroImageOk,

    initialTable,
    tableAccepted,
    setTableAccepted,
    tableDraftText,
    setTableDraftText,
    renderedTableNarration,
    enteredDungeon,
    setEnteredDungeon,

    activeSection,
    setActiveSection,
    gameplayFocusStep,
    setGameplayFocusStep,

    playerInput,
    setPlayerInput,
    parsed,
    options,
    selectedOption,
    setSelectedOption,

    actingPlayerId,
    setActingPlayerId,

    enemyTelegraphHint,
    setEnemyTelegraphHint,

    outcomesCount,
    canonCount,

    partyCanonical,
    partyDraft,
    setPartyDraft,
    partyEffective,
    partyMembers,
    partySize,
    effectivePlayerNames,

    dungeon,
    location,
    currentFloor,
    currentRoom,
    currentRoomTitle,
    currentRoomVisualKey,

    reachableConnections,
    nearbyRoomIds,
    openedDoorIds,
    unlockedDoorIds,
    dungeonEvolution,

    currentFeatures,
    narrationFeatures,
    narrationExits: toNarrationExits({
      currentRoom,
      currentFloorRooms: currentFloor.rooms,
      allDungeonRooms: dungeon.floors.flatMap((floor) => floor.rooms),
      connections: reachableConnections,
    }),

    roomImage,
    roomConnectionsView,

    chronicleSeed,
    roomNarrative,
    roomFeatureNarrative,
    roomExitNarrative,
    roomSummary,

    latestCombatId,
    derivedCombat,
    combatEnded,
    combatActive,
    activeCombatantSpec,
    isEnemyTurn,
    isPlayerTurn,
    activeTurnLabel,

    actingPlayerInjuryStacks,
    actingRollModifier,

    pressureTier,
    combatEncounterContext,
    resolutionMovement,
    resolutionCombat,

    partyLockedByCanon,
    partyLockedByCombat,
    partyLocked,
    partyCanonicalExists,

    isWrongPlayerForTurn,
    canPlayerSubmitIntent,

    chapterState,
    presentationPhase,
    showFullHero,
    showCompactHero,
    showGameplay,
    showInitialTable,

    activeEnemyOverlayName,
    activeEnemyOverlayId,
    solaceNeutralEnemyTurnEnabled,
    resolutionDmMode,

    allowGameplay,
    gameplayAllowsPressure,
    gameplayAllowsMap,
    gameplayAllowsAction,

    shareCanon,
    appendCanon,

    setPartySize,
    randomizePartyNames,
    commitParty,

    handlePlayerAction,
    handleRecord,
    handleRecordOutcomeOnly,

    advanceTurn,
    endCombat,
    passTurn,
    enterDungeon,

    safeInt,
  };
}
