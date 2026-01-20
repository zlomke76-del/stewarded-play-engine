"use client";

// ------------------------------------------------------------
// Caveman — Survival (The Weave)
// ------------------------------------------------------------
//
// Invariants:
// - Player selects actions
// - Solace arbitrates (authoritative)
// - Dice are mandatory + auto-rolled
// - Canon is committed immediately
// - Pressure escalates mechanically
// - No human override
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

import WorldLedgerPanel from "@/components/world/WorldLedgerPanel";

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

  if (t.includes("attack") || t.includes("fight")) {
    return "contested";
  }

  if (t.includes("cross") || t.includes("move")) {
    return "environmental";
  }

  if (t.includes("risk")) {
    return "risky";
  }

  return "safe";
}

// ------------------------------------------------------------

export default function CavemanPage() {
  const [state, setState] = useState<SessionState>(
    createSession("caveman-session")
  );

  const [turn, setTurn] = useState(0);

  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);

  // ----------------------------------------------------------
  // Derive current location from canon
  // ----------------------------------------------------------

  const currentLocation = useMemo(() => {
    const last = [...state.events]
      .reverse()
      .find(
        (e) =>
          e.type === "OUTCOME" &&
          typeof (e as any).payload?.world?.roomId === "string"
      ) as any | undefined;

    return last?.payload?.world?.roomId ?? "The Camp";
  }, [state.events]);

  // ----------------------------------------------------------
  // Player submits intent
  // ----------------------------------------------------------

  function handleSubmitCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction("player_1", command);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
  }

  // ----------------------------------------------------------
  // Solace auto-resolves + records canon (governed)
  // ----------------------------------------------------------

  function autoResolve(option: Option) {
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "solace",
        type: "OUTCOME",
        payload: {
          description: option.description,
          dice: {
            mode: option.diceMode ?? "d20",
            roll: null,
            dc: option.dc ?? 10,
            justification: "Governed resolution",
          },
          audit: ["Resolved by Solace", "The Weave enforced"],
          world: {
            turn: nextTurn,
            pressure: "escalated",
          },
        },
      })
    );

    setOptions(null);
    setParsed(null);
    setCommand("");
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
    <StewardedShell theme="primitive">
      <ModeHeader
        title="Caveman — Survival (The Weave)"
        onShare={handleShare}
        roles={[
          {
            label: "Player",
            description: "Selects actions under pressure",
          },
          {
            label: "Solace",
            description:
              "Arbitrates outcomes and enforces canon",
          },
        ]}
      />

      <CardSection title="🌍 Current State">
        <p>
          <strong>{currentLocation}</strong>
        </p>
        <p className="muted">
          Shared reality governed by The Weave.
        </p>
      </CardSection>

      <CardSection title="Intent">
        <textarea
          rows={3}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="HUNT, MOVE CAMP, SCOUT, DEFEND…"
        />
        <button onClick={handleSubmitCommand}>
          Commit Intent
        </button>
      </CardSection>

      {options && (
        <CardSection title="Available Paths">
          <ul>
            {options.map((opt) => (
              <li key={opt.id}>
                <button onClick={() => autoResolve(opt)}>
                  {opt.description}
                </button>
              </li>
            ))}
          </ul>
        </CardSection>
      )}

      <WorldLedgerPanel events={state.events} />

      <CardSection title="Canon">
        {state.events.filter(
          (e) => e.type === "OUTCOME"
        ).length === 0 ? (
          <p className="muted">
            The Weave has not yet resolved.
          </p>
        ) : (
          <ul>
            {state.events
              .filter((e) => e.type === "OUTCOME")
              .map((event) => (
                <li key={event.id}>
                  {String(
                    (event as any).payload.description
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
