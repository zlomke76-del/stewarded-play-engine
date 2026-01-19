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

import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";
import DiceOutcomePanel from "@/components/DiceOutcomePanel";
import NextActionHint from "@/components/NextActionHint";
import StewardedShell from "@/components/layout/StewardedShell";

// ------------------------------------------------------------

export default function ClassicFantasyPage() {
  const [state, setState] = useState<SessionState>(
    createSession("classic-fantasy-session")
  );

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [chronicle, setChronicle] = useState<string[]>([]);

  function handleCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction("player_1", command);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
  }

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

  function handleConfirm(changeId: string) {
    setState((prev) => confirmChange(prev, changeId, "arbiter"));
  }

  function handleOutcome(outcomeText: string) {
    setState((prev) => {
      const next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "system",
        type: "OUTCOME",
        payload: { description: outcomeText },
      });

      const event: SessionEvent = next.events.at(-1)!;
      const rendered = renderNarration(event, { tone: "neutral" });

      setChronicle((c) => [...c, rendered.text]);
      return next;
    });
  }

  function copyShareLink() {
    const url = `${window.location.origin}/classic-fantasy?session=classic-fantasy-session`;
    navigator.clipboard.writeText(url);
    alert("Read-only chronicle link copied.");
  }

  return (
    <StewardedShell
      title="Classic Fantasy — Stewarded Resolution"
      onShare={copyShareLink}
    >
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

      {parsed && (
        <section className="card fade-in">
          <h2>Command Classification (System)</h2>
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </section>
      )}

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

      <DMConfirmationPanel state={state} onConfirm={handleConfirm} />
      <DiceOutcomePanel onSubmit={handleOutcome} />
      <NextActionHint state={state} />

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

      <footer className="disclaimer">
        <p>
          This software provides a system-agnostic facilitation framework for
          human-led tabletop roleplaying sessions and does not reproduce or
          automate any proprietary game rules, content, or narrative.
        </p>
      </footer>
    </StewardedShell>
  );
}
