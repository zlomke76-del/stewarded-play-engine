"use client";

import { useEffect, useMemo, useState } from "react";
import CardSection from "@/components/layout/CardSection";
import type { DMMode, DiceMode, RollSource } from "../demoTypes";
import { formatCombatantLabel } from "@/lib/combat/CombatState";

type OutcomePayload = {
  description: string;
  dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
  audit: string[];
};

type CombatantSpecLike = {
  id: string;
  name: string;
  kind: "player" | "enemy_group";
  initiativeMod: number;
};

type Props = {
  dmMode: DMMode | null;

  // combat context
  combatActive: boolean;
  isEnemyTurn: boolean;
  activeCombatantSpec: CombatantSpecLike | null;

  // player intent
  playerInput: string;
  setPlayerInput: (v: string) => void;
  canPlayerSubmitIntent: boolean;
  onSubmitPlayerAction: () => void;

  // enemy paced resolution
  onRecordOutcome: (payload: OutcomePayload, opts?: { commitExploration?: boolean }) => void;
  onAdvanceTurn: () => void;
};

type EnemyPhase = "idle" | "intent" | "roll" | "outcome" | "ledger" | "ready";

function d20(): number {
  // suspense > determinism for now; still replayable because we record the roll in OUTCOME payload
  // (if you later want deterministic, we can swap this to seeded rolls from combat seed)
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return (a[0] % 20) + 1;
}

function d6(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return (a[0] % 6) + 1;
}

function pick<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function enemyIntentFor(groupName: string): { intent: string; dc: number; mod: number; kind: "attack" | "pressure" } {
  const g = (groupName || "").toLowerCase();

  // light heuristic flavor — no state shortcuts, purely narrative choice
  if (g.includes("archer")) {
    return {
      intent: pick([
        "The archers take aim from cover and loose a coordinated volley.",
        "The archers reposition and fire at exposed targets.",
        "A whistling volley rains down — disciplined, practiced, merciless.",
      ]),
      dc: 12,
      mod: 2,
      kind: "attack",
    };
  }

  if (g.includes("caster") || g.includes("wraith") || g.includes("signal") || g.includes("echo")) {
    return {
      intent: pick([
        "A cold pulse rolls through the chamber — a disruptive hex seeks your footing.",
        "An unseen force tugs at your resolve, searching for the weak seam in your stance.",
        "Static crawls across the air — an arcane interference tries to fracture coordination.",
      ]),
      dc: 13,
      mod: 1,
      kind: "pressure",
    };
  }

  if (g.includes("brute") || g.includes("shield") || g.includes("warden")) {
    return {
      intent: pick([
        "The front line surges forward to crush space and force you back.",
        "They advance as a wall — pressure first, damage second.",
        "Heavy steps. A battering push meant to break formation.",
      ]),
      dc: 12,
      mod: 1,
      kind: "attack",
    };
  }

  return {
    intent: pick([
      "The enemy group advances and tests your guard with quick strikes.",
      "They split wide, looking for an opening to punish hesitation.",
      "A probing rush — fast, coordinated, and opportunistic.",
    ]),
    dc: 12,
    mod: 1,
    kind: "attack",
  };
}

function softPanelStyle(): React.CSSProperties {
  return {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.10))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  };
}

function buttonStyle(tone: "primary" | "ghost", disabled?: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    userSelect: "none",
  };

  if (tone === "primary") {
    return {
      ...base,
      border: "1px solid rgba(138,180,255,0.28)",
      background: "linear-gradient(180deg, rgba(138,180,255,0.14), rgba(138,180,255,0.06))",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 22px rgba(0,0,0,0.22)",
    };
  }

  return {
    ...base,
    background: "rgba(255,255,255,0.04)",
  };
}

