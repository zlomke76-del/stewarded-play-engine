// lib/dungeon/puzzles/PuzzleRegistry.ts
// ------------------------------------------------------------
// Echoes of Fate — Puzzle Registry
// ------------------------------------------------------------
// Purpose:
// - Define canonical puzzle metadata
// - Keep puzzle placement / compatibility deterministic
// - Expose puzzle lookup helpers for runtime + UI
// ------------------------------------------------------------

import type { FloorDepth, PuzzleId } from "@/lib/dungeon/FloorState";
import type { RoomType } from "@/lib/dungeon/RoomTypes";
import type { PuzzleDefinition } from "@/lib/dungeon/puzzles/PuzzleState";
import { resolvePuzzleAttempt } from "@/lib/dungeon/puzzles/PuzzleResolver";

const REGISTRY: Record<PuzzleId, Omit<PuzzleDefinition, "resolve">> = {
  whispering_anvil: {
    id: "whispering_anvil",
    label: "The Whispering Anvil",
    roomTypes: ["armory", "forge_chamber", "storage"],
    floorDepths: [0],
    shortDescription:
      "A ruined forge test where the player strikes an anvil while declaring a sacrifice.",
    prompt:
      "Strike the anvil and declare a single word that names what you are willing to sacrifice.",
    oneLineHint:
      "The room responds to named intent, not noise.",
    supportsRepeatAttempt: false,
  },

  mirror_of_regrets: {
    id: "mirror_of_regrets",
    label: "The Mirror of Unspoken Regrets",
    roomTypes: ["shrine", "rest_site", "ritual_chamber", "trial_chamber"],
    floorDepths: [0, -1, -2],
    shortDescription:
      "A confessional puzzle that judges whether the player offers a sincere regret.",
    prompt:
      "Speak a genuine regret tied to what you have already done in the dungeon.",
    oneLineHint:
      "The mirror wants honesty, not theater.",
    supportsRepeatAttempt: true,
  },

  pressure_gauges: {
    id: "pressure_gauges",
    label: "The Pressure Gauges",
    roomTypes: ["corridor", "guard_post", "sentinel_hall", "gate_hall"],
    floorDepths: [0, -1, -2],
    shortDescription:
      "A sequencing puzzle built around symbols, order, and simulated multi-point pressure.",
    prompt:
      "Declare the plate order and how you will cover or trigger each symbol in sequence.",
    oneLineHint:
      "The order matters, and one pair of feet is not enough without creativity.",
    supportsRepeatAttempt: true,
  },

  singing_chains: {
    id: "singing_chains",
    label: "The Singing Chains",
    roomTypes: ["corridor", "ritual_chamber", "sentinel_hall", "gate_hall"],
    floorDepths: [0, -1],
    shortDescription:
      "A sound-memory room where the player must reproduce a buried martial melody.",
    prompt:
      "Describe how you strike the chains and in what pattern you attempt the melody.",
    oneLineHint:
      "Listen before you answer.",
    supportsRepeatAttempt: true,
  },

  vault_of_unchosen_paths: {
    id: "vault_of_unchosen_paths",
    label: "The Vault of Unchosen Paths",
    roomTypes: ["relic_vault", "treasure_room", "trial_chamber", "relic_chamber"],
    floorDepths: [-1, -2],
    shortDescription:
      "A branching sacrifice-choice puzzle where one future ally is risked against another path.",
    prompt:
      "Choose a door and declare which future companion you are willing to lose if you are wrong.",
    oneLineHint:
      "The room values commitment more than cleverness.",
    supportsRepeatAttempt: false,
  },

  oathbound_gate: {
    id: "oathbound_gate",
    label: "The Oathbound Gate",
    roomTypes: ["trial_chamber", "gate_hall"],
    floorDepths: [-1],
    shortDescription:
      "A burden-sharing threshold that measures vow, cost, and willingness to carry consequence.",
    prompt:
      "State who bears the burden, or whether you refuse and force the gate instead.",
    oneLineHint:
      "No answer is free.",
    supportsRepeatAttempt: false,
  },
};

export const DUNGEON_PUZZLE_REGISTRY: Record<PuzzleId, PuzzleDefinition> =
  Object.fromEntries(
    Object.values(REGISTRY).map((definition) => [
      definition.id,
      {
        ...definition,
        resolve: resolvePuzzleAttempt,
      },
    ])
  ) as Record<PuzzleId, PuzzleDefinition>;

export function getPuzzleDefinition(puzzleId: PuzzleId): PuzzleDefinition {
  return DUNGEON_PUZZLE_REGISTRY[puzzleId];
}

export function listPuzzleDefinitions(): PuzzleDefinition[] {
  return Object.values(DUNGEON_PUZZLE_REGISTRY);
}

export function getPuzzlesForRoom(args: {
  roomType: RoomType;
  floorDepth: FloorDepth;
}): PuzzleDefinition[] {
  const { roomType, floorDepth } = args;

  return Object.values(DUNGEON_PUZZLE_REGISTRY).filter(
    (puzzle) =>
      puzzle.roomTypes.includes(roomType) &&
      puzzle.floorDepths.includes(floorDepth)
  );
}

export function isPuzzleCompatibleWithRoom(args: {
  puzzleId: PuzzleId;
  roomType: RoomType;
  floorDepth: FloorDepth;
}): boolean {
  const puzzle = getPuzzleDefinition(args.puzzleId);
  return (
    puzzle.roomTypes.includes(args.roomType) &&
    puzzle.floorDepths.includes(args.floorDepth)
  );
}
