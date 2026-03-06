"use client";

// components/combat/EnemyTurnResolverPanel.tsx
// ------------------------------------------------------------
// EnemyTurnResolverPanel (V4)
// ------------------------------------------------------------
// In Solace Neutral Facilitator mode, enemies are driven by Solace.
// This panel:
// - resolves the active enemy from EnemyDatabase first
// - chooses an enemy action using database skillIds when available
// - falls back to action profile + role/faction when needed
// - plays suspense steps (declare → telegraph → roll → reveal → commit)
// - does NOT write canon directly; it calls parent callbacks
//
// Upgrade:
// - uses EnemyDatabase as the primary truth source
// - deterministic portrait loading from portraitKey when present
// - deterministic skill choice per enemy/target pair
// - richer attack hint + damage typing
// - backward-compatible with existing combat flow
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "@/components/layout/CardSection";
import { getSkillDefinition } from "@/lib/skills/skillDefinitions";
import {
  EnemyAction,
  EnemyDefinition,
  getEnemyDefinitionByName,
  getEnemiesForGroupLabel,
} from "@/lib/game/EnemyDatabase";

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
  enemyName: string;
  archetypeSource: string;
  attackHint: "volley" | "beam" | "charge" | "unknown";
  dc: number;
  damage: { count: number; sides: number; bonus: number; kind: DamageKind };
  declared: string;
  actionLabel?: string | null;
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

