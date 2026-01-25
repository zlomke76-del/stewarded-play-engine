"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract (HUMAN-ARBITER):
// - Solace drafts only (non-authoritative)
// - Dice decide outcome
// - Solace narrates strain on the PLAN, not player failure
// - Human Arbiter explicitly records canon
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

export type ResolutionContext = {
  optionDescription: string;
  optionKind?: "safe" | "environmental" | "risky" | "contested";
};

type Props = {
  context: ResolutionContext;
  role: "arbiter";
  onRecord: (payload: {
    description: string;
    dice: {
      mode: DiceMode;
      roll: number;
      dc: number;
      source: RollSource;
    };
    audit: string[];
  }) => void;
};

/* ------------------------------------------------------------
   Difficulty framing (advisory)
------------------------------------------------------------ */

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
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

/* ------------------------------------------------------------
   Intent analysis
------------------------------------------------------------ */

function analyzeIntent(text: string) {
  const t = text.toLowerCase();

  return {
    stealth: t.includes("stealth") || t.includes("sneak") || t.includes("scout"),
    magic: t.includes("spell") || t.includes("cantrip") || t.includes("detect"),
    force: t.includes("attack") || t.includes("grip") || t.includes("ready"),
    caution: t.includes("careful") || t.includes("quiet") || t.includes("if clear"),
  };
}

/* ------------------------------------------------------------
   Narrative synthesis
------------------------------------------------------------ */

function narrateOutcome(
  intent: string,
  roll: number,
  dc: number
): string {
  const margin = roll - dc;
  const intentShape = analyzeIntent(intent);

  // SUCCESS — clean or strong
  if (margin >= 3) {
    return "The plan unfolds cleanly. Each role holds, and the path ahead opens without resistance.";
  }

  if (margin >= 0) {
    return "The plan holds, though only just. Small adjustments keep things quiet — for now.";
  }

  // FAILURE — strain, not stupidity
  if (margin >= -2) {
    if (intentShape.stealth) {
      return "The formation stays tight, but something feels off. Sound carries farther than expected, and caution slows the advance.";
    }
    if (intentShape.magic) {
      return "The magic hums uncertainly, offering no clear warning — absence of certainty becomes its own risk.";
    }
    return "The approach meets resistance from the environment itself. Progress slows under growing tension.";
  }

  // HARD FAILURE
  if (intentShape.stealth) {
    return "Movement betrays you — not loudly, but unmistakably. The plan fractures at its edges as attention shifts your way.";
  }

  return "The plan collapses under pressure. What should have been controlled becomes exposed, forcing immediate decisions.";
}

/* ------------------------------------------------------------ */

export default function ResolutionDraftAdvisoryPanel({
  context,
  role,
  onRecord,
}: Props) {
  const dc = difficultyFor(context.optionKind);

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [manualRoll, setManualRoll] = useState<string>("");

  const committedRef = useRef(false);

  useEffect(() => {
    setRoll(null);
    setManualRoll("");
    committedRef.current = false;
  }, [context.optionDescription]);

  function rollDice() {
    const max = parseInt(diceMode.slice(1), 10);
    const r = Math.ceil(Math.random() * max);
    setRoll(r);
  }

  function acceptManualRoll() {
    const r = Number(manualRoll);
    if (!Number.isInteger(r) || r <= 0) return;
    setRoll(r);
  }

  const narration =
    roll !== null
      ? narrateOutcome(context.optionDescription, roll, dc)
      : "The moment stretches as fate waits on the dice.";

  function handleRecord() {
    if (roll === null || committedRef.current) return;
    committedRef.current = true;

    onRecord({
      description: narration,
      dice: {
        mode: diceMode,
        roll,
        dc,
        source: manualRoll ? "manual" : "solace",
      },
      audit: ["Drafted by Solace", "Recorded by Arbiter"],
    });
  }

  return (
    <section style={{ border: "1px dashed #666", padding: 16 }}>
      <h3>Resolution Draft</h3>

      <p className="muted">
        Difficulty {dc} — Dice decide outcome
      </p>

      <label>
        Dice:
        <select
          value={diceMode}
          onChange={(e) =>
            setDiceMode(e.target.value as DiceMode)
          }
        >
          <option>d4</option>
          <option>d6</option>
          <option>d8</option>
          <option>d10</option>
          <option>d12</option>
          <option>d20</option>
        </select>
      </label>

      <div style={{ marginTop: 8 }}>
        <button onClick={rollDice}>Roll Here</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <input
          placeholder="Enter physical roll"
          value={manualRoll}
          onChange={(e) => setManualRoll(e.target.value)}
        />
        <button onClick={acceptManualRoll}>Accept Roll</button>
      </div>

      {roll !== null && (
        <p>
          🎲 {diceMode} rolled <strong>{roll}</strong> vs DC{" "}
          <strong>{dc}</strong>
        </p>
      )}

      <p>{narration}</p>

      {role === "arbiter" && (
        <button
          onClick={handleRecord}
          disabled={roll === null}
        >
          Record Outcome
        </button>
      )}
    </section>
  );
}
