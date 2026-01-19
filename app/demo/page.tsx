"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Solace Neutral DM Enabled)
// ------------------------------------------------------------
//
// Invariants:
// - Solace may PROPOSE, never decide
// - Canon only written via confirmation
// - Auto-confirm is explicit and optional
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

import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";
import DiceOutcomePanel from "@/components/DiceOutcomePanel";
import NextActionHint from "@/components/NextActionHint";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

import { exportCanon } from "@/lib/export/exportCanon";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type DMMode = "human" | "solace-neutral";

// ------------------------------------------------------------

export default function DemoPage() {
  const [state, setState] = useState<SessionState>(
    createSession("demo-session")
  );

  const [dmMode, setDmMode] = useState<DMMode>("human");
  const [autoConfirm, setAutoConfirm] = useState(false);

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
  // Solace Neutral DM — auto propose (NO AUTHORITY)
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;

    const option = options[0]; // neutral, deterministic

    setState((prev) =>
      proposeChange(prev, {
        id: crypto.randomUUID(),
        description: option.description,
        proposedBy: "system",
        createdAt: Date.now(),
      })
    );
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // DM / Solace confirms change
  // ----------------------------------------------------------

  function handleConfirm(changeId: string) {
    setState((prev) => confirmChange(prev, changeId, "DM"));
  }

  // ----------------------------------------------------------
  // Record OUTCOME → CANON
  // ----------------------------------------------------------

  function handleOutcome(outcomeText: string) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: dmMode === "solace-neutral" ? "system" : "DM",
        type: "OUTCOME",
        payload: {
          description: outcomeText,
        },
      })
    );
  }

  // ----------------------------------------------------------
  // Auto-confirm path (explicit, optional)
  // ----------------------------------------------------------

  useEffect(() => {
    if (!autoConfirm) return;
    if (state.pending.length !== 1) return;

    handleConfirm(state.pending[0].id);
  }, [autoConfirm, state.pending]);

  // ----------------------------------------------------------
  // Share / Export Canon
  // ----------------------------------------------------------

  function shareCanon() {
    const canon = exportCanon(state.events);
    navigator.clipboard.writeText(canon);
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <StewardedShell>
      <ModeHeader
        title="Stewarded Play — Full Flow"
        onShare={shareCanon}
        roles={[
          { label: "Player", description: "Declares intent" },
          {
            label: dmMode === "human" ? "DM" : "Solace (Neutral)",
            description:
              dmMode === "human"
                ? "Confirms outcomes"
                : "Proposes neutral resolutions",
          },
        ]}
      />

      {/* MODE CONTROLS */}
      <CardSection title="Facilitation Mode">
        <label>
          <input
            type="radio"
            checked={dmMode === "human"}
            onChange={() => setDmMode("human")}
          />{" "}
          Human DM
        </label>
        <br />
        <label>
          <input
            type="radio"
            checked={dmMode === "solace-neutral"}
            onChange={() => setDmMode("solace-neutral")}
          />{" "}
          Solace (Neutral Facilitator)
        </label>

        {dmMode === "solace-neutral" && (
          <>
            <br />
            <label>
              <input
                type="checkbox"
                checked={autoConfirm}
                onChange={(e) => setAutoConfirm(e.target.checked)}
              />{" "}
              Auto-confirm Solace proposals
            </label>
          </>
        )}
      </CardSection>

      {/* SESSION START */}
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

      {/* PLAYER ACTION */}
      <CardSection title="Player Action">
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          placeholder="Describe what your character does…"
        />
        <button onClick={handlePlayerAction}>Submit Action</button>
      </CardSection>

      {/* PARSED */}
      {parsed && (
        <CardSection title="Parsed Action (System)">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </CardSection>
      )}

      {/* OPTIONS */}
      {options && (
        <CardSection title="Possible Options (No Ranking)">
          <ul>
            {options.map((opt) => (
              <li key={opt.id}>{opt.description}</li>
            ))}
          </ul>
        </CardSection>
      )}

      {/* AUTHORITY + OUTCOME */}
      <DMConfirmationPanel state={state} onConfirm={handleConfirm} />
      <DiceOutcomePanel onSubmit={handleOutcome} spellCheck />
      <NextActionHint state={state} />

      {/* CANON */}
      <CardSection title="Canon (Confirmed Narrative)" className="canon">
        {state.events.filter((e) => e.type === "OUTCOME").length === 0 ? (
          <p className="muted">No canon yet.</p>
        ) : (
          <ul>
            {state.events
              .filter((e) => e.type === "OUTCOME")
              .map((event) => (
                <li key={event.id}>
                  {typeof event.payload.description === "string"
                    ? event.payload.description
                    : "(Unspecified outcome)"}
                </li>
              ))}
          </ul>
        )}
      </CardSection>

      <Disclaimer />
    </StewardedShell>
  );
}
