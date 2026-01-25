"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// Invariants:
// - Player declares intent
// - Solace prepares initial table (non-canonical)
// - Dice decide fate
// - Solace narrates outcomes (non-authoritative)
// - Arbiter commits canon
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
  createSession,
  recordEvent,
  SessionState,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";

import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import NextActionHint from "@/components/NextActionHint";
import WorldLedgerPanelLegacy from "@/components/world/WorldLedgerPanel.legacy";
import DungeonPressurePanel from "@/components/world/DungeonPressurePanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type DMMode = "human" | "solace-neutral";

type OptionKind =
  | "safe"
  | "environmental"
  | "risky"
  | "contested";

type InitialTable = {
  openingFrame: string;
  locationTraits: string[];
  latentFactions: {
    name: string;
    desire: string;
    pressure: string;
  }[];
  environmentalOddities: string[];
  dormantHooks: string[];
};

// ------------------------------------------------------------
// Random helpers (deterministic per load, different each time)
// ------------------------------------------------------------

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateInitialTable(): InitialTable {
  return {
    openingFrame: pick([
      "A low fog coils between narrow streets as evening bells fade.",
      "Rain-dark stone reflects lanternlight in uneasy patterns.",
      "Voices echo where they shouldn’t, carrying fragments of argument.",
      "The city hums, unaware of the pressure building beneath it.",
    ]),
    locationTraits: [
      pick(["crowded", "echoing", "claustrophobic", "uneasily quiet"]),
      pick(["ancient stone", "rotting wood", "slick cobblestone"]),
    ],
    latentFactions: [
      {
        name: pick(["The Whisperers", "The Vaultwardens", "The Ash Circle"]),
        desire: pick([
          "control what sleeps below",
          "seal the vaults forever",
          "profit from forbidden knowledge",
        ]),
        pressure: pick([
          "time is running out",
          "someone is leaking secrets",
          "an old oath is failing",
        ]),
      },
    ],
    environmentalOddities: [
      pick([
        "Lantern flames gutter without wind",
        "Stone walls seem to absorb sound",
        "Whispers surface near old drains",
        "Footsteps echo twice",
      ]),
    ],
    dormantHooks: [
      pick([
        "A name scratched into stone repeats across districts",
        "A missing city clerk last seen near the underways",
        "A sealed door recently disturbed",
      ]),
    ],
  };
}

// ------------------------------------------------------------
// Difficulty inference (language-only)
// ------------------------------------------------------------

function inferOptionKind(description: string): OptionKind {
  const text = description.toLowerCase();

  if (
    text.includes("attack") ||
    text.includes("fight") ||
    text.includes("oppose") ||
    text.includes("contest")
  ) {
    return "contested";
  }

  if (
    text.includes("climb") ||
    text.includes("cross") ||
    text.includes("navigate") ||
    text.includes("environment")
  ) {
    return "environmental";
  }

  if (
    text.includes("steal") ||
    text.includes("sneak") ||
    text.includes("risk")
  ) {
    return "risky";
  }

  return "safe";
}

