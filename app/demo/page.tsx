"use client";

// ------------------------------------------------------------
// Stewarded Play — Full Flow (Governed Resolution Engine)
// ------------------------------------------------------------
//
// Invariants:
// - Solace may DRAFT, never decide
// - Dice advise, never authorize
// - Canon written ONLY by Arbiter
// - Draft is editable before record
// - All authority actions are visible
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  createSession,
  confirmChange,
  recordEvent,
  SessionState,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";

import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";
import NextActionHint from "@/components/NextActionHint";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Authority + Dice Types
// ------------------------------------------------------------

type Role = "player" | "arbiter";
type DiceMode = "d20" | "2d6";

function difficultyFor(kind: Option["kind"]) {
  switch (kind) {
    case "safe":
      return { dc: 0, reason: "safe action" };
    case "environmental":
      return { dc: 6, reason: "environmental uncertainty" };
    case "risky":
      return { dc: 10, reason: "risky action" };
    case "contested":
      return { dc: 14, reason: "contested action" };
    default:
      return { dc: 10, reason: "default risk" };
  }
}

function rollDice(mode: DiceMode) {
  if (mode === "d20") {
    return Math.ceil(Math.random() * 20);
  }
  return (
    Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6)
  );
}

// ------------------------------------------------------------

export default function DemoPage() {
  const role: Role = "arbiter"; // later from auth/session

  const [state, setState] = useState<SessionState>(
    createSession("demo-session")
  );

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);

  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const [draftOutcome, setDraftOutcome] = useState("");
  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [diceResult, setDiceResult] = useState<number | null>(null);

  const [audit, setAudit] = useState<string[]>([]);

  // ----------------------------------------------------------
  // Player action
  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
    setDraftOutcome("");
    setDiceResult(null);
    setAudit([]);
  }

  // ----------------------------------------------------------
  // Solace auto-draft (non-authoritative)
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
    setSelectedOption(option);

    setDraftOutcome(
      `The action resolves as expected. ${option.description}.`
    );

    setAudit(["Drafted by Solace"]);
  }

  // ----------------------------------------------------------
  // Dice roll (advisory)
  // ----------------------------------------------------------

  function handleRollDice() {
    const roll = rollDice(diceMode);
    setDiceResult(roll);
    setAudit((a) => [...a, `Dice rolled (${diceMode}): ${roll}`]);
  }

  // ----------------------------------------------------------
  // Record canon (arbiter only)
  // ----------------------------------------------------------

  function handleRecordOutcome() {
    if (!draftOutcome.trim()) return;

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: {
          description: draftOutcome,
          dice: diceResult,
        },
      })
    );

    setAudit((a) => [...a, "Recorded by Arbiter"]);
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  const difficulty =
    selectedOption && difficultyFor(selectedOption.kind);

  return (
    <StewardedShell>
      <ModeHeader
        title="Stewarded Play — Full Flow"
        onShare={() =>
          navigator.clipboard.writeText(
            exportCanon(state.events)
          )
        }
        roles={[
          { label: "Player", description: "Declares intent" },
          { label: "Arbiter", description: "Confirms outcomes" },
        ]}
      />

      <CardSection title="Player Action">
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
        />
        <button onClick={handlePlayerAction}>Submit Action</button>
      </CardSection>

      {parsed && (
        <CardSection title="Parsed Action (System)">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </CardSection>
      )}

      {options && (
        <CardSection title="Possible Options">
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

      {selectedOption && role === "arbiter" && (
        <CardSection title="Resolution Draft">
          {difficulty && (
            <p className="muted">
              🎲 Difficulty {difficulty.dc} — {difficulty.reason}
            </p>
          )}

          <label>
            Dice system:{" "}
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

          <button onClick={handleRollDice}>Roll Dice</button>

          {diceResult !== null && (
            <p>Result: {diceResult}</p>
          )}

          <textarea
            rows={4}
            value={draftOutcome}
            onChange={(e) => {
              setDraftOutcome(e.target.value);
              if (!audit.includes("Edited by Arbiter")) {
                setAudit((a) => [...a, "Edited by Arbiter"]);
              }
            }}
          />

          <button onClick={handleRecordOutcome}>
            Record Outcome
          </button>

          <p className="muted">
            {audit.join(" · ")}
          </p>
        </CardSection>
      )}

      <NextActionHint state={state} />

      <CardSection title="Canon (Confirmed Narrative)" className="canon">
        {state.events
          .filter((e) => e.type === "OUTCOME")
          .map((e) => (
            <p key={e.id}>
              {String(e.payload.description)}
            </p>
          ))}
      </CardSection>

      <Disclaimer />
    </StewardedShell>
  );
}
