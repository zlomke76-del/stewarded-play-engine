"use client";

// components/combat/EnemyTurnResolverPanel.tsx
// ------------------------------------------------------------
// EnemyTurnResolverPanel (V1 + Damage Draft)
// ------------------------------------------------------------
// In Solace Neutral Facilitator mode, enemies are driven by Solace.
// This panel:
// - chooses an enemy action (V1 heuristic)
// - plays suspense steps (declare → telegraph → roll → reveal → commit)
// - does NOT write canon directly; it calls parent callbacks
//
// Damage logic (added):
// - On hit (d20 >= DC), we roll damage using a simple D&D-like dice profile per archetype.
// - We DO NOT mutate party HP here (authority stays with arbiter + canon).
// - We attach structured damage info to the OUTCOME payload (payload.meta.damageDraft)
//   so the parent can later emit canonical DAMAGE_APPLIED / PLAYER_DOWNED, etc.
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "@/components/layout/CardSection";

type Step = "idle" | "declared" | "telegraph" | "rolled" | "revealed";

type OutcomePayload = {
  description: string;
  dice: { mode: "d20"; roll: number; dc: number; source: "solace" };
  audit: string[];
  meta?: {
    damageDraft?: {
      enemyGroupId: string | null;
      enemyGroupName: string;
      targetName: string;
      hit: boolean;
      dc: number;
      attackRoll: number;
      damage: {
        dice: string; // e.g. "1d6+1"
        amount: number; // 0 if miss
        kind: "piercing" | "slashing" | "bludgeoning" | "force" | "psychic" | "fire" | "mixed";
      } | null;
      downedRule: "Downed when HP reaches 0";
      injuryRule: "On downed: apply 1 injury stack; each stack is -2 on d20 checks";
    };
  };
};

type TelegraphInfo = {
  enemyName: string;
  targetName: string;
  attackStyleHint: "volley" | "beam" | "charge" | "unknown";
};

type Props = {
  enabled: boolean; // true only when (dmMode === "solace-neutral" && combatActive && isEnemyTurn)
  activeEnemyGroupName: string | null;
  activeEnemyGroupId: string | null;

  // for targeting text (optional)
  playerNames: string[]; // resolved names: ["Rune", "Orin", ...] for active players

  // Theater trigger (parent can increment a nonce)
  onTelegraph: (info: TelegraphInfo) => void;

  // Parent commits OUTCOME (arbiter commit) and advances the turn pointer
  onCommitOutcome: (payload: OutcomePayload) => void;
  onAdvanceTurn: () => void;
};

function randInt(minIncl: number, maxIncl: number) {
  const span = maxIncl - minIncl + 1;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return minIncl + (buf[0] % span);
}

function pick<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[randInt(0, arr.length - 1)];
}

function archetypeFor(name: string | null) {
  const s = String(name ?? "").toLowerCase();
  if (s.includes("archer")) return "archers";
  if (s.includes("brute")) return "brutes";
  if (s.includes("shield")) return "shields";
  if (s.includes("stalker")) return "stalkers";
  if (s.includes("caster")) return "casters";
  if (s.includes("drone")) return "drones";
  if (s.includes("sentr")) return "sentries";
  if (s.includes("wraith")) return "wraiths";
  if (s.includes("grid")) return "grid_knights";
  if (s.includes("firewall")) return "firewall_wardens";
  if (s.includes("hound")) return "neon_hounds";
  if (s.includes("skirm")) return "skirmishers";
  return "unknown";
}

function attackHintFor(enemyName: string) {
  const a = archetypeFor(enemyName);
  switch (a) {
    case "archers":
    case "sentries":
      return "volley" as const;
    case "casters":
    case "firewall_wardens":
      return "beam" as const;
    case "brutes":
    case "grid_knights":
    case "neon_hounds":
    case "skirmishers":
      return "charge" as const;
    default:
      return "unknown" as const;
  }
}

