// ------------------------------------------------------------
// Cave State Evolution Logic
// ------------------------------------------------------------

import { CaveNodeState } from "./WindscarCave";

type CaveContext = {
  caveId: string;
  nodeId: string;
  currentState: CaveNodeState;
  traits: string[];
};

type EvolutionSignals = {
  fireUsed: boolean;
  successfulHunt: boolean;
  rested: boolean;
  turn: number;
};

export function evolveCaveState(
  cave: CaveContext,
  signals: EvolutionSignals
): CaveNodeState {
  const { currentState } = cave;

  // Sacred is terminal
  if (currentState === "sacred") return "sacred";

  // used → smoked
  if (
    currentState === "used" &&
    signals.fireUsed
  ) {
    return "smoked";
  }

  // smoked → sacred
  if (
    currentState === "smoked" &&
    signals.successfulHunt &&
    signals.rested
  ) {
    return "sacred";
  }

  return currentState;
}
