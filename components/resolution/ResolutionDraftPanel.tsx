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

type DiceMode =
  | "d4"
  | "d6"
  | "d8"
  | "d10"
  | "d12"
  | "d20";

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

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return { dc: 0, justification: "Safe action" };
    case "environmental":
      return { dc: 6, justification: "Environmental uncertainty" };
    case "risky":
      return { dc: 10, justification: "Risk involved" };
    case "contested":
      return { dc: 14, justification: "Opposition expected" };
    default:
      return { dc: 10, justification: "Default difficulty" };
  }
}

function inferRoomName(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("hallway")) return "Stone Hallway";
  if (t.includes("room")) return "Unmarked Chamber";
  if (t.includes("door")) return "Threshold Chamber";
  return "Unspecified Location";
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

  const [draft, setDraft] = useState(
    `The situation resolves based on the chosen path: ${context.optionDescription}.`
  );

  const [audit, setAudit] = useState<string[]>(["Drafted by Solace"]);

  // ---------------- LOCATION COMMIT ----------------

  const inferredRoomName = useMemo(
    () => inferRoomName(context.optionDescription),
    [context.optionDescription]
  );

  const [commitLocation, setCommitLocation] =
    useState<boolean>(true);

  const [roomName, setRoomName] =
    useState<string>(inferredRoomName);

  // ---------------- TRAP ----------------

  const [trapPresent, setTrapPresent] = useState(false);
  const [trapState, setTrapState] =
    useState<TrapState>("armed");

  // ------------------------------------------------

  function handleRoll() {
    const r = Math.ceil(Math.random() * 20);
    setRoll(r);
    setAudit((a) => [...a, `Dice rolled (${diceMode}): ${r}`]);
  }

  function handleRecord() {
    onRecord({
      description: draft,
      dice: {
        mode: diceMode,
        roll,
        dc,
        justification,
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

      <button onClick={handleRoll}>Roll Dice</button>
      {roll !== null && <span> Result: {roll}</span>}

      {/* -------- LOCATION COMMIT -------- */}
      <hr />
      <h4>📍 Location Commit (Arbiter)</h4>

      <label>
        <input
          type="checkbox"
          checked={commitLocation}
          onChange={(e) =>
            setCommitLocation(e.target.checked)
          }
        />{" "}
        This outcome establishes party location
      </label>

      {commitLocation && (
        <div style={{ marginTop: 8 }}>
          <label>
            Room name:&nbsp;
            <input
              value={roomName}
              onChange={(e) =>
                setRoomName(e.target.value)
              }
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
          onChange={(e) =>
            setTrapPresent(e.target.checked)
          }
        />{" "}
        Trap present
      </label>

      {trapPresent && (
        <select
          value={trapState}
          onChange={(e) =>
            setTrapState(
              e.target.value as TrapState
            )
          }
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
        <button
          style={{ marginTop: 8 }}
          onClick={handleRecord}
        >
          Record Outcome
        </button>
      )}

      <p className="muted">{audit.join(" · ")}</p>
    </section>
  );
}
