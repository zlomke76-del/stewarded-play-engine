// lib/game/deriveGameState.ts
import type { SessionEvent } from "@/lib/session/SessionState";

export type Stats = {
  STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number;
};

export type Character = {
  actorId: string;
  name: string;
  stats: Stats;
  hpMax: number;
  hp: number;
  ac: number;
};

export type Entity = {
  entityId: string;
  kind: "monster" | "npc";
  name: string;
  hpMax: number;
  hp: number;
  ac: number;
  tags: string[];
};

export type GameState = {
  rngSeed: string | null;
  characters: Record<string, Character>;
  entities: Record<string, Entity>;
  lastRollIndex: number; // highest seen index (for deterministic next roll)
};

function isNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

export function deriveGameState(events: readonly SessionEvent[]): GameState {
  const state: GameState = {
    rngSeed: null,
    characters: {},
    entities: {},
    lastRollIndex: -1,
  };

  for (const e of events) {
    switch (e.type) {
      case "RNG_SEEDED": {
        const seed = e.payload["seed"];
        if (typeof seed === "string") state.rngSeed = seed;
        break;
      }

      case "CHARACTER_CREATED": {
        const actorId = e.payload["actorId"];
        const name = e.payload["name"];
        const stats = e.payload["stats"];
        const hpMax = e.payload["hpMax"];
        const ac = e.payload["ac"];

        if (typeof actorId !== "string" || typeof name !== "string") break;
        if (typeof stats !== "object" || stats === null) break;
        if (!isNum(hpMax) || !isNum(ac)) break;

        // Basic stats extraction with defaults
        const s = stats as any;
        const parsedStats = {
          STR: Number(s.STR ?? 10),
          DEX: Number(s.DEX ?? 10),
          CON: Number(s.CON ?? 10),
          INT: Number(s.INT ?? 10),
          WIS: Number(s.WIS ?? 10),
          CHA: Number(s.CHA ?? 10),
        };

        state.characters[actorId] = {
          actorId,
          name,
          stats: parsedStats,
          hpMax,
          hp: hpMax,
          ac,
        };
        break;
      }

      case "ENTITY_SPAWNED": {
        const entityId = e.payload["entityId"];
        const kind = e.payload["kind"];
        const name = e.payload["name"];
        const hpMax = e.payload["hpMax"];
        const ac = e.payload["ac"];
        const tags = e.payload["tags"];

        if (typeof entityId !== "string") break;
        if (kind !== "monster" && kind !== "npc") break;
        if (typeof name !== "string") break;
        if (!isNum(hpMax) || !isNum(ac)) break;

        state.entities[entityId] = {
          entityId,
          kind,
          name,
          hpMax,
          hp: hpMax,
          ac,
          tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [],
        };
        break;
      }

      case "ROLL_RECORDED": {
        const idx = e.payload["rngIndex"];
        if (isNum(idx)) state.lastRollIndex = Math.max(state.lastRollIndex, idx);
        break;
      }

      case "DAMAGE_APPLIED": {
        const targetId = e.payload["targetId"];
        const hpAfter = e.payload["hpAfter"];

        if (typeof targetId !== "string" || !isNum(hpAfter)) break;

        // Target can be character or entity
        if (state.characters[targetId]) {
          state.characters[targetId] = { ...state.characters[targetId], hp: hpAfter };
        } else if (state.entities[targetId]) {
          state.entities[targetId] = { ...state.entities[targetId], hp: hpAfter };
        }
        break;
      }

      default:
        break;
    }
  }

  return state;
}
