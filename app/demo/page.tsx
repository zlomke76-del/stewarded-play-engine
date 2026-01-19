"use client";

// ------------------------------------------------------------
// Demo Page — Full Stewarded Flow
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

import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";

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
    setOptions(optionSet.options);
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
  // DM confirms change → record event → narrate
  // ----------------------------------------------------------

  function handleConfirm(changeId: string) {
    setState((prev) => {
      const confirmed = confirmChange(prev, changeId, "DM");

      const event: SessionEvent = confirmed.events.at(-1)!;

      const rendered = renderNarration(event, {
        tone: "neutral",
      });

      setNarration((n) => [...n, rendered.text]);

      return confirmed;
    });
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <div style={{ padding: "24px", maxWidth: "900px" }}>
      <h1>Stewarded Play — Full Flow Demo</h1>

      {/* Player Input */}
      <section style={{ marginBottom: "24px" }}>
        <h2>Player Action</h2>
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          style={{ width: "100%" }}
          placeholder="Describe what your character does..."
        />
        <button onClick={handlePlayerAction} style={{ marginTop: "8px" }}>
          Submit Action
        </button>
      </section>

      {/* Parsed Action */}
      {parsed && (
        <section style={{ marginBottom: "24px" }}>
          <h2>Parsed Action (System)</h2>
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </section>
      )}

      {/* Options */}
      {options && (
        <section style={{ marginBottom: "24px" }}>
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
      <section style={{ marginBottom: "24px" }}>
        <DMConfirmationPanel state={state} onConfirm={handleConfirm} />
      </section>

      {/* Narration */}
      <section>
        <h2>Narration (Confirmed Only)</h2>
        {narration.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No narration yet.</p>
        ) : (
          <ul>
            {narration.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
