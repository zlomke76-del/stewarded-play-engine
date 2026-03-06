"use client";

// components/combat/EnemyTurnResolverPanel.tsx
// ------------------------------------------------------------
// EnemyTurnResolverPanel (V2)
// ------------------------------------------------------------
// In Solace Neutral Facilitator mode, enemies are driven by Solace.
// This panel:
// - chooses an enemy action using enemy specialty skills when available
// - plays suspense steps (declare → telegraph → roll → reveal → commit)
// - does NOT write canon directly; it calls parent callbacks
//
// Upgrade:
// - integrates enemy skill registry
// - deterministic skill choice per enemy/target pair
// - richer attack hint + damage typing
// - still fully backward-compatible with existing combat flow
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "@/components/layout/CardSection";
import { getSkillsForEnemyArchetype } from "@/lib/skills/classSkillMap";
import { getSkillDefinition } from "@/lib/skills/skillDefinitions";

type Step = "idle" | "declared" | "telegraph" | "rolled" | "revealed";

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
  | "radiant"
  | "shadow";

type OutcomePayload = {
  description: string;
  dice: { mode: "d20"; roll: number; dc: number; source: "solace" };
  audit: string[];
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
  enabled: boolean;
  activeEnemyGroupName: string | null;
  activeEnemyGroupId: string | null;
  playerNames: string[];
  onTelegraph: (info: TelegraphInfo) => void;
  onCommitOutcome: (payload: OutcomePayload) => void;
  onAdvanceTurn: () => void;
};

