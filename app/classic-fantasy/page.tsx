"use client";

// ------------------------------------------------------------
// Classic Fantasy — Might & Magic Resolution
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

import WorldLedgerPanel from "@/components/world/WorldLedgerPanel";
import TurnPressurePanel from "@/components/world/TurnPressurePanel";
import FogOfWarPanel from "@/components/world/FogOfWarPanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

type OptionKind =
  | "safe"
  | "environmental"
  | "risky"
  | "contested";

function inferOptionKind(description: string): OptionKind {
  const t = description.toLowerCase();

  if (
    t.includes("attack") ||
    t.includes("fight") ||
    t.includes("enemy") ||
    t.includes("contest")
  ) {
    return "contested";
  }

  if (
    t.includes("climb") ||
    t.includes("cross") ||
    t.includes("door") ||
    t.includes("environment")
  ) {
    return "environmental";
  }

  if (
    t.includes("steal") ||
    t.includes("sneak") ||
    t.includes("risk")
  ) {
    return "risky";
  }

  return "safe";
}

// ------------------------------------------------------------

export default function ClassicFantasyPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(
    createSession("classic-fantasy-session")
  );

  const [turn, setTurn] = useState(0);

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  // ----------------------------------------------------------
  // Player issues command
  // ----------------------------------------------------------

  function handleSubmitCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction("player_1", command);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
  }

  // ----------------------------------------------------------
  // Arbiter records canon (TURN ADVANCES HERE)
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
    world?: {
      primary?: string;
      roomId?: string;
      scope?: "local" | "regional" | "global";

      // extensions (future-safe)
      lock?: {
        state: "locked" | "unlocked";
        keyId?: string;
      };
      trap?: {
        id: string;
        state: "armed" | "sprung" | "disarmed";
        effect?: string;
      };
      alert?: {
        level: "none" | "suspicious" | "alerted";
        source?: string;
      };
    };
  }) {
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: {
          ...payload,
          world: {
            ...payload.world,
            turn: nextTurn,
          },
        },
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
        title="Classic Fantasy — Resolution"
        onShare={handleShare}
        roles={[
          { label: "Player", description: "Issues commands" },
          {
            label: "Solace",
            description:
              "Drafts procedural outcomes (non-authoritative)",
          },
          {
            label: "Arbiter",
            description:
              "Applies world state changes and records canon",
          },
        ]}
      />

      {/* ---------- DUNGEON STATE ---------- */}
      <TurnPressurePanel turn={turn} />
      <FogOfWarPanel events={state.events} />

      {/* ---------- COMMAND ---------- */}
      <CardSection title="Command">
        <textarea
          rows={3}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="OPEN DOOR, ATTACK GOBLIN, SEARCH CHEST…"
        />
        <button onClick={handleSubmitCommand}>
          Submit Command
        </button>
      </CardSection>

      {parsed && (
        <CardSection title="Parsed Command (System)">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </CardSection>
      )}

      {options && (
        <CardSection title="Possible Resolution Paths">
          <ul>
            {options.map((opt) => (
              <li key={opt.id}>
                <button
                  onClick={() =>
                    setSelectedOption(opt)
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