// ------------------------------------------------------------

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(
    createSession("demo-session", "demo")
  );

  const [dmMode, setDmMode] = useState<DMMode>("solace-neutral");

  // Initial Table Gate
  const [initialTable, setInitialTable] =
    useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);

  // 🔹 ADDITIVE: editable DM draft of table text
  const [initialTableDraft, setInitialTableDraft] =
    useState<string>("");

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<Option | null>(null);

  // ----------------------------------------------------------
  // Generate table ONCE per session in Solace mode
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (initialTable) return;

    const table = generateInitialTable();
    setInitialTable(table);

    // 🔹 Seed editable draft (non-canonical)
    setInitialTableDraft(
      [
        table.openingFrame,
        "",
        `Traits: ${table.locationTraits.join(", ")}`,
        "",
        ...table.latentFactions.map(
          (f) =>
            `${f.name} — ${f.desire} (${f.pressure})`
        ),
        "",
        `Oddity: ${table.environmentalOddities.join(", ")}`,
        "",
        `Hook: ${table.dormantHooks.join(", ")}`,
      ].join("\n")
    );
  }, [dmMode, initialTable]);

  // ----------------------------------------------------------
  // Player submits action
  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);
  }

  // ----------------------------------------------------------
  // Solace silently selects option when facilitating
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;

    setSelectedOption(options[0]);
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // Record canon
  // ----------------------------------------------------------

  function handleRecord(payload: {
    description: string;
    dice: {
      mode: string;
      roll: number;
      dc: number;
      source: "manual" | "solace";
    };
    audit: string[];
  }) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload,
      })
    );
  }

  // ----------------------------------------------------------
  // Share canon
  // ----------------------------------------------------------

  function shareCanon() {
    navigator.clipboard.writeText(
      exportCanon(state.events)
    );
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <StewardedShell>
      <ModeHeader
        title="Stewarded Play — Full Flow"
        onShare={shareCanon}
        roles={[
          { label: "Player", description: "Declares intent" },
          {
            label: "Solace",
            description:
              "Prepares the table and narrates outcomes",
          },
          {
            label: "Arbiter",
            description: "Commits canon",
          },
        ]}
      />

      {/* INITIAL TABLE GATE */}
      {dmMode === "solace-neutral" &&
        initialTable &&
        !tableAccepted && (
          <CardSection title="Initial Table (Solace — Editable)">
            {/* Existing rendered structure (unchanged) */}
            <p>{initialTable.openingFrame}</p>

            <p className="muted">
              Traits:{" "}
              {initialTable.locationTraits.join(", ")}
            </p>

            <ul>
              {initialTable.latentFactions.map(
                (f, i) => (
                  <li key={i}>
                    <strong>{f.name}</strong> —{" "}
                    {f.desire} ({f.pressure})
                  </li>
                )
              )}
            </ul>

            <p className="muted">
              Oddity:{" "}
              {initialTable.environmentalOddities.join(
                ", "
              )}
            </p>

            <p className="muted">
              Hook:{" "}
              {initialTable.dormantHooks.join(", ")}
            </p>

            {/* 🔹 ADDITIVE: DM-editable narrative draft */}
            <label className="muted">
              DM Notes / Editable Table Framing
            </label>
            <textarea
              rows={8}
              style={{ width: "100%" }}
              value={initialTableDraft}
              onChange={(e) =>
                setInitialTableDraft(e.target.value)
              }
            />

            <button
              onClick={() => {
                const t = generateInitialTable();
                setInitialTable(t);
                setInitialTableDraft(
                  [
                    t.openingFrame,
                    "",
                    `Traits: ${t.locationTraits.join(", ")}`,
                    "",
                    ...t.latentFactions.map(
                      (f) =>
                        `${f.name} — ${f.desire} (${f.pressure})`
                    ),
                    "",
                    `Oddity: ${t.environmentalOddities.join(
                      ", "
                    )}`,
                    "",
                    `Hook: ${t.dormantHooks.join(", ")}`,
                  ].join("\n")
                );
              }}
            >
              Regenerate
            </button>{" "}
            <button
              onClick={() => setTableAccepted(true)}
            >
              Accept Table
            </button>
          </CardSection>
        )}

      {/* BLOCK PLAY UNTIL ACCEPTED */}
      {dmMode === "solace-neutral" &&
        !tableAccepted && <Disclaimer />}

      {/* GAME FLOW */}
      {(dmMode === "human" || tableAccepted) && (
        <>
          <DungeonPressurePanel
            turn={state.events.filter(
              (e) => e.type === "OUTCOME"
            ).length}
            events={state.events}
          />

          <CardSection title="Player Action">
            <textarea
              rows={3}
              value={playerInput}
              onChange={(e) =>
                setPlayerInput(e.target.value)
              }
              placeholder="Describe what your character does…"
            />
            <button onClick={handlePlayerAction}>
              Submit Action
            </button>
          </CardSection>

          {parsed && (
            <CardSection title="Parsed Action">
              <pre>
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </CardSection>
          )}

          {options && dmMode === "human" && (
            <CardSection title="Options">
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
            <ResolutionDraftAdvisoryPanel
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
          <WorldLedgerPanelLegacy
            events={state.events}
          />
        </>
      )}

      <Disclaimer />
    </StewardedShell>
  );
}
