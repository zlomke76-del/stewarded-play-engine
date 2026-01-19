"use client";

// ------------------------------------------------------------
// Classic Fantasy — Stewarded Resolution Mode (AUTO-ASSISTED)
// ------------------------------------------------------------

import { useEffect, useState } from "react";
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

export default function ClassicFantasyPage() {
  const [state, setState] = useState<SessionState>(
    createSession("classic-fantasy-session")
  );

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [chronicle, setChronicle] = useState<string[]>([]);

  // automation guards
  const [autoProposed, setAutoProposed] = useState(false);
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
    setAutoProposed(false);
    setDraftOutcome("");
  }

  // ----------------------------------------------------------
  // Solace auto-proposes FIRST option (one-shot)
  // ----------------------------------------------------------

  useEffect(() => {
    if (!options || options.length === 0) return;
    if (autoProposed) return;

    const option = options[0];

    setState((prev) =>
      proposeChange(prev, {
        id: crypto.randomUUID(),
        description: option.description,
        proposedBy: "system",
        createdAt: Date.now(),
      })
    );

    // Draft neutral outcome text
    setDraftOutcome(
      `The action resolves in a straightforward manner. ${option.description}.`
    );

    setAutoProposed(true);
  }, [options, autoProposed]);

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
    setState((prev) => {
      const next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "system",
        type: "OUTCOME",
        payload: {
          description: outcomeText,
          dice: diceResult ?? null,
        },
      });

      const event: SessionEvent = next.events.at(-1)!;
      const rendered = renderNarration(event, { tone: "neutral" });

      setChronicle((c) => [...c, rendered.text]);
      setDraftOutcome("");
      return next;
    });
  }

  // ----------------------------------------------------------
  // Share = Export Canon
  // ----------------------------------------------------------

  function handleShare() {
    const canonText = exportCanon(state.events);
    if (!canonText.trim()) return alert("No canon to export.");

    navigator.clipboard.writeText(canonText);
    alert("Canon copied.");
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
          { label: "Solace", description: "Drafts neutral resolutions" },
          { label: "Arbiter", description: "Confirms outcomes" },
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
              <li key={opt.id}>{opt.description}</li>
            ))}
          </ul>
        </CardSection>
      )}

      <DMConfirmationPanel state={state} onConfirm={handleConfirm} />

      {state.pending.length > 0 && (
        <DiceOutcomePanel
          onSubmit={handleOutcome}
          initialText={draftOutcome}
        />
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
