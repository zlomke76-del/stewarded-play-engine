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

import DMConfirmationPanel from "@/components/DMConfirmationPanel";
import DiceOutcomePanel from "@/components/DiceOutcomePanel";
import NextActionHint from "@/components/NextActionHint";

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
        type: "outcome",
        text: outcomeText,
        createdAt: Date.now(),
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
    <main className="demo-shell">
      <header className="demo-header">
        <h1>Stewarded Play — Full Flow Demo</h1>
        <button onClick={copyShareLink} className="share-btn">
          🔗 Share Session
        </button>
      </header>

      {/* Player Action */}
      <section className="card">
        <h2>Player Action</h2>
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          placeholder="Describe what your character does…"
        />
        <button onClick={handlePlayerAction}>Submit Action</button>
      </section>

      {/* Parsed */}
      {parsed && (
        <section className="card fade-in">
          <h2>Parsed Action (System)</h2>
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </section>
      )}

      {/* Options */}
      {options && (
        <section className="card fade-in">
          <h2>Possible Options (No Ranking)</h2>
          <ul>
            {options.map((opt) => (
              <li key={opt.id}>
                <button onClick={() => handleSelectOption(opt)}>
                  {opt.description}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DM Confirmation */}
      <DMConfirmationPanel state={state} onConfirm={handleConfirm} />

      {/* Dice / Outcome */}
      <DiceOutcomePanel onSubmit={handleOutcome} />

      {/* Next Action Hint */}
      <NextActionHint state={state} />

      {/* Canon */}
      <section className="card canon fade-in">
        <h2>Canon (Confirmed Narrative)</h2>
        {narration.length === 0 ? (
          <p className="muted">No canon yet.</p>
        ) : (
          <ul>
            {narration.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
