"use client";

// components/combat/EnemyTurnResolverPanel.tsx
// ------------------------------------------------------------
// EnemyTurnResolverPanel (V1)
// ------------------------------------------------------------
// In Solace Neutral Facilitator mode, enemies are driven by Solace.
// This panel:
// - chooses an enemy action (V1 heuristic)
// - plays suspense steps (declare → telegraph → roll → reveal → commit)
// - does NOT write canon directly; it calls parent callbacks
//
// NOTE (type fix):
// A recent damage-kind expansion introduced values like "piercing".
// This file now defines DamageKind as a union that includes those,
// fixing the TS error: '"piercing"' is not assignable to type '"mixed"'.
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "@/components/layout/CardSection";

type Step = "idle" | "declared" | "telegraph" | "rolled" | "revealed";

// Expandable damage-kind vocabulary (kept small + RPG-obvious)
type DamageKind =
  | "mixed"
  | "piercing"
  | "slashing"
  | "bludgeoning"
  | "force"
  | "fire"
  | "cold"
  | "lightning"
  | "necrotic"
  | "psychic"
  | "poison"
  | "radiant";

type OutcomePayload = {
  description: string;
  dice: { mode: "d20"; roll: number; dc: number; source: "solace" };
  audit: string[];

  // Optional future-proofing: if your pipeline consumes structured damage,
  // keep it here as soft/optional metadata (parent may ignore).
  damage?: {
    roll: { count: number; sides: number; bonus: number };
    kind: DamageKind;
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

function outcomeText(enemyName: string, targetName: string, roll: number, dc: number) {
  const hit = roll >= dc;

  const a = archetypeFor(enemyName);
  if (a === "archers") {
    return hit
      ? `Arrows hiss through the torchlight — one finds ${targetName}.`
      : `A volley of arrows clatters off stone — ${targetName} ducks behind cover.`;
  }

  if (a === "casters") {
    return hit
      ? `The air snaps with force — ${targetName} is struck mid-step.`
      : `The spell fractures against the dungeon’s damp air — it fizzles wide.`;
  }

  return hit
    ? `The attack lands — ${targetName} is forced back.`
    : `The attack misses — ${targetName} holds their ground.`;
}

function damageProfileFor(enemyName: string): { count: number; sides: number; bonus: number; kind: DamageKind } {
  const a = archetypeFor(enemyName);
  switch (a) {
    case "archers":
    case "sentries":
      return { count: 1, sides: 6, bonus: 1, kind: "piercing" };
    case "brutes":
    case "grid_knights":
    case "neon_hounds":
      return { count: 1, sides: 8, bonus: 2, kind: "bludgeoning" };
    case "casters":
      return { count: 1, sides: 10, bonus: 0, kind: "force" };
    case "firewall_wardens":
      return { count: 1, sides: 10, bonus: 0, kind: "fire" };
    case "wraiths":
      return { count: 1, sides: 8, bonus: 0, kind: "necrotic" };
    case "stalkers":
    case "skirmishers":
      return { count: 1, sides: 6, bonus: 2, kind: "slashing" };
    default:
      return { count: 1, sides: 6, bonus: 0, kind: "mixed" };
  }
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

    // clear timers
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, activeEnemyGroupId, activeEnemyGroupName]);

  function queue(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function begin() {
    if (!enabled || !enemyName) return;

    const intent = buildEnemyIntent(enemyName, targetName);
    const nextDC = defaultDC(enemyName);
    const hint = attackHintFor(enemyName);

    setDeclared(intent);
    setDC(nextDC);
    setStep("declared");

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
      setRoll(r);
      setStep("rolled");
    });

    queue(1750, () => {
      const r = roll ?? randInt(1, 20); // safety; usually roll already set
      const text = outcomeText(enemyName, targetName, r, nextDC);
      setReveal(text);
      setStep("revealed");
    });
  }

  function commit() {
    if (!enabled || !enemyName) return;
    const r = roll ?? 0;

    const dmg = damageProfileFor(enemyName);

    const payload: OutcomePayload = {
      description: `Enemy turn — ${enemyName}. ${reveal || "Outcome pending."}`,
      dice: { mode: "d20", roll: r, dc, source: "solace" },
      audit: [
        `enemy_group=${enemyName}`,
        `intent="${declared}"`,
        `dc=${dc}`,
        `roll=${r}`,
        `note=V1 heuristic resolver`,
      ],
      damage: { roll: { count: dmg.count, sides: dmg.sides, bonus: dmg.bonus }, kind: dmg.kind },
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
            V1: action selection is heuristic. Later we’ll add per-enemy “move sets”, cooldowns, and pressure-driven
            behavior.
          </div>
        </div>
      )}
    </CardSection>
  );
}
