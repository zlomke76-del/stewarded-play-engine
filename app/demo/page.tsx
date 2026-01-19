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
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";

import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";
import DiceOutcomePanel from "@/components/DiceOutcomePanel";
import NextActionHint from "@/components/NextActionHint";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------

export default function DemoPage() {
  const [state, setState] = useState<SessionState>(
    createSession("demo-session")
  );

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);

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
  // DM confirms change (authority moment)
  // ----------------------------------------------------------

  function handleConfirm(changeId: string) {
    setState((prev) => confirmChange(prev, changeId, "DM"));
  }

  // ----------------------------------------------------------
  // DM records outcome → CANON
  // ----------------------------------------------------------

  function handleOutcome(outcomeText: string) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "system",
        type: "OUTCOME",
        payload: {
          description: outcomeText,
        },
      })
    );
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
    <StewardedShell>
      <ModeHeader
        title="Stewarded Play — Full Flow"
        onShare={copyShareLink}
        roles={[
          { label: "Player", description: "Declares intent" },
          { label: "DM", description: "Confirms outcomes" },
        ]}
      />

      {/* INITIAL PROMPT — NON-CANONICAL */}
      <CardSection title="Session Start">
        <p className="muted">
          The facilitator has framed the situation.
          <br />
          Nothing has happened yet.
        </p>
        <p>
          <strong>Describe your opening action.</strong>
        </p>
      </CardSection>

      {/* Player Action */}
      <CardSection title="Player Action">
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          placeholder="Describe what your character does…"
        />
        <button onClick={handlePlayerAction}>Submit Action</button>
      </CardSection>

      {/* Parsed Action */}
      {parsed && (
        <CardSection title="Parsed Action (System)">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </CardSection>
      )}

      {/* Options */}
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

      {/* DM Authority + Outcome */}
      <DMConfirmationPanel state={state} onConfirm={handleConfirm} />
      <DiceOutcomePanel onSubmit={handleOutcome} />
      <NextActionHint state={state} />

      {/* CANON — AUTHORITATIVE, CONTEXTUAL */}
      <CardSection title="Canon (Confirmed Narrative)" className="canon">
        {state.events.filter((e) => e.type === "OUTCOME").length === 0 ? (
          <p className="muted">No canon yet.</p>
        ) : (
          <ul>
            {state.events.map((event, index, all) => {
              if (event.type !== "OUTCOME") return null;

              const outcome =
                typeof event.payload.description === "string"
                  ? event.payload.description
                  : "(Unspecified outcome)";

              // Find most recent confirmed change before this outcome
              const prior = [...all.slice(0, index)]
                .reverse()
                .find((e) => e.type === "CONFIRMED_CHANGE");

              const ruling =
                prior &&
                typeof prior.payload.description === "string"
                  ? prior.payload.description
                  : null;

              return (
                <li key={event.id}>
                  {ruling
                    ? `DM ruled on "${ruling}": ${outcome}`
                    : outcome}
                </li>
              );
            })}
          </ul>
        )}
      </CardSection>

      <Disclaimer />
    </StewardedShell>
  );
}
