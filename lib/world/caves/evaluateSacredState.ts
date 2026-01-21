import type { CaveGraph } from "./WindscarCave";

export function evaluateSacredState(
  cave: CaveGraph
): boolean {
  return Object.values(cave.nodes).every(
    (n) =>
      n.structuralState === "collapsed" ||
      n.structuralState === "blocked"
  );
}