function buildEnemyIntent(enemyName: string, targetName: string) {
  const a = archetypeFor(enemyName);

  switch (a) {
    case "archers":
      return `The ${enemyName} loose a coordinated volley at ${targetName}.`;
    case "brutes":
      return `The ${enemyName} charge and attempt to smash ${targetName} to the ground.`;
    case "shields":
      return `The ${enemyName} advance behind cover, trying to pin ${targetName} in place.`;
    case "stalkers":
      return `The ${enemyName} vanish into shadow and strike at ${targetName} from an angle.`;
    case "casters":
      return `The ${enemyName} weave a spell and hurl force toward ${targetName}.`;
    case "drones":
      return `The ${enemyName} align and fire a synchronized burst at ${targetName}.`;
    case "sentries":
      return `The ${enemyName} lock on and fire a precision shot at ${targetName}.`;
    case "wraiths":
      return `The ${enemyName} phase through the air and lash out at ${targetName}.`;
    case "grid_knights":
      return `The ${enemyName} step in formation and execute a disciplined strike on ${targetName}.`;
    case "firewall_wardens":
      return `The ${enemyName} project a burning barrier and drive it into ${targetName}.`;
    case "neon_hounds":
      return `The ${enemyName} sprint and snap at ${targetName}, testing defenses.`;
    case "skirmishers":
      return `The ${enemyName} dart forward and harry ${targetName} with quick attacks.`;
    default:
      return `The ${enemyName} press the attack against ${targetName}.`;
  }
}

function defaultDC(enemyName: string) {
  const a = archetypeFor(enemyName);
  switch (a) {
    case "archers":
    case "sentries":
      return 13;
    case "stalkers":
    case "wraiths":
      return 14;
    case "brutes":
    case "grid_knights":
      return 12;
    case "casters":
    case "firewall_wardens":
      return 15;
    default:
      return 12;
  }
}

// ----------------------------
// Damage profiles (D&D-ish)
// ----------------------------

type DamageProfile = {
  count: number;
  sides: number;
  bonus: number;
  kind: OutcomePayload["meta"] extends { damageDraft?: any }
    ? NonNullable<NonNullable<OutcomePayload["meta"]>["damageDraft"]>["damage"]["kind"]
    : "mixed";
};

// Keep conservative early-game numbers (party HP ~12)
// so a single hit hurts but doesn’t auto-delete.
function damageProfileFor(enemyName: string): DamageProfile {
  const a = archetypeFor(enemyName);
  switch (a) {
    case "archers":
    case "sentries":
      return { count: 1, sides: 6, bonus: 1, kind: "piercing" };
    case "brutes":
    case "grid_knights":
    case "neon_hounds":
      return { count: 1, sides: 8, bonus: 1, kind: "bludgeoning" };
    case "stalkers":
    case "skirmishers":
      return { count: 1, sides: 6, bonus: 2, kind: "slashing" };
    case "casters":
      return { count: 1, sides: 8, bonus: 0, kind: "force" };
    case "firewall_wardens":
      return { count: 1, sides: 8, bonus: 0, kind: "fire" };
    case "wraiths":
      return { count: 1, sides: 6, bonus: 1, kind: "psychic" };
    case "shields":
      // shields are “control” oriented; lower damage
      return { count: 1, sides: 4, bonus: 1, kind: "bludgeoning" };
    default:
      return { count: 1, sides: 6, bonus: 0, kind: "mixed" };
  }
}

function rollDamage(profile: DamageProfile): { amount: number; dice: string } {
  const { count, sides, bonus } = profile;
  let total = 0;
  for (let i = 0; i < Math.max(1, Math.trunc(count)); i++) {
    total += randInt(1, Math.max(2, Math.trunc(sides)));
  }
  total += Math.trunc(bonus);
  const dice = `${count}d${sides}${bonus === 0 ? "" : bonus > 0 ? `+${bonus}` : `${bonus}`}`;
  return { amount: Math.max(0, total), dice };
}

