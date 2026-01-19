"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Solace Neutral DM Enabled)
// ------------------------------------------------------------
//
// Invariants:
// - Solace may FRAME and PROPOSE, never decide
// - Canon only written via OUTCOME
// - Framing is non-canonical and excluded from export
// - Dice are evidence, not authority
// - Human explicitly records outcome
// - Hydration-safe interactive rendering
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  createSession,
  recordEvent,
  SessionState,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";

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
// Framing helpers (neutral, deterministic)
// ------------------------------------------------------------

function generateFraming(seed: string): string {
  return (
    `You arrive at the edge of a small settlement as dusk settles in. ` +
    `Lantern light flickers through misty air. ` +
    (seed ? `Rumors speak of ${seed}. ` : "") +
    `Nothing has happened yet. The world waits.`
  );
}

function generateDraftOutcome(option: Option): string {
  return (
    `Following the chosen path (“${option.description}”), ` +
    `the interaction unfolds naturally. Information is exchanged, ` +
    `revealing some details while leaving others unresolved.`
  );
}

// ------------------------------------------------------------

export default function DemoPage() {
  const [state, setState] = useState<SessionState>(
    createSession("demo-session")
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [dmMode, setDmMode] = useState<DMMode>("human");
  const [campaignSeed, setCampaignSeed] = useState("");
  const [framing, setFraming] = useState<string | null>(null);

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);

  // NEW: selected resolution + drafted outcome
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [draftOutcome, setDraftOutcome] = useState<string>("");

  const canonStarted = state.events.some((e) => e.type === "OUTCOME");

  // ----------------------------------------------------------
  // Generate framing (Solace-only, non-canonical)
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (canonStarted) return;
    setFraming(generateFraming(campaignSeed));
  }, [dmMode, campaignSeed, canonStarted]);

  function regenerateFraming() {
    if (canonStarted) return;
    setFraming(generateFraming(campaignSeed));
  }

  // ----------------------------------------------------------
  // Player submits an action
  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);

    // reset downstream state
    setSelectedOption(null);
    setDraftOutcome("");
  }

  // ----------------------------------------------------------
  // Option selected → Solace frames outcome (NO CANON)
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
    setSelectedOption(option);
    setDraftOutcome(generateDraftOutcome(option));
  }

  // ----------------------------------------------------------
  // Record OUTCOME → CANON (human authority)
  // ----------------------------------------------------------

  function handleRecordOutcome(diceResult?: any) {
    if (!draftOutcome.trim()) return;

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "DM",
        type: "OUTCOME",
        payload: {
          description: draftOutcome,
          dice: diceResult ?? null,
          basedOn: selectedOption?.description ?? null,
        },
      })
    );

    // clear resolution state
    setSelectedOption(null);
    setDraftOutcome("");
    setOptions(null);
    setParsed(null);
    setPlayerInput("");
  }

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
                ? "Records outcomes"
                : "Frames scenes and drafts neutral outcomes",
          },
        ]}
      />

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
              Campaign seed:{" "}
              <input
                value={campaignSeed}
                onChange={(e) => setCampaignSeed(e.target.value)}
                placeholder="Optional world hook"
              />
            </label>
          </>
        )}
      </CardSection>

      <CardSection title="Session Start">
        {framing ? (
          <>
            <p className="muted">Facilitator framing (non-canonical):</p>
            <p>{framing}</p>
            {dmMode === "solace-neutral" && !canonStarted && (
              <button onClick={regenerateFraming}>
                Regenerate framing
              </button>
            )}
          </>
        ) : (
          <p className="muted">No framing set.</p>
        )}
      </CardSection>

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

      {mounted && options && (
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

      {/* DICE + OUTCOME — ONLY AFTER OPTION SELECTED */}
      {selectedOption && (
        <CardSection title="Outcome (DM / Arbiter)">
          <p className="muted">
            Drafted by Solace (editable, non-canonical):
          </p>
          <textarea
            rows={4}
            value={draftOutcome}
            onChange={(e) => setDraftOutcome(e.target.value)}
          />

          <DiceOutcomePanel
            onSubmit={(dice) => handleRecordOutcome(dice)}
          />

          <button
            style={{ marginTop: "12px" }}
            onClick={() => handleRecordOutcome()}
          >
            Record Outcome
          </button>
        </CardSection>
      )}

      <NextActionHint state={state} />

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
