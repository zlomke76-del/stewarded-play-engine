"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract:
// - Dice decide success/failure
// - CreativeNarrator drafts narration (NON-AUTHORITATIVE flavor)
// - Human DM mode: Arbiter may EDIT narration
// - Solace (Neutral Facilitator) DM mode: narration is NOT editable (read-only)
// - Arbiter commits canon (Record Outcome)
//
// Upgrade (2026-03):
// - Optional rollModifier applied to the rolled value for DC comparisons.
//   This supports deterministic penalties like "Injury: -2 per stack"
//   without changing existing callers.
//
// Premium UX upgrade:
// - animated digital roll sequence
// - roll / land / record SFX
// - Solace Neutral mode is digital-roll only
// - Human mode retains physical-roll acceptance path
//
// Ritual staging upgrade:
// - clear phase progression: intent -> weighing -> result -> narration -> commit
// - stronger result language
// - moment-of-truth card
// - consequence banner before record
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { generateNarration } from "@/lib/narration/CreativeNarrator";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

export type ResolutionContext = {
  optionDescription: string;
  optionKind?: "safe" | "environmental" | "risky" | "contested";
};

type DMMode = "human" | "solace_neutral";

type XY = { x: number; y: number };

type Props = {
  context: ResolutionContext;
  role: "arbiter";

  /**
   * Controls whether narration is editable.
   * - "human": editable narration (current behavior)
   * - "solace_neutral": Solace-as-Arbiter narration, read-only
   *
   * Defaults to "human" to avoid changing existing flows unless explicitly set.
   */
  dmMode?: DMMode;

  /**
   * Optional truth anchors (passed from orchestrator).
   * These do NOT grant authority; they just let narration reference what actually happened.
   */
  setupText?: string | null;

  movement?: {
    from?: XY | null;
    to?: XY | null;
    direction?: "north" | "east" | "south" | "west" | "none" | null;
  } | null;

  combat?: {
    activeEnemyGroupName?: string | null;
    isEnemyTurn?: boolean;
    attackStyleHint?: "volley" | "beam" | "charge" | "unknown";
  } | null;

  /**
   * Optional mechanical modifier applied to the rolled value.
   * Use negative values for penalties (e.g., injury stacks: -2, -4, ...).
   *
   * Important:
   * - The panel records the *effective* roll (raw + modifier) in dice.roll,
   *   and logs the raw roll + modifier in audit for transparency.
   */
  rollModifier?: number;
  rollModifierLabel?: string | null;

  onRecord: (payload: {
    description: string;
    dice: {
      mode: DiceMode;
      roll: number; // effective (raw + modifier)
      dc: number;
      source: RollSource;
    };
    audit: string[];
  }) => void;
};

/* ------------------------------------------------------------
   Difficulty (mechanical truth only)
------------------------------------------------------------ */

function difficultyFor(kind?: ResolutionContext["optionKind"]): number {
  switch (kind) {
    case "safe":
      return 6;
    case "environmental":
      return 8;
    case "risky":
      return 10;
    case "contested":
      return 14;
    default:
      return 10;
  }
}

function clampInt(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function safeInt(n: unknown, fallback: number) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : fallback;
}

function maxForDiceMode(mode: DiceMode) {
  return clampInt(Number(mode.slice(1)), 2, 100);
}

function playSfx(src: string, volume = 0.7) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // fail silently
    });
  } catch {
    // fail silently
  }
}

function toneForMargin(margin: number) {
  if (margin >= 6) return "decisive-success";
  if (margin >= 0) return "success";
  if (margin <= -6) return "hard-failure";
  return "failure";
}