export default function ActionSection(props: Props) {
  const {
    dmMode,
    combatActive,
    isEnemyTurn,
    activeCombatantSpec,
    playerInput,
    setPlayerInput,
    canPlayerSubmitIntent,
    onSubmitPlayerAction,
    onRecordOutcome,
    onAdvanceTurn,
  } = props;

  const isSolaceNeutral = dmMode === "solace-neutral";
  const enemyTurnActive = isSolaceNeutral && combatActive && isEnemyTurn && !!activeCombatantSpec;

  const enemyLabel = useMemo(() => {
    if (!activeCombatantSpec) return "Enemy";
    try {
      return formatCombatantLabel(activeCombatantSpec as any);
    } catch {
      return activeCombatantSpec.name || activeCombatantSpec.id;
    }
  }, [activeCombatantSpec]);

  // -----------------------------
  // Paced enemy resolution state
  // -----------------------------

  const [phase, setPhase] = useState<EnemyPhase>("idle");

  const [draftIntent, setDraftIntent] = useState<string>("");
  const [draftDC, setDraftDC] = useState<number>(12);
  const [draftMod, setDraftMod] = useState<number>(1);

  const [rolledNatural, setRolledNatural] = useState<number | null>(null);
  const [rolledTotal, setRolledTotal] = useState<number | null>(null);
  const [draftOutcome, setDraftOutcome] = useState<string>("");
  const [draftAudit, setDraftAudit] = useState<string[]>([]);

  // reset pacing when we leave enemy turn / switch combatant
  useEffect(() => {
    if (!enemyTurnActive) {
      setPhase("idle");
      setDraftIntent("");
      setRolledNatural(null);
      setRolledTotal(null);
      setDraftOutcome("");
      setDraftAudit([]);
      return;
    }

    // if enemy turn just became active, start at idle but ready to reveal intent
    setPhase("idle");
    setDraftIntent("");
    setRolledNatural(null);
    setRolledTotal(null);
    setDraftOutcome("");
    setDraftAudit([]);
  }, [enemyTurnActive, activeCombatantSpec?.id]);

  function revealIntent() {
    if (!enemyTurnActive) return;

    const plan = enemyIntentFor(activeCombatantSpec?.name ?? activeCombatantSpec?.id ?? "Enemy");
    setDraftIntent(plan.intent);
    setDraftDC(plan.dc);
    setDraftMod(plan.mod);

    setDraftAudit((prev) => [
      ...prev,
      `Facilitator: Solace-neutral`,
      `Enemy: ${enemyLabel}`,
      `Intent chosen (non-instant pacing): "${plan.intent}"`,
      `Check: d20 + ${plan.mod} vs DC ${plan.dc}`,
    ]);

    setPhase("intent");
  }

  function rollNow() {
    if (!enemyTurnActive) return;

    const nat = d20();
    const total = nat + (draftMod || 0);

    setRolledNatural(nat);
    setRolledTotal(total);

    setDraftAudit((prev) => [...prev, `Roll: d20=${nat} + ${draftMod} => ${total}`]);

    setPhase("roll");
  }

  function revealOutcome() {
    if (!enemyTurnActive) return;
    if (rolledNatural == null || rolledTotal == null) return;

    const success = rolledTotal >= draftDC;
    const dmg = success ? d6() : 0;

    const outcome = success
      ? `${enemyLabel} succeeds. The pressure lands — you take ${dmg} damage (or equivalent harm).`
      : `${enemyLabel} fails. The attack skims wide — no damage, but the threat remains.`;

    setDraftOutcome(outcome);
    setDraftAudit((prev) => [...prev, `Outcome resolved: ${success ? "SUCCESS" : "FAILURE"}${success ? `, dmg=${dmg}` : ""}`]);

    setPhase("outcome");
  }

  function recordToLedger() {
    if (!enemyTurnActive) return;
    if (!draftOutcome) return;
    if (rolledTotal == null) return;

    const payload: OutcomePayload = {
      description: draftOutcome,
      dice: {
        mode: "d20" as any,
        roll: rolledTotal,
        dc: draftDC,
        source: "solace" as any,
      },
      audit: draftAudit.length ? draftAudit : ["Enemy outcome recorded (Solace-neutral)."],
    };

    // IMPORTANT: enemy actions should NOT auto-commit exploration events
    onRecordOutcome(payload, { commitExploration: false });

    setPhase("ledger");
  }

  function commitAndAdvance() {
    if (!enemyTurnActive) return;
    onAdvanceTurn();
    setPhase("ready");
  }

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <CardSection title="Action">
      {enemyTurnActive ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div className="muted" style={{ marginTop: 0 }}>
                Enemy turn — Solace is facilitating (paced resolution).
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>{enemyLabel}</strong>
              </div>
            </div>

            <div className="muted" style={{ fontSize: 12 }}>
              Reveal intent → roll → outcome → ledger → advance
            </div>
          </div>

          <div style={{ marginTop: 12, ...softPanelStyle() }}>
            {/* Step content */}
            {phase === "idle" && (
              <div className="muted">
                The enemy gathers itself. You feel the air tighten — something is about to happen.
              </div>
            )}

            {phase !== "idle" && draftIntent && (
              <div style={{ marginBottom: 12 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Intent (Solace)
                </div>
                <div style={{ lineHeight: 1.55 }}>{draftIntent}</div>
              </div>
            )}

            {(phase === "roll" || phase === "outcome" || phase === "ledger" || phase === "ready") && (
              <div style={{ marginBottom: 12 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Roll
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
                    DC <strong>{draftDC}</strong>
                  </span>
                  <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
                    d20 <strong>{rolledNatural ?? "—"}</strong>
                  </span>
                  <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
                    mod <strong>{draftMod >= 0 ? `+${draftMod}` : `${draftMod}`}</strong>
                  </span>
                  <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
                    total <strong>{rolledTotal ?? "—"}</strong>
                  </span>
                </div>
              </div>
            )}

            {(phase === "outcome" || phase === "ledger" || phase === "ready") && draftOutcome && (
              <div style={{ marginBottom: 12 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Outcome
                </div>
                <div style={{ lineHeight: 1.55 }}>{draftOutcome}</div>
              </div>
            )}

            <details style={{ marginTop: 8 }}>
              <summary className="muted">Show resolution audit</summary>
              <ul style={{ marginTop: 10 }}>
                {draftAudit.map((a, idx) => (
                  <li key={idx} className="muted">
                    {a}
                  </li>
                ))}
              </ul>
            </details>

            {/* Controls (paced) */}
            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={revealIntent}
                style={buttonStyle("primary", phase !== "idle")}
                disabled={phase !== "idle"}
              >
                Reveal Enemy Intent
              </button>

              <button
                onClick={rollNow}
                style={buttonStyle("primary", phase !== "intent")}
                disabled={phase !== "intent"}
              >
                Roll
              </button>

              <button
                onClick={revealOutcome}
                style={buttonStyle("primary", phase !== "roll")}
                disabled={phase !== "roll"}
              >
                Reveal Outcome
              </button>

              <button
                onClick={recordToLedger}
                style={buttonStyle("primary", phase !== "outcome")}
                disabled={phase !== "outcome"}
              >
                Record to Ledger
              </button>

              <button
                onClick={commitAndAdvance}
                style={buttonStyle("ghost", phase !== "ledger")}
                disabled={phase !== "ledger"}
              >
                Advance Turn
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {combatActive && isEnemyTurn && dmMode !== "human" && (
            <p className="muted" style={{ marginTop: 0 }}>
              Enemy turn. In Solace-neutral, Solace resolves enemy intent step-by-step. (Switch to Human DM only if you want manual enemy control.)
            </p>
          )}

          <textarea
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            placeholder="Describe what your character does…"
            disabled={!canPlayerSubmitIntent}
            style={{
              width: "100%",
              minHeight: "120px",
              resize: "vertical",
              boxSizing: "border-box",
              lineHeight: 1.5,
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: canPlayerSubmitIntent ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.04)",
              color: "inherit",
              outline: "none",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          />

          <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={onSubmitPlayerAction} disabled={!canPlayerSubmitIntent} style={buttonStyle("primary", !canPlayerSubmitIntent)}>
              Submit Action
            </button>
            <span className="muted" style={{ fontSize: 12 }}>
              Tip: After you submit, the page jumps to Resolution automatically.
            </span>
          </div>
        </>
      )}
    </CardSection>
  );
}
