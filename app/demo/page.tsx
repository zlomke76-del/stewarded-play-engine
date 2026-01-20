"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Resolution-Aware)
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  createSession,
  recordEvent,
  confirmChange,
  SessionState,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";

import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";
import NextActionHint from "@/components/NextActionHint";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Dice + Evaluation helpers (advisory only)
// ------------------------------------------------------------

type DiceMode = "d20" | "2d6";
type EvalResult = "success" | "partial" | "failure";

function rollDice(mode: DiceMode): number {
  if (mode === "d20") return Math.floor(Math.random() * 20) + 1;
  return (
    Math.floor(Math.random() * 6) +
    1 +
    (Math.floor(Math.random() * 6) + 1)
  );
}

function evaluateRoll(
  mode: DiceMode,
  roll: number,
  dc: number
): { result: EvalResult; justification: string } {
  if (mode === "d20") {
    return roll >= dc
      ? {
          result: "success",
          justification: `Rolled ${roll} ≥ DC ${dc}`,
        }
      : {
          result: "failure",
          justification: `Rolled ${roll} < DC ${dc}`,
        };
  }

  // 2d6 bands
  if (roll >= dc + 2) {
    return {
      result: "success",
      justification: `Rolled ${roll} ≥ DC ${dc}+2 (strong success band)`,
    };
  }

  if (roll >= dc) {
    return {
      result: "partial",
      justification: `Rolled ${roll} ≥ DC ${dc} (partial band)`,
    };
  }

  return {
    result: "failure",
    justification: `Rolled ${roll} < DC ${dc}`,
  };
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

  // Resolution state
  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [dc, setDc] = useState<number>(6);
  const [roll, setRoll] = useState<number | null>(null);
  const [manualRoll, setManualRoll] = useState(false);
  const [manualValue, setManualValue] = useState<number>(0);

  const [draftText, setDraftText] = useState("");
  const [evaluation, setEvaluation] = useState<{
    result: EvalResult;
    justification: string;
  } | null>(null);

  // ----------------------------------------------------------
  // Player submits action
  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
    setRoll(null);
    setEvaluation(null);
    setDraftText("");
  }

  // ----------------------------------------------------------
  // Option selected → prepare resolution
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
    setSelectedOption(option);
    setDc(6); // neutral default; not a ruleset
    setDraftText(
      `The situation follows the chosen path: ${option.description}.`
    );
  }

  // ----------------------------------------------------------
  // Roll dice (manual or automatic)
  // ----------------------------------------------------------

  function handleRoll() {
    const value = manualRoll ? manualValue : rollDice(diceMode);
    setRoll(value);

    const evalResult = evaluateRoll(diceMode, value, dc);
    setEvaluation(evalResult);

    setDraftText(() => {
      switch (evalResult.result) {
        case "success":
          return `The action succeeds. ${selectedOption?.description} resolves cleanly.`;
        case "partial":
          return `The action partially succeeds. ${selectedOption?.description} resolves, but with complications.`;
        case "failure":
          return `The action fails. ${selectedOption?.description} does not resolve as intended.`;
      }
    });
  }

  // ----------------------------------------------------------
  // Record Outcome → Canon
  // ----------------------------------------------------------

  function handleRecord() {
    if (!draftText.trim()) return;

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "DM",
        type: "OUTCOME",
        payload: {
          description: draftText,
          dice: {
            mode: diceMode,
            roll,
            dc,
            evaluation,
            manual: manualRoll,
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
          { label: "Solace", description: "Drafts neutral resolution" },
        ]}
      />

      <CardSection title="Player Action">
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          placeholder="Describe what your character does…"
        />
        <button onClick={handlePlayerAction}>Submit Action</button>
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

      {selectedOption && (
        <CardSection title="Resolution Draft">
          <p>
            <strong>Difficulty:</strong> DC {dc}
          </p>

          <label>
            Dice system:{" "}
            <select
              value={diceMode}
              onChange={(e) => setDiceMode(e.target.value as DiceMode)}
            >
              <option value="d20">d20</option>
              <option value="2d6">2d6</option>
            </select>
          </label>

          <br />
          <label>
            <input
              type="checkbox"
              checked={manualRoll}
              onChange={(e) => setManualRoll(e.target.checked)}
            />{" "}
            Enter roll manually
          </label>

          {manualRoll && (
            <input
              type="number"
              value={manualValue}
              onChange={(e) => setManualValue(Number(e.target.value))}
            />
          )}

          <br />
          <button onClick={handleRoll}>Roll Dice</button>

          {roll !== null && evaluation && (
            <p>
              <strong>Result:</strong> {evaluation.result} —{" "}
              {evaluation.justification}
            </p>
          )}

          <textarea
            rows={4}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
          />

          <button onClick={handleRecord}>Record Outcome</button>

          <p className="muted">
            Drafted by Solace · Dice: {diceMode} ·{" "}
            {manualRoll ? "manual" : "auto"}
          </p>
        </CardSection>
      )}

      <DMConfirmationPanel state={state} onConfirm={() => {}} />
      <NextActionHint state={state} />

      <CardSection title="Canon (Confirmed Narrative)" className="canon">
        {state.events.filter((e) => e.type === "OUTCOME").length === 0 ? (
          <p className="muted">No canon yet.</p>
        ) : (
          <ul>
            {state.events
              .filter((e) => e.type === "OUTCOME")
              .map((e) => (
                <li key={e.id}>{e.payload.description as string}</li>
              ))}
          </ul>
        )}
      </CardSection>

      <Disclaimer />
    </StewardedShell>
  );
}
