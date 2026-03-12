"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSession, type SessionState } from "@/lib/session/SessionState";
import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, type Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";
import { deriveCombatState, findLatestCombatId, nextTurnPointer } from "@/lib/combat/CombatState";
import { generateDungeon } from "@/lib/dungeon/DungeonGenerator";
import {
  deriveCurrentDungeonLocation,
  deriveOpenedDoorIds,
  deriveReachableConnections,
  deriveUnlockedDoorIds,
  inferNeighborRoomIds,
} from "@/lib/dungeon/DungeonNavigation";
import { deriveDungeonEvolution } from "@/lib/dungeon/DungeonEvolution";
import {
  buildPuzzlePresentationBlock,
  resolveActiveRoomPuzzle,
  runRoomPuzzleAttempt as runRoomPuzzleAttemptRuntime,
} from "@/lib/dungeon/puzzles/PuzzleRuntime";
import type { PuzzleCanonRecord, PuzzleResolution } from "@/lib/dungeon/puzzles/PuzzleState";
import {
  deriveProgressionEvolution,
  type SessionEvent as ProgressionSessionEvent,
} from "@/lib/progression/ProgressionEvolution";
import type { ProgressionState as CampaignProgressionState } from "@/lib/progression/ProgressionTypes";
import {
  formatCompactProgressionBanner,
  formatProgressionInspectorReport,
  inspectProgressionState,
} from "@/lib/debug/ProgressionInspector";
import type { DMMode, DemoSectionId, DiceMode, InitialTable, RollSource } from "../demoTypes";
import {
  normalizeName,
  randomName,
  generateInitialTable,
  renderInitialTableNarration,
  isCombatEndedForId,
} from "../demoUtils";
import {
  extractOpeningChronicleSeed,
  inferPressureTier,
} from "../lib/demoNarration";
import {
  type CombatEncounterContext,
  type GameplayFocusStep,
  type MusicMode,
  type PartyDeclaredPayload,
  type PartyMember,
} from "./runtime/demoRuntimeTypes";
import {
  buildStarterMember,
  cleanCommittedSoloParty,
  deriveInjuryStacksForPlayer,
  deriveLatestParty,
  displayName,
} from "./runtime/demoRuntimeParty";
import {
  playIntroTheme,
  pauseIntroTheme,
  startAmbientTheme,
  startCombatTheme,
  stopAllMusic,
  stopAmbience,
} from "./runtime/demoRuntimeAudio";
import {
  commitDungeonTraversalBundle,
  mapStateEventsToPuzzleCanon,
} from "./runtime/demoRuntimeTraversal";
import {
  deriveChapterState,
  deriveGameplayPermissions,
  derivePresentationPhase,
  deriveRoomInteractionMode,
} from "./runtime/demoRuntimeFlow";
import { appendEventToState, hasDungeonInitialized, safeInt } from "./runtime/demoRuntimeUtils";
import {
  buildCombatEncounterContext,
  buildRoomConnectionsView,
  buildRoomViewModel,
} from "./runtime/demoRuntimeDerived";
import {
  commitOutcomeOnlyToState,
  commitResolvedActionToState,
} from "./runtime/demoRuntimeResolution";
import {
  createBeginDungeonDescent,
  createEnterDungeon,
  createEnteredDungeonSetter,
  ensureInitialTable,
  resetChronicleGateForModeChange,
  setSoloPartySize,
  syncPartyDraftFromMode,
  syncRenderedNarrationToDraft,
} from "./runtime/demoRuntimeCampaign";
import { bootstrapDungeonState } from "./runtime/demoRuntimeDungeonBootstrap";

export { displayName };
export type { PartyDeclaredPayload, PartyMember };

type MusicRefs = {
  introAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  bgmAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  ambienceAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentMusicModeRef: React.MutableRefObject<MusicMode>;
  lastAmbientIndexRef: React.MutableRefObject<number>;
  lastCombatIndexRef: React.MutableRefObject<number>;
};

