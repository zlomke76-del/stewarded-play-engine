"use client";

// ------------------------------------------------------------
// Caveman — Survival (The Weave)
// ------------------------------------------------------------
// Invariants:
// - Player selects intent
// - Solace resolves outcomes
// - Canon is committed automatically
// - Exactly ONE resolution per intent
// - Resolution persists until NEXT intent
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

// 🜂 Solace resolution pipeline
import {
  createRun,
  appendResolution,
} from "@/lib/solace/resolution.run";

import { saveRun } from "@/lib/solace/resolution.persistence";
import { buildSolaceResolution } from "@/lib/solace/resolution.pipeline";

// ------------------------------------------------------------
// Risk inference (LANGUAGE-ONLY — retained, non-authoritative)
// ------------------------------------------------------------

type OptionKind =
  | "safe"
  | "environmental"
  | "risky"
  | "contested";

function inferOptionKindFromText(
  description: string
): OptionKind {
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
// Risk inference (STRUCTURAL — AUTHORITATIVE)
// ------------------------------------------------------------

function optionCategoryToKind(
  category: Option["category"]
): OptionKind {
  switch (category) {
    case "mechanical":
      return "contested";
    case "environmental":
      return "environmental";
    case "social":
      return "risky";
    case "narrative":
    case "other":
    default:
      return "safe";
  }
}

// ------------------------------------------------------------
// 🜂 Solace observation (non-authoritative, descriptive only)
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
// Page Component
// ------------------------------------------------------------

export default function CavemanPage() {
  const [state, setState] = useState<SessionState>(
    createSession("caveman-session")
  );

  const [turn, setTurn] = useState(0);

  // 🜂 Active resolution run (durable canon)
  const [run, setRun] = useState(() => createRun());

  const [command, setCommand] = useState("");
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  // 🔒 Resolution persists until NEXT intent
  const [resolutionActive, setResolutionActive] =
    useState(false);

  // ----------------------------------------------------------
  // Canon-derived world
  // ----------------------------------------------------------

  const lastWorld = useMemo(() => {
    const last = [...state.events]
      .reverse()
      .find((e) => e.type === "OUTCOME") as
      | any
      | undefined;

    return last?.payload?.world;
  }, [state.events]);

  const currentLocation =
    lastWorld?.roomId ?? "The Wilds";

  const observation = useMemo(
    () => deriveObservation(lastWorld),
    [lastWorld]
  );

  // ----------------------------------------------------------
  // Player intent → option generation
  // ----------------------------------------------------------

  function handleSubmitCommand() {
    if (!command.trim()) return;

    // Clear previous resolution ONLY when new intent is declared
    setResolutionActive(false);
    setOptions(null);
    setSelectedOption(null);

    const parsed = parseAction("player_1", command);
    const optionSet = generateOptions(parsed);

    const resolved: Option[] =
      optionSet?.options?.length > 0
        ? [...optionSet.options]
        : [
            {
              id: crypto.randomUUID(),
              category: "other",
              description: `Proceed cautiously: ${command}`,
            },
          ];

    setOptions(resolved);
    setSelectedOption(resolved[0]);
    setResolutionActive(true);
  }

  // ----------------------------------------------------------
  // Solace commits canon (ONE TURN PER INTENT)
  // ----------------------------------------------------------

  function handleAutoRecord(payload: {
    description: string;
    dice: {
      mode: string;
      roll: number | null;
      dc: number;
      justification: string;
      source: string;
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
          (e as any).payload?.world?.nodeType ===
            "cave"
      ) as any | undefined;

    const previousCave = lastCaveEvent?.payload?.world;

    const fireUsed =
      payload.audit.some((a) =>
        a.toLowerCase().includes("fire")
      ) ||
      payload.description
        .toLowerCase()
        .includes("fire");

    const successfulHunt =
      payload.world?.resources?.foodDelta &&
      payload.world.resources.foodDelta > 0;

    const rested = Boolean(
      selectedOption?.description
        .toLowerCase()
        .includes("rest") ||
        selectedOption?.description
          .toLowerCase()
          .includes("wait")
    );

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

    // 1️⃣ SessionState canon (UI / ephemeral)
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "solace",
        type: "OUTCOME",
        payload: {
          ...payload,
          audit: [...payload.audit, "The Weave enforced"],
          world: previousCave
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

    // 2️⃣ ResolutionRun canon (durable)
    const resolution = buildSolaceResolution({
      legacyPayload: payload,
      turn: nextTurn,
    });

    setRun((prevRun) => {
      const updated = appendResolution(
        prevRun,
        resolution
      );

      // Persist asynchronously; DB enforces immutability
      saveRun(updated).catch(console.error);

      return updated;
    });

    // NO timeout
    // NO auto-clear
    // Resolution remains until next intent
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

      {selectedOption && resolutionActive && (
        <CardSection title="Resolution">
          <ResolutionDraftPanel
            key={`resolution-${selectedOption.id}`}
            role="arbiter"
            autoResolve
            context={{
              optionDescription:
                selectedOption.description,

              // 🔑 STRUCTURAL RISK (authoritative)
              optionKind: optionCategoryToKind(
                selectedOption.category
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

/* ------------------------------------------------------------
   EOF
   This file now additionally enforces:
   - ResolutionRun creation + append
   - Durable canon persistence
   - SessionState + Run dual-ledger alignment
------------------------------------------------------------ */
