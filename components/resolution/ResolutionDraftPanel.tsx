"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel
// ------------------------------------------------------------
// Governing contract:
// - Drafted by Solace (non-authoritative)
// - Dice are advisory only
// - Arbiter edits + records canon
// - World state suggestions are explicit and persistent
// ------------------------------------------------------------

import { useMemo, useState } from "react";

type DiceMode =
  | "d4"
  | "d6"
  | "d8"
  | "d10"
  | "d12"
  | "d20"
  | "d100";

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
      scope?: "local" | "regional" | "global";

      // --- LOCKS ---
      lock?: {
        state: "locked" | "unlocked";
        keyId?: string;
      };

      // --- TRAPS ---
      trap?: {
        id: string;
        state: TrapState;
        effect?: string;
      };
    };
  }) => void;
};

// ------------------------------------------------------------
// Difficulty mapping
// ------------------------------------------------------------

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return { dc: 0, justification: "Safe action" };
    case "environmental":
      return { dc: 6, justification: "Environmental uncertainty" };
    case "risky":
      return { dc: 10, justification: "Risky action" };
    case "contested":
      return { dc: 14, justification: "Contested action" };
    default:
      return { dc: 10, justification: "Default risk" };
  }
}

// ------------------------------------------------------------
// Dice
// ------------------------------------------------------------

function rollDice(mode: DiceMode) {
  switch (mode) {
    case "d4":
      return Math.ceil(Math.random() * 4);
    case "d6":
      return Math.ceil(Math.random() * 6);
    case "d8":
      return Math.ceil(Math.random() * 8);
    case "d10":
      return Math.ceil(Math.random() * 10);
    case "d12":
      return Math.ceil(Math.random() * 12);
    case "d20":
      return Math.ceil(Math.random() * 20);
    case "d100":
      return Math.ceil(Math.random() * 100);
  }
}

// ------------------------------------------------------------
// Room inference
// ------------------------------------------------------------

function inferRoomSuggestion(text: string): string | null {
  const t = text.toLowerCase();

  if (
    t.includes("open door") ||
    t.includes("enter") ||
    t.includes("hallway") ||
    t.includes("room") ||
    t.includes("passage")
  ) {
    return `room-${crypto.randomUUID().slice(0, 6)}`;
  }

  return null;
}

// ------------------------------------------------------------
// Trap inference (suggestion only)
// ------------------------------------------------------------

function inferTrapSuggestion(text: string): {
  id: string;
  effect: string;
} | null {
  const t = text.toLowerCase();

  if (
    t.includes("trap") ||
    t.includes("pressure plate") ||
    t.includes("tripwire")
  ) {
    return {
      id: `trap-${crypto.randomUUID().slice(0, 6)}`,
      effect: "Damage or condition applied",
    };
  }

  return null;
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

  const [audit, setAudit] = useState<string[]>([
    "Drafted by Solace",
  ]);

  // ---------- ROOM ----------
  const suggestedRoomId = useMemo(
    () => inferRoomSuggestion(context.optionDescription),
    [context.optionDescription]
  );

  const [roomId, setRoomId] = useState<string | null>(
    suggestedRoomId
  );

  // ---------- TRAP ----------
  const suggestedTrap = useMemo(
    () => inferTrapSuggestion(context.optionDescription),
    [context.optionDescription]
  );

  const [trapPresent, setTrapPresent] = useState<boolean>(
    Boolean(suggestedTrap)
  );

  const [trapId, setTrapId] = useState<string>(
    suggestedTrap?.id ?? `trap-${crypto.randomUUID().slice(0, 6)}`
  );

  const [trapState, setTrapState] =
    useState<TrapState>("armed");

  const [trapEffect, setTrapEffect] = useState<string>(
    suggestedTrap?.effect ?? "Damage or condition applied"
  );

  // ----------------------------------------------------------

  function handleRoll() {
    const result = rollDice(diceMode);
    setRoll(result);
    setAudit((a) => [
      ...a,
      `Dice rolled (${diceMode}): ${result}`,
    ]);
  }

  function handleEdit(text: string) {
    setDraft(text);
    if (!audit.includes("Edited by Arbiter")) {
      setAudit((a) => [...a, "Edited by Arbiter"]);
    }
  }

  function handleRecord() {
    if (!draft.trim()) return;

    onRecord({
      description: draft,
      dice: {
        mode: diceMode,
        roll,
        dc,
        justification,
      },
      audit: [...audit, "Recorded by Arbiter"],
      world: {
        primary: "room state update",
        roomId: roomId ?? undefined,
        scope: "local",
        ...(trapPresent
          ? {
              trap: {
                id: trapId,
                state: trapState,
                effect: trapEffect,
              },
            }
          : undefined),
      },
    });
  }

  // ----------------------------------------------------------

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
        🎲 Difficulty {dc} — {justification}
      </p>

      <label>
        Dice system:&nbsp;
        <select
          value={diceMode}
          onChange={(e) =>
            setDiceMode(e.target.value as DiceMode)
          }
        >
          <option value="d4">d4</option>
          <option value="d6">d6</option>
          <option value="d8">d8</option>
          <option value="d10">d10</option>
          <option value="d12">d12</option>
          <option value="d20">d20</option>
          <option value="d100">d100</option>
        </select>
      </label>

      <div style={{ marginTop: 8 }}>
        <button onClick={handleRoll}>Roll Dice</button>
        {roll !== null && (
          <span style={{ marginLeft: 8 }}>
            Result: <strong>{roll}</strong>
          </span>
        )}
      </div>

      {/* ---------- ROOM ---------- */}
      {roomId && (
        <div style={{ marginTop: 12 }}>
          <label>
            Room ID:&nbsp;
            <input
              value={roomId}
              onChange={(e) =>
                setRoomId(e.target.value)
              }
            />
          </label>
        </div>
      )}

      {/* ---------- TRAP ---------- */}
      <div style={{ marginTop: 12 }}>
        <label>
          <input
            type="checkbox"
            checked={trapPresent}
            onChange={(e) =>
              setTrapPresent(e.target.checked)
            }
          />{" "}
          Trap present in room
        </label>

        {trapPresent && (
          <div style={{ marginTop: 8 }}>
            <label>
              Trap ID:&nbsp;
              <input
                value={trapId}
                onChange={(e) =>
                  setTrapId(e.target.value)
                }
              />
            </label>

            <br />

            <label>
              Trap state:&nbsp;
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
                <option value="disarmed">
                  Disarmed
                </option>
              </select>
            </label>

            <br />

            <label>
              Effect:&nbsp;
              <input
                value={trapEffect}
                onChange={(e) =>
                  setTrapEffect(e.target.value)
                }
              />
            </label>
          </div>
        )}
      </div>

      <textarea
        rows={4}
        style={{ width: "100%", marginTop: 12 }}
        value={draft}
        onChange={(e) => handleEdit(e.target.value)}
      />

      {role === "arbiter" && (
        <button
          style={{ marginTop: 8 }}
          onClick={handleRecord}
        >
          Record Outcome
        </button>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        {audit.join(" · ")}
      </p>
    </section>
  );
}
