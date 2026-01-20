"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel
// ------------------------------------------------------------
// Governing contract:
// - Drafted by Solace (non-authoritative)
// - Dice are advisory only UNLESS autoResolve enabled
// - Arbiter explicitly commits world state OR Solace auto-commits
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";

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
  autoResolve?: boolean; // ← NEW, opt-in only
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

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return { dc: 0, justification: "Low immediate risk (roll optional)" };
    case "environmental":
      return { dc: 6, justification: "Environmental uncertainty" };
    case "risky":
      return { dc: 10, justification: "Meaningful risk involved" };
    case "contested":
      return { dc: 14, justification: "Active opposition expected" };
    default:
      return { dc: 10, justification: "Situation requires Arbiter judgment" };
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
  autoResolve = false,
  onRecord,
}: Props) {
  const { dc, justification } = difficultyFor(context.optionKind);

  const [diceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [rollSource, setRollSource] = useState<RollSource>("auto");

  const [draft] = useState(
    `The situation resolves based on the chosen path: ${context.optionDescription}.`
  );

  const [audit, setAudit] = useState<string[]>(["Drafted by Solace"]);

  const inferredRoomName = useMemo(
    () => inferRoomName(context.optionDescription),
    [context.optionDescription]
  );

  const [roomName] = useState(inferredRoomName);

  // ----------------------------------------------------------
  // AUTO RESOLUTION (OPT-IN)
  // ----------------------------------------------------------

  useEffect(() => {
    if (!autoResolve) return;
    if (roll !== null) return;

    const max = diceMax(diceMode);
    const r = Math.ceil(Math.random() * max);

    setRoll(r);
    setRollSource("auto");
    setAudit((a) => [...a, `Dice rolled (${diceMode}, auto): ${r}`]);
  }, [autoResolve, roll, diceMode]);

  useEffect(() => {
    if (!autoResolve) return;
    if (roll === null) return;

    onRecord({
      description: draft,
      dice: {
        mode: diceMode,
        roll,
        dc,
        justification,
        source: rollSource,
      },
      audit: [...audit, "Auto-recorded by Solace"],
      world: {
        primary: "location",
        roomId: roomName,
        scope: "local",
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResolve, roll]);

  // ----------------------------------------------------------
  // MANUAL (UNCHANGED)
  // ----------------------------------------------------------

  function handleAutoRoll() {
    const max = diceMax(diceMode);
    const r = Math.ceil(Math.random() * max);
    setRoll(r);
    setRollSource("auto");
    setAudit((a) => [...a, `Dice rolled (${diceMode}, auto): ${r}`]);
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
      world: {
        primary: "location",
        roomId: roomName,
        scope: "local",
      },
    });
  }

  // ----------------------------------------------------------

  if (autoResolve) {
    return (
      <section style={{ opacity: 0.85 }}>
        <p className="muted">Solace resolving outcome…</p>
      </section>
    );
  }

  return (
    <section style={{ border: "1px dashed #666", padding: 16 }}>
      <h3>Resolution Draft</h3>
      <p className="muted">
        Difficulty {dc} — {justification}
      </p>

      <button onClick={handleAutoRoll}>Roll (Auto)</button>

      {roll !== null && (
        <p>
          Result: <strong>{roll}</strong> ({rollSource})
        </p>
      )}

      {role === "arbiter" && (
        <button onClick={handleRecord}>Record Outcome</button>
      )}

      <p className="muted">{audit.join(" · ")}</p>
    </section>
  );
}
