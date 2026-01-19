"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Polished Demo)
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

// Components
import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";
import DiceOutcomePanel from "@/components/DiceOutcomePanel";
import NextActionHint from "@/components/NextActionHint";

// Layout
import StewardedShell from "@/components/layout/StewardedShell";
import CardSection from "@/components/layout/CardSection";

// ------------------------------------------------------------

export default function DemoPage() {
  const [state, setState] = useState<SessionState>(
    createSession("demo-session")
  );

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [narration, setNarration] = useState<string[]>([]);

  // ----------------------------------------------------------
  // Player submits an action
  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
  }

  // ----------------------------------------------------------
  // DM selects an option → propose change
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
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
  // DM confirms change
  // ----------------------------------------------------------

  function handleConfirm(changeId: string) {
    setState((prev) => confirmChange(prev, changeId, "DM"));
  }

  // ----------------------------------------------------------
  // Dice / Outcome entry → canon
  // ----------------------------------------------------------

  function handleOutcome(outcomeText: string) {
    setState((prev) => {
      const next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "system",
        type: "OUTCOME",
        payload: {
          description: outcomeText,
        },
      });

      const event: SessionEvent = next.events.at(-1)!;
      const rendered = renderNarration(event, { tone: "neutral" });

      setNarration((n) => [...n, rendered.text]);
      return next;
    });
  }

  // ----------------------------------------------------------
  // Share link (read-only)
  // ----------------------------------------------------------

  function copyShareLink() {
    const url = `${window.location.origin}/demo?session=demo-session`;
    navigator.clipboard.writeText(url);
    alert("Session link copied (read-only).");
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <StewardedShell
      title="Stewarded Play — Full Flow Demo"
      onShare={copyShareLink}
    >
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

      <DMConfirmationPanel state={state} onConfirm={handleConfirm} />
      <DiceOutcomePanel onSubmit={handleOutcome} />
      <NextActionHint state={state} />

      <CardSection title="Canon (Confirmed Narrative)" className="canon">
        {narration.length === 0 ? (
          <p className="muted">No canon yet.</p>
        ) : (
          <ul>
            {narration.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </CardSection>
    </StewardedShell>
  );
}
