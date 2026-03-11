import type { DiceMode, RollSource } from "../../demoTypes";
import { inferOptionKind } from "../../demoUtils";
import { appendEventToState } from "./demoRuntimeUtils";
import { commitDungeonTraversalBundle } from "./demoRuntimeTraversal";

type HandleRecordArgs = {
  prevState: any;
  payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  };
  playerInput: string;
  selectedOptionDescription: string;
  location: {
    floorId: string;
    roomId: string;
  };
  currentRoom: any;
  reachableConnections: any[];
  dungeon: any;
  openedDoorIds: string[];
  unlockedDoorIds: string[];
};

type HandleOutcomeOnlyArgs = {
  prevState: any;
  payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  };
  location: {
    floorId: string;
    roomId: string;
  };
};

export function deriveOutcomeSuccess(payload: {
  dice?: { roll?: number; dc?: number } | null;
}) {
  const roll = Number(payload?.dice?.roll);
  const dc = Number(payload?.dice?.dc);

  return Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;
}

export function commitResolvedActionToState(args: HandleRecordArgs) {
  const {
    prevState,
    payload,
    playerInput,
    selectedOptionDescription,
    location,
    currentRoom,
    reachableConnections,
    dungeon,
    openedDoorIds,
    unlockedDoorIds,
  } = args;

  const combinedText = `${playerInput}\n${selectedOptionDescription}`.trim();
  const kind = inferOptionKind(
    combinedText.length ? combinedText : selectedOptionDescription
  );
  const success = deriveOutcomeSuccess(payload);

  const enrichedOutcome = {
    ...payload,
    meta: {
      ...(payload as any)?.meta,
      optionKind: kind,
      optionDescription: selectedOptionDescription,
      intent: playerInput,
      floorId: location.floorId,
      roomId: location.roomId,
      success,
    },
  };

  let next = appendEventToState(prevState, "OUTCOME", enrichedOutcome as any);

  const pressureDelta =
    kind === "contested"
      ? success
        ? 5
        : 11
      : kind === "risky"
        ? success
          ? 4
          : 9
        : kind === "environmental"
          ? success
            ? 3
            : 7
          : success
            ? 2
            : 5;

  const awarenessDelta =
    kind === "contested"
      ? success
        ? 7
        : 14
      : kind === "risky"
        ? success
          ? 5
          : 11
        : kind === "environmental"
          ? success
            ? 2
            : 6
          : success
            ? 1
            : 4;

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

  next = commitDungeonTraversalBundle({
    prevState: next,
    success,
    selectedText: combinedText,
    currentRoom,
    reachableConnections,
    dungeon,
    floorId: location.floorId,
    roomId: location.roomId,
    openedDoorIds,
    unlockedDoorIds,
  });

  return next;
}

export function commitOutcomeOnlyToState(args: HandleOutcomeOnlyArgs) {
  const { prevState, payload, location } = args;

  const success = deriveOutcomeSuccess(payload);

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

  let next = appendEventToState(prevState, "OUTCOME", enrichedOutcome as any);

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
}
