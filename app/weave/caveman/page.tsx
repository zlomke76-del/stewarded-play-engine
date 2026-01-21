"use client";

// ------------------------------------------------------------
// Caveman — Survival (The Weave)
// ------------------------------------------------------------
// Invariants:
// - Player selects intent
// - Solace resolves outcomes
// - Exactly ONE resolution per intent
// - Canon advances only on human declaration
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
// Risk inference (language-only)
// ------------------------------------------------------------

type OptionKind = "safe" | "environmental" | "risky" | "contested";

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
// 🜂 Solace observation (non-authoritative)
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

  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  // 🔐 Intent latch — guarantees 1 resolution per intent
  const [activeIntentId, setActiveIntentId] =
    useState<string | null>(null);

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
  // Player intent
  // ----------------------------------------------------------

  function handleSubmitCommand() {
    if (!command.trim()) return;
    if (activeIntentId) return; // 🔒 block stacking intents

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

    const intentId = crypto.randomUUID();

    setOptions(resolved);
    setSelectedOption(resolved[0]);
    setActiveIntentId(intentId);
  }

  // ----------------------------------------------------------
  // Solace commits canon (EXACTLY ONCE)
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
    if (!activeIntentId) return; // 🔐 HARD STOP

    const nextTurn = turn + 1;
    setTurn(nextTurn);

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "solace",
        type: "OUTCOME",
        payload: {
          ...payload,
          audit: [...payload.audit, "The Weave enforced"],
          world: {
            ...payload.world,
            turn: nextTurn,
          },
        },
      })
    );

    // 🔑 Clear intent AFTER resolution
    setTimeout(() => {
      setActiveIntentId(null);
      setCommand("");
      setOptions(null);
      setSelectedOption(null);
    }, 600);
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

      {selectedOption && activeIntentId && (
        <CardSection title="Resolution">
          <ResolutionDraftPanel
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
          disabled={Boolean(activeIntentId)}
        />
        <button
          onClick={handleSubmitCommand}
          disabled={Boolean(activeIntentId)}
        >
          Commit Intent
        </button>
      </CardSection>

      <WorldLedgerPanel events={state.events} />
      <Disclaimer />
    </StewardedShell>
  );
}
