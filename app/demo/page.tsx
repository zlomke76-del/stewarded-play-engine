"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Resolution Loop)
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
  createSession,
  recordEvent,
  SessionState,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Dice + Resolution helpers (LOCAL, EXPLICIT)
// ------------------------------------------------------------

type DiceMode = "d20" | "2d6";
type ResolutionClass = "success" | "partial" | "failure";

function rollDice(mode: DiceMode): number {
  if (mode === "2d6") {
    return (
      Math.floor(Math.random() * 6) + 1 +
      Math.floor(Math.random() * 6) + 1
    );
  }
  return Math.floor(Math.random() * 20) + 1;
}

function difficultyFor(optionDescription: string) {
  if (/safe|simple/i.test(optionDescription)) {
    return { dc: 0, reason: "safe action" };
  }
  if (/contested|resist/i.test(optionDescription)) {
    return { dc: 14, reason: "contested action" };
  }
  return { dc: 10, reason: "standard difficulty" };
}

function classifyResult(roll: number, dc: number): ResolutionClass {
  if (dc === 0) return "success";
  if (roll >= dc + 5) return "success";
  if (roll >= dc) return "partial";
  return "failure";
}

function synthesizeDraft(
  option: string,
  result: ResolutionClass
): string {
  switch (result) {
    case "success":
      return `The action succeeds. ${option} resolves cleanly and without complication.`;
    case "partial":
      return `The action partially succeeds. ${option} resolves, but introduces a complication or cost.`;
    case "failure":
      return `The action fails. ${option} does not resolve as intended, and the situation escalates.`;
  }
}

// ------------------------------------------------------------

export default function DemoPage() {
  const [state, setState] = useState<SessionState>(
    createSession("demo-session")
  );

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);

  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [rollResult, setRollResult] = useState<number | null>(null);

  const [manualDice, setManualDice] = useState(false);
  const [manualValue, setManualValue] = useState<number>(0);

  const [draftText, setDraftText] = useState("");
  const [arbiterEdited, setArbiterEdited] = useState(false);

  // ----------------------------------------------------------
  // Player submits action
  // ----------------------------------------------------------

  function handleSubmitAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
    setRollResult(null);
    setDraftText("");
    setArbiterEdited(false);
  }

  // ----------------------------------------------------------
  // Option selected → auto-roll
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
    setSelectedOption(option);
    setManualDice(false);
    setManualValue(0);

    const roll = rollDice(diceMode);
    setRollResult(roll);
  }

  // ----------------------------------------------------------
  // Derived evaluation
  // ----------------------------------------------------------

  const evaluation = useMemo(() => {
    if (!selectedOption || rollResult === null) return null;

    const { dc, reason } = difficultyFor(selectedOption.description);
    const effectiveRoll = manualDice ? manualValue : rollResult;
    const outcome = classifyResult(effectiveRoll, dc);

    return {
      dc,
      reason,
      outcome,
      effectiveRoll,
    };
  }, [selectedOption, rollResult, manualDice, manualValue]);

  // ----------------------------------------------------------
  // Draft synthesis (Solace)
  // ----------------------------------------------------------

  useEffect(() => {
    if (!evaluation || !selectedOption) return;

    const synthesized = synthesizeDraft(
      selectedOption.description,
      evaluation.outcome
    );

    setDraftText(synthesized);
    setArbiterEdited(false);
  }, [evaluation, selectedOption]);

  // ----------------------------------------------------------
  // Record Outcome (ONLY authority moment)
  // ----------------------------------------------------------

  function handleRecordOutcome() {
    if (!draftText.trim()) return;

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: {
          description: draftText,
          dice: {
            mode: diceMode,
            roll: evaluation?.effectiveRoll,
            dc: evaluation?.dc,
            manual: manualDice,
          },
        },
      })
    );
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <StewardedShell>
      <ModeHeader
        title="Stewarded Play — Full Flow"
        roles={[
          { label: "Player", description: "Declares intent" },
          { label: "Solace", description: "Drafts resolution" },
          { label: "Arbiter", description: "Confirms canon" },
        ]}
      />

      <CardSection title="Player Action">
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
        />
        <button onClick={handleSubmitAction}>Submit Action</button>
      </CardSection>

      {parsed && (
        <CardSection title="Parsed Action (System)">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </CardSection>
      )}

      {options && (
        <CardSection title="Possible Options (No Ranking)">
          <ul>
            {options.map((opt) => (
              <li key={opt.id}>
                <button onClick={() => handleSelectOption(opt)}>
                  {opt.description}
                </button>
              </li>
            ))}
          </ul>
        </CardSection>
      )}

      {selectedOption && evaluation && (
        <CardSection title="Resolution Draft">
          <p>
            <strong>Difficulty {evaluation.dc}</strong> —{" "}
            {evaluation.reason}
          </p>

          <p>
            <strong>Result:</strong>{" "}
            {evaluation.outcome.toUpperCase()}
          </p>

          <label>
            Dice system:
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

          <p>
            Roll:{" "}
            <strong>{evaluation.effectiveRoll}</strong>
          </p>

          <label>
            <input
              type="checkbox"
              checked={manualDice}
              onChange={(e) =>
                setManualDice(e.target.checked)
              }
            />{" "}
            Manual dice entry
          </label>

          {manualDice && (
            <input
              type="number"
              value={manualValue}
              onChange={(e) =>
                setManualValue(Number(e.target.value))
              }
            />
          )}

          <textarea
            rows={4}
            value={draftText}
            onChange={(e) => {
              setDraftText(e.target.value);
              setArbiterEdited(true);
            }}
          />

          <button onClick={handleRecordOutcome}>
            Record Outcome
          </button>

          <p className="muted">
            Drafted by Solace ·{" "}
            {arbiterEdited
              ? "Edited by Arbiter"
              : "Unedited"}{" "}
            · Dice{" "}
            {manualDice
              ? "entered manually"
              : "rolled automatically"}
          </p>
        </CardSection>
      )}

      <CardSection title="Canon (Confirmed Narrative)">
        {state.events
          .filter((e) => e.type === "OUTCOME")
          .map((e) => (
            <p key={e.id}>{String(e.payload.description)}</p>
          ))}
      </CardSection>

      <Disclaimer />
    </StewardedShell>
  );
}
