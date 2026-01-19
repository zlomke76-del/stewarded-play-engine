"use client";

// ------------------------------------------------------------
// Might & Magic — Stewarded Resolution Mode
// ------------------------------------------------------------
// This page intentionally duplicates the demo logic.
// Differences are semantic + framing only.
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
import DiceOutcomePanel from "@/components/DiceOutcomePanel";
import NextActionHint from "@/components/NextActionHint";

// ------------------------------------------------------------

export default function MightAndMagicPage() {
  const [state, setState] = useState<SessionState>(
    createSession("mm-session")
  );

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [chronicle, setChronicle] = useState<string[]>([]);

  // ----------------------------------------------------------
  // Player issues a command
  // ----------------------------------------------------------

  function handleCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction("player_1", command);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
  }

  // ----------------------------------------------------------
  // Arbiter selects a resolution path
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
  // Arbiter confirms resolution path
  // ----------------------------------------------------------

  function handleConfirm(changeId: string) {
    setState((prev) => confirmChange(prev, changeId, "arbiter"));
  }

  // ----------------------------------------------------------
  // Resolution / Outcome entry → canon
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

      setChronicle((c) => [...c, rendered.text]);
      return next;
    });
  }

  // ----------------------------------------------------------
  // Share link (read-only)
  // ----------------------------------------------------------

  function copyShareLink() {
    const url = `${window.location.origin}/might-and-magic?session=mm-session`;
    navigator.clipboard.writeText(url);
    alert("Read-only chronicle link copied.");
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <main className="demo-shell">
      <header className="demo-header">
        <h1>Might & Magic — Stewarded Resolution</h1>
        <button onClick={copyShareLink} className="share-btn">
          🔗 Share Chronicle
        </button>
      </header>

      {/* Command Input */}
      <section className="card">
        <h2>Command</h2>
        <textarea
          rows={3}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Issue a command or declare an action…"
        />
        <button onClick={handleCommand}>Submit Command</button>
      </section>

      {/* Parsed Command */}
      {parsed && (
        <section className="card fade-in">
          <h2>Command Classification (System)</h2>
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </section>
      )}

      {/* Resolution Paths */}
      {options && (
        <section className="card fade-in">
          <h2>Possible Resolution Paths</h2>
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

      {/* Arbiter Confirmation */}
      <DMConfirmationPanel state={state} onConfirm={handleConfirm} />

      {/* Resolution Entry */}
      <DiceOutcomePanel onSubmit={handleOutcome} />

      {/* Flow Hint */}
      <NextActionHint state={state} />

      {/* Chronicle */}
      <section className="card canon fade-in">
        <h2>Chronicle (Confirmed World State)</h2>
        {chronicle.length === 0 ? (
          <p className="muted">No confirmed resolutions yet.</p>
        ) : (
          <ul>
            {chronicle.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
