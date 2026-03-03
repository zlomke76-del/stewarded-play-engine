// lib/game/rng.ts
// Deterministic RNG for replayability + mods.
// Roll outcomes are derived from (seed, index).

export type RngSeed = string;

function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollDieFromSeed(opts: {
  seed: RngSeed;
  index: number; // increments per roll
  sides: number; // e.g. 20
}): { natural: number; index: number } {
  const base = fnv1a32(`${opts.seed}#${opts.index}#d${opts.sides}`);
  const rnd = mulberry32(base)();
  const natural = Math.floor(rnd * opts.sides) + 1; // 1..sides
  return { natural, index: opts.index };
}
