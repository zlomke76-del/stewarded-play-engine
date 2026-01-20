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

// 🪨 Cave system
import { WindscarCave } from "@/lib/world/caves/WindscarCave";
import { evolveCaveState } from "@/lib/world/caves/evolveCaveState";

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
// Cave resolution logic (Solace-only)
// ------------------------------------------------------------

function resolveCaveNode(option: Option) {
  const t = option.description.toLowerCase();

  const shouldEnterCave =
    t.includes("defend") ||
    t.includes("fortify") ||
    t.includes("rest") ||
    t.includes("wait") ||
    t.includes("hold");

  if (!shouldEnterCave) return null;

  const entry =
    WindscarCave.nodes[WindscarCave.entryNodeId];

  return {
    caveId: WindscarCave.caveId,
    nodeId: entry.nodeId,
    nodeName: entry.name,
    depth: entry.depth,
    traits: entry.traits,
    state: entry.state,
  };
}

// ------------------------------------------------------------

export default function CavemanPage() {
  const [state, setState] = useState<SessionState>(
    createSession("caveman-session")
  );

  const [turn, setTurn] = useState(0);

  const [command, setCommand] = useState("");
  const [options, setOptions] = useState<Option[] | null>(null);
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

    const parsed = parseAction(
      "player_1",
      command
    );
    const optionSet =
      generateOptions(parsed);

    const resolved =
      optionSet?.options?.length > 0
        ? optionSet.options
        : ([{
            id: "fallback",
            description: `Proceed cautiously: ${command}`,
          }] as Option[]);

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

    // 🔎 Detect last cave state
    const lastCaveEvent = [...state.events]
      .reverse()
      .find(
        (e) =>
          e.type === "OUTCOME" &&
          (e as any).payload?.world
            ?.nodeType === "cave"
      ) as any | undefined;

    const previousCave =
      lastCaveEvent?.payload?.world;

    // 🔥 Solace signals
    const fireUsed =
      payload.description
        .toLowerCase()
        .includes("fire") ||
      payload.audit.some((a) =>
        a.toLowerCase().includes("fire")
      );

    const successfulHunt =
      payload.world?.resources?.foodDelta &&
      payload.world.resources.foodDelta > 0;

    const rested =
      selectedOption?.description
        .toLowerCase()
        .includes("rest") ||
      selectedOption?.description
        .toLowerCase()
        .includes("wait");

    // 🪨 Cave entry
    const caveEntry =
      selectedOption &&
      resolveCaveNode(selectedOption);

    // 🪨 Cave evolution
    let evolvedState =
      previousCave?.state;

    if (previousCave) {
      evolvedState = evolveCaveState(
        {
          caveId: previousCave.caveId,
          nodeId: previousCave.roomId,
          currentState: previousCave.state,
          traits: previousCave.traits ?? [],
        },
        {
          fireUsed,
          successfulHunt,
          rested,
          turn: nextTurn,
        }
      );
    }

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
          world: caveEntry
            ? {
                primary: "location",
                roomId: caveEntry.nodeId,
                caveId: caveEntry.caveId,
                nodeType: "cave",
                depth: caveEntry.depth,
                traits: caveEntry.traits,
                state: caveEntry.state,
                turn: nextTurn,
              }
            : previousCave
            ? {
                ...previousCave,
                state: evolvedState,
                turn: nextTurn,
              }
            : {
                ...payload.world,
                turn: nextTurn,
              },
        },
      })
    );

    // Reset forward inputs
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
            key={turn} // 🔑 forces progression
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
