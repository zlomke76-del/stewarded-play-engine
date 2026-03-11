// lib/dungeon/puzzles/PuzzleState.ts
// ------------------------------------------------------------
// Echoes of Fate — Puzzle State Types
// ------------------------------------------------------------
// Purpose:
// - Define typed puzzle runtime inputs / outputs
// - Keep puzzle resolution deterministic and isolated from UI
// - Provide a clean bridge into canon/event writing later
// ------------------------------------------------------------

import type { RoomType } from "@/lib/dungeon/RoomTypes";
import type { DungeonRoom, FloorDepth, PuzzleId } from "@/lib/dungeon/FloorState";

export type PuzzleAttemptInput = {
  actorId?: string | null;
  actorName?: string | null;
  floorId: string;
  floorDepth: FloorDepth;
  roomId: string;
  roomLabel?: string | null;
  roomType: RoomType;
  puzzleId: PuzzleId;
  inputText: string;
  rngSeed?: string | null;
  knownCanon?: readonly PuzzleCanonRecord[];
};

export type PuzzleCanonRecord =
  | {
      type: "puzzle_resolved";
      puzzleId: PuzzleId;
      floorId: string;
      roomId: string;
      success: boolean;
      timestamp?: number;
      details?: Record<string, unknown>;
    }
  | {
      type: "trait_gained";
      traitId: string;
      label: string;
      details?: Record<string, unknown>;
    }
  | {
      type: "trait_lost";
      traitId: string;
      label: string;
      details?: Record<string, unknown>;
    }
  | {
      type: "companion_lock";
      companionTag: string;
      reason: string;
      details?: Record<string, unknown>;
    }
  | {
      type: "resource_change";
      resource: string;
      delta: number;
      details?: Record<string, unknown>;
    };

export type PuzzleSuggestedEvent =
  | {
      type: "PUZZLE_DISCOVERED";
      payload: Record<string, unknown>;
    }
  | {
      type: "PUZZLE_ATTEMPTED";
      payload: Record<string, unknown>;
    }
  | {
      type: "PUZZLE_RESOLVED";
      payload: Record<string, unknown>;
    }
  | {
      type: "PUZZLE_REWARD_GRANTED";
      payload: Record<string, unknown>;
    }
  | {
      type: "PUZZLE_CONSEQUENCE_APPLIED";
      payload: Record<string, unknown>;
    };

export type PuzzleResolutionEffect =
  | {
      kind: "grant_trait";
      traitId: string;
      label: string;
      description: string;
      value?: number;
    }
  | {
      kind: "apply_penalty";
      penaltyId: string;
      label: string;
      description: string;
      value?: number;
      duration?: "room" | "floor" | "run" | "permanent";
    }
  | {
      kind: "lock_companion_path";
      companionTag: string;
      label: string;
      description: string;
    }
  | {
      kind: "set_echo_flag";
      flag: string;
      value: string | number | boolean;
      description: string;
    }
  | {
      kind: "modify_pressure";
      delta: number;
      description: string;
    }
  | {
      kind: "modify_awareness";
      delta: number;
      description: string;
    }
  | {
      kind: "grant_resource";
      resource: string;
      delta: number;
      description: string;
    };

export type PuzzleResolution = {
  ok: boolean;
  puzzleId: PuzzleId;
  title: string;
  summary: string;
  success: boolean;
  score?: number;
  parsedIntent?: Record<string, unknown>;
  narration: string[];
  effects: PuzzleResolutionEffect[];
  canon: PuzzleCanonRecord[];
  suggestedEvents: PuzzleSuggestedEvent[];
};

export type PuzzleDefinition = {
  id: PuzzleId;
  label: string;
  roomTypes: RoomType[];
  floorDepths: FloorDepth[];
  shortDescription: string;
  prompt: string;
  oneLineHint: string;
  supportsRepeatAttempt: boolean;
  resolve: (input: PuzzleAttemptInput) => PuzzleResolution;
};

export type ActivePuzzleContext = {
  room: DungeonRoom;
  floorId: string;
  floorDepth: FloorDepth;
  puzzleId: PuzzleId;
  prompt: string;
  hint: string;
};
