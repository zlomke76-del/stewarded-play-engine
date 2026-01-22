"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// Invariants:
// - Player declares intent
// - Solace proposes + drafts (non-authoritative)
// - Dice are advisory only
// - Arbiter edits + records canon
// - Audit ribbon always visible
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  createSession,
  recordEvent,
  SessionState,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";

import ResolutionDraftPanel from "@/components/resolution/ResolutionDraftPanel";
import NextActionHint from "@/components/NextActionHint";
import WorldLedgerPanel from "@/components/world/WorldLedgerPanel";
import DungeonPressurePanel from "@/components/world/DungeonPressurePanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type DMMode = "human" | "solace-neutral";
type OptionKind =
  | "safe"
  | "environmental"
  | "risky"
  | "contested";

// ------------------------------------------------------------
// Framing helpers
// ------------------------------------------------------------

function generateFraming(seed: string): string {
  return (
    `You arrive at the edge of a small settlement as dusk settles in. ` +
    `Lantern light flickers through misty air. ` +
    (seed ? `Rumors speak of ${seed}. ` : "") +
    `Nothing has happened yet. The world waits.`
  );
}

// ------------------------------------------------------------
// Difficulty inference (NO Option schema changes)
// ------------------------------------------------------------

function inferOptionKind(description: string): OptionKind {
  const text = description.toLowerCase();

  if (
    text.includes("attack") ||
    text.includes("fight") ||
    text.includes("oppose") ||
    text.includes("contest")
  ) {
    return "contested";
  }

  if (
    text.includes("climb") ||
    text.includes("cross") ||
    text.includes("navigate") ||
    text.includes("environment")
  ) {
    return "environmental";
  }

  if (
    text.includes("steal") ||
    text.includes("sneak") ||
    text.includes("risk")
  ) {
    return "risky";
  }

  return "safe";
}

// ------------------------------------------------------------

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(
  createSession("demo-session", "demo")
);

  const [dmMode, setDmMode] = useState<DMMode>("solace-neutral");
  const [campaignSeed, setCampaignSeed] = useState("");
  const [framing, setFraming] = useState<string | null>(null);

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  const canonStarted = state.events.some(
    (e) => e.type === "OUTCOME"
  );

  // ----------------------------------------------------------
  // Framing
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (canonStarted) return;

    setFraming(generateFraming(campaignSeed));
  }, [dmMode, campaignSeed, canonStarted]);

  // ----------------------------------------------------------
  // Player submits action
  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
  }

  // ----------------------------------------------------------
  // Option selection → Solace draft
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
    setSelectedOption(option);
  }

  // ----------------------------------------------------------
  // Record canon (arbiter only)
  // ----------------------------------------------------------

  function handleRecord(payload: {
    description: string;
    dice: {
      mode: string;
      roll: number | null;
      dc: number;
      justification: string;
    };
    audit: string[];
  }) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload,
      })
    );
  }

  // ----------------------------------------------------------
  // Share canon
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
            label: "Solace (Neutral)",
            description:
              "Frames scenes and drafts neutral resolutions",
          },
          {
            label: "Arbiter",
            description: "Edits and records canon",
          },
        ]}
      />

      {/* ---------- ADVISORY DUNGEON PRESSURE ---------- */}
      <DungeonPressurePanel
        turn={state.events.filter(
          (e) => e.type === "OUTCOME"
        ).length}
        events={state.events}
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
                onChange={(e) =>
                  setCampaignSeed(e.target.value)
                }
                placeholder="Optional world hook"
              />
            </label>
          </>
        )}
      </CardSection>

      <CardSection title="Session Start">
        {framing ? (
          <>
            <p className="muted">
              Facilitator framing (non-canonical):
            </p>
            <p>{framing}</p>
          </>
        ) : (
          <p className="muted">No framing set.</p>
        )}
      </CardSection>

      <CardSection title="Player Action">
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) =>
            setPlayerInput(e.target.value)
          }
          placeholder="Describe what your character does…"
        />
        <button onClick={handlePlayerAction}>
          Submit Action
        </button>
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
                <button
                  onClick={() =>
                    handleSelectOption(opt)
                  }
                >
                  {opt.description}
                </button>
              </li>
            ))}
          </ul>
        </CardSection>
      )}

      {selectedOption && (
        <ResolutionDraftPanel
          role={role}
          context={{
            optionDescription:
              selectedOption.description,
            optionKind: inferOptionKind(
              selectedOption.description
            ),
          }}
          onRecord={handleRecord}
        />
      )}

      <NextActionHint state={state} />

      <WorldLedgerPanel events={state.events} />

      <CardSection
        title="Canon (Confirmed Narrative)"
        className="canon"
      >
        {state.events.filter(
          (e) => e.type === "OUTCOME"
        ).length === 0 ? (
          <p className="muted">No canon yet.</p>
        ) : (
          <ul>
            {state.events
              .filter((e) => e.type === "OUTCOME")
              .map((event) => (
                <li key={event.id}>
                  {String(
                    event.payload.description
                  )}
                </li>
              ))}
          </ul>
        )}
      </CardSection>

      <Disclaimer />
    </StewardedShell>
  );
}