function normalizeKey(v: string | null | undefined) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toTitle(v: string) {
  return String(v ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function getEnemyPortraitPathFromDefinition(enemy: EnemyDefinition | null, fallbackName: string | null) {
  if (enemy?.portraitKey) {
    return `/assets/V2/Enemy/${enemy.portraitKey}.png`;
  }

  const safeName = String(fallbackName ?? "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "");

  return `/assets/V2/Enemy/Enemy_${safeName}.png`;
}

function resolveActiveEnemyDefinition(activeEnemyGroupName: string | null): EnemyDefinition | null {
  const raw = String(activeEnemyGroupName ?? "").trim();
  if (!raw) return null;

  const byName = getEnemyDefinitionByName(raw);
  if (byName) return byName;

  const byGroup = getEnemiesForGroupLabel(raw);
  if (byGroup.length > 0) return byGroup[0] ?? null;

  return null;
}

function attackHintFromActionKind(kind?: EnemyAction["kind"]): "volley" | "beam" | "charge" | "unknown" {
  if (kind === "ranged") return "volley";
  if (kind === "spell") return "beam";
  if (kind === "melee" || kind === "control") return "charge";
  return "unknown";
}

function attackHintFor(
  enemyName: string,
  skillId?: string | null,
  actionKind?: EnemyAction["kind"]
): "volley" | "beam" | "charge" | "unknown" {
  const s = String(skillId ?? "").toLowerCase();

  if (s.includes("volley")) return "volley";
  if (s.includes("blast") || s.includes("hex") || s.includes("drain") || s.includes("lance")) return "beam";
  if (s.includes("strike") || s.includes("slash") || s.includes("cleave") || s.includes("frenzy")) return "charge";

  const byAction = attackHintFromActionKind(actionKind);
  if (byAction !== "unknown") return byAction;

  const n = String(enemyName ?? "").toLowerCase();
  if (n.includes("archer")) return "volley";
  if (n.includes("acolyte") || n.includes("priest") || n.includes("wraith") || n.includes("sentinel")) return "beam";
  if (
    n.includes("warrior") ||
    n.includes("raider") ||
    n.includes("knight") ||
    n.includes("wolf") ||
    n.includes("spider") ||
    n.includes("golem")
  ) {
    return "charge";
  }

  return "unknown";
}

function mapEnemyDamageTypeToPanelKind(type?: string | null): DamageKind {
  switch (String(type ?? "").toLowerCase()) {
    case "piercing":
      return "piercing";
    case "slashing":
      return "slashing";
    case "bludgeoning":
      return "bludgeoning";
    case "force":
      return "force";
    case "fire":
      return "fire";
    case "cold":
      return "cold";
    case "lightning":
      return "lightning";
    case "necrotic":
      return "necrotic";
    case "psychic":
      return "psychic";
    case "poison":
      return "poison";
    case "radiant":
      return "radiant";
    case "shadow":
      return "shadow";
    default:
      return "mixed";
  }
}

function defaultDCFromRole(enemy: EnemyDefinition | null, skillId?: string | null, action?: EnemyAction | null) {
  const s = String(skillId ?? "").toLowerCase();

  if (s.includes("strike") || s.includes("cleave") || s.includes("slash")) return 12;
  if (s.includes("volley")) return 13;
  if (s.includes("hex") || s.includes("drain") || s.includes("lance")) return 14;
  if (s.includes("smoke") || s.includes("vanish")) return 12;
  if (s.includes("march") || s.includes("frenzy")) return 11;

  if (action?.saveDC && Number(action.saveDC) > 0) {
    return Math.max(10, Math.trunc(action.saveDC));
  }

  if (typeof action?.toHitBonus === "number") {
    return Math.max(10, 8 + Math.trunc(action.toHitBonus));
  }

  switch (enemy?.role) {
    case "archer":
      return 13;
    case "caster":
    case "controller":
    case "support":
      return 14;
    case "assassin":
      return 14;
    case "boss":
      return 15;
    case "brute":
    case "soldier":
    case "construct":
    case "undead":
    case "beast":
      return 12;
    default:
      return 12;
  }
}

function damageProfileForEnemy(
  enemy: EnemyDefinition | null,
  skillId?: string | null,
  action?: EnemyAction | null
): { count: number; sides: number; bonus: number; kind: DamageKind } {
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

  if (action?.damage) {
    return {
      count: Math.max(1, Math.trunc(action.damage.diceCount || 1)),
      sides: Math.max(4, Math.trunc(action.damage.diceSides || 6)),
      bonus: Math.trunc(action.damage.bonus || 0),
      kind: mapEnemyDamageTypeToPanelKind(action.damage.type),
    };
  }

  switch (enemy?.role) {
    case "archer":
      return { count: 1, sides: 6, bonus: 1, kind: "piercing" };
    case "brute":
      return { count: 1, sides: 8, bonus: 2, kind: "bludgeoning" };
    case "caster":
    case "controller":
    case "support":
      return { count: 1, sides: 8, bonus: 0, kind: "force" };
    case "assassin":
      return { count: 1, sides: 6, bonus: 2, kind: "slashing" };
    case "construct":
      return { count: 1, sides: 8, bonus: 2, kind: "force" };
    case "undead":
      return { count: 1, sides: 8, bonus: 0, kind: "necrotic" };
    case "beast":
      return { count: 1, sides: 6, bonus: 2, kind: "piercing" };
    case "boss":
      return { count: 2, sides: 8, bonus: 3, kind: "mixed" };
    default:
      return { count: 1, sides: 6, bonus: 0, kind: "mixed" };
  }
}

function buildEnemyIntent(
  enemyName: string,
  targetName: string,
  skillId?: string | null,
  skillLabel?: string,
  actionLabel?: string | null
) {
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

  if (actionLabel) {
    return `The ${enemyName} use ${actionLabel} against ${targetName}.`;
  }

  return `The ${enemyName} press the attack against ${targetName}.`;
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

  if (action.attackHint === "volley") {
    return hit
      ? `Missiles cut through the air — ${targetName} is hit cleanly.`
      : `${targetName} slips the incoming line of fire.`;
  }

  if (action.attackHint === "beam") {
    return hit
      ? `The energy discharge lands hard — ${targetName} staggers under the impact.`
      : `The effect fractures wide and misses ${targetName}.`;
  }

  return hit
    ? `The attack lands — ${targetName} is forced back.`
    : `The attack misses — ${targetName} holds their ground.`;
}

function resolveEnemyAction(
  enemy: EnemyDefinition | null,
  enemyName: string,
  enemyId: string | null,
  targetName: string
): ResolvedEnemyAction {
  const skillIds = Array.isArray(enemy?.skillIds) ? enemy!.skillIds : [];
  const actions = Array.isArray(enemy?.actions) ? enemy!.actions : [];

  let chosenSkillId: string | null = null;
  if (skillIds.length > 0) {
    const seed = `${enemyId ?? enemy?.id ?? enemyName}::${targetName}::skills`;
    const idx = hash32(seed) % skillIds.length;
    chosenSkillId = skillIds[idx] ?? null;
  }

  let chosenAction: EnemyAction | null = null;
  if (actions.length > 0) {
    const seed = `${enemyId ?? enemy?.id ?? enemyName}::${targetName}::actions`;
    const idx = hash32(seed) % actions.length;
    chosenAction = actions[idx] ?? null;
  }

  const def = chosenSkillId ? getSkillDefinition(chosenSkillId) : null;
  const skillLabel = def?.label ?? (chosenSkillId ? toTitle(chosenSkillId) : chosenAction?.label ?? "Attack");
  const attackHint = attackHintFor(enemyName, chosenSkillId, chosenAction?.kind);
  const dc = defaultDCFromRole(enemy, chosenSkillId, chosenAction);
  const damage = damageProfileForEnemy(enemy, chosenSkillId, chosenAction);
  const declared = buildEnemyIntent(enemyName, targetName, chosenSkillId, skillLabel, chosenAction?.label ?? null);

  return {
    skillId: chosenSkillId,
    skillLabel,
    enemyName,
    archetypeSource: enemy?.archetypeSkillSource ?? enemy?.name ?? "Unknown",
    attackHint,
    dc,
    damage,
    declared,
    actionLabel: chosenAction?.label ?? null,
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

  const enemyDef = useMemo(() => resolveActiveEnemyDefinition(activeEnemyGroupName), [activeEnemyGroupName]);

  const enemyName = useMemo(() => {
    if (enemyDef?.name) return enemyDef.name;
    return activeEnemyGroupName ?? null;
  }, [enemyDef, activeEnemyGroupName]);

  const targetName = useMemo(() => {
    const candidates = playerNames.filter((x) => String(x || "").trim().length > 0);
    return pick(candidates) ?? "the party";
  }, [playerNames]);

  const portraitSrc = useMemo(() => {
    return getEnemyPortraitPathFromDefinition(enemyDef, enemyName);
  }, [enemyDef, enemyName]);

  useEffect(() => {
    setStep("idle");
    setDeclared("");
    setRoll(null);
    rollRef.current = null;
    setReveal("");
    setResolvedAction(null);
    setDC(defaultDCFromRole(enemyDef));

    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, [enabled, activeEnemyGroupId, activeEnemyGroupName, enemyDef]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  function queue(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function begin() {
    if (!enabled || !enemyName) return;

    const action = resolveEnemyAction(enemyDef, enemyName, activeEnemyGroupId, targetName);
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
    const action = resolvedAction ?? resolveEnemyAction(enemyDef, enemyName, activeEnemyGroupId, targetName);

    const payload: OutcomePayload = {
      description: `Enemy turn — ${enemyName}. ${reveal || "Outcome pending."}`,
      dice: { mode: "d20", roll: r, dc, source: "solace" },
      audit: [
        `enemy_group=${String(activeEnemyGroupName ?? "")}`,
        `enemy_group_id=${String(activeEnemyGroupId ?? "")}`,
        `enemy_resolved_name=${enemyName}`,
        `enemy_database_id=${String(enemyDef?.id ?? "")}`,
        `enemy_slug=${String(enemyDef?.slug ?? "")}`,
        `enemy_faction=${String(enemyDef?.faction ?? "")}`,
        `enemy_role=${String(enemyDef?.role ?? "")}`,
        `enemy_tier=${String(enemyDef?.tier ?? "")}`,
        `enemy_pressure_band=${String(enemyDef?.pressureBand ?? "")}`,
        `enemy_archetype_source=${action.archetypeSource}`,
        `enemy_skill_id=${String(action.skillId ?? "none")}`,
        `enemy_skill_label="${action.skillLabel}"`,
        `enemy_action_label="${String(action.actionLabel ?? "")}"`,
        `intent="${declared}"`,
        `dc=${dc}`,
        `roll=${r}`,
        `note=V4 database-aware resolver`,
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

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(0,0,0,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title={enemyName ?? "Enemy"}
        >
          {enemyName ? (
            <img
              src={portraitSrc}
              alt={enemyName}
              width={72}
              height={72}
              style={{ width: 72, height: 72, objectFit: "cover", display: "block" }}
              onError={(e) => {
                const el = e.currentTarget;
                el.onerror = null;
                el.src = "/assets/V2/Enemy/Enemy_Bandit_Warrior.png";
              }}
            />
          ) : (
            <span style={{ fontSize: 12, opacity: 0.7 }}>No Enemy</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="muted" style={{ marginBottom: 6 }}>
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

          {enemyDef && (
            <div className="muted" style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.5 }}>
              Role: <strong>{enemyDef.role}</strong> · Tier <strong>{enemyDef.tier}</strong> · Pressure{" "}
              <strong>{enemyDef.pressureBand}</strong> · Faction <strong>{enemyDef.faction}</strong>
            </div>
          )}

          {resolvedAction && (
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
              Skill source: <strong>{resolvedAction.archetypeSource}</strong> · Attack hint{" "}
              <strong>{resolvedAction.attackHint}</strong> · Damage{" "}
              <strong>
                {resolvedAction.damage.count}d{resolvedAction.damage.sides}
                {resolvedAction.damage.bonus >= 0 ? `+${resolvedAction.damage.bonus}` : resolvedAction.damage.bonus}
              </strong>{" "}
              <strong>{resolvedAction.damage.kind}</strong>
            </div>
          )}
        </div>
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
            V4: enemy behavior now resolves from EnemyDatabase first, then skill mappings and action profiles. This is
            the right foundation for cooldowns, target weighting, and encounter-specific enemy logic.
          </div>
        </div>
      )}
    </CardSection>
  );
}
