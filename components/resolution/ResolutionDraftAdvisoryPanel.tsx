"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract (HUMAN-ARBITER):
// - Dice decide fate
// - Solace narrates the dice (not outcomes)
// - Human Arbiter binds canon
// - Player may roll physically or digitally
// - Invalid rolls are rejected
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "solace" | "player-ui" | "player-manual";

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
      justification: string;
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
      return { dc: 6, justification: "Low immediate risk" };
    case "environmental":
      return { dc: 8, justification: "Environmental uncertainty" };
    case "risky":
      return { dc: 10, justification: "Meaningful risk involved" };
    case "contested":
      return { dc: 14, justification: "Active opposition expected" };
    default:
      return { dc: 10, justification: "Outcome uncertain" };
  }
}

function diceMax(mode: DiceMode): number {
  return parseInt(mode.replace("d", ""), 10);
}

/* ------------------------------------------------------------ */

export default function ResolutionDraftAdvisoryPanel({
  context,
  role,
  onRecord,
}: Props) {
  const base = difficultyFor(context.optionKind);

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [rollSource, setRollSource] =
    useState<RollSource>("solace");
  const [manualInput, setManualInput] =
    useState<string>("");

  const committedRef = useRef(false);

  // Reset on new intent
  useEffect(() => {
    setRoll(null);
    setManualInput("");
    committedRef.current = false;
  }, [context.optionDescription]);

  /* ----------------------------------------------------------
     Dice narration (interesting, non-authoritative)
  ---------------------------------------------------------- */

  const narration = useMemo(() => {
    if (roll === null) {
      return "The moment tightens. This comes down to the roll.";
    }

    const delta = roll - base.dc;

    if (delta >= 6) {
      return "That’s overwhelming. The numbers don’t hesitate.";
    }

    if (delta >= 1) {
      return "It clears the bar — barely enough, but enough.";
    }

    if (delta === 0) {
      return "Right on the edge. No margin at all.";
    }

    if (delta >= -3) {
      return "Close — but the dice don’t give it to you.";
    }

    return "That goes badly. The roll leaves no room to argue.";
  }, [roll, base.dc]);

  /* ----------------------------------------------------------
     Roll handlers
  ---------------------------------------------------------- */

  function rollDigitally() {
    const max = diceMax(diceMode);
    const r = Math.ceil(Math.random() * max);
    setRoll(r);
    setRollSource("player-ui");
  }

  function acceptManualRoll() {
    const value = Number(manualInput);
    const max = diceMax(diceMode);

    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value > max
    ) {
      alert(
        `Invalid roll. ${diceMode} must be between 1 and ${max}.`
      );
      return;
    }

    setRoll(value);
    setRollSource("player-manual");
  }

  /* ----------------------------------------------------------
     Commit canon (manual, arbiter only)
  ---------------------------------------------------------- */

  function handleRecord() {
    if (committedRef.current || roll === null) return;
    committedRef.current = true;

    onRecord({
      description: narration,
      dice: {
        mode: diceMode,
        roll,
        dc: base.dc,
        justification: base.justification,
        source: rollSource,
      },
      audit: [
        "Dice determine fate",
        `Roll source: ${rollSource}`,
        "Canon recorded by Arbiter",
      ],
    });
  }

  /* ----------------------------------------------------------
     UI
  ---------------------------------------------------------- */

  return (
    <section
      style={{
        border: "1px dashed #666",
        padding: 16,
        marginTop: 16,
      }}
    >
      <h3>Resolution Draft</h3>

      <p className="muted">
        Difficulty {base.dc} — {base.justification}
      </p>

      <label>
        Dice:&nbsp;
        <select
          value={diceMode}
          onChange={(e) =>
            setDiceMode(e.target.value as DiceMode)
          }
          disabled={roll !== null}
        >
          {["d4", "d6", "d8", "d10", "d12", "d20"].map(
            (d) => (
              <option key={d} value={d}>
                {d}
              </option>
            )
          )}
        </select>
      </label>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={rollDigitally}
          disabled={roll !== null}
        >
          Roll Here
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <input
          type="number"
          placeholder="Enter physical roll"
          value={manualInput}
          onChange={(e) =>
            setManualInput(e.target.value)
          }
          disabled={roll !== null}
          style={{ width: 140 }}
        />
        <button
          onClick={acceptManualRoll}
          disabled={roll !== null}
          style={{ marginLeft: 8 }}
        >
          Accept Roll
        </button>
      </div>

      {roll !== null && (
        <>
          <p style={{ marginTop: 12 }}>
            🎲 {diceMode} rolled{" "}
            <strong>{roll}</strong> vs DC{" "}
            <strong>{base.dc}</strong>
          </p>

          <p>{narration}</p>
        </>
      )}

      {role === "arbiter" && (
        <button
          onClick={handleRecord}
          disabled={roll === null}
          style={{ marginTop: 12 }}
        >
          Record Outcome
        </button>
      )}
    </section>
  );
}
