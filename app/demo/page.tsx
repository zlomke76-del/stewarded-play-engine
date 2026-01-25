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

// Keep local dice types aligned with ResolutionDraftAdvisoryPanel
type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

// ------------------------------------------------------------
// Random helpers (deterministic per load, different each time)
// ------------------------------------------------------------

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickManyUnique<T>(arr: T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (pool.length > 0 && out.length < count) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function generateInitialTable(): InitialTable {
  const factionNames = [
    "The Whisperers",
    "The Vaultwardens",
    "The Ash Circle",
    "The Night Ledger",
    "The Bell-Silent",
    "The Cobble Court",
  ];

  const desires = [
    "control what sleeps below",
    "seal the vaults forever",
    "profit from forbidden knowledge",
    "redeem an ancient failure",
    "expose the truth no matter the cost",
    "keep the city calm at any price",
  ];

  const pressures = [
    "time is running out",
    "someone is leaking secrets",
    "an old oath is failing",
    "a rival faction is moving first",
    "witnesses keep vanishing",
    "the city above is starting to notice",
  ];

  const factionCount = pick([2, 3, 3]); // bias slightly toward 3
  const chosenNames = pickManyUnique(factionNames, factionCount);

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
    latentFactions: chosenNames.map((name) => ({
      name,
      desire: pick(desires),
      pressure: pick(pressures),
    })),
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
// Table narration renderer (NON-CANONICAL)
// - Uses ONLY provided table signals
// - Adds connective tissue / table-play voice
// - Does NOT add new facts (no new NPCs, no new places, no new events)
// ------------------------------------------------------------

function renderInitialTableNarration(t: InitialTable): string {
  const [traitA, traitB] = t.locationTraits;
  const oddity = t.environmentalOddities[0] ?? "Something feels off";
  const hook = t.dormantHooks[0] ?? "A sign repeats";
  const factions = t.latentFactions;

  const lines: string[] = [];

  // Opening (keep the exact first line, then make it playable)
  lines.push(t.openingFrame);

  // Traits become sensory framing (no new facts; just voice)
  lines.push(
    `The place feels ${traitA}, and the air carries the stink of ${traitB}.`
  );

  // Oddity becomes immediate table tension
  if (/footsteps echo twice/i.test(oddity)) {
    lines.push(
      "Every step answers itself — once, then again — like the street remembers you a beat too late."
    );
  } else if (/lantern/i.test(oddity.toLowerCase())) {
    lines.push(
      "Lanternlight can’t decide what it wants to be — steady one second, starving the next."
    );
  } else if (/absorb sound/i.test(oddity.toLowerCase())) {
    lines.push(
      "Sound doesn’t travel right. Words die early, like the walls are swallowing them."
    );
  } else if (/whispers/i.test(oddity.toLowerCase())) {
    lines.push(
      "You keep catching whispers at the edge of hearing — not loud enough to understand, not quiet enough to ignore."
    );
  } else {
    lines.push(`${oddity}.`);
  }

  // Factions (multiple) — presented as pressure vectors
  if (factions.length > 0) {
    lines.push("There are pressures under the surface:");
    factions.forEach((f) => {
      lines.push(`• ${f.name} want to ${f.desire} — but ${f.pressure}.`);
    });
  }

  // Hook as the “why now”
  lines.push(`${hook}.`);
  lines.push("That repetition feels deliberate. And it feels recent.");

  return lines.join("\n\n");
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

  // Editable narration buffer (DM-controlled)
  const [tableDraftText, setTableDraftText] = useState("");

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

    setInitialTable(generateInitialTable());
  }, [dmMode, initialTable]);

  // ----------------------------------------------------------
  // When table exists, generate playable narration (once),
  // then allow DM edits.
  // ----------------------------------------------------------

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  useEffect(() => {
    if (!initialTable) return;

    // Seed editable draft only if empty (no overwriting DM edits)
    if (tableDraftText.trim() === "") {
      setTableDraftText(renderedTableNarration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTable, renderedTableNarration]);

  // ----------------------------------------------------------
  // If user switches to HUMAN DM mode:
  // - don’t block play behind the table gate
  // - but still allow “Solace setup” as convenience
  // ----------------------------------------------------------

  useEffect(() => {
    if (dmMode === "human") {
      setTableAccepted(true);
    } else {
      // In Solace mode, gate applies again until accepted
      setTableAccepted(false);
    }
  }, [dmMode]);

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
      mode: DiceMode;
      roll: number;
      dc: number;
      source: RollSource;
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

      {/* FACILITATION MODE (NO DELETIONS — ADDED CONTROL) */}
      <CardSection title="Facilitation Mode">
        <label>
          <input
            type="radio"
            checked={dmMode === "human"}
            onChange={() => setDmMode("human")}
          />{" "}
          Human DM (options visible + editable setup)
        </label>
        <br />
        <label>
          <input
            type="radio"
            checked={dmMode === "solace-neutral"}
            onChange={() => setDmMode("solace-neutral")}
          />{" "}
          Solace (Neutral Facilitator)
        </label>
      </CardSection>

      {/* INITIAL TABLE GATE */}
      {dmMode === "solace-neutral" &&
        initialTable &&
        !tableAccepted && (
          <CardSection title="Initial Table (Solace)">
            {/* DM-EDITABLE, TABLE-PLAYABLE NARRATION */}
            <p className="muted" style={{ marginBottom: 8 }}>
              Table-play narration (editable before start):
            </p>
            <textarea
              rows={10}
              value={tableDraftText}
              onChange={(e) => setTableDraftText(e.target.value)}
              style={{ width: "100%" }}
            />

            {/* Keep the raw table visible, but not as the primary “start” */}
            <details style={{ marginTop: 12 }}>
              <summary className="muted">Show underlying table signals</summary>
              <div style={{ marginTop: 10 }}>
                <p>{initialTable.openingFrame}</p>

                <p className="muted">
                  Traits:{" "}
                  {initialTable.locationTraits.join(", ")}
                </p>

                <ul>
                  {initialTable.latentFactions.map((f, i) => (
                    <li key={i}>
                      <strong>{f.name}</strong> — {f.desire} ({f.pressure})
                    </li>
                  ))}
                </ul>

                <p className="muted">
                  Oddity:{" "}
                  {initialTable.environmentalOddities.join(", ")}
                </p>

                <p className="muted">
                  Hook:{" "}
                  {initialTable.dormantHooks.join(", ")}
                </p>
              </div>
            </details>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => {
                  const next = generateInitialTable();
                  setInitialTable(next);
                  setTableDraftText(renderInitialTableNarration(next));
                }}
              >
                Regenerate
              </button>{" "}
              <button onClick={() => setTableAccepted(true)}>
                Accept Table
              </button>
            </div>
          </CardSection>
        )}

      {/* HUMAN DM: optional Solace setup helper (EDITABLE) */}
      {dmMode === "human" && (
        <CardSection title="Solace Setup Helper (Optional)">
          <p className="muted" style={{ marginTop: 0 }}>
            If you want a fast-start table, generate one, edit it, then run the game.
          </p>

          {!initialTable ? (
            <button
              onClick={() => {
                const next = generateInitialTable();
                setInitialTable(next);
                setTableDraftText(renderInitialTableNarration(next));
              }}
            >
              Generate Table
            </button>
          ) : (
            <>
              <textarea
                rows={10}
                value={tableDraftText}
                onChange={(e) => setTableDraftText(e.target.value)}
                style={{ width: "100%" }}
              />

              <details style={{ marginTop: 12 }}>
                <summary className="muted">Show underlying table signals</summary>
                <div style={{ marginTop: 10 }}>
                  <p>{initialTable.openingFrame}</p>

                  <p className="muted">
                    Traits:{" "}
                    {initialTable.locationTraits.join(", ")}
                  </p>

                  <ul>
                    {initialTable.latentFactions.map((f, i) => (
                      <li key={i}>
                        <strong>{f.name}</strong> — {f.desire} ({f.pressure})
                      </li>
                    ))}
                  </ul>

                  <p className="muted">
                    Oddity:{" "}
                    {initialTable.environmentalOddities.join(", ")}
                  </p>

                  <p className="muted">
                    Hook:{" "}
                    {initialTable.dormantHooks.join(", ")}
                  </p>
                </div>
              </details>

              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => {
                    const next = generateInitialTable();
                    setInitialTable(next);
                    setTableDraftText(renderInitialTableNarration(next));
                  }}
                >
                  Regenerate
                </button>
              </div>
            </>
          )}
        </CardSection>
      )}

      {/* BLOCK PLAY UNTIL ACCEPTED */}
      {dmMode === "solace-neutral" && !tableAccepted && <Disclaimer />}

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
