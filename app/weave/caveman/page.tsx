"use client";

// ------------------------------------------------------------
// Caveman — Survival (The Weave)
// ------------------------------------------------------------
//
// Invariants:
// - Player selects intent
// - Solace interprets
// - Solace resolves outcomes
// - Canon is committed automatically
// - Clarification is ephemeral (not a turn, not canon)
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
import WorldLedgerPanel from "@/components/world/WorldLedgerPanel";

import EnvironmentalPressurePanel from "@/components/world/EnvironmentalPressurePanel";
import SurvivalResourcePanel from "@/components/world/SurvivalResourcePanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type OptionKind =
  | "safe"
  | "environmental"
  | "risky"
  | "contested";

type InterpretationState =
  | { mode: "idle" }
  | { mode: "ask"; question: string }
  | { mode: "resolve"; option: Option };

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function inferOptionKind(description: string): OptionKind {
  const t = description.toLowerCase();

  if (
    t.includes("attack") ||
    t.includes("fight") ||
    t.includes("defend") ||
    t.includes("enemy")
  ) {
    return "contested";
  }

  if (
    t.includes("hunt") ||
    t.includes("move") ||
    t.includes("travel") ||
    t.includes("scout")
  ) {
    return "environmental";
  }

  if (
    t.includes("risk") ||
    t.includes("sneak") ||
    t.includes("steal")
  ) {
    return "risky";
  }

  return "safe";
}

function inferBiome(description: string): string {
  const t = description.toLowerCase();

  if (t.includes("hunt")) return "Hunting Grounds";
  if (t.includes("scout")) return "Nearby Ridge";
  if (t.includes("move")) return "New Camp";
  if (t.includes("defend")) return "Camp Perimeter";

  return "The Wilds";
}

function narrateOutcome(
  roll: number | null,
  dc: number
): string {
  if (roll === null || dc === 0) {
    return "You proceed carefully. The tribe endures.";
  }

  if (roll >= dc) {
    return "The attempt succeeds. Momentum shifts in your favor.";
  }

  return "The attempt falters. The land resists your effort.";
}

// Simple heuristic: ambiguous scale → ask
function needsClarification(intent: string): string | null {
  const t = intent.toLowerCase();

  if (t.includes("hunt"))
    return "How many hunters are involved?";
  if (t.includes("scout"))
    return "How far do you scout from camp?";
  if (t.includes("defend"))
    return "What threat are you defending against?";

  return null;
}

// ------------------------------------------------------------

export default function CavemanPage() {
  const [state, setState] = useState<SessionState>(
    createSession("caveman-session")
  );

  const [turn, setTurn] = useState(0);

  const [command, setCommand] = useState("");
  const [clarification, setClarification] = useState("");

  const [interpretation, setInterpretation] =
    useState<InterpretationState>({ mode: "idle" });

  // ----------------------------------------------------------
  // Canon-derived location
  // ----------------------------------------------------------

  const currentLocation = useMemo(() => {
    const last = [...state.events]
      .reverse()
      .find(
        (e) =>
          e.type === "OUTCOME" &&
          typeof (e as any).payload?.world?.roomId === "string"
      ) as any | undefined;

    return last?.payload?.world?.roomId ?? "The Wilds";
  }, [state.events]);

  // ----------------------------------------------------------
  // Player intent submission
  // ----------------------------------------------------------

  function handleSubmitCommand() {
    if (!command.trim()) return;

    const parsed = parseAction("player_1", command);
    const optionSet = generateOptions(parsed);

    const question = needsClarification(command);

    if (question) {
      setInterpretation({ mode: "ask", question });
      return;
    }

    const option =
      optionSet.options[0] ??
      ({
        id: "fallback",
        description: command,
      } as Option);

    setInterpretation({ mode: "resolve", option });
  }

  // ----------------------------------------------------------
  // Clarification response
  // ----------------------------------------------------------

  function handleClarificationSubmit() {
    const combinedIntent = `${command} (${clarification})`;
    const parsed = parseAction("player_1", combinedIntent);
    const optionSet = generateOptions(parsed);

    const option =
      optionSet.options[0] ??
      ({
        id: "fallback",
        description: combinedIntent,
      } as Option);

    setClarification("");
    setInterpretation({ mode: "resolve", option });
  }

  // ----------------------------------------------------------
  // Canon commit (Solace)
  // ----------------------------------------------------------

  function handleAutoRecord(payload: {
    dice: {
      roll: number | null;
      dc: number;
    };
    audit: string[];
  }) {
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    const biome = inferBiome(
      interpretation.mode === "resolve"
        ? interpretation.option.description
        : command
    );

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "solace",
        type: "OUTCOME",
        payload: {
          description: narrateOutcome(
            payload.dice.roll,
            payload.dice.dc
          ),
          audit: [...payload.audit, "The Weave enforced"],
          world: {
            primary: "location",
            roomId: biome,
            scope: "local",
            turn: nextTurn,
          },
        },
      })
    );

    // reset forward state
    setCommand("");
    setInterpretation({ mode: "idle" });
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
    <StewardedShell theme="dark">
      <ModeHeader
        title="Caveman — Survival (The Weave)"
        onShare={handleShare}
        roles={[
          { label: "Player", description: "Declares intent" },
          {
            label: "Solace",
            description:
              "Interprets, resolves, and commits canon",
          },
        ]}
      />

      <CardSection title="🌍 Current State">
        <strong>{currentLocation}</strong>
      </CardSection>

      <EnvironmentalPressurePanel turn={turn} />
      <SurvivalResourcePanel turn={turn} />

      {/* ---------- INTERPRETATION ---------- */}

      {interpretation.mode === "ask" && (
        <CardSection title="Clarification Requested">
          <p className="muted">{interpretation.question}</p>
          <textarea
            rows={2}
            value={clarification}
            onChange={(e) =>
              setClarification(e.target.value)
            }
            placeholder="Respond briefly…"
          />
          <button onClick={handleClarificationSubmit}>
            Respond
          </button>
        </CardSection>
      )}

      {interpretation.mode === "resolve" && (
        <CardSection title="Last Turn">
          <ResolutionDraftPanel
            role="arbiter"
            autoResolve
            context={{
              optionDescription:
                interpretation.option.description,
              optionKind: inferOptionKind(
                interpretation.option.description
              ),
            }}
            onRecord={handleAutoRecord}
          />
        </CardSection>
      )}

      {/* ---------- NEW INTENT ---------- */}

      {interpretation.mode === "idle" && (
        <CardSection title="Intent">
          <textarea
            rows={3}
            value={command}
            onChange={(e) =>
              setCommand(e.target.value)
            }
            placeholder="HUNT, SCOUT, DEFEND, MOVE CAMP…"
          />
          <button onClick={handleSubmitCommand}>
            Commit Intent
          </button>
        </CardSection>
      )}

      <WorldLedgerPanel events={state.events} />
      <Disclaimer />
    </StewardedShell>
  );
}
