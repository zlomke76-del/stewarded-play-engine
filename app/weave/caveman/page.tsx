"use client";

// ------------------------------------------------------------
// Caveman — Survival (The Weave)
// ------------------------------------------------------------
// Invariants:
// - Player selects intent
// - Solace resolves outcomes
// - Canon is committed automatically
// - No human arbiter
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

// 🪨 NEW
import { WindscarCave } from "@/lib/world/caves/WindscarCave";

// ------------------------------------------------------------
// Risk inference
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
    t.includes("defend") ||
    t.includes("ambush")
  ) {
    return "contested";
  }

  if (
    t.includes("hunt") ||
    t.includes("scout") ||
    t.includes("travel")
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

// ------------------------------------------------------------
// Cave resolution logic (Solace-controlled)
// ------------------------------------------------------------

function resolveCaveNode(
  option: Option,
  turn: number
) {
  const text = option.description.toLowerCase();

  // Solace enters Windscar Cave only on
  // shelter / defense / rest-implied intents
  const shouldEnterCave =
    text.includes("defend") ||
    text.includes("fortify") ||
    text.includes("rest") ||
    text.includes("hold position") ||
    text.includes("wait");

  if (!shouldEnterCave) return null;

  const entryNode =
    WindscarCave.nodes[WindscarCave.entryNodeId];

  return {
    caveId: WindscarCave.caveId,
    nodeId: entryNode.nodeId,
    nodeName: entryNode.name,
    depth: entryNode.depth,
    traits: entryNode.traits,
    state: entryNode.state,
  };
}

// ------------------------------------------------------------

export default function CavemanPage() {
  const [state, setState] = useState<SessionState>(
    createSession("caveman-session")
  );

  const [turn, setTurn] = useState(0);

  const [command, setCommand] = useState("");
  const [options, setOptions] = useState<Option[] | null>(
    null
  );
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  // ----------------------------------------------------------
  // Canon-derived location
  // ----------------------------------------------------------

  const currentLocation = useMemo(() => {
    const last = [...state.events]
      .reverse()
      .find(
        (e) =>
          e.type === "OUTCOME" &&
          typeof (e as any).payload?.world
            ?.roomId === "string"
      ) as any | undefined;

    return (
      last?.payload?.world?.roomId ??
      "The Wilds"
    );
  }, [state.events]);

  // ----------------------------------------------------------
  // Player intent
  // ----------------------------------------------------------

  function handleSubmitCommand() {
    if (!command.trim()) return;

    const parsedAction = parseAction(
      "player_1",
      command
    );
    const optionSet =
      generateOptions(parsedAction);

    const resolved =
      optionSet?.options?.length > 0
        ? optionSet.options
        : ([
            {
              id: "fallback",
              description: `Proceed cautiously: ${command}`,
            },
          ] as Option[]);

    setOptions([...resolved]);
  }

  // ----------------------------------------------------------
  // Solace commits canon (TURN ADVANCES HERE)
  // ----------------------------------------------------------

  function handleAutoRecord(payload: {
    description: string;
    dice: {
      mode: string;
      roll: number | null;
      dc: number;
      justification: string;
    };
    audit: string[];
    world?: any;
  }) {
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    // 🪨 NEW — Solace checks for cave entry
    const caveResolution =
      selectedOption &&
      resolveCaveNode(
        selectedOption,
        nextTurn
      );

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "solace",
        type: "OUTCOME",
        payload: {
          ...payload,
          audit: [
            ...payload.audit,
            "The Weave enforced",
          ],
          world: caveResolution
            ? {
                primary: "location",
                roomId:
                  caveResolution.nodeId,
                caveId:
                  caveResolution.caveId,
                nodeType: "cave",
                depth: caveResolution.depth,
                traits:
                  caveResolution.traits,
                state: caveResolution.state,
                turn: nextTurn,
              }
            : {
                ...payload.world,
                turn: nextTurn,
              },
        },
      })
    );

    // reset forward intent only
    setCommand("");
    setOptions(null);
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
          {
            label: "Player",
            description: "Selects intent",
          },
          {
            label: "Solace",
            description:
              "Interprets risk and commits canon",
          },
        ]}
      />

      {/* ---------- CURRENT STATE ---------- */}
      <CardSection title="🌍 Current State">
        <strong>{currentLocation}</strong>
      </CardSection>

      {/* ---------- PRESSURE / RESOURCES ---------- */}
      <EnvironmentalPressurePanel turn={turn} />
      <SurvivalResourcePanel turn={turn} />

      {/* ---------- LAST TURN ---------- */}
      {selectedOption && (
        <CardSection title="Last Turn">
          <ResolutionDraftPanel
            key={turn} // 🔑 ensures turn progression
            role="arbiter"
            autoResolve
            context={{
              optionDescription:
                selectedOption.description,
              optionKind:
                inferOptionKind(
                  selectedOption.description
                ),
            }}
            onRecord={handleAutoRecord}
          />
        </CardSection>
      )}

      {/* ---------- NEW INTENT ---------- */}
      <CardSection title="Intent">
        <textarea
          rows={3}
          value={command}
          onChange={(e) =>
            setCommand(e.target.value)
          }
          placeholder="HUNT, DEFEND, WAIT, SCOUT…"
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

      {/* ---------- LEDGER ---------- */}
      <WorldLedgerPanel events={state.events} />

      <Disclaimer />
    </StewardedShell>
  );
}
