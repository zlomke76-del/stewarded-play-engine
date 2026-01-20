"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Resolution Flow)
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  createSession,
  proposeChange,
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
// Dice + Resolution helpers
// ------------------------------------------------------------

type DiceMode = "d20" | "2d6";
type ResolutionResult = "success" | "partial" | "failure";

function rollDice(mode: DiceMode) {
  if (mode === "d20") return Math.floor(Math.random() * 20) + 1;
  return (
    Math.floor(Math.random() * 6) + 1 +
    Math.floor(Math.random() * 6) + 1
  );
}

function difficultyFor(option: Option) {
  const text = option.description.toLowerCase();

  if (text.includes("simple") || text.includes("freeform")) {
    return { dc: 0, reason: "Safe / uncontested action" };
  }
  if (text.includes("alter") || text.includes("change")) {
    return { dc: 12, reason: "State-altering action" };
  }
  return { dc: 14, reason: "Contested or risky action" };
}

function evaluateRoll(
  roll: number,
  dc: number
): ResolutionResult {
  if (dc === 0) return "success";
  if (roll >= dc) return "success";
  if (roll >= dc - 3) return "partial";
  return "failure";
}

function synthesizeDraft(
  option: Option,
  result: ResolutionResult
) {
  switch (result) {
    case "success":
      return `The action succeeds. ${option.description} resolves cleanly.`;
    case "partial":
      return `The action partially succeeds. ${option.description} resolves, but with complications or cost.`;
    case "failure":
      return `The action fails. ${option.description} does not resolve as intended, and the situation escalates.`;
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

  // Resolution Draft state
  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [rolled, setRolled] = useState<number | null>(null);
  const [manualRoll, setManualRoll] = useState<string>("");
  const [draftText, setDraftText] = useState("");
  const [result, setResult] = useState<ResolutionResult | null>(null);
  const [auditEdited, setAuditEdited] = useState(false);

  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);

    // reset resolution
    setSelectedOption(null);
    setRolled(null);
    setDraftText("");
    setResult(null);
    setAuditEdited(false);
  }

  function handleSelectOption(option: Option) {
    setSelectedOption(option);

    setState((prev) =>
      proposeChange(prev, {
        id: crypto.randomUUID(),
        description: option.description,
        proposedBy: "system",
        createdAt: Date.now(),
      })
    );
  }

  function handleRoll() {
    const value =
      manualRoll.trim() !== ""
        ? Number(manualRoll)
        : rollDice(diceMode);

    if (Number.isNaN(value)) return;

    setRolled(value);

    if (!selectedOption) return;

    const { dc } = difficultyFor(selectedOption);
    const outcome = evaluateRoll(value, dc);

    setResult(outcome);
    setDraftText(synthesizeDraft(selectedOption, outcome));
  }

  function handleRecordOutcome() {
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
            roll: rolled,
            result,
          },
        },
      })
    );
  }

  function handleShare() {
    navigator.clipboard.writeText(exportCanon(state.events));
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------

  return (
    <StewardedShell>
      <ModeHeader
        title="Stewarded Play — Full Flow"
        onShare={handleShare}
        roles={[
          { label: "Player", description: "Declares intent" },
          { label: "Solace", description: "Drafts neutral resolution" },
          { label: "DM", description: "Records canon" },
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
          {(() => {
            const { dc, reason } = difficultyFor(selectedOption);
            return (
              <>
                <p>
                  <strong>Difficulty:</strong> {dc} — {reason}
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
                  Manual roll override:&nbsp;
                  <input
                    value={manualRoll}
                    onChange={(e) =>
                      setManualRoll(e.target.value)
                    }
                    placeholder="optional"
                  />
                </label>

                <br />

                <button onClick={handleRoll}>Roll Dice</button>

                {rolled !== null && (
                  <p>
                    <strong>Result:</strong> {rolled} (
                    {result})
                  </p>
                )}

                <textarea
                  rows={4}
                  value={draftText}
                  onChange={(e) => {
                    setDraftText(e.target.value);
                    setAuditEdited(true);
                  }}
                  placeholder="Solace draft appears here…"
                />

                <button onClick={handleRecordOutcome}>
                  Record Outcome
                </button>

                <p className="muted">
                  Drafted by Solace
                  {auditEdited && " · Edited by Arbiter"}
                </p>
              </>
            );
          })()}
        </CardSection>
      )}

      <NextActionHint state={state} />

      <CardSection title="Canon (Confirmed Narrative)" className="canon">
        {state.events.filter((e) => e.type === "OUTCOME").length ===
        0 ? (
          <p className="muted">No canon yet.</p>
        ) : (
          <ul>
            {state.events
              .filter((e) => e.type === "OUTCOME")
              .map((e) => (
                <li key={e.id}>
                  {String(e.payload.description)}
                </li>
              ))}
          </ul>
        )}
      </CardSection>

      <Disclaimer />
    </StewardedShell>
  );
}
