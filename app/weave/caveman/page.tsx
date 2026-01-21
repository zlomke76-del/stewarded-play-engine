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
// Risk inference (Solace-only)
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
// 🜂 Solace observation
// ------------------------------------------------------------

function deriveObservation(world?: any): string {
  if (!world || world.nodeType !== "cave") {
    return "Wind moves freely here, but stone nearby interrupts its flow.";
  }

  if (world.depth === 0) {
    return "Air cools unevenly near the rock face, carrying the scent of damp stone.";
  }

  if (world.depth === 1) {
    return "Sound dulls quickly here, swallowed by twisting stone and narrow air.";
  }

  if (world.state === "sacred") {
    return "The chamber feels altered — as if presence, not shelter, defines it now.";
  }

  return "The stone closes in, holding traces of earlier passage.";
}

// ------------------------------------------------------------

export default function CavemanPage() {
  const [state, setState] = useState<SessionState>(
    createSession("caveman-session")
  );

  const [turn, setTurn] = useState(0);
  const [command, setCommand] = useState("");
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  // ----------------------------------------------------------
  // Canon-derived world
  // ----------------------------------------------------------

  const lastWorld = useMemo(() => {
    const last = [...state.events]
      .reverse()
      .find((e) => e.type === "OUTCOME") as any | undefined;

    return last?.payload?.world;
  }, [state.events]);

  const currentLocation =
    lastWorld?.roomId ?? "The Wilds";

  const observation = useMemo(
    () => deriveObservation(lastWorld),
    [lastWorld]
  );

  // ----------------------------------------------------------
  // Player intent → Solace decision
  // ----------------------------------------------------------

  function handleSubmitCommand() {
    if (!command.trim()) return;

    const parsed = parseAction("player_1", command);
    const optionSet = generateOptions(parsed);

    const resolvedOptions =
      optionSet?.options?.length > 0
        ? optionSet.options
        : ([{
            id: "fallback",
            description: `Proceed cautiously: ${command}`,
          }] as Option[]);

    // 🔒 Solace selects internally — player never sees branches
    setSelectedOption(resolvedOptions[0]);
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

    const lastCaveEvent = [...state.events]
      .reverse()
      .find(
        (e) =>
          e.type === "OUTCOME" &&
          (e as any).payload?.world?.nodeType === "cave"
      ) as any | undefined;

    const previousCave = lastCaveEvent?.payload?.world;

    const fireUsed = Boolean(
      payload.description.toLowerCase().includes("fire") ||
        payload.audit.some((a) =>
          a.toLowerCase().includes("fire")
        )
    );

    const successfulHunt = Boolean(
      payload.world?.resources?.foodDelta &&
        payload.world.resources.foodDelta > 0
    );

    const rested = Boolean(
      selectedOption?.description
        .toLowerCase()
        .includes("rest") ||
        selectedOption?.description
          .toLowerCase()
          .includes("wait")
    );

    const caveEntry =
      selectedOption &&
      resolveCaveNode(selectedOption);

    let evolvedState = previousCave?.state;

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
          audit: [...payload.audit, "The Weave enforced"],
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

    setCommand("");
    setSelectedOption(null);
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <StewardedShell theme="dark">
      <ModeHeader
        title="Caveman — Survival (The Weave)"
        onShare={() =>
          navigator.clipboard.writeText(
            exportCanon(state.events)
          )
        }
        roles={[
          { label: "Player", description: "Selects intent" },
          {
            label: "Solace",
            description: "Interprets risk and commits canon",
          },
        ]}
      />

      <CardSection title="🌍 Current State">
        <strong>{currentLocation}</strong>
      </CardSection>

      <CardSection title="Solace Observes">
        <p className="muted">{observation}</p>
      </CardSection>

      <EnvironmentalPressurePanel turn={turn} />
      <SurvivalResourcePanel turn={turn} />

      {selectedOption && (
        <CardSection title="Last Turn">
          <ResolutionDraftPanel
            key={turn}
            role="arbiter"
            autoResolve
            context={{
              optionDescription: selectedOption.description,
              optionKind: inferOptionKind(
                selectedOption.description
              ),
            }}
            onRecord={handleAutoRecord}
          />
        </CardSection>
      )}

      <CardSection title="Intent">
        <textarea
          rows={3}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="HUNT, DEFEND, WAIT, SCOUT…"
        />
        <button onClick={handleSubmitCommand}>
          Commit Intent
        </button>
      </CardSection>

      <WorldLedgerPanel events={state.events} />
      <Disclaimer />
    </StewardedShell>
  );
}
