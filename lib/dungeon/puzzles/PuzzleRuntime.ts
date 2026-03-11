// lib/dungeon/puzzles/PuzzleRuntime.ts
// ------------------------------------------------------------
// Echoes of Fate — Puzzle Runtime
// ------------------------------------------------------------
// Purpose:
// - Bridge dungeon rooms to the puzzle system
// - Resolve whether a room currently exposes an active puzzle
// - Provide a stable prompt/hint payload for UI/runtime
// - Route player input into the deterministic puzzle resolver
//
// Notes:
// - Pure module
// - No canon writes here
// - No mutation of runtime state
// ------------------------------------------------------------

import type { DungeonRoom, FloorDepth, PuzzleId } from "@/lib/dungeon/FloorState";
import type { RoomType } from "@/lib/dungeon/RoomTypes";
import {
  getPuzzleDefinition,
  isPuzzleCompatibleWithRoom,
} from "@/lib/dungeon/puzzles/PuzzleRegistry";
import type {
  ActivePuzzleContext,
  PuzzleAttemptInput,
  PuzzleResolution,
} from "@/lib/dungeon/puzzles/PuzzleState";

export type ResolveRoomPuzzleArgs = {
  room: DungeonRoom;
  floorId: string;
  floorDepth: FloorDepth;
};

export type RunRoomPuzzleArgs = {
  room: DungeonRoom;
  floorId: string;
  floorDepth: FloorDepth;
  actorId?: string | null;
  actorName?: string | null;
  inputText: string;
  rngSeed?: string | null;
  knownCanon?: PuzzleAttemptInput["knownCanon"];
};

function normalizeText(v: unknown): string {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function derivePuzzleIdFromStoryHint(storyHint?: string | null): PuzzleId | null {
  const text = normalizeText(storyHint).toLowerCase();
  if (!text) return null;

  const match = text.match(/\bpuzzle:([a-z_]+)\b/i)?.[1] ?? null;
  if (!match) return null;

  switch (match) {
    case "whispering_anvil":
    case "singing_chains":
    case "mirror_of_regrets":
    case "pressure_gauges":
    case "vault_of_unchosen_paths":
    case "oathbound_gate":
      return match;
    default:
      return null;
  }
}

export function resolveActiveRoomPuzzle(
  args: ResolveRoomPuzzleArgs
): ActivePuzzleContext | null {
  const { room, floorId, floorDepth } = args;

  const puzzleId = room.puzzleId ?? derivePuzzleIdFromStoryHint(room.storyHint);
  if (!puzzleId) return null;

  if (
    !isPuzzleCompatibleWithRoom({
      puzzleId,
      roomType: room.roomType as RoomType,
      floorDepth,
    })
  ) {
    return null;
  }

  const definition = getPuzzleDefinition(puzzleId);

  return {
    room,
    floorId,
    floorDepth,
    puzzleId,
    prompt: definition.prompt,
    hint: definition.oneLineHint,
  };
}

export function roomHasActivePuzzle(args: ResolveRoomPuzzleArgs): boolean {
  return resolveActiveRoomPuzzle(args) !== null;
}

export function getRoomPuzzlePrompt(
  args: ResolveRoomPuzzleArgs
): { puzzleId: PuzzleId; label: string; prompt: string; hint: string } | null {
  const active = resolveActiveRoomPuzzle(args);
  if (!active) return null;

  const definition = getPuzzleDefinition(active.puzzleId);

  return {
    puzzleId: active.puzzleId,
    label: definition.label,
    prompt: definition.prompt,
    hint: definition.oneLineHint,
  };
}

export function runRoomPuzzleAttempt(
  args: RunRoomPuzzleArgs
): PuzzleResolution {
  const active = resolveActiveRoomPuzzle({
    room: args.room,
    floorId: args.floorId,
    floorDepth: args.floorDepth,
  });

  if (!active) {
    return {
      ok: false,
      puzzleId:
        args.room.puzzleId ??
        derivePuzzleIdFromStoryHint(args.room.storyHint) ??
        "mirror_of_regrets",
      title: "No Active Puzzle",
      summary: "This room does not currently expose a playable puzzle.",
      success: false,
      narration: ["Nothing in this room is presently resolving as an active puzzle."],
      effects: [],
      canon: [],
      suggestedEvents: [],
      parsedIntent: {},
    };
  }

  const definition = getPuzzleDefinition(active.puzzleId);

  return definition.resolve({
    actorId: args.actorId ?? null,
    actorName: args.actorName ?? null,
    floorId: args.floorId,
    floorDepth: args.floorDepth,
    roomId: args.room.id,
    roomLabel: args.room.label,
    roomType: args.room.roomType,
    puzzleId: active.puzzleId,
    inputText: args.inputText,
    rngSeed: args.rngSeed ?? null,
    knownCanon: args.knownCanon ?? [],
  });
}

export function buildPuzzlePresentationBlock(
  args: ResolveRoomPuzzleArgs
): {
  title: string;
  description: string;
  prompt: string;
  hint: string;
} | null {
  const active = resolveActiveRoomPuzzle(args);
  if (!active) return null;

  const definition = getPuzzleDefinition(active.puzzleId);

  return {
    title: definition.label,
    description: definition.shortDescription,
    prompt: definition.prompt,
    hint: definition.oneLineHint,
  };
}
