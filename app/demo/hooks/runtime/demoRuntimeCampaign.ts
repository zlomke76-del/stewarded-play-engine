import type { DMMode, InitialTable } from "../../demoTypes";
import type { DemoSectionId } from "../../demoTypes";
import type { GameplayFocusStep, PartyDeclaredPayload } from "./demoRuntimeTypes";
import {
  buildStarterMember,
  defaultParty,
} from "./demoRuntimeParty";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function syncPartyDraftFromMode(args: {
  dmMode: DMMode | null;
  partyCanonical: PartyDeclaredPayload | null;
  setPartyDraft: SetState<PartyDeclaredPayload | null>;
}) {
  const { dmMode, partyCanonical, setPartyDraft } = args;

  if (dmMode === null) return;

  if (partyCanonical) {
    setPartyDraft((prev) => prev ?? partyCanonical);
    return;
  }

  setPartyDraft((prev) => {
    if (prev) {
      return {
        ...prev,
        members:
          (prev.members ?? []).slice(0, 1).length > 0
            ? (prev.members ?? []).slice(0, 1)
            : defaultParty().members,
      };
    }

    return defaultParty();
  });
}

export function resetChronicleGateForModeChange(args: {
  dmMode: DMMode | null;
  setTableAccepted: SetState<boolean>;
  setEnteredDungeonState: SetState<boolean>;
  setDungeonDescentConfirmed: SetState<boolean>;
  setGameplayFocusStep: SetState<GameplayFocusStep>;
}) {
  const {
    dmMode,
    setTableAccepted,
    setEnteredDungeonState,
    setDungeonDescentConfirmed,
    setGameplayFocusStep,
  } = args;

  if (dmMode === null) return;

  setTableAccepted(false);
  setEnteredDungeonState(false);
  setDungeonDescentConfirmed(false);
  setGameplayFocusStep("pressure");
}

export function createEnteredDungeonSetter(args: {
  tableAccepted: boolean;
  partyCanonicalExists: boolean;
  setEnteredDungeonState: SetState<boolean>;
  setDungeonDescentConfirmed: SetState<boolean>;
  setGameplayFocusStep: SetState<GameplayFocusStep>;
  setActiveSection: SetState<DemoSectionId>;
}) {
  const {
    tableAccepted,
    partyCanonicalExists,
    setEnteredDungeonState,
    setDungeonDescentConfirmed,
    setGameplayFocusStep,
    setActiveSection,
  } = args;

  return function setEnteredDungeon(next: boolean) {
    setEnteredDungeonState(next);

    if (!next) {
      setDungeonDescentConfirmed(false);
      return;
    }

    if (tableAccepted && partyCanonicalExists) {
      setDungeonDescentConfirmed(true);
      setGameplayFocusStep("pressure");
      setActiveSection("pressure");
    }
  };
}

export function createBeginDungeonDescent(args: {
  setEnteredDungeonState: SetState<boolean>;
  setDungeonDescentConfirmed: SetState<boolean>;
  setGameplayFocusStep: SetState<GameplayFocusStep>;
  setActiveSection: SetState<DemoSectionId>;
}) {
  const {
    setEnteredDungeonState,
    setDungeonDescentConfirmed,
    setGameplayFocusStep,
    setActiveSection,
  } = args;

  return function beginDungeonDescent() {
    setEnteredDungeonState(true);
    setDungeonDescentConfirmed(true);
    setGameplayFocusStep("pressure");
    setActiveSection("pressure");
  };
}

export function createEnterDungeon(args: {
  canEnterDungeon: boolean;
  playIntro: () => void;
  setEnteredDungeonState: SetState<boolean>;
  setDungeonDescentConfirmed: SetState<boolean>;
  setActiveSection: SetState<DemoSectionId>;
}) {
  const {
    canEnterDungeon,
    playIntro,
    setEnteredDungeonState,
    setDungeonDescentConfirmed,
    setActiveSection,
  } = args;

  return function enterDungeon() {
    if (!canEnterDungeon) return;
    playIntro();
    setEnteredDungeonState(true);
    setDungeonDescentConfirmed(false);
    setActiveSection("table");
  };
}

export function ensureInitialTable(args: {
  initialTable: InitialTable | null;
  setInitialTable: SetState<InitialTable | null>;
  generateInitialTable: () => InitialTable;
}) {
  const { initialTable, setInitialTable, generateInitialTable } = args;
  if (initialTable) return;
  setInitialTable(generateInitialTable());
}

export function syncRenderedNarrationToDraft(args: {
  initialTable: InitialTable | null;
  renderedTableNarration: string;
  tableDraftText: string;
  setTableDraftText: SetState<string>;
}) {
  const { initialTable, renderedTableNarration, tableDraftText, setTableDraftText } = args;
  if (!initialTable) return;
  if (tableDraftText.trim() === "") {
    setTableDraftText(renderedTableNarration);
  }
}

export function setSoloPartySize(
  setPartyDraft: SetState<PartyDeclaredPayload | null>,
  _nextCount: number
) {
  setPartyDraft((prev) => {
    const base = prev ?? defaultParty();
    const first = (base.members ?? [buildStarterMember(0)])[0] ?? buildStarterMember(0);

    return {
      ...base,
      members: [{ ...first }],
    };
  });
}