function titleCase(input: string) {
  return input
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function optionKindLabel(kind?: ResolutionContext["optionKind"]) {
  return kind ? titleCase(kind) : "Standard";
}

function toneHeadline(tone: ReturnType<typeof toneForMargin>) {
  switch (tone) {
    case "decisive-success":
      return "The moment breaks decisively in your favor.";
    case "success":
      return "The attempt succeeds.";
    case "hard-failure":
      return "The dungeon pushes back hard.";
    case "failure":
      return "The effort strains against resistance.";
    default:
      return "Fate has not yet spoken.";
  }
}

function toneSubline(tone: ReturnType<typeof toneForMargin>, margin: number | null) {
  if (margin === null) return "A roll is required before consequence can be recorded.";

  switch (tone) {
    case "decisive-success":
      return `The action clears the threshold with force (${margin >= 0 ? "+" : ""}${margin}).`;
    case "success":
      return `The action clears the threshold (${margin >= 0 ? "+" : ""}${margin}).`;
    case "hard-failure":
      return `The attempt falls well short (${margin >= 0 ? "+" : ""}${margin}).`;
    case "failure":
      return `The attempt misses narrowly (${margin >= 0 ? "+" : ""}${margin}).`;
    default:
      return "Outcome pending.";
  }
}

function ritualPhaseLabel(args: {
  rawRoll: number | null;
  isRolling: boolean;
  draftText: string;
}) {
  const { rawRoll, isRolling, draftText } = args;
  if (isRolling) return "Fate is weighing the moment";
  if (rawRoll === null) return "Intent awaits adjudication";
  if (!draftText.trim()) return "Consequence is taking shape";
  return "Outcome stands ready for canon";
}

function ritualPhaseSteps(args: {
  rawRoll: number | null;
  isRolling: boolean;
  hasNarration: boolean;
}) {
  const { rawRoll, isRolling, hasNarration } = args;

  return [
    {
      label: "Intent Declared",
      state: "done" as const,
    },
    {
      label: "Fate Weighs",
      state: isRolling ? ("active" as const) : rawRoll !== null ? ("done" as const) : ("pending" as const),
    },
    {
      label: "Result Lands",
      state: rawRoll !== null && !isRolling ? ("done" as const) : ("pending" as const),
    },
    {
      label: "Narration Forms",
      state:
        rawRoll !== null && hasNarration
          ? ("done" as const)
          : rawRoll !== null
            ? ("active" as const)
            : ("pending" as const),
    },
    {
      label: "Canon Ready",
      state: rawRoll !== null && hasNarration ? ("active" as const) : ("pending" as const),
    },
  ];
}

/* ------------------------------------------------------------ */

const SFX = {
  diceRoll: "/assets/audio/sfx_button_click_01.mp3",
  diceLand: "/assets/audio/sfx_success_01.mp3",
  recordOutcome: "/assets/audio/sfx_arbiter_cannon_record_01.mp3",
} as const;

export default function ResolutionDraftAdvisoryPanel({
  context,
  role,
  dmMode = "human",
  setupText = null,
  movement = null,
  combat = null,
  rollModifier = 0,
  rollModifierLabel = null,
  onRecord,
}: Props) {
  const dc = difficultyFor(context.optionKind);
  const isSolaceNeutral = dmMode === "solace_neutral";

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [rawRoll, setRawRoll] = useState<number | null>(null);
  const [manualRoll, setManualRoll] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [displayRoll, setDisplayRoll] = useState<number | null>(null);

  const committedRef = useRef(false);
  const rollIntervalRef = useRef<number | null>(null);
  const rollTimeoutRef = useRef<number | null>(null);

  const [draftText, setDraftText] = useState("");

  // Reset on new intent
  useEffect(() => {
    setRawRoll(null);
    setDisplayRoll(null);
    setManualRoll("");
    setDraftText("");
    setIsRolling(false);
    committedRef.current = false;

    if (rollIntervalRef.current) {
      window.clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }

    if (rollTimeoutRef.current) {
      window.clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
  }, [context.optionDescription]);

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) {
        window.clearInterval(rollIntervalRef.current);
      }
      if (rollTimeoutRef.current) {
        window.clearTimeout(rollTimeoutRef.current);
      }
    };
  }, []);

  /* ----------------------------------------------------------
     Dice handling
  ---------------------------------------------------------- */

  function rollDice() {
    if (isRolling) return;

    const max = maxForDiceMode(diceMode);
    const finalRoll = Math.ceil(Math.random() * max);

    setIsRolling(true);
    setRawRoll(null);
    setDisplayRoll(Math.ceil(Math.random() * max));
    playSfx(SFX.diceRoll, 0.56);

    let tickCount = 0;

    rollIntervalRef.current = window.setInterval(() => {
      tickCount += 1;
      setDisplayRoll(Math.ceil(Math.random() * max));

      if (tickCount === 4 || tickCount === 8) {
        playSfx(SFX.diceRoll, 0.42);
      }
    }, 85);

    rollTimeoutRef.current = window.setTimeout(() => {
      if (rollIntervalRef.current) {
        window.clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }

      setDisplayRoll(finalRoll);
      setRawRoll(finalRoll);
      setIsRolling(false);
      playSfx(SFX.diceLand, 0.72);
    }, 900);
  }

  function acceptManualRoll() {
    if (isSolaceNeutral) return;

    const r = Number(manualRoll);
    if (!Number.isInteger(r) || r <= 0) return;

    setRawRoll(r);
    setDisplayRoll(r);
    playSfx(SFX.diceLand, 0.6);
  }

  const effectiveRoll = useMemo(() => {
    if (rawRoll === null) return null;
    return rawRoll + safeInt(rollModifier, 0);
  }, [rawRoll, rollModifier]);

  const margin = useMemo(() => {
    if (effectiveRoll === null) return null;
    return effectiveRoll - dc;
  }, [effectiveRoll, dc]);

  /* ----------------------------------------------------------
     Creative narration (NON-AUTHORITATIVE flavor)
  ---------------------------------------------------------- */

  const generatedNarration = useMemo(() => {
    if (rawRoll === null || effectiveRoll === null) return "";

    const localMargin = effectiveRoll - dc;

    const truth = isSolaceNeutral
      ? {
          setup: (setupText ?? "").trim() || undefined,
          movement: movement
            ? {
                from: movement.from ?? undefined,
                to: movement.to ?? undefined,
                direction: movement.direction ?? undefined,
              }
            : undefined,
          combat: combat
            ? {
                activeEnemyGroupName: combat.activeEnemyGroupName ?? undefined,
                isEnemyTurn: !!combat.isEnemyTurn,
                attackStyleHint: combat.attackStyleHint ?? "unknown",
              }
            : undefined,
          mechanics: {
            dc,
            roll: effectiveRoll,
            rawRoll,
            rollModifier: safeInt(rollModifier, 0),
            margin: localMargin,
            success: localMargin >= 0,
            optionKind: context.optionKind,
          },
        }
      : undefined;

    return generateNarration({
      intentText: context.optionDescription,
      margin: localMargin,
      lens: isSolaceNeutral ? "mythic" : "heroic",
      depth: isSolaceNeutral ? 2 : 1.5,
      truth,
    });
  }, [
    rawRoll,
    effectiveRoll,
    dc,
    context.optionDescription,
    context.optionKind,
    isSolaceNeutral,
    setupText,
    movement,
    combat,
    rollModifier,
  ]);

  useEffect(() => {
    if (rawRoll === null) return;

    if (isSolaceNeutral) {
      setDraftText(generatedNarration);
      return;
    }

    if (draftText === "") {
      setDraftText(generatedNarration);
    }
  }, [rawRoll, generatedNarration, draftText, isSolaceNeutral]);

  /* ----------------------------------------------------------
     Commit (arbiter authority)
  ---------------------------------------------------------- */

  function handleRecord() {
    if (rawRoll === null || effectiveRoll === null || committedRef.current || isRolling) return;
    committedRef.current = true;

    const source: RollSource = manualRoll ? "manual" : "solace";

    const audit: string[] = [];
    audit.push("Drafted by CreativeNarrator");

    const mod = safeInt(rollModifier, 0);
    if (mod !== 0) {
      const modLabel = (rollModifierLabel ?? "").trim();
      const labelPart = modLabel ? ` (${modLabel})` : "";
      audit.push(
        `Roll modifier applied${labelPart}: ${mod >= 0 ? `+${mod}` : `${mod}`} (raw ${rawRoll} → effective ${effectiveRoll})`
      );
    } else {
      audit.push(`Roll: raw ${rawRoll} (no modifier)`);
    }

    if (isSolaceNeutral) {
      audit.push("Presented as Solace (Neutral Facilitator) Arbiter narration (read-only)");
      audit.push("Digital roll path only");
      audit.push("Recorded by Arbiter");
    } else {
      audit.push(manualRoll ? "Physical roll accepted by Arbiter" : "Digital roll used");
      audit.push("Edited by Arbiter");
    }

    playSfx(SFX.recordOutcome, 0.74);

    onRecord({
      description: draftText.trim(),
      dice: { mode: diceMode, roll: effectiveRoll, dc, source },
      audit,
    });
  }

  /* ---------------------------------------------------------- */

  const showAnchors =
    isSolaceNeutral &&
    rawRoll !== null &&
    (!!setupText || !!movement?.from || !!movement?.to || !!combat?.activeEnemyGroupName);

  const resultTone =
    margin === null ? "pending" : toneForMargin(margin);

  const resultToneStyle: React.CSSProperties =
    resultTone === "decisive-success"
      ? {
          border: "1px solid rgba(120,190,140,0.28)",
          background: "rgba(120,190,140,0.10)",
        }
      : resultTone === "success"
        ? {
            border: "1px solid rgba(120,170,255,0.24)",
            background: "rgba(120,170,255,0.09)",
          }
        : resultTone === "hard-failure"
          ? {
              border: "1px solid rgba(220,120,120,0.28)",
              background: "rgba(220,120,120,0.10)",
            }
          : resultTone === "failure"
            ? {
                border: "1px solid rgba(255,196,118,0.22)",
                background: "rgba(255,196,118,0.08)",
              }
            : {
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
              };

  const momentHeadline = margin === null ? "Awaiting roll" : toneHeadline(resultTone);
  const momentSubline = toneSubline(resultTone, margin);
  const hasNarration = draftText.trim().length > 0 || generatedNarration.trim().length > 0;
  const phaseSteps = ritualPhaseSteps({ rawRoll, isRolling, hasNarration });
  const phaseLabel = ritualPhaseLabel({ rawRoll, isRolling, draftText });

  const commitSummary =
    rawRoll === null || effectiveRoll === null
      ? "A result is required before the outcome can be recorded."
      : `${effectiveRoll >= dc ? "Success" : "Failure"} will be recorded as canon using ${manualRoll ? "the accepted physical roll" : "the digital roll"}.`;

  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(circle at top, rgba(255,194,116,0.06), transparent 24%), linear-gradient(180deg, rgba(17,17,17,0.92), rgba(10,10,10,0.88))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px rgba(0,0,0,0.24)",
        padding: 18,
      }}
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 0.2 }}>
            Adjudication
          </div>
          <div style={{ fontSize: 13, opacity: 0.76, lineHeight: 1.6 }}>
            Fate now weighs the intent against the danger of the moment.
          </div>
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.7, opacity: 0.62 }}>
              Ritual Progress
            </div>
            <div style={{ fontSize: 12, opacity: 0.78 }}>{phaseLabel}</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            {phaseSteps.map((step) => {
              const isDone = step.state === "done";
              const isActive = step.state === "active";

              return (
                <div
                  key={step.label}
                  style={{
                    padding: "10px 10px",
                    borderRadius: 12,
                    border: isActive
                      ? "1px solid rgba(255,196,118,0.24)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: isDone
                      ? "rgba(120,170,255,0.08)"
                      : isActive
                        ? "rgba(255,196,118,0.08)"
                        : "rgba(255,255,255,0.03)",
                    minHeight: 56,
                    display: "grid",
                    alignContent: "center",
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 10, opacity: 0.62, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {isDone ? "Done" : isActive ? "Now" : "Pending"}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 14,
            alignItems: "start",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.62 }}>
              Resolution Context
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.65, opacity: 0.92 }}>
              {context.optionDescription}
            </div>
          </div>

          <div
            style={{
              minWidth: 160,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.62 }}>
              Difficulty
            </div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>DC {dc}</div>
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
              Tone: {optionKindLabel(context.optionKind)}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.62 }}>
            Moment of Truth
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.25 }}>{momentHeadline}</div>
          <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.55 }}>{momentSubline}</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 220px",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.62 }}>
                  Roll Method
                </div>
                <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>
                  {isSolaceNeutral ? "Digital roll only" : "Digital or physical roll"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.62 }}>
                  Dice
                </div>
                <div style={{ marginTop: 6 }}>
                  <select
                    value={diceMode}
                    onChange={(e) => setDiceMode(e.target.value as DiceMode)}
                    disabled={isRolling}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "inherit",
                    }}
                  >
                    <option>d4</option>
                    <option>d6</option>
                    <option>d8</option>
                    <option>d10</option>
                    <option>d12</option>
                    <option>d20</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={rollDice}
                disabled={isRolling}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,196,118,0.28)",
                  background: isRolling
                    ? "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))"
                    : "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))",
                  color: isRolling ? "rgba(244,227,201,0.75)" : "#2f1606",
                  boxShadow: isRolling
                    ? "none"
                    : "0 10px 28px rgba(255,145,42,0.16), inset 0 1px 0 rgba(255,244,220,0.72)",
                  fontWeight: 900,
                  cursor: isRolling ? "not-allowed" : "pointer",
                }}
              >
                {isRolling ? "Rolling..." : "Roll Fate"}
              </button>

              {!isSolaceNeutral && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    placeholder="Enter physical roll"
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value)}
                    disabled={isRolling}
                    style={{
                      minWidth: 170,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "inherit",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={acceptManualRoll}
                    disabled={isRolling}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "inherit",
                      cursor: isRolling ? "not-allowed" : "pointer",
                    }}
                  >
                    Accept Physical Roll
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                ...resultToneStyle,
                padding: "14px 16px",
                borderRadius: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.68 }}>
                Fate Result
              </div>

              <div style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
                <div
                  style={{
                    fontSize: 46,
                    fontWeight: 950,
                    lineHeight: 1,
                    minWidth: 56,
                    transform: isRolling ? "scale(1.06) rotate(-2deg)" : "scale(1)",
                    transition: "transform 120ms ease",
                    textShadow: isRolling ? "0 0 18px rgba(255,196,118,0.16)" : "none",
                  }}
                >
                  {displayRoll ?? "—"}
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 14, opacity: 0.84 }}>
                    {rawRoll === null
                      ? "Awaiting roll."
                      : safeInt(rollModifier, 0) !== 0 && effectiveRoll !== null
                        ? `Raw ${rawRoll} ${safeInt(rollModifier, 0) >= 0 ? "+" : ""}${safeInt(rollModifier, 0)} → Effective ${effectiveRoll}`
                        : `Effective roll ${effectiveRoll}`}
                  </div>

                  {rawRoll !== null && effectiveRoll !== null && (
                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                      vs DC <strong>{dc}</strong>{" "}
                      {margin !== null && (
                        <>
                          · Margin{" "}
                          <strong>
                            {margin >= 0 ? "+" : ""}
                            {margin}
                          </strong>
                        </>
                      )}
                    </div>
                  )}

                  {safeInt(rollModifier, 0) !== 0 && (
                    <div style={{ fontSize: 12, opacity: 0.72 }}>
                      Modifier {safeInt(rollModifier, 0) >= 0 ? "+" : ""}
                      {safeInt(rollModifier, 0)}
                      {rollModifierLabel ? ` · ${rollModifierLabel}` : ""}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "16px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: 126,
                height: 126,
                borderRadius: 22,
                border: "1px solid rgba(255,196,118,0.22)",
                background:
                  "radial-gradient(circle at 30% 25%, rgba(255,220,160,0.18), rgba(255,196,118,0.05) 36%, rgba(0,0,0,0.18) 72%)",
                boxShadow: isRolling
                  ? "0 0 0 6px rgba(255,196,118,0.04), 0 0 28px rgba(255,196,118,0.14)"
                  : "0 0 0 4px rgba(255,196,118,0.03)",
                display: "grid",
                placeItems: "center",
                transform: isRolling ? "rotate(10deg) scale(1.04)" : "rotate(0deg) scale(1)",
                transition: "transform 120ms ease, box-shadow 120ms ease",
              }}
            >
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.34)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 34,
                  fontWeight: 950,
                }}
              >
                {displayRoll ?? "?"}
              </div>
            </div>
          </div>
        </div>

        {rawRoll !== null && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.62 }}>
              Consequence Standing
            </div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{commitSummary}</div>
            <div style={{ fontSize: 12, opacity: 0.76 }}>
              The Arbiter may review the narration, then commit the moment into canon.
            </div>
          </div>
        )}

        {rawRoll !== null && (
          <>
            {isSolaceNeutral ? (
              <>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.62 }}>
                    Arbiter Narration
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.78 }}>
                    Solace (Neutral Facilitator) · Read-only
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      background: "rgba(0,0,0,0.28)",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.65,
                    }}
                  >
                    {draftText || generatedNarration || "—"}
                  </div>

                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
                    Narration is read-only in Solace-neutral mode.
                  </div>

                  {showAnchors && (
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ cursor: "pointer", opacity: 0.9 }}>
                        Truth anchors
                      </summary>
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85, lineHeight: 1.55 }}>
                        {!!setupText && (
                          <div style={{ marginBottom: 6 }}>
                            <strong>Setup:</strong> {String(setupText).slice(0, 240)}
                            {String(setupText).length > 240 ? "…" : ""}
                          </div>
                        )}

                        {(movement?.from || movement?.to) && (
                          <div style={{ marginBottom: 6 }}>
                            <strong>Movement:</strong>{" "}
                            {movement?.from ? `(${movement.from.x},${movement.from.y})` : "(?)"}{" "}
                            {movement?.direction && movement.direction !== "none" ? `→ ${movement.direction}` : ""}
                            {"  "}
                            {movement?.to ? `(${movement.to.x},${movement.to.y})` : "(?)"}
                          </div>
                        )}

                        {!!combat?.activeEnemyGroupName && (
                          <div style={{ marginBottom: 6 }}>
                            <strong>Combat:</strong> {combat.activeEnemyGroupName}
                            {combat.isEnemyTurn ? " (enemy turn)" : ""}
                          </div>
                        )}

                        <div>
                          <strong>Mechanics:</strong>{" "}
                          {effectiveRoll !== null ? (
                            <>
                              margin {effectiveRoll - dc >= 0 ? "+" : ""}
                              {effectiveRoll - dc} (effective {effectiveRoll} vs DC {dc}
                              {safeInt(rollModifier, 0) !== 0 ? `; raw ${rawRoll}` : ""})
                            </>
                          ) : (
                            <>—</>
                          )}
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.62 }}>
                  Narration
                </div>
                <div style={{ fontSize: 12, opacity: 0.76 }}>
                  Arbiter-editable in Human mode
                </div>
                <textarea
                  rows={5}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.28)",
                    color: "inherit",
                    padding: "12px 12px",
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              </div>
            )}
          </>
        )}

        {role === "arbiter" && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleRecord}
              disabled={rawRoll === null || isRolling}
              style={{
                padding: "11px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,196,118,0.28)",
                background:
                  rawRoll === null || isRolling
                    ? "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))"
                    : "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))",
                color:
                  rawRoll === null || isRolling
                    ? "rgba(244,227,201,0.75)"
                    : "#2f1606",
                boxShadow:
                  rawRoll === null || isRolling
                    ? "none"
                    : "0 10px 28px rgba(255,145,42,0.16), inset 0 1px 0 rgba(255,244,220,0.72)",
                fontWeight: 900,
                cursor: rawRoll === null || isRolling ? "not-allowed" : "pointer",
              }}
            >
              Record Outcome
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
