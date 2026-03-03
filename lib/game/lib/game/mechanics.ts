// lib/game/mechanics.ts
import type { SessionEvent } from "@/lib/session/SessionState";
import type { GameState } from "@/lib/game/deriveGameState";
import { rollDieFromSeed } from "@/lib/game/rng";

export type ProposedResolution = {
  summary: string;
  eventsToCommit: SessionEvent[];
  // For UI explainability
  details: {
    kind: "attack";
    actorId: string;
    targetId: string;
    die: "d20";
    natural: number;
    modifier: number;
    total: number;
    targetAc: number;
    hit: boolean;
    damage: number;
    hpBefore: number;
    hpAfter: number;
    rngIndex: number;
  };
};

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proposeAttack(opts: {
  now: number;
  actorId: string;
  targetId: string;
  intentText: string;
  state: GameState;
}): ProposedResolution {
  const actor = opts.state.characters[opts.actorId];
  const target =
    opts.state.entities[opts.targetId] ?? opts.state.characters[opts.targetId];

  if (!actor) {
    throw new Error(`Unknown actorId: ${opts.actorId}`);
  }
  if (!target) {
    throw new Error(`Unknown targetId: ${opts.targetId}`);
  }
  if (!opts.state.rngSeed) {
    throw new Error(`RNG not seeded (missing RNG_SEEDED event)`);
  }

  const rngIndex = opts.state.lastRollIndex + 1;
  const { natural } = rollDieFromSeed({
    seed: opts.state.rngSeed,
    index: rngIndex,
    sides: 20,
  });

  const modifier = abilityMod(actor.stats.STR); // v1: STR-based melee
  const total = natural + modifier;
  const targetAc = target.ac;
  const hit = total >= targetAc;

  // v1 damage: 1d8 + STR mod (min 1)
  const dmgIndex = rngIndex + 1;
  const dmgRoll = rollDieFromSeed({
    seed: opts.state.rngSeed,
    index: dmgIndex,
    sides: 8,
  }).natural;

  const rawDamage = hit ? dmgRoll + modifier : 0;
  const damage = hit ? Math.max(1, rawDamage) : 0;

  const hpBefore = target.hp;
  const hpAfter = Math.max(0, hpBefore - damage);

  const rollId = crypto.randomUUID();
  const now = opts.now;

  const events: SessionEvent[] = [
    {
      id: crypto.randomUUID(),
      timestamp: now,
      actor: opts.actorId,
      type: "ACTION_DECLARED",
      payload: {
        actorId: opts.actorId,
        action: { kind: "attack", targetId: opts.targetId, intentText: opts.intentText },
      },
    },
    {
      id: crypto.randomUUID(),
      timestamp: now,
      actor: "system",
      type: "ROLL_RECORDED",
      payload: {
        rollId,
        die: "d20",
        natural,
        modifiers: [{ name: "STR", value: modifier }],
        total,
        dcOrAc: targetAc,
        rngIndex,
        source: "solace",
      },
    },
    {
      id: crypto.randomUUID(),
      timestamp: now,
      actor: "system",
      type: "ATTACK_RESOLVED",
      payload: {
        actorId: opts.actorId,
        targetId: opts.targetId,
        rollId,
        hit,
      },
    },
  ];

  if (hit) {
    events.push(
      {
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "system",
        type: "ROLL_RECORDED",
        payload: {
          rollId: crypto.randomUUID(),
          die: "d8",
          natural: dmgRoll,
          modifiers: [{ name: "STR", value: modifier }],
          total: dmgRoll + modifier,
          dcOrAc: null,
          rngIndex: dmgIndex,
          source: "solace",
        },
      },
      {
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "system",
        type: "DAMAGE_APPLIED",
        payload: {
          targetId: opts.targetId,
          amount: damage,
          hpBefore,
          hpAfter,
          damageType: "physical",
        },
      }
    );
  }

  const summary = hit
    ? `Hit (${total} vs AC ${targetAc}) for ${damage} damage.`
    : `Miss (${total} vs AC ${targetAc}).`;

  return {
    summary,
    eventsToCommit: events,
    details: {
      kind: "attack",
      actorId: opts.actorId,
      targetId: opts.targetId,
      die: "d20",
      natural,
      modifier,
      total,
      targetAc,
      hit,
      damage,
      hpBefore,
      hpAfter,
      rngIndex,
    },
  };
}