type ResolvedEnemyAction = {
  skillId: string | null;
  skillLabel: string;
  archetype: string;
  attackHint: "volley" | "beam" | "charge" | "unknown";
  dc: number;
  damage: { count: number; sides: number; bonus: number; kind: DamageKind };
  declared: string;
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

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

function enemyArchetypeKeyForSkills(name: string | null) {
  const a = archetypeFor(name);
  switch (a) {
    case "archers":
    case "sentries":
      return "Bandit Archer";
    case "skirmishers":
      return "Goblin Skirmisher";
    case "casters":
    case "firewall_wardens":
      return "Dark Cultist";
    case "wraiths":
    case "grid_knights":
      return "Undead Knight";
    case "stalkers":
      return "Shadow Assassin";
    case "brutes":
    case "shields":
    case "neon_hounds":
    case "drones":
      return "Orc Raider";
    default:
      return "Orc Raider";
  }
}

function attackHintFor(enemyName: string, skillId?: string | null) {
  const s = String(skillId ?? "").toLowerCase();
  if (s.includes("volley")) return "volley" as const;
  if (s.includes("blast") || s.includes("hex") || s.includes("drain")) return "beam" as const;
  if (s.includes("strike") || s.includes("slash") || s.includes("cleave") || s.includes("frenzy")) {
    return "charge" as const;
  }

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

function defaultDC(enemyName: string, skillId?: string | null) {
  const s = String(skillId ?? "").toLowerCase();
  if (s.includes("strike") || s.includes("cleave") || s.includes("slash")) return 12;
  if (s.includes("volley")) return 13;
  if (s.includes("hex") || s.includes("drain")) return 14;
  if (s.includes("smoke") || s.includes("vanish")) return 12;
  if (s.includes("march") || s.includes("frenzy")) return 11;

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

function damageProfileFor(enemyName: string, skillId?: string | null): { count: number; sides: number; bonus: number; kind: DamageKind } {
  const s = String(skillId ?? "").toLowerCase();

  if (s === "bandit_volley") return { count: 1, sides: 6, bonus: 1, kind: "piercing" };
  if (s === "suppressing_fire") return { count: 1, sides: 4, bonus: 1, kind: "piercing" };
  if (s === "raider_cleave") return { count: 1, sides: 8, bonus: 2, kind: "slashing" };
  if (s === "raider_frenzy") return { count: 1, sides: 8, bonus: 1, kind: "slashing" };
  if (s === "skirmisher_harass") return { count: 1, sides: 6, bonus: 2, kind: "piercing" };
  if (s === "skirmisher_smoke") return { count: 1, sides: 4, bonus: 0, kind: "mixed" };
  if (s === "cultist_hex") return { count: 1, sides: 4, bonus: 1, kind: "shadow" };
  if (s === "cultist_drain") return { count: 1, sides: 8, bonus: 0, kind: "necrotic" };
  if (s === "undead_slash") return { count: 1, sides: 8, bonus: 1, kind: "slashing" };
  if (s === "deathless_march") return { count: 1, sides: 6, bonus: 0, kind: "bludgeoning" };
  if (s === "shadow_strike") return { count: 1, sides: 8, bonus: 2, kind: "shadow" };
  if (s === "vanish") return { count: 1, sides: 4, bonus: 0, kind: "mixed" };

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

function buildEnemyIntent(enemyName: string, targetName: string, skillId?: string | null, skillLabel?: string) {
  switch (skillId) {
    case "bandit_volley":
      return `The ${enemyName} unleash ${skillLabel ?? "Bandit Volley"} at ${targetName}, saturating the lane with arrows.`;
    case "suppressing_fire":
      return `The ${enemyName} use ${skillLabel ?? "Suppressing Fire"} to pin ${targetName} down and ruin their movement lane.`;
    case "raider_cleave":
      return `The ${enemyName} surge forward with ${skillLabel ?? "Raider Cleave"}, trying to break ${targetName} apart.`;
    case "raider_frenzy":
      return `The ${enemyName} enter ${skillLabel ?? "Raider Frenzy"} and barrel toward ${targetName} with savage momentum.`;
    case "skirmisher_harass":
      return `The ${enemyName} dart in with ${skillLabel ?? "Skirmisher Harass"}, cutting at ${targetName} before fading back.`;
    case "skirmisher_smoke":
      return `The ${enemyName} trigger ${skillLabel ?? "Skirmisher Smoke"}, masking their angle on ${targetName}.`;
    case "cultist_hex":
      return `The ${enemyName} lay ${skillLabel ?? "Cultist Hex"} on ${targetName}, trying to weaken their resolve.`;
    case "cultist_drain":
      return `The ${enemyName} invoke ${skillLabel ?? "Cultist Drain"} and leech strength from ${targetName}.`;
    case "undead_slash":
      return `The ${enemyName} advance with ${skillLabel ?? "Undead Slash"} and carve toward ${targetName}.`;
    case "deathless_march":
      return `The ${enemyName} begin a ${skillLabel ?? "Deathless March"}, grinding relentlessly into ${targetName}.`;
    case "shadow_strike":
      return `The ${enemyName} spring from concealment with ${skillLabel ?? "Shadow Strike"} at ${targetName}.`;
    case "vanish":
      return `The ${enemyName} use ${skillLabel ?? "Vanish"} to dissolve from sight and reset on ${targetName}.`;
    default:
      break;
  }

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

function outcomeText(enemyName: string, targetName: string, roll: number, dc: number, action: ResolvedEnemyAction) {
  const hit = roll >= dc;
  const skillId = action.skillId;

  if (skillId === "bandit_volley") {
    return hit
      ? `The volley converges cleanly — ${targetName} is struck through the chaos.`
      : `The arrows scatter into stone and shadow — ${targetName} slips the kill lane.`;
  }

  if (skillId === "cultist_drain") {
    return hit
      ? `Dark force locks on — ${targetName} staggers as vitality is torn away.`
      : `The ritual thread frays in the air — ${targetName} resists the drain.`;
  }

  if (skillId === "shadow_strike") {
    return hit
      ? `A sudden shape flashes in close — ${targetName} is hit before they can square up.`
      : `Steel whispers past — ${targetName} twists clear at the last instant.`;
  }

  if (skillId === "raider_cleave" || skillId === "undead_slash") {
    return hit
      ? `The strike lands with brutal weight — ${targetName} is forced backward.`
      : `The heavy swing goes wide — ${targetName} holds the line.`;
  }

  const a = archetypeFor(enemyName);
  if (a === "archers") {
    return hit
      ? `Arrows hiss through the torchlight — one finds ${targetName}.`
      : `A volley of arrows clatters off stone — ${targetName} ducks behind cover.`;
  }

  if (a === "casters" || a === "firewall_wardens") {
    return hit
      ? `The air snaps with force — ${targetName} is struck mid-step.`
      : `The spell fractures against the air — it fizzles wide.`;
  }

  return hit
    ? `The attack lands — ${targetName} is forced back.`
    : `The attack misses — ${targetName} holds their ground.`;
}

function resolveEnemyAction(enemyName: string, enemyId: string | null, targetName: string): ResolvedEnemyAction {
  const archetype = enemyArchetypeKeyForSkills(enemyName);
  const skillIds = getSkillsForEnemyArchetype(archetype);

  let chosenSkillId: string | null = null;
  if (skillIds.length > 0) {
    const seed = `${enemyId ?? enemyName}::${targetName}::${archetype}`;
    const idx = hash32(seed) % skillIds.length;
    chosenSkillId = skillIds[idx] ?? null;
  }

  const def = chosenSkillId ? getSkillDefinition(chosenSkillId) : null;
  const skillLabel = def?.label ?? (chosenSkillId ? chosenSkillId : "Attack");
  const attackHint = attackHintFor(enemyName, chosenSkillId);
  const dc = defaultDC(enemyName, chosenSkillId);
  const damage = damageProfileFor(enemyName, chosenSkillId);
  const declared = buildEnemyIntent(enemyName, targetName, chosenSkillId, skillLabel);

  return {
    skillId: chosenSkillId,
    skillLabel,
    archetype,
    attackHint,
    dc,
    damage,
    declared,
  };
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
  const [resolvedAction, setResolvedAction] = useState<ResolvedEnemyAction | null>(null);

  const timers = useRef<number[]>([]);
  const rollRef = useRef<number | null>(null);

  const enemyName = activeEnemyGroupName ?? null;

  const targetName = useMemo(() => {
    const candidates = playerNames.filter((x) => String(x || "").trim().length > 0);
    return pick(candidates) ?? "the party";
  }, [playerNames]);

  useEffect(() => {
    setStep("idle");
    setDeclared("");
    setRoll(null);
    rollRef.current = null;
    setReveal("");
    setResolvedAction(null);
    if (enemyName) setDC(defaultDC(enemyName));

    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, [enabled, activeEnemyGroupId, activeEnemyGroupName, enemyName]);

  function queue(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function begin() {
    if (!enabled || !enemyName) return;

    const action = resolveEnemyAction(enemyName, activeEnemyGroupId, targetName);
    setResolvedAction(action);
    setDeclared(action.declared);
    setDC(action.dc);
    setStep("declared");

    queue(450, () => {
      setStep("telegraph");
      onTelegraph({
        enemyName,
        targetName,
        attackStyleHint: action.attackHint,
      });
    });

    queue(1250, () => {
      const r = randInt(1, 20);
      rollRef.current = r;
      setRoll(r);
      setStep("rolled");
    });

    queue(1750, () => {
      const r = rollRef.current ?? randInt(1, 20);
      const text = outcomeText(enemyName, targetName, r, action.dc, action);
      setReveal(text);
      setStep("revealed");
    });
  }

  function commit() {
    if (!enabled || !enemyName) return;
    const r = rollRef.current ?? roll ?? 0;
    const action = resolvedAction ?? resolveEnemyAction(enemyName, activeEnemyGroupId, targetName);

    const payload: OutcomePayload = {
      description: `Enemy turn — ${enemyName}. ${reveal || "Outcome pending."}`,
      dice: { mode: "d20", roll: r, dc, source: "solace" },
      audit: [
        `enemy_group=${enemyName}`,
        `enemy_group_id=${String(activeEnemyGroupId ?? "")}`,
        `enemy_archetype=${action.archetype}`,
        `enemy_skill_id=${String(action.skillId ?? "none")}`,
        `enemy_skill_label="${action.skillLabel}"`,
        `intent="${declared}"`,
        `dc=${dc}`,
        `roll=${r}`,
        `note=V2 skill-aware heuristic resolver`,
      ],
      damage: {
        roll: {
          count: action.damage.count,
          sides: action.damage.sides,
          bonus: action.damage.bonus,
        },
        kind: action.damage.kind,
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
            {resolvedAction ? (
              <>
                {" "}
                · Move: <strong>{resolvedAction.skillLabel}</strong>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {resolvedAction && (
        <div
          style={{
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div className="muted" style={{ fontSize: 12 }}>
            Archetype: <strong>{resolvedAction.archetype}</strong> · Attack hint{" "}
            <strong>{resolvedAction.attackHint}</strong> · Damage{" "}
            <strong>
              {resolvedAction.damage.count}d{resolvedAction.damage.sides}
              {resolvedAction.damage.bonus >= 0 ? `+${resolvedAction.damage.bonus}` : resolvedAction.damage.bonus}
            </strong>{" "}
            <strong>{resolvedAction.damage.kind}</strong>
          </div>
        </div>
      )}

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
            V2: enemy behavior now resolves through mapped enemy specialty skills when available. Next layer can add
            cooldowns, target preference, and pressure-conditioned move weighting.
          </div>
        </div>
      )}
    </CardSection>
  );
}
