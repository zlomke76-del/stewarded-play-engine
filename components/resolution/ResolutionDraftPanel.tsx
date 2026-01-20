"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel
// ------------------------------------------------------------
// Governing contract:
// - Drafted by Solace (non-authoritative)
// - Dice are advisory only
// - Arbiter explicitly commits world state
// ------------------------------------------------------------

import { useMemo, useState } from "react";

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "auto" | "manual";

export type ResolutionContext = {
  optionDescription: string;
  optionKind?: "safe" | "environmental" | "risky" | "contested";
};

type TrapState = "armed" | "sprung" | "disarmed";

type Props = {
  context: ResolutionContext;
  role: "arbiter";
  onRecord: (payload: {
    description: string;
    dice: {
      mode: DiceMode;
      roll: number | null;
      dc: number;
      justification: string;
      source: RollSource;
    };
    audit: string[];
    world?: {
      primary?: string;
      roomId?: string;
      scope?: "local";
      trap?: {
        id: string;
        state: TrapState;
        effect?: string;
      };
    };
  }) => void;
};

// ------------------------------------------------------------
// Difficulty framing (language-only, non-authoritative)
// ------------------------------------------------------------

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return {
        dc: 0,
        justification: "Low immediate risk (roll optional)",
      };
    case "environmental":
      return {
        dc: 6,
        justification: "Environmental uncertainty",
      };
    case "risky":
      return {
        dc: 10,
        justification: "Meaningful risk involved",
      };
    case "contested":
      return {
        dc: 14,
        justification: "Active opposition expected",
      };
    default:
      return {
        dc: 10,
        justification: "Situation requires Arbiter judgment",
      };
  }
}

function inferRoomName(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("hallway")) return "Stone Hallway";
  if (t.includes("room")) return "Unmarked Chamber";
  if (t.includes("door")) return "Threshold Chamber";
  return "Unspecified Location";
}

function diceMax(mode: DiceMode): number {
  return parseInt(mode.replace("d", ""), 10);
}

// ------------------------------------------------------------

export default function ResolutionDraftPanel({
  context,
  role,
  onRecord,
}: Props) {
  const { dc, justification } = difficultyFor(context.optionKind);

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [rollSource, setRollSource] = useState<RollSource>("auto");

  const [draft, setDraft] = useState(
    `The situation resolves based on the chosen path: ${context.optionDescription}.`
  );

  const [audit, setAudit] = useState<string[]>(["Drafted by Solace"]);

  // ---------------- LOCATION COMMIT ----------------

  const inferredRoomName = useMemo(
    () => inferRoomName(context.optionDescription),
    [context.optionDescription]
  );

  const [commitLocation, setCommitLocation] = useState(true);
  const [roomName, setRoomName] = useState(inferredRoomName);

  // ---------------- TRAP ----------------

  const [trapPresent, setTrapPresent] = useState(false);
  const [trapState, setTrapState] = useState<TrapState>("armed");

  // ------------------------------------------------

  function handleAutoRoll() {
    const max = diceMax(diceMode);
    const r = Math.ceil(Math.random() * max);
    setRoll(r);
    setRollSource("auto");
    setAudit((a) => [...a, `Dice rolled (${diceMode}, auto): ${r}`]);
  }

  function handleManualRoll(value: number) {
    if (value < 1 || value > diceMax(diceMode)) return;
    setRoll(value);
    setRollSource("manual");
    setAudit((a) => [...a, `Dice entered (${diceMode}, manual): ${value}`]);
  }

  function handleRecord() {
    onRecord({
      description: draft,
      dice: {
        mode: diceMode,
        roll,
        dc,
        justification,
        source: rollSource,
      },
      audit: [...audit, "Recorded by Arbiter"],
      world: commitLocation
        ? {
            primary: "location",
            roomId: roomName,
            scope: "local",
            ...(trapPresent
              ? {
                  trap: {
                    id: "trap",
                    state: trapState,
                    effect: "Damage or condition",
                  },
                }
              : {}),
          }
        : undefined,
    });
  }

  // ------------------------------------------------

  return (
    <section
      style={{
        border: "1px dashed #666",
        padding: 16,
        borderRadius: 6,
        marginTop: 16,
      }}
    >
      <h3>Resolution Draft</h3>

      <p className="muted">
        Difficulty {dc} — {justification}
      </p>

      {/* -------- DICE CONTROL -------- */}
      <div style={{ marginBottom: 12 }}>
        <label>
          Dice:&nbsp;
          <select
            value={diceMode}
            onChange={(e) => {
              setDiceMode(e.target.value as DiceMode);
              setRoll(null);
            }}
          >
            <option value="d4">d4</option>
            <option value="d6">d6</option>
            <option value="d8">d8</option>
            <option value="d10">d10</option>
            <option value="d12">d12</option>
            <option value="d20">d20</option>
          </select>
        </label>

        <button style={{ marginLeft: 8 }} onClick={handleAutoRoll}>
          Roll (Auto)
        </button>

        <label style={{ marginLeft: 12 }}>
          Manual:&nbsp;
          <input
            type="number"
            min={1}
            max={diceMax(diceMode)}
            onChange={(e) => handleManualRoll(Number(e.target.value))}
            placeholder="—"
            style={{ width: 60 }}
          />
        </label>

        {roll !== null && (
          <span style={{ marginLeft: 12 }}>
            Result: <strong>{roll}</strong> ({rollSource})
          </span>
        )}
      </div>

      {/* -------- LOCATION COMMIT -------- */}
      <hr />
      <h4>📍 Location Commit (Arbiter)</h4>

      <label>
        <input
          type="checkbox"
          checked={commitLocation}
          onChange={(e) => setCommitLocation(e.target.checked)}
        />{" "}
        This outcome establishes party location
      </label>

      {commitLocation && (
        <div style={{ marginTop: 8 }}>
          <label>
            Room name:&nbsp;
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </label>
          <p className="muted">
            Suggested from command; Arbiter may rename.
          </p>
        </div>
      )}

      {/* -------- TRAP -------- */}
      <hr />
      <label>
        <input
          type="checkbox"
          checked={trapPresent}
          onChange={(e) => setTrapPresent(e.target.checked)}
        />{" "}
        Trap present
      </label>

      {trapPresent && (
        <select
          value={trapState}
          onChange={(e) => setTrapState(e.target.value as TrapState)}
        >
          <option value="armed">Armed</option>
          <option value="sprung">Sprung</option>
          <option value="disarmed">Disarmed</option>
        </select>
      )}

      <textarea
        rows={4}
        style={{ width: "100%", marginTop: 12 }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />

      {role === "arbiter" && (
        <button style={{ marginTop: 8 }} onClick={handleRecord}>
          Record Outcome
        </button>
      )}

      <p className="muted">{audit.join(" · ")}</p>
    </section>
  );
}
