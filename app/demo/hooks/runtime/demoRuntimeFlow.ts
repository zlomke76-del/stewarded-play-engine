import type {
  GameplayFocusStep,
  PresentationPhase,
  RoomInteractionMode,
} from "./demoRuntimeTypes";

export function derivePresentationPhase(args: {
  dmMode: any;
  enteredDungeon: boolean;
  tableAccepted: boolean;
  partyCanonicalExists: boolean;
  dungeonDescentConfirmed: boolean;
}): PresentationPhase {
  const {
    dmMode,
    enteredDungeon,
    tableAccepted,
    partyCanonicalExists,
    dungeonDescentConfirmed,
  } = args;

  if (dmMode === null || !enteredDungeon) return "onboarding";
  if (!tableAccepted) return "chronicle";
  if (!partyCanonicalExists) return "party-declaration";
  if (!dungeonDescentConfirmed) return "tavern";
  return "gameplay";
}

export function deriveRoomInteractionMode(args: {
  combatActive: boolean;
  gameplayFocusStep: GameplayFocusStep;
  hasActivePuzzle: boolean;
  puzzleResolved: boolean;
}): RoomInteractionMode {
  const { combatActive, gameplayFocusStep, hasActivePuzzle, puzzleResolved } = args;

  if (combatActive) return "combat";
  if (gameplayFocusStep === "pressure") return "threshold";

  const unresolvedPuzzle = hasActivePuzzle && !puzzleResolved;

  if (unresolvedPuzzle) {
    if (gameplayFocusStep === "map") return "navigation";
    return "trial";
  }

  if (gameplayFocusStep === "map") return "navigation";
  return "command";
}

export function deriveGameplayPermissions(args: {
  showGameplay: boolean;
  allowGameplay: boolean;
  gameplayFocusStep: GameplayFocusStep;
  roomInteractionMode: RoomInteractionMode;
}): {
  gameplayAllowsPressure: boolean;
  gameplayAllowsMap: boolean;
  gameplayAllowsAction: boolean;
} {
  const { showGameplay, allowGameplay, gameplayFocusStep, roomInteractionMode } = args;

  const gameplayAllowsPressure = showGameplay && allowGameplay;

  const gameplayAllowsMap =
    gameplayAllowsPressure &&
    (gameplayFocusStep === "map" ||
      gameplayFocusStep === "puzzle" ||
      gameplayFocusStep === "action");

  const gameplayAllowsAction =
    gameplayAllowsPressure &&
    gameplayFocusStep === "action" &&
    roomInteractionMode === "command";

  return {
    gameplayAllowsPressure,
    gameplayAllowsMap,
    gameplayAllowsAction,
  };
}

export function deriveChapterState(args: {
  dmMode: any;
  tableAccepted: boolean;
  partyCanonicalExists: boolean;
  showInitialTable: boolean;
  dungeonDescentConfirmed: boolean;
}) {
  const {
    dmMode,
    tableAccepted,
    partyCanonicalExists,
    showInitialTable,
    dungeonDescentConfirmed,
  } = args;

  const doneMode = dmMode !== null;
  const doneTable = tableAccepted;
  const doneParty = partyCanonicalExists;
  const doneDescent = dungeonDescentConfirmed;

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
    pressure: doneTable && doneParty && doneDescent ? ("open" as const) : ("locked" as const),
    map: doneTable && doneParty && doneDescent ? ("open" as const) : ("locked" as const),
    combat: doneTable && doneParty && doneDescent ? ("open" as const) : ("locked" as const),
    action: doneTable && doneParty && doneDescent ? ("open" as const) : ("locked" as const),
    resolution: doneTable && doneParty && doneDescent ? ("open" as const) : ("locked" as const),
    canon: doneTable && doneParty && doneDescent ? ("open" as const) : ("locked" as const),
    ledger: doneTable && doneParty && doneDescent ? ("open" as const) : ("locked" as const),
  };
}
