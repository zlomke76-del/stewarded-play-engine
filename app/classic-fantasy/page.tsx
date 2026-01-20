"use client";

// ------------------------------------------------------------
// Classic Fantasy — Might and Magic Resolution Flow
// ------------------------------------------------------------
//
// Governing invariants:
// - Player issues commands (procedural intent)
// - Solace drafts resolution (non-authoritative)
// - Dice are advisory only
// - Arbiter edits + records canon
// - No narrative framing
// - World-state outcomes, not prose
// ------------------------------------------------------------

import { useState } from "react";
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

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Option classification (NO schema changes)
// ------------------------------------------------------------

type OptionKind =
  | "safe"
  | "environmental"
  | "risky"
  | "contested";

function inferOptionKind(description: string): OptionKind {
  const text = description.toLowerCase();

  if (
    text.includes("attack") ||
    text.includes("fight") ||
    text.includes("enemy") ||
    text.includes("contest")
  ) {
    return "contested";
  }

  if (
    text.includes("move") ||
    text.includes("climb") ||
    text.includes("cross") ||
    text.includes("terrain")
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

export default function ClassicFantasyPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(
    createSession("might-and-magic-session")
  );

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  // ----------------------------------------------------------
  // Player submits command
  // ----------------------------------------------------------

  function handleCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction("player_1", command);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
  }

  // ----------------------------------------------------------
  // Option selected → resolution draft
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
      outcome: "success" | "partial" | "failure" | null;
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

  function handleShare() {
    const canon = exportCanon(state.events);
    navigator.clipboard.writeText(canon);
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <StewardedShell theme="fantasy">
      <ModeHeader
        title="Classic Fantasy — Might & Magic Resolution"
        onShare={handleShare}
        roles={[
          {
            label: "Player",
            description: "Issues commands",
          },
          {
            label: "Solace",
            description:
              "Drafts neutral resolution (procedural)",
          },
          {
            label: "Arbiter",
            description:
              "Applies world-state changes and records canon",
          },
        ]}
      />

      {/* COMMAND INPUT */}
      <CardSection title="Command">
        <textarea
          rows={2}
          value={command}
          onChange={(e) =>
            setCommand(e.target.value)
          }
          placeholder="Issue a command (e.g., ATTACK GOBLIN, OPEN CHEST, CAST FIREBALL)…"
        />
        <button onClick={handleCommand}>
          Submit Command
        </button>
      </CardSection>

      {/* PARSED COMMAND */}
      {parsed && (
        <CardSection title="Parsed Command (System)">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </CardSection>
      )}

      {/* RESOLUTION OPTIONS */}
      {options && (
        <CardSection title="Possible Resolution Paths">
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

      {/* ---------- RESOLUTION DRAFT (IDENTICAL PANEL) ---------- */}
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

      {/* CANON */}
      <CardSection
        title="Canon (Confirmed World State)"
        className="canon"
      >
        {state.events.filter(
          (e) => e.type === "OUTCOME"
        ).length === 0 ? (
          <p className="muted">
            No confirmed outcomes yet.
          </p>
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