export function useDemoRuntime() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));
  const [dmMode, setDmMode] = useState<DMMode | null>(null);

  const HERO_IMAGE_SRC = "/Hero_dungeon.png";
  const [heroImageOk, setHeroImageOk] = useState(true);

  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambienceAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentMusicModeRef = useRef<MusicMode>("none");
  const lastAmbientIndexRef = useRef(-1);
  const lastCombatIndexRef = useRef(-1);

  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);
  const [tableDraftText, setTableDraftText] = useState("");
  const [enteredDungeon, setEnteredDungeonState] = useState(false);
  const [dungeonDescentConfirmed, setDungeonDescentConfirmed] = useState(false);

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

  const [puzzleResolution, setPuzzleResolution] = useState<PuzzleResolution | null>(null);
  const [selectedTraversalTargetId, setSelectedTraversalTargetId] = useState<string | null>(null);

  const outcomesCount = useMemo(
    () => state.events.filter((e: any) => e?.type === "OUTCOME").length,
    [state.events]
  );

  const canonCount = useMemo(
    () => state.events.filter((e: any) => e?.type && e?.type !== "OUTCOME").length,
    [state.events]
  );

  const partyCanonical = useMemo(
    () => deriveLatestParty(state.events as any[]) ?? null,
    [state.events]
  );

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
    syncPartyDraftFromMode({
      dmMode,
      partyCanonical,
      setPartyDraft,
    });
  }, [dmMode, partyCanonical?.partyId]);

  const partyEffective: PartyDeclaredPayload | null = partyCanonical ?? partyDraft;
  const partyMembers = (partyEffective?.members ?? []).slice(0, 1);
  const partySize = 1;

  const effectivePlayerNames = useMemo(
    () => partyMembers.map((m, idx) => displayName(m, idx + 1)),
    [partyMembers]
  );

  const progressionEvents = useMemo(
    () => state.events as unknown as readonly ProgressionSessionEvent[],
    [state.events]
  );

  const progressionState: CampaignProgressionState = useMemo(() => {
    return deriveProgressionEvolution({
      events: progressionEvents,
    });
  }, [progressionEvents]);

  const progressionInspectorSummary = useMemo(() => {
    return inspectProgressionState({
      state: progressionState,
      events: progressionEvents,
    });
  }, [progressionState, progressionEvents]);

  const progressionInspectorReport = useMemo(() => {
    return formatProgressionInspectorReport({
      state: progressionState,
      events: progressionEvents,
    });
  }, [progressionState, progressionEvents]);

  const progressionInspectorBanner = useMemo(() => {
    return formatCompactProgressionBanner({
      state: progressionState,
    });
  }, [progressionState]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug(progressionInspectorReport);
  }, [progressionInspectorReport]);

  useEffect(() => {
    if (!partyMembers.length) {
      setActingPlayerId("player_1");
      return;
    }
    const exists = partyMembers.some((m) => String(m.id) === String(actingPlayerId));
    if (exists) return;
    setActingPlayerId(String(partyMembers[0].id ?? "player_1"));
  }, [partyMembers, actingPlayerId]);

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
  const partyLockedByCanon = !!partyCanonical;
  const partyLockedByCombat = combatActive;
  const partyLocked = partyLockedByCanon || partyLockedByCombat;

  const activeCombatantSpec = useMemo(() => {
    if (!derivedCombat?.activeCombatantId) return null;
    return (
      derivedCombat.participants.find(
        (p: any) => p.id === derivedCombat.activeCombatantId
      ) ?? null
    );
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

  const audioRefs: MusicRefs = {
    introAudioRef,
    bgmAudioRef,
    ambienceAudioRef,
    currentMusicModeRef,
    lastAmbientIndexRef,
    lastCombatIndexRef,
  };

  const partyCanonicalExists = !!partyCanonical;
  const canEnterDungeon = dmMode !== null;
  const showInitialTable = enteredDungeon && dmMode !== null;

  const setEnteredDungeon = useMemo(
    () =>
      createEnteredDungeonSetter({
        tableAccepted,
        partyCanonicalExists,
        setEnteredDungeonState,
        setDungeonDescentConfirmed,
        setGameplayFocusStep,
        setActiveSection,
      }),
    [tableAccepted, partyCanonicalExists]
  );

  const beginDungeonDescent = useMemo(
    () =>
      createBeginDungeonDescent({
        setEnteredDungeonState,
        setDungeonDescentConfirmed,
        setGameplayFocusStep,
        setActiveSection,
      }),
    []
  );

  const enterDungeon = useMemo(
    () =>
      createEnterDungeon({
        canEnterDungeon,
        playIntro: () =>
          playIntroTheme({
            introAudioRef,
            bgmAudioRef,
            currentMusicModeRef,
            loop: true,
          }),
        setEnteredDungeonState,
        setDungeonDescentConfirmed,
        setActiveSection,
      }),
    [canEnterDungeon]
  );

  const dungeonAudioActive = dungeonDescentConfirmed;

  useEffect(() => {
    if (dungeonAudioActive) return;
    stopAllMusic(audioRefs);
  }, [dungeonAudioActive]);

  useEffect(() => {
    const intro = introAudioRef.current;
    if (!intro) return;
    intro.loop = enteredDungeon && !tableAccepted && !dungeonDescentConfirmed;
  }, [enteredDungeon, tableAccepted, dungeonDescentConfirmed]);

  useEffect(() => {
    if (!dungeonAudioActive) {
      stopAmbience(ambienceAudioRef);
      return;
    }

    const ambience = ambienceAudioRef.current;
    if (!ambience) return;

    try {
      ambience.loop = true;
      ambience.volume = 0.18;

      const playPromise = ambience.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch {
      // fail silently
    }
  }, [dungeonAudioActive]);

  useEffect(() => {
    if (!dungeonAudioActive) return;

    const intro = introAudioRef.current;
    const introIsPlaying = !!intro && !intro.paused && intro.currentTime > 0;

    if (!tableAccepted) {
      if (currentMusicModeRef.current !== "intro" || !introIsPlaying) {
        playIntroTheme({
          introAudioRef,
          bgmAudioRef,
          currentMusicModeRef,
          loop: true,
        });
      }
      return;
    }

    if (introIsPlaying) {
      pauseIntroTheme(introAudioRef, true);
    }

    if (combatActive) {
      if (currentMusicModeRef.current !== "combat") {
        startCombatTheme({
          introAudioRef,
          bgmAudioRef,
          currentMusicModeRef,
          lastCombatIndexRef,
        });
      }
      return;
    }

    if (currentMusicModeRef.current !== "ambient") {
      startAmbientTheme({
        introAudioRef,
        bgmAudioRef,
        currentMusicModeRef,
        lastAmbientIndexRef,
      });
    }
  }, [dungeonAudioActive, tableAccepted, combatActive]);

  function setPartySize(nextCount: number) {
    setSoloPartySize(setPartyDraft, nextCount);
  }

  function randomizePartyNames() {
    if (!partyDraft) return;

    setPartyDraft((prev) => {
      if (!prev) return prev;

      const next: PartyDeclaredPayload = {
        ...prev,
        members: (prev.members ?? []).slice(0, 1).map((m) => ({ ...m })),
      };

      if (!next.members[0]) {
        next.members = [buildStarterMember(0)];
      }

      const current = normalizeName(next.members[0].name || "");
      if (!current) {
        next.members[0].name = randomName();
      }

      return next;
    });
  }

  function commitParty() {
    if (!partyDraft) return;
    if (partyLocked) return;

    const cleaned = cleanCommittedSoloParty(partyDraft);
    setState((prev) => appendEventToState(prev, "PARTY_DECLARED", cleaned as any));

    if (tableAccepted) {
      setGameplayFocusStep("pressure");
      setActiveSection("party");
    }
  }

  useEffect(() => {
    ensureInitialTable({
      initialTable,
      setInitialTable,
      generateInitialTable,
    });
  }, [initialTable]);

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  const chronicleSeed = useMemo(
    () => extractOpeningChronicleSeed(initialTable),
    [initialTable]
  );

  useEffect(() => {
    syncRenderedNarrationToDraft({
      initialTable,
      renderedTableNarration,
      tableDraftText,
      setTableDraftText,
    });
  }, [initialTable, renderedTableNarration, tableDraftText]);

  useEffect(() => {
    resetChronicleGateForModeChange({
      dmMode,
      setTableAccepted,
      setEnteredDungeonState,
      setDungeonDescentConfirmed,
      setGameplayFocusStep,
    });
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
    setState((prev) => appendEventToState(prev, "TURN_ADVANCED", payload as any));
  }

  function endCombat() {
    if (!derivedCombat) return;
    if (combatEnded) return;

    setState((prev) =>
      appendEventToState(prev, "COMBAT_ENDED", {
        combatId: derivedCombat.combatId,
      } as any)
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
        dungeon,
      }),
    [state.events, location.floorId, location.roomId, nearbyRoomIds, dungeon]
  );

  const roomView = useMemo(
    () =>
      buildRoomViewModel({
        dungeon,
        currentFloor,
        currentRoom,
        reachableConnections,
        chronicleSeed,
        dungeonEvolutionSignals: dungeonEvolution.signals,
      }),
    [
      dungeon,
      currentFloor,
      currentRoom,
      reachableConnections,
      chronicleSeed,
      dungeonEvolution.signals,
    ]
  );

  const roomConnectionsView = useMemo(
    () =>
      buildRoomConnectionsView({
        reachableConnections,
        currentRoom,
        currentFloor,
        dungeon,
      }),
    [reachableConnections, currentRoom, currentFloor, dungeon]
  );

  useEffect(() => {
    const firstRouteId = roomConnectionsView[0]?.id ?? null;

    setSelectedTraversalTargetId((prev) => {
      if (!prev) return firstRouteId;
      const stillExists = roomConnectionsView.some((route) => route.id === prev);
      return stillExists ? prev : firstRouteId;
    });
  }, [roomConnectionsView, location.floorId, location.roomId]);

  const selectedTraversalRoute = useMemo(() => {
    return (
      roomConnectionsView.find((route) => route.id === selectedTraversalTargetId) ??
      roomConnectionsView[0] ??
      null
    );
  }, [roomConnectionsView, selectedTraversalTargetId]);

  const selectedTraversalTargetLabel = selectedTraversalRoute?.targetLabel ?? null;

  const puzzleCanon = useMemo(
    () => mapStateEventsToPuzzleCanon(state.events as any[]) as PuzzleCanonRecord[],
    [state.events]
  );

  const activeRoomPuzzle = useMemo(() => {
    return resolveActiveRoomPuzzle({
      room: currentRoom,
      floorId: location.floorId,
      floorDepth: currentFloor.depth,
    });
  }, [currentRoom, location.floorId, currentFloor.depth]);

  const activePuzzleBlock = useMemo(() => {
    return buildPuzzlePresentationBlock({
      room: currentRoom,
      floorId: location.floorId,
      floorDepth: currentFloor.depth,
    });
  }, [currentRoom, location.floorId, currentFloor.depth]);

  useEffect(() => {
  useEffect(() => {
    setPuzzleResolution(null);
  }, [location.floorId, location.roomId]);

  useEffect(() => {
    if (!tableAccepted || !partyCanonical) return;
    if (hasDungeonInitialized(state.events as any[])) return;

    setState((prev) =>
      bootstrapDungeonState({
        prev,
        dungeon,
      })
    );
  }, [tableAccepted, partyCanonical, state.events, dungeon]);

  function resolvePressureGaugePuzzleSuccess() {
    const successResult = runRoomPuzzleAttemptRuntime({
      room: currentRoom,
      floorId: location.floorId,
      floorDepth: currentFloor.depth,
      actorId: actingPlayerId,
      actorName:
        partyMembers.find((m) => String(m.id) === String(actingPlayerId))?.name ??
        effectivePlayerNames[0] ??
        null,
      inputText: "pressure gauge solved",
      knownCanon: puzzleCanon,
    });

    setPuzzleResolution(successResult);

    setState((prev) => {
      let next = prev;

      for (const event of successResult.suggestedEvents) {
        next = appendEventToState(next, event.type, event.payload as any);
      }

      next = appendEventToState(next, "HERO_EXPERIENCE_GAINED", {
        amount: 25,
        source: "pressure_gauges_puzzle",
        floorId: location.floorId,
        roomId: location.roomId,
      } as any);

      next = commitDungeonTraversalBundle({
        prevState: next,
        success: true,
        selectedText:
          selectedTraversalTargetLabel ??
          selectedTraversalRoute?.targetLabel ??
          selectedTraversalRoute?.targetType ??
          selectedTraversalRoute?.id ??
          "",
        currentRoom,
        reachableConnections,
        dungeon,
        floorId: location.floorId,
        roomId: location.roomId,
        openedDoorIds,
        unlockedDoorIds,
      });

      return next;
    });

    setGameplayFocusStep("map");
    setActiveSection("map");
  }

  async function runRoomPuzzleAttempt(inputText: string) {
    const trimmed = String(inputText ?? "").trim();
    if (!trimmed || !activeRoomPuzzle) return null;

    const result = runRoomPuzzleAttemptRuntime({
      room: currentRoom,
      floorId: location.floorId,
      floorDepth: currentFloor.depth,
      actorId: actingPlayerId,
      actorName:
        partyMembers.find((m) => String(m.id) === String(actingPlayerId))?.name ??
        effectivePlayerNames[0] ??
        null,
      inputText: trimmed,
      knownCanon: puzzleCanon,
    });

    setPuzzleResolution(result);

    setState((prev) => {
      let next = prev;

      for (const event of result.suggestedEvents) {
        next = appendEventToState(next, event.type, event.payload as any);
      }

      if (result.success) {
        next = appendEventToState(next, "HERO_EXPERIENCE_GAINED", {
          amount: 25,
          source: "pressure_gauges_puzzle",
          floorId: location.floorId,
          roomId: location.roomId,
        } as any);

        next = commitDungeonTraversalBundle({
          prevState: next,
          success: true,
          selectedText:
            selectedTraversalTargetLabel ??
            selectedTraversalRoute?.targetLabel ??
            selectedTraversalRoute?.targetType ??
            selectedTraversalRoute?.id ??
            "",
          currentRoom,
          reachableConnections,
          dungeon,
          floorId: location.floorId,
          roomId: location.roomId,
          openedDoorIds,
          unlockedDoorIds,
        });
      }

      return next;
    });

    if (result.success) {
      setGameplayFocusStep("map");
      setActiveSection("map");
    }

    return result;
  }

  function handleRecord(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  }) {
    const selectedText = selectedOption?.description ?? "";

    setState((prev) =>
      commitResolvedActionToState({
        prevState: prev,
        payload,
        playerInput,
        selectedOptionDescription: selectedText,
        location,
        currentRoom,
        reachableConnections,
        dungeon,
        openedDoorIds,
        unlockedDoorIds,
      })
    );

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
    setState((prev) =>
      commitOutcomeOnlyToState({
        prevState: prev,
        payload,
        location,
      })
    );

    setGameplayFocusStep("action");
    setActiveSection("canon");
  }

  const presentationPhase = useMemo(
    () =>
      derivePresentationPhase({
        dmMode,
        enteredDungeon,
        tableAccepted,
        partyCanonicalExists,
        dungeonDescentConfirmed,
      }),
    [dmMode, enteredDungeon, tableAccepted, partyCanonicalExists, dungeonDescentConfirmed]
  );

  const showFullHero = presentationPhase === "onboarding";
  const showCompactHero = presentationPhase !== "onboarding";
  const showGameplay = presentationPhase === "gameplay";

  const activeEnemyOverlayName =
    dmMode !== "human" && combatActive && isEnemyTurn
      ? String(activeCombatantSpec?.name ?? "")
      : null;

  const activeEnemyOverlayId =
    dmMode !== "human" && combatActive && isEnemyTurn
      ? String(activeCombatantSpec?.id ?? "")
      : null;

  const solaceNeutralEnemyTurnEnabled =
    dmMode === "solace-neutral" &&
    combatActive &&
    isEnemyTurn &&
    !!activeEnemyOverlayName &&
    !!activeEnemyOverlayId;

  const resolutionDmMode = useMemo(
    () => (dmMode === "solace-neutral" ? "solace_neutral" : "human"),
    [dmMode]
  );

  const allowGameplay =
    dmMode !== null &&
    tableAccepted &&
    partyCanonicalExists &&
    dungeonDescentConfirmed;

  const roomInteractionMode = useMemo(
    () =>
      deriveRoomInteractionMode({
        combatActive,
        gameplayFocusStep,
        hasActivePuzzle: !!activeRoomPuzzle,
        puzzleResolved: !!puzzleResolution?.success,
      }),
    [combatActive, gameplayFocusStep, activeRoomPuzzle, puzzleResolution?.success]
  );

  const { gameplayAllowsPressure, gameplayAllowsMap, gameplayAllowsAction } = useMemo(
    () =>
      deriveGameplayPermissions({
        showGameplay,
        allowGameplay,
        gameplayFocusStep,
        roomInteractionMode,
      }),
    [showGameplay, allowGameplay, gameplayFocusStep, roomInteractionMode]
  );

  const chapterState = useMemo(
    () =>
      deriveChapterState({
        dmMode,
        tableAccepted,
        partyCanonicalExists,
        showInitialTable,
        dungeonDescentConfirmed,
      }),
    [dmMode, tableAccepted, partyCanonicalExists, showInitialTable, dungeonDescentConfirmed]
  );

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

  const combatEncounterContext = useMemo<CombatEncounterContext>(
    () =>
      buildCombatEncounterContext({
        currentRoom,
        reachableConnections,
        playerInput,
        selectedOptionDescription: selectedOption?.description ?? "",
        floorId: location.floorId,
        roomId: location.roomId,
      }),
    [currentRoom, reachableConnections, playerInput, selectedOption?.description, location.floorId, location.roomId]
  );

  return {
    role,

    introAudioRef,
    bgmAudioRef,
    ambienceAudioRef,

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
    dungeonDescentConfirmed,
    beginDungeonDescent,

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

    puzzleResolution,
    setPuzzleResolution,

    selectedTraversalTargetId,
    setSelectedTraversalTargetId,
    selectedTraversalTargetLabel,

    outcomesCount,
    canonCount,

    partyCanonical,
    partyDraft,
    setPartyDraft,
    partyEffective,
    partyMembers,
    partySize,
    effectivePlayerNames,

    progressionState,
    progressionInspectorSummary,
    progressionInspectorReport,
    progressionInspectorBanner,
    progression: {
      hero: {
        level: progressionState.hero.level,
        experience: progressionState.hero.experience,
        legacyRank: progressionState.hero.legacyRank,
        upgradePoints: progressionState.hero.upgradePoints,
        upgrades: progressionState.hero.upgrades,
        masteryUnlocked: progressionState.hero.masteryUnlocked,
      },
      party: {
        activeSlots: progressionState.party.activeSlots,
        unlockedSlots: progressionState.party.unlockedSlots,
        maxSlots: progressionState.party.maxSlots,
        livingMembers: progressionState.party.livingMembers,
        fallenMembers: progressionState.party.fallenMembers,
      },
      inventory: {
        totalSlots: progressionState.inventory.totalSlots,
        usedSlots: progressionState.inventory.usedSlots,
        freeSlots: progressionState.inventory.freeSlots,
      },
      campaign: {
        fullFellowshipAssembled: progressionState.campaign.fullFellowshipAssembled,
        completionRequiresFullFellowship: progressionState.campaign.completionRequiresFullFellowship,
        completionRequiresFullParty: progressionState.campaign.completionRequiresFullFellowship,
        completionBlocked: progressionState.campaign.completionBlocked,
        cryptFullyCleared: progressionState.campaign.cryptFullyCleared,
        finalDescentUnlocked: progressionState.campaign.finalDescentUnlocked,
      },
      companions: {
        recruited: progressionState.companions.recruited,
        available: progressionState.companions.available,
        declined: progressionState.companions.declined,
        lost: progressionState.companions.lost,
        extinctCombinations: progressionState.companions.extinctCombinations,
      },
      relics: {
        equippedByHero: progressionState.relics.equippedByHero,
        equippedByCompanion: progressionState.relics.equippedByCompanion,
        stored: progressionState.relics.storedRelics,
        carried: progressionState.relics.carriedRelics,
        lost: progressionState.relics.lostRelics,
        activePool: progressionState.relics.activePool,
      },
    },

    unlockedPartySlots: progressionState.party.unlockedSlots,
    activePartySize: progressionState.party.activeSlots,
    maxPartySlots: progressionState.party.maxSlots,
    fullFellowshipAssembled: progressionState.campaign.fullFellowshipAssembled,
    completionRequiresFullFellowship: progressionState.campaign.completionRequiresFullFellowship,
    campaignCompletionBlocked: progressionState.campaign.completionBlocked,

    dungeon,
    location,
    currentFloor,
    currentRoom,
    currentRoomTitle: roomView.currentRoomTitle,
    currentRoomVisualKey: roomView.currentRoomVisualKey,

    reachableConnections,
    nearbyRoomIds,
    openedDoorIds,
    unlockedDoorIds,
    dungeonEvolution,

    currentFeatures: roomView.currentFeatures,
    narrationFeatures: roomView.narrationFeatures,
    narrationExits: roomView.narrationExits,
    roomImage: roomView.roomImage,
    roomConnectionsView,

    activeRoomPuzzle,
    activePuzzleBlock,
    runRoomPuzzleAttempt,
    resolvePressureGaugePuzzleSuccess,

    chronicleSeed,
    roomNarrative: roomView.roomNarrative,
    roomFeatureNarrative: roomView.roomFeatureNarrative,
    roomExitNarrative: roomView.roomExitNarrative,
    roomSummary: roomView.roomSummary,

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

    roomInteractionMode,

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
