"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel
// ------------------------------------------------------------
// Governing contract:
// - Drafted by Solace (non-authoritative)
// - Dice are advisory only
// - Arbiter edits + records canon
// - Full audit ribbon always visible
// ------------------------------------------------------------

import { useState } from "react";

/* ------------------------------------------------------------ */
/* Dice Types                                                   */
/* ------------------------------------------------------------ */

type DiceMode =
  | "d4"
  | "d6"
  | "d8"
  | "d10"
  | "d12"
  | "d20"
  | "d100";

type EvalResult = "success" | "partial" | "failure";

/* ------------------------------------------------------------ */
/* Props & Context                                              */
/* ------------------------------------------------------------ */

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
      evaluation: EvalResult | null;
      justification: string;
      manual: boolean;
    };
    audit: string[];
  }) => void;
};

/* ------------------------------------------------------------ */
/* Difficulty Mapping (Transparent & Visible)                   */
/* ------------------------------------------------------------ */

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

/* ------------------------------------------------------------ */
/* Dice Roller                                                  */
/* ------------------------------------------------------------ */

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

/* ------------------------------------------------------------ */
/* Roll Evaluation (Advisory)                                   */
/* ------------------------------------------------------------ */

function evaluateRoll(
  roll: number,
  dc: number
): EvalResult {
  if (dc === 0) return "success";
  if (roll >= dc + 4) return "success";
  if (roll >= dc) return "partial";
  return "failure";
}

/* ------------------------------------------------------------ */
/* Component                                                    */
/* ------------------------------------------------------------ */

export default function ResolutionDraftPanel({
  context,
  role,
  onRecord,
}: Props) {
  const { dc, justification } = difficultyFor(context.optionKind);

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [manual, setManual] = useState(false);
  const [manualValue, setManualValue] = useState<number>(0);

  const [roll, setRoll] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<EvalResult | null>(null);

  const [draft, setDraft] = useState(
    `The situation follows the chosen path: ${context.optionDescription}.`
  );

  const [audit, setAudit] = useState<string[]>([
    "Drafted by Solace",
  ]);

  /* ---------------------------------------------------------- */
  /* Pre-roll Resolution Bands (Solace Draft)                   */
  /* ---------------------------------------------------------- */

  const bands = {
    success: `Success: ${context.optionDescription} resolves cleanly and decisively.`,
    partial: `Partial success: ${context.optionDescription} resolves, but with complications or cost.`,
    failure: `Failure: ${context.optionDescription} does not resolve as intended.`,
  };

  /* ---------------------------------------------------------- */
  /* Dice Roll                                                  */
  /* ---------------------------------------------------------- */

  function handleRoll() {
    const value = manual ? manualValue : rollDice(diceMode);
    const result = evaluateRoll(value, dc);

    setRoll(value);
    setEvaluation(result);

    setDraft(bands[result]);

    setAudit((a) => [
      ...a,
      `Dice rolled (${diceMode}): ${value}`,
      `Evaluated as ${result}`,
    ]);
  }

  /* ---------------------------------------------------------- */
  /* Arbiter Edit                                               */
  /* ---------------------------------------------------------- */

  function handleEdit(text: string) {
    setDraft(text);
    if (!audit.includes("Edited by Arbiter")) {
      setAudit((a) => [...a, "Edited by Arbiter"]);
    }
  }

  /* ---------------------------------------------------------- */
  /* Record Outcome                                             */
  /* ---------------------------------------------------------- */

  function handleRecord() {
    if (!draft.trim()) return;

    onRecord({
      description: draft,
      dice: {
        mode: diceMode,
        roll,
        dc,
        evaluation,
        justification,
        manual,
      },
      audit: [...audit, "Recorded by Arbiter"],
    });
  }

  /* ---------------------------------------------------------- */
  /* Render                                                     */
  /* ---------------------------------------------------------- */

  return (
    <section
      style={{
        border: "1px dashed #666",
        padding: 16,
        borderRadius: 6,
        marginTop: 16,
      }}
    >
      <h3>Resolution Draft</h3>

      <p className="muted">
        🎲 Difficulty {dc} — {justification}
      </p>

      {/* Dice Controls */}
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
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />{" "}
          Enter roll manually
        </label>

        {manual && (
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
            Result: <strong>{roll}</strong>{" "}
            {evaluation && `(${evaluation})`}
          </span>
        )}
      </div>

      {/* Draft Text */}
      <textarea
        rows={4}
        style={{ width: "100%", marginTop: 12 }}
        value={draft}
        onChange={(e) => handleEdit(e.target.value)}
      />

      {/* Record */}
      {role === "arbiter" && (
        <button
          style={{ marginTop: 8 }}
          onClick={handleRecord}
        >
          Record Outcome
        </button>
      )}

      {/* Audit */}
      <p className="muted" style={{ marginTop: 8 }}>
        {audit.join(" · ")}
      </p>
    </section>
  );
}