function outcomeTextWithDamage(
  enemyName: string,
  targetName: string,
  roll: number,
  dc: number,
  damageText: string | null
) {
  const hit = roll >= dc;

  const a = archetypeFor(enemyName);
  if (a === "archers") {
    return hit
      ? `Arrows hiss through the torchlight — one finds ${targetName}${damageText ? ` (${damageText}).` : "."}`
      : `A volley of arrows clatters off stone — ${targetName} ducks behind cover.`;
  }

  if (a === "casters") {
    return hit
      ? `The air snaps with force — ${targetName} is struck mid-step${damageText ? ` (${damageText}).` : "."}`
      : `The spell fractures against the dungeon’s damp air — it fizzles wide.`;
  }

  return hit
    ? `The attack lands — ${targetName} is forced back${damageText ? ` (${damageText}).` : "."}`
    : `The attack misses — ${targetName} holds their ground.`;
}

export default function EnemyTurnResolverPanel({
  enabled,
  activeEnemyGroupName,
  activeEnemyGroupId,
  playerNames,
  onTelegraph,
  onCommitOutcome,
  onAdvanceTurn,
}: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [declared, setDeclared] = useState<string>("");
  const [roll, setRoll] = useState<number | null>(null);
  const [dc, setDC] = useState<number>(12);
  const [reveal, setReveal] = useState<string>("");

  const timers = useRef<number[]>([]);

  // Store the current “turn draft” in refs so suspense steps don’t suffer stale closures.
  const draftRef = useRef<{
    enemyName: string | null;
    targetName: string;
    dc: number;
    roll: number | null;
    hit: boolean;
    damage: { amount: number; dice: string; kind: DamageProfile["kind"] } | null;
  }>({
    enemyName: null,
    targetName: "the party",
    dc: 12,
    roll: null,
    hit: false,
    damage: null,
  });

  const enemyName = activeEnemyGroupName ?? null;

  const targetName = useMemo(() => {
    const candidates = playerNames.filter((x) => String(x || "").trim().length > 0);
    return pick(candidates) ?? "the party";
  }, [playerNames]);

  // Reset when turn/enemy changes
  useEffect(() => {
    setStep("idle");
    setDeclared("");
    setRoll(null);
    setReveal("");
    if (enemyName) setDC(defaultDC(enemyName));

    draftRef.current = {
      enemyName,
      targetName,
      dc: enemyName ? defaultDC(enemyName) : 12,
      roll: null,
      hit: false,
      damage: null,
    };

    // clear timers
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, activeEnemyGroupId, activeEnemyGroupName, targetName]);

  function queue(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function begin() {
    if (!enabled || !enemyName) return;

    // clear timers before replaying
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    const intent = buildEnemyIntent(enemyName, targetName);
    const nextDC = defaultDC(enemyName);
    const hint = attackHintFor(enemyName);

    setDeclared(intent);
    setDC(nextDC);
    setRoll(null);
    setReveal("");
    setStep("declared");

    draftRef.current = {
      enemyName,
      targetName,
      dc: nextDC,
      roll: null,
      hit: false,
      damage: null,
    };

    // suspense beats
    queue(450, () => {
      setStep("telegraph");
      onTelegraph({
        enemyName,
        targetName,
        attackStyleHint: hint,
      });
    });

    queue(1250, () => {
      const r = randInt(1, 20);
      const hit = r >= nextDC;

      let dmg: { amount: number; dice: string; kind: DamageProfile["kind"] } | null = null;
      if (hit) {
        const prof = damageProfileFor(enemyName);
        const rolled = rollDamage(prof);
        dmg = { amount: rolled.amount, dice: rolled.dice, kind: prof.kind };
      }

      draftRef.current.roll = r;
      draftRef.current.hit = hit;
      draftRef.current.damage = dmg;

      setRoll(r);
      setStep("rolled");
    });

    queue(1750, () => {
      const r = draftRef.current.roll ?? randInt(1, 20);
      const hit = r >= nextDC;

      const dmg = hit ? draftRef.current.damage : null;
      const dmgText = dmg ? `damage ${dmg.amount} (${dmg.dice})` : null;

      const text = outcomeTextWithDamage(enemyName, targetName, r, nextDC, dmgText);
      setReveal(text);
      setStep("revealed");
    });
  }

  function commit() {
    if (!enabled || !enemyName) return;

    const r = draftRef.current.roll ?? roll ?? 0;
    const hit = r >= dc;
    const dmg = hit ? draftRef.current.damage : null;

    const payload: OutcomePayload = {
      description: `Enemy turn — ${enemyName}. ${reveal || "Outcome pending."}`,
      dice: { mode: "d20", roll: r, dc, source: "solace" },
      audit: [
        `enemy_group=${enemyName}`,
        `enemy_group_id=${activeEnemyGroupId ?? "null"}`,
        `target="${targetName}"`,
        `intent="${declared}"`,
        `dc=${dc}`,
        `roll=${r}`,
        `hit=${hit ? "true" : "false"}`,
        dmg ? `damage=${dmg.amount} (${dmg.dice}) kind=${dmg.kind}` : `damage=0 (miss)`,
        `downed_rule=HP<=0`,
        `injury_rule=+1 stack on downed; -2 per stack`,
        `note=V1 heuristic resolver + damage draft`,
      ],
      meta: {
        damageDraft: {
          enemyGroupId: activeEnemyGroupId ?? null,
          enemyGroupName: enemyName,
          targetName,
          hit,
          dc,
          attackRoll: r,
          damage: dmg
            ? {
                dice: dmg.dice,
                amount: dmg.amount,
                kind: dmg.kind,
              }
            : null,
          downedRule: "Downed when HP reaches 0",
          injuryRule: "On downed: apply 1 injury stack; each stack is -2 on d20 checks",
        },
      },
    };

    onCommitOutcome(payload);
    onAdvanceTurn();
  }

  if (!enabled) return null;

  return (
    <CardSection title="Enemy Turn (Solace Neutral)">
      <p className="muted" style={{ marginTop: 0 }}>
        Solace drives enemy intent and suspense. You only commit the outcome.
      </p>

      <div className="muted" style={{ marginBottom: 10 }}>
        Active enemy: <strong>{enemyName ?? "—"}</strong>
        {enemyName ? (
          <>
            {" "}
            · Target: <strong>{targetName}</strong> · DC <strong>{dc}</strong>
          </>
        ) : null}
      </div>

      {step === "idle" && (
        <button onClick={begin} disabled={!enemyName}>
          Begin Enemy Turn
        </button>
      )}

      {step !== "idle" && (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
              DECLARED INTENT
            </div>
            <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.10)" }}>
              {declared}
            </div>
          </div>

          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
              SUSPENSE
            </div>
            <div className="muted">
              {step === "declared" && "…you hear movement in the dark."}
              {step === "telegraph" && "…something draws a bead on you."}
              {step === "rolled" && `Roll: ${roll ?? "—"} vs DC ${dc}`}
              {step === "revealed" && reveal}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={begin}
              disabled={!enemyName || step === "telegraph" || step === "rolled" || step === "revealed"}
            >
              Replay Enemy Turn
            </button>

            <button onClick={commit} disabled={step !== "revealed"}>
              Commit Outcome + Advance Turn
            </button>
          </div>

          <div className="muted" style={{ fontSize: 11, opacity: 0.85 }}>
            Damage is drafted here (D&D-ish dice per archetype) but HP changes are not applied until the arbiter converts
            this into canon (e.g., DAMAGE_APPLIED / PLAYER_DOWNED).
          </div>
        </div>
      )}
    </CardSection>
  );
}
