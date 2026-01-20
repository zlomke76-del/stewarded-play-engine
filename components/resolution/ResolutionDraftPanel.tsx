"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel
// ------------------------------------------------------------
// Governing contract:
// - Drafted by Solace (non-authoritative)
// - Dice are advisory only
// - Arbiter edits + records canon
// - World state suggestions are explicit, optional, and visible
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

      // --- NEW ---
      lock?: {
        state: "locked" | "unlocked";
        keyId?: string;
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
// Room inference (movement only)
// ------------------------------------------------------------

function inferRoomSuggestion(text: string): string | null {
  const t = text.toLowerCase();

  if (
    t.includes("open door") ||
    t.includes("enter") ||
    t.includes("go through") ||
    t.includes("descend") ||
    t.includes("ascend")
  ) {
    return `room-${crypto.randomUUID().slice(0, 6)}`;
  }

  return null;
}

// ------------------------------------------------------------
// Lock inference (suggestion only)
// ------------------------------------------------------------

function inferLockSuggestion(text: string): {
  locked: boolean;
  keyId?: string;
} | null {
  const t = text.toLowerCase();

  if (t.includes("locked")) {
    return {
      locked: true,
      keyId: "iron-key",
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

  // --- Room suggestion ---
  const suggestedRoomId = useMemo(
    () => inferRoomSuggestion(context.optionDescription),
    [context.optionDescription]
  );

  const [roomId, setRoomId] = useState<string | null>(
    suggestedRoomId
  );

  // --- Lock suggestion ---
  const suggestedLock = useMemo(
    () => inferLockSuggestion(context.optionDescription),
    [context.optionDescription]
  );

  const [locked, setLocked] = useState<boolean>(
    suggestedLock?.locked ?? false
  );

  const [keyId, setKeyId] = useState<string>(
    suggestedLock?.keyId ?? "iron-key"
  );

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
        primary: roomId ? "location change" : "state change",
        roomId: roomId ?? undefined,
        scope: "local",
        ...(locked
          ? {
              lock: {
                state: "locked",
                keyId,
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

      {/* ---------- LOCK ---------- */}
      <div style={{ marginTop: 12 }}>
        <label>
          <input
            type="checkbox"
            checked={locked}
            onChange={(e) =>
              setLocked(e.target.checked)
            }
          />{" "}
          Door is locked
        </label>

        {locked && (
          <div style={{ marginTop: 4 }}>
            <label>
              Required key:&nbsp;
              <input
                value={keyId}
                onChange={(e) =>
                  setKeyId(e.target.value)
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
