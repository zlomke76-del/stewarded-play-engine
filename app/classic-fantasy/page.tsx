"use client";

// ------------------------------------------------------------
// Classic Fantasy — Stewarded Resolution
// ------------------------------------------------------------

import { useState } from "react";
import {
  createSession,
  proposeChange,
  recordEvent,
  SessionState,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";

import NextActionHint from "@/components/NextActionHint";
import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// --- identical dice + resolution helpers imported or duplicated here ---

type DiceMode = "d20" | "2d6";
type ResolutionResult = "success" | "partial" | "failure";

function rollDice(mode: DiceMode) {
  return mode === "d20"
    ? Math.floor(Math.random() * 20) + 1
    : Math.floor(Math.random() * 6) + 1 +
        Math.floor(Math.random() * 6) + 1;
}

function difficultyFor(option: Option) {
  return { dc: 12, reason: "Uncertain outcome" };
}

function evaluateRoll(
  roll: number,
  dc: number
): ResolutionResult {
  if (roll >= dc) return "success";
  if (roll >= dc - 3) return "partial";
  return "failure";
}

function synthesizeDraft(
  option: Option,
  result: ResolutionResult
) {
  return `${option.description} — ${result.toUpperCase()}`;
}

// ------------------------------------------------------------

export default function ClassicFantasyPage() {
  const [state, setState] = useState<SessionState>(
    createSession("classic-fantasy")
  );

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selected, setSelected] = useState<Option | null>(null);

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  function handleCommand() {
    const parsedAction = parseAction("player", command);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
  }

  function handleSelect(option: Option) {
    setSelected(option);
    setState((s) =>
      proposeChange(s, {
        id: crypto.randomUUID(),
        description: option.description,
        proposedBy: "system",
        createdAt: Date.now(),
      })
    );
  }

  function handleRoll() {
    if (!selected) return;

    const r = rollDice(diceMode);
    const { dc } = difficultyFor(selected);
    const res = evaluateRoll(r, dc);

    setRoll(r);
    setDraft(synthesizeDraft(selected, res));
  }

  function handleRecord() {
    setState((s) =>
      recordEvent(s, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: { description: draft },
      })
    );
  }

  return (
    <StewardedShell theme="fantasy">
      <ModeHeader
        title="Classic Fantasy — Stewarded Resolution"
        onShare={() =>
          navigator.clipboard.writeText(exportCanon(state.events))
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
        />
        <button onClick={handleCommand}>Submit</button>
      </CardSection>

      {parsed && (
        <CardSection title="System Interpretation">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </CardSection>
      )}

      {options && (
        <CardSection title="Resolution Paths">
          <ul>
            {options.map((o) => (
              <li key={o.id}>
                <button onClick={() => handleSelect(o)}>
                  {o.description}
                </button>
              </li>
            ))}
          </ul>
        </CardSection>
      )}

      {selected && (
        <CardSection title="Resolution Draft">
          <button onClick={handleRoll}>Roll Dice</button>
          {roll !== null && <p>Roll: {roll}</p>}
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button onClick={handleRecord}>
            Record Outcome
          </button>
        </CardSection>
      )}

      <NextActionHint state={state} />
      <Disclaimer />
    </StewardedShell>
  );
}
