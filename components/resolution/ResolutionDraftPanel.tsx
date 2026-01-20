"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel — Polyhedral Governed
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import CardSection from "@/components/layout/CardSection";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type DiceMode =
  | "d4"
  | "d6"
  | "d8"
  | "d10"
  | "d12"
  | "d20"
  | "d100";

type EvalResult = "success" | "partial" | "failure";

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
      evaluation: EvalResult | null;
      manual: boolean;
    };
    audit: string[];
  }) => void;
};

// ------------------------------------------------------------
// Difficulty + recommendation mapping
// ------------------------------------------------------------

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return { dc: 4, justification: "Low-impact, safe action", recommend: "d4" };
    case "environmental":
      return {
        dc: 6,
        justification: "Environmental uncertainty",
        recommend: "d6",
      };
    case "risky":
      return { dc: 10, justification: "Risky action", recommend: "d10" };
    case "contested":
      return {
        dc: 14,
        justification: "Contested or opposed action",
        recommend: "d20",
      };
    default:
      return { dc: 8, justification: "Uncertain action", recommend: "d8" };
  }
}

// ------------------------------------------------------------
// Dice rolling
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
      return Math.ceil(Math.random() * 100);
  }
}

// ------------------------------------------------------------
// Evaluation logic (system-agnostic)
// ------------------------------------------------------------

function evaluateRoll(
  roll: number,
  dc: number
): EvalResult {
  if (roll >= dc + 4) return "success";
  if (roll >= dc) return "partial";
  return "failure";
}

// ------------------------------------------------------------

export default function ResolutionDraftPanel({
  context,
  role,
  onRecord,
}: Props) {
  const { dc, justification, recommend } = difficultyFor(context.optionKind);

  const [diceMode, setDiceMode] = useState<DiceMode>(recommend);
  const [roll, setRoll] = useState<number | null>(null);
  const [manual, setManual] = useState(false);
  const [manualValue, setManualValue] = useState<number>(0);

  const [evaluation, setEvaluation] = useState<EvalResult | null>(null);
  const [draft, setDraft] = useState("");
  const [audit, setAudit] = useState<string[]>(["Drafted by Solace"]);

  // ----------------------------------------------------------
  // Initial Solace draft
  // ----------------------------------------------------------

  useEffect(() => {
    setDraft(
      `Solace proposes a possible resolution: ${context.optionDescription}. The outcome will depend on the roll.`
    );
    setAudit(["Drafted by Solace"]);
    setRoll(null);
    setEvaluation(null);
    setDiceMode(recommend);
  }, [context.optionDescription, recommend]);

  // ----------------------------------------------------------
  // Roll dice
  // ----------------------------------------------------------

  function handleRoll() {
    const value = manual ? manualValue : rollDice(diceMode);
    setRoll(value);

    const result = evaluateRoll(value, dc);
    setEvaluation(result);

    setDraft(() => {
      switch (result) {
        case "success":
          return `The action succeeds. ${context.optionDescription} resolves cleanly.`;
        case "partial":
          return `The action partially succeeds. ${context.optionDescription} resolves, but with complications.`;
        case "failure":
          return `The action fails. ${context.optionDescription} does not resolve as intended.`;
      }
    });

    setAudit((a) => [
      ...a,
      `Dice rolled (${diceMode}): ${value}`,
      `Evaluated as ${result}`,
    ]);
  }

  // ----------------------------------------------------------
  // Arbiter edits
  // ----------------------------------------------------------

  function handleEdit(text: string) {
    setDraft(text);
    if (!audit.includes("Edited by Arbiter")) {
      setAudit((a) => [...a, "Edited by Arbiter"]);
    }
  }

  // ----------------------------------------------------------
  // Record canon
  // ----------------------------------------------------------

  function handleRecord() {
    if (!draft.trim()) return;

    onRecord({
      description: draft,
      dice: {
        mode: diceMode,
        roll,
        dc,
        justification,
        evaluation,
        manual,
      },
      audit: [...audit, "Recorded by Arbiter"],
    });
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <CardSection title="Resolution Draft">
      <p className="muted">
        🎲 Difficulty {dc} — {justification}
        <br />
        Recommended die: <strong>{recommend}</strong>
      </p>

      <label>
        Dice:&nbsp;
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
          <option value="d100">d100</option>
        </select>
      </label>

      <br />

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

      <div style={{ marginTop: 8 }}>
        <button onClick={handleRoll}>Roll Dice</button>
        {roll !== null && (
          <span style={{ marginLeft: 8 }}>
            Result: <strong>{roll}</strong>{" "}
            {evaluation && `(${evaluation})`}
          </span>
        )}
      </div>

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
    </CardSection>
  );
}
