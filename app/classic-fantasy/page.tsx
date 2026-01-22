"use client";

// ------------------------------------------------------------
// Classic Fantasy — Might & Magic Resolution
// ------------------------------------------------------------
//
// Invariants:
// - Player issues commands
// - Solace drafts (non-authoritative)
// - Dice are advisory only
// - Arbiter records canon
// - Dungeon pressure is visible but NEVER acts
// ------------------------------------------------------------

import { useMemo, useState } from "react";
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
    t.includes("hallway") ||
    t.includes("room")
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

// Friendly room naming (fallback only)
function prettyRoomName(roomId?: string) {
  if (!roomId) return "Unknown";
  if (roomId.startsWith("room-")) return "Stone Hallway";
  return roomId;
}

// ------------------------------------------------------------
// Canon-Derived Prologue / Epilogue
// ------------------------------------------------------------

function buildPrologue(events: readonly any[]): string | null {
  const firstOutcome = events.find(
    (e) => e.type === "OUTCOME"
  ) as any | undefined;

  if (!firstOutcome) return null;

  const room =
    firstOutcome.payload?.world?.roomId ??
    "an unknown place";

  return `The journey begins in ${prettyRoomName(
    room
  )}. The world is quiet, but it will not remain so.`;
}

function buildEpilogue(events: readonly any[]): string | null {
  const outcomes = events.filter(
    (e) => e.type === "OUTCOME"
  );

  if (outcomes.length < 2) return null;

  const last = outcomes[outcomes.length - 1] as any;
  const room =
    last.payload?.world?.roomId ??
    "the depths beyond";

  return `Here, in ${prettyRoomName(
    room
  )}, the tale rests. What was done is now part of the world.`;
}

// ------------------------------------------------------------

export default function ClassicFantasyPage() {
  const role: "arbiter" = "arbiter";

  // ✅ CORRECT: createSession takes ONE argument in this repo
  const [state, setState] = useState<SessionState>(
  createSession("classic-fantasy-session", "classic-fantasy")
);

  const [turn, setTurn] = useState(0);

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  // ----------------------------------------------------------
  // Derive current room from last recorded outcome
  // ----------------------------------------------------------

  const currentRoomId = useMemo(() => {
    const last = [...state.events]
      .reverse()
      .find(
        (e) =>
          e.type === "OUTCOME" &&
          typeof (e as any).payload?.world?.roomId === "string"
      ) as any | undefined;

    return last?.payload?.world?.roomId;
  }, [state.events]);

  const prologue = useMemo(
    () => buildPrologue(state.events),
    [state.events]
  );

  const epilogue = useMemo(
    () => buildEpilogue(state.events),
    [state.events]
  );

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

      {prologue && (
        <CardSection title="Prologue">
          <p>{prologue}</p>
        </CardSection>
      )}

      <CardSection title="📍 Current Location">
        <p>
          <strong>{prettyRoomName(currentRoomId)}</strong>
        </p>
        <p className="muted">
          Canon location derived from last recorded outcome.
        </p>
      </CardSection>

      <DungeonPressurePanel
        turn={turn}
        currentRoomId={currentRoomId}
        events={state.events}
        parsedCommand={parsed}
      />

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
                  onClick={() => setSelectedOption(opt)}
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

      {epilogue && (
        <CardSection title="Epilogue">
          <p>{epilogue}</p>
        </CardSection>
      )}

      <Disclaimer />
    </StewardedShell>
  );
}
