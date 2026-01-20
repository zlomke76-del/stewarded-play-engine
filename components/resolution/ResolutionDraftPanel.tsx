"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel
// ------------------------------------------------------------
// Governing contract:
// - Drafted by Solace (non-authoritative)
// - Dice are advisory only
// - Arbiter edits + records canon
// - Full audit ribbon always visible
// - Layout-safe (CardSection only)
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import CardSection from "@/components/layout/CardSection";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type DiceMode = "d20" | "2d6";
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

function rollDice(mode: DiceMode) {
  if (mode === "d20") return Math.ceil(Math.random() * 20);
  return Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6);
}

function evaluateRoll(
  mode: DiceMode,
  roll: number,
  dc: number
): EvalResult {
  if (dc === 0) return "success";

  if (mode === "d20") {
    if (roll >= dc) return "success";
    if (roll >= dc - 3) return "partial";
    return "failure";
  }

  // 2d6 bands
  if (roll >= dc + 2) return "success";
  if (roll >= dc) return "partial";
  return "failure";
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
  const [manual, setManual] = useState(false);
  const [manualValue, setManualValue] = useState<number>(0);

  const [evaluation, setEvaluation] = useState<EvalResult | null>(null);

  const [draft, setDraft] = useState("");
  const [audit, setAudit] = useState<string[]>([
    "Drafted by Solace",
  ]);

  // ----------------------------------------------------------
  // Initial Solace draft (on option select)
  // ----------------------------------------------------------

  useEffect(() => {
    setDraft(
      `Solace proposes a possible resolution: ${context.optionDescription}. The outcome will depend on the roll.`
    );
    setAudit(["Drafted by Solace"]);
    setRoll(null);
    setEvaluation(null);
  }, [context.optionDescription]);

  // ----------------------------------------------------------
  // Roll dice
  // ----------------------------------------------------------

  function handleRoll() {
    const value = manual ? manualValue : rollDice(diceMode);
    setRoll(value);

    const result = evaluateRoll(diceMode, value, dc);
    setEvaluation(result);

    setDraft(() => {
      switch (result) {
        case "success":
          return `The action succeeds. ${context.optionDescription} resolves cleanly.`;
        case "partial":
          return `The action partially succeeds. ${context.optionDescription} resolves, but with complications or cost.`;
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
      </p>

      <label>
        Dice system:&nbsp;
        <select
          value={diceMode}
          onChange={(e) =>
            setDiceMode(e.target.value as DiceMode)
          }
        >
          <option value="d20">d20</option>
          <option value="2d6">2d6</option>
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
