"use client";

// ------------------------------------------------------------
// Classic Fantasy — Stewarded Resolution (Governed)
// ------------------------------------------------------------
//
// Invariants:
// - Player declares intent
// - Solace drafts (non-authoritative)
// - Dice advise only
// - Arbiter edits + records canon
// - All authority actions are visible
// ------------------------------------------------------------

import { useState } from "react";
import {
  createSession,
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
// Dice + Difficulty
// ------------------------------------------------------------

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

export default function ClassicFantasyPage() {
  const role: "arbiter" = "arbiter"; // future: auth-gated

  const [state, setState] = useState<SessionState>(
    createSession("classic-fantasy-session")
  );

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);

  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  const [draftOutcome, setDraftOutcome] = useState("");
  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [diceResult, setDiceResult] = useState<number | null>(null);

  const [audit, setAudit] = useState<string[]>([]);

  // ----------------------------------------------------------
  // Player command
  // ----------------------------------------------------------

  function handleCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction("player_1", command);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
    setDraftOutcome("");
    setDiceResult(null);
    setAudit([]);
  }

  // ----------------------------------------------------------
  // Solace draft (non-authoritative)
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
    setSelectedOption(option);

    setDraftOutcome(
      `The world responds accordingly. ${option.description}.`
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
    <StewardedShell theme="fantasy">
      <ModeHeader
        title="Classic Fantasy — Stewarded Resolution"
        onShare={() =>
          navigator.clipboard.writeText(
            exportCanon(state.events)
          )
        }
        roles={[
          { label: "Player", description: "Issues commands" },
          { label: "Arbiter", description: "Confirms outcomes" },
        ]}
      />

      <CardSection title="Command">
        <textarea
          rows={3}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Declare an action or intent…"
        />
        <button onClick={handleCommand}>Submit Command</button>
      </CardSection>

      {parsed && (
        <CardSection title="Command Classification (System)">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </CardSection>
      )}

      {options && (
        <CardSection title="Possible Resolution Paths">
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

          <p className="muted">{audit.join(" · ")}</p>
        </CardSection>
      )}

      <NextActionHint state={state} />

      <CardSection title="Chronicle (Confirmed World State)" className="canon">
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
