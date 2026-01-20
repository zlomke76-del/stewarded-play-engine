"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel
// ------------------------------------------------------------
// Governing contract:
// - Drafted by Solace (non-authoritative)
// - Dice are advisory only
// - Arbiter edits + records canon
// - Full audit ribbon always visible
// - No ruleset assumptions
// ------------------------------------------------------------

import { useState } from "react";

type DiceMode =
  | "d4"
  | "d6"
  | "d8"
  | "d10"
  | "d12"
  | "d20"
  | "d100";

type OutcomeBand = "success" | "partial" | "failure";

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
      roll: number | null;
      dc: number;
      justification: string;
      outcome: OutcomeBand | null;
    };
    audit: string[];
  }) => void;
};

// ------------------------------------------------------------
// Difficulty mapping (transparent + visible)
// ------------------------------------------------------------

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return { dc: 0, justification: "Safe action" };
    case "environmental":
      return { dc: 6, justification: "Environmental uncertainty" };
    case "risky":
      return { dc: 10, justification: "Risky action" };
    case "contested":
      return { dc: 14, justification: "Contested action" };
    default:
      return { dc: 10, justification: "Default risk" };
  }
}

// ------------------------------------------------------------
// Dice rolling (polyhedral)
// ------------------------------------------------------------

function rollDice(mode: DiceMode): number {
  switch (mode) {
    case "d4":
      return Math.ceil(Math.random() * 4);
    case "d6":
      return Math.ceil(Math.random() * 6);
    case "d8":
      return Math.ceil(Math.random() * 8);
    case "d10":
      return Math.ceil(Math.random() * 10);
    case "d12":
      return Math.ceil(Math.random() * 12);
    case "d20":
      return Math.ceil(Math.random() * 20);
    case "d100":
      return (
        Math.floor(Math.random() * 10) * 10 +
        Math.floor(Math.random() * 10)
      );
  }
}

// ------------------------------------------------------------
// Outcome evaluation (advisory only)
// ------------------------------------------------------------

function evaluateOutcome(
  roll: number,
  dc: number
): { band: OutcomeBand; explanation: string } {
  if (roll >= dc + 4) {
    return {
      band: "success",
      explanation:
        "The roll clearly exceeds the difficulty, indicating a clean success.",
    };
  }

  if (roll >= dc) {
    return {
      band: "partial",
      explanation:
        "The roll meets the difficulty, but uncertainty introduces cost or complication.",
    };
  }

  return {
    band: "failure",
    explanation:
      "The roll falls short of the difficulty, indicating the attempt does not resolve as intended.",
  };
}

// ------------------------------------------------------------

export default function ResolutionDraftPanel({
  context,
  role,
  onRecord,
}: Props) {
  const { dc, justification } = difficultyFor(context.optionKind);

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);

  const [manualRoll, setManualRoll] = useState(false);
  const [manualValue, setManualValue] = useState<number>(0);

  const [outcome, setOutcome] = useState<OutcomeBand | null>(
    null
  );
  const [outcomeExplanation, setOutcomeExplanation] =
    useState<string>("");

  const [draft, setDraft] = useState(
    `The situation resolves based on the chosen path: ${context.optionDescription}.`
  );

  const [consequences, setConsequences] = useState<
    Record<string, boolean>
  >({
    time: false,
    resources: false,
    threat: false,
    position: false,
    information: false,
    complication: false,
  });

  const [audit, setAudit] = useState<string[]>([
    "Drafted by Solace",
  ]);

  // ----------------------------------------------------------

  function handleRoll() {
    const value = manualRoll
      ? manualValue
      : rollDice(diceMode);

    setRoll(value);

    const evaluation = evaluateOutcome(value, dc);
    setOutcome(evaluation.band);
    setOutcomeExplanation(evaluation.explanation);

    setAudit((a) => [
      ...a,
      manualRoll
        ? `Dice entered manually (${diceMode}): ${value}`
        : `Dice rolled (${diceMode}): ${value}`,
    ]);

    setDraft(() => {
      switch (evaluation.band) {
        case "success":
          return `Success: ${context.optionDescription} resolves cleanly.`;
        case "partial":
          return `Partial success: ${context.optionDescription} resolves, but with complications or cost.`;
        case "failure":
          return `Failure: ${context.optionDescription} does not resolve as intended.`;
      }
    });
  }

  function handleEdit(text: string) {
    setDraft(text);
    if (!audit.includes("Edited by Arbiter")) {
      setAudit((a) => [...a, "Edited by Arbiter"]);
    }
  }

  function toggleConsequence(key: string) {
    setConsequences((c) => ({
      ...c,
      [key]: !c[key],
    }));
  }

  function handleRecord() {
    if (!draft.trim()) return;

    onRecord({
      description: draft,
      dice: {
        mode: diceMode,
        roll,
        dc,
        justification,
        outcome,
      },
      audit: [...audit, "Recorded by Arbiter"],
    });
  }

  // ----------------------------------------------------------

  return (
    <section className="resolution-draft">
      <h3>Resolution Draft</h3>

      <p className="muted">
        🎲 Difficulty {dc} — {justification}
      </p>

      <label>
        Dice system:&nbsp;
        <select
          value={diceMode}
          onChange={(e) =>
            setDiceMode(e.target.value as DiceMode)
          }
        >
          <option value="d4">d4</option>
          <option value="d6">d6</option>
          <option value="d8">d8</option>
          <option value="d10">d10</option>
          <option value="d12">d12</option>
          <option value="d20">d20</option>
          <option value="d100">d100 / percentile</option>
        </select>
      </label>

      <div style={{ marginTop: 8 }}>
        <label>
          <input
            type="checkbox"
            checked={manualRoll}
            onChange={(e) =>
              setManualRoll(e.target.checked)
            }
          />{" "}
          Enter roll manually
        </label>

        {manualRoll && (
          <input
            type="number"
            value={manualValue}
            onChange={(e) =>
              setManualValue(Number(e.target.value))
            }
            style={{ marginLeft: 8, width: 80 }}
          />
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={handleRoll}>Roll Dice</button>
        {roll !== null && (
          <span style={{ marginLeft: 8 }}>
            Result: <strong>{roll}</strong>
          </span>
        )}
      </div>

      {outcome && (
        <p className="muted" style={{ marginTop: 8 }}>
          <strong>{outcome.toUpperCase()}:</strong>{" "}
          {outcomeExplanation}
        </p>
      )}

      {(outcome === "partial" || outcome === "failure") && (
        <div style={{ marginTop: 8 }}>
          <p className="muted">
            Possible consequence categories (optional):
          </p>
          {[
            ["time", "Time cost"],
            ["resources", "Resource loss"],
            ["threat", "New threat"],
            ["position", "Worsened position"],
            ["information", "Information revealed"],
            ["complication", "Narrative complication"],
          ].map(([key, label]) => (
            <label
              key={key}
              style={{ display: "block" }}
            >
              <input
                type="checkbox"
                checked={consequences[key]}
                onChange={() =>
                  toggleConsequence(key)
                }
              />{" "}
              {label}
            </label>
          ))}
        </div>
      )}

      <textarea
        rows={4}
        style={{ width: "100%", marginTop: 12 }}
        value={draft}
        onChange={(e) => handleEdit(e.target.value)}
      />

      {role === "arbiter" && (
        <button
          style={{ marginTop: 8 }}
          onClick={handleRecord}
        >
          Record Outcome
        </button>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        {audit.join(" · ")}
      </p>
    </section>
  );
}
