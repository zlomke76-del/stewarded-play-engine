"use client";

// ------------------------------------------------------------
// Classic Fantasy — Stewarded Resolution Mode
// ------------------------------------------------------------

import { useState } from "react";
import {
  createSession,
  proposeChange,
  confirmChange,
  recordEvent,
  SessionState,
  SessionEvent,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { renderNarration } from "@/lib/narration/NarrationRenderer";
import { exportCanon } from "@/lib/export/exportCanon";

import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";
import DiceOutcomePanel from "@/components/DiceOutcomePanel";
import NextActionHint from "@/components/NextActionHint";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Draft helper (neutral, non-canonical)
// ------------------------------------------------------------

function generateDraftOutcome(option: Option): string {
  return (
    `Choosing the path “${option.description},” ` +
    `events unfold in a way consistent with the situation. ` +
    `Some information is revealed, while other details remain uncertain.`
  );
}

// ------------------------------------------------------------

export default function ClassicFantasyPage() {
  const [state, setState] = useState<SessionState>(
    createSession("classic-fantasy-session")
  );

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [chronicle, setChronicle] = useState<string[]>([]);

  // NEW: facilitation-only state
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [draftOutcome, setDraftOutcome] = useState<string>("");

  // ----------------------------------------------------------
  // Player issues a command
  // ----------------------------------------------------------

  function handleCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction("player_1", command);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);

    // reset downstream facilitation
    setSelectedOption(null);
    setDraftOutcome("");
  }

  // ----------------------------------------------------------
  // Arbiter selects a resolution path (proposal)
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
    setSelectedOption(option);
    setDraftOutcome(generateDraftOutcome(option));

    setState((prev) =>
      proposeChange(prev, {
        id: crypto.randomUUID(),
        description: option.description,
        proposedBy: "system",
        createdAt: Date.now(),
      })
    );
  }

  // ----------------------------------------------------------
  // Arbiter confirms resolution path
  // ----------------------------------------------------------

  function handleConfirm(changeId: string) {
    setState((prev) => confirmChange(prev, changeId, "arbiter"));
  }

  // ----------------------------------------------------------
  // Resolution / Outcome entry → canon
  // ----------------------------------------------------------

  function handleOutcome(outcomeText: string, diceResult?: any) {
    if (!outcomeText.trim()) return;

    setState((prev) => {
      const next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: {
          description: outcomeText,
          dice: diceResult ?? null,
          basedOn: selectedOption?.description ?? null,
        },
      });

      const event: SessionEvent = next.events.at(-1)!;
      const rendered = renderNarration(event, { tone: "neutral" });

      setChronicle((c) => [...c, rendered.text]);
      return next;
    });

    // reset for next turn
    setCommand("");
    setParsed(null);
    setOptions(null);
    setSelectedOption(null);
    setDraftOutcome("");
  }

  // ----------------------------------------------------------
  // Share = Export Canon (Authoritative)
  // ----------------------------------------------------------

  function handleShare() {
    const canonText = exportCanon(state.events);

    if (!canonText.trim()) {
      alert("No canon to export yet.");
      return;
    }

    const blob = new Blob([canonText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "classic-fantasy-chronicle.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <StewardedShell theme="fantasy">
      <ModeHeader
        title="Classic Fantasy — Stewarded Resolution"
        onShare={handleShare}
        roles={[
          { label: "Player", description: "Issues commands" },
          { label: "Arbiter", description: "Confirms and records outcomes" },
        ]}
      />

      <CardSection title="Command">
        <textarea
          rows={3}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Issue a command or declare an action…"
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

      {/* Existing confirmation component — preserved */}
      <DMConfirmationPanel state={state} onConfirm={handleConfirm} />

      {/* Outcome + Dice only once context exists */}
      {selectedOption && (
        <CardSection title="Outcome (Arbiter)">
          <p className="muted">
            Drafted by system (editable, non-canonical):
          </p>

          <textarea
            rows={4}
            value={draftOutcome}
            onChange={(e) => setDraftOutcome(e.target.value)}
          />

          <DiceOutcomePanel onSubmit={handleOutcome} />
        </CardSection>
      )}

      <NextActionHint state={state} />

      <CardSection title="Chronicle (Confirmed World State)" className="canon">
        {chronicle.length === 0 ? (
          <p className="muted">No confirmed resolutions yet.</p>
        ) : (
          <ul>
            {chronicle.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </CardSection>

      <Disclaimer />
    </StewardedShell>
  );
}
