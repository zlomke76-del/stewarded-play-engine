"use client";

// ------------------------------------------------------------
// Classic Fantasy — Might & Magic Resolution
// ------------------------------------------------------------
//
// Invariants:
// - Player issues commands
// - Solace narrates dice outcomes
// - Dice decide fate
// - Arbiter records canon
// - Dungeon pressure is visible but NEVER acts
//
// Build-pass hotfix:
// - Removes dependency on incompatible ResolutionDraftAdvisoryPanel props
// - Uses a local, minimal outcome recorder so the route compiles cleanly
// ------------------------------------------------------------

import { useMemo, useState, useEffect } from "react";
import {
  createSession,
  recordEvent,
  SessionState,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";

import NextActionHint from "@/components/NextActionHint";
import WorldLedgerPanelLegacy from "@/components/world/WorldLedgerPanel.legacy";
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

function prettyRoomName(roomId?: string) {
  if (!roomId) return "Unknown";
  if (roomId.startsWith("room-")) return "Stone Hallway";
  return roomId;
}

function difficultyFor(kind?: OptionKind): number {
  switch (kind) {
    case "safe":
      return 6;
    case "environmental":
      return 8;
    case "risky":
      return 10;
    case "contested":
      return 14;
    default:
      return 10;
  }
}

// ------------------------------------------------------------
// Canon framing
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
  const [state, setState] = useState<SessionState>(
    createSession(
      "classic-fantasy-session",
      "classic-fantasy"
    )
  );

  const [turn, setTurn] = useState(0);

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] =
    useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  // local build-safe resolution state
  const [draftNarration, setDraftNarration] =
    useState("");
  const [rolledValue, setRolledValue] = useState<
    number | null
  >(null);

  // ----------------------------------------------------------
  // Current location
  // ----------------------------------------------------------

  const currentRoomId = useMemo(() => {
    const last = [...state.events]
      .reverse()
      .find(
        (e) =>
          e.type === "OUTCOME" &&
          typeof (e as any).payload?.world
            ?.roomId === "string"
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

  const selectedKind = useMemo<OptionKind | undefined>(
    () =>
      selectedOption
        ? inferOptionKind(selectedOption.description)
        : undefined,
    [selectedOption]
  );

  const selectedDc = useMemo(
    () => difficultyFor(selectedKind),
    [selectedKind]
  );

  // ----------------------------------------------------------
  // Player command
  // ----------------------------------------------------------

  function handleSubmitCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction(
      "player_1",
      command
    );
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
    setDraftNarration("");
    setRolledValue(null);
  }

  // ----------------------------------------------------------
  // Solace facilitator — deterministic, non-ranking
  // ----------------------------------------------------------

  useEffect(() => {
    if (!options || options.length === 0) return;
    setSelectedOption(options[0]);
  }, [options]);

  useEffect(() => {
    if (!selectedOption) return;
    setDraftNarration(
      `Solace frames the attempt: ${selectedOption.description}`
    );
    setRolledValue(null);
  }, [selectedOption]);

  // ----------------------------------------------------------
  // Local build-safe roll + record
  // ----------------------------------------------------------

  function handleRoll() {
    const r = Math.ceil(Math.random() * 20);
    setRolledValue(r);

    if (!selectedOption) return;

    const success = r >= selectedDc;
    setDraftNarration(
      success
        ? `The attempt succeeds: ${selectedOption.description}`
        : `The attempt falters: ${selectedOption.description}`
    );
  }

  function handleRecord() {
    if (!selectedOption) return;

    const roll = rolledValue ?? 10;
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: {
          description:
            draftNarration.trim() ||
            selectedOption.description,
          dice: {
            mode: "d20",
            roll,
            dc: selectedDc,
            source: "solace" as const,
          },
          audit: [
            "Classic Fantasy fallback recorder",
            `Selected option: ${selectedOption.description}`,
            `Inferred kind: ${selectedKind ?? "safe"}`,
            `Roll: ${roll} vs DC ${selectedDc}`,
          ],
          world: {
            roomId: currentRoomId,
            turn: nextTurn,
            scope: "local",
          },
        },
      })
    );
  }

  // ----------------------------------------------------------
  // Share
  // ----------------------------------------------------------

  function handleShare() {
    const canon = exportCanon(state.events);
    void navigator.clipboard.writeText(canon);
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
              "Narrates dice outcomes (non-authoritative)",
          },
          {
            label: "Arbiter",
            description:
              "Commits outcomes to the world",
          },
        ]}
      />

      {prologue && (
        <CardSection title="Prologue">
          <p>{prologue}</p>
        </CardSection>
      )}

      <CardSection title="📍 Current Location">
        <strong>{prettyRoomName(currentRoomId)}</strong>
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
          onChange={(e) =>
            setCommand(e.target.value)
          }
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

      {selectedOption && (
        <CardSection title="Resolution">
          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              <strong>Selected Option:</strong>{" "}
              {selectedOption.description}
            </div>

            <div>
              <strong>Inferred Kind:</strong>{" "}
              {selectedKind ?? "safe"} ·{" "}
              <strong>DC:</strong> {selectedDc}
            </div>

            <div>
              <strong>Roll:</strong>{" "}
              {rolledValue ?? "—"}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button onClick={handleRoll}>
                Roll d20
              </button>
              <button onClick={handleRecord}>
                Record Outcome
              </button>
            </div>

            <div>
              <strong>Narration Draft</strong>
            </div>

            <textarea
              rows={5}
              value={draftNarration}
              onChange={(e) =>
                setDraftNarration(e.target.value)
              }
            />
          </div>
        </CardSection>
      )}

      <NextActionHint state={state} />
      <WorldLedgerPanelLegacy events={state.events} />

      {epilogue && (
        <CardSection title="Epilogue">
          <p>{epilogue}</p>
        </CardSection>
      )}

      <Disclaimer />
    </StewardedShell>
  );
}
