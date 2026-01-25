"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract (HUMAN-ARBITER):
// - Solace drafts only (non-authoritative)
// - Dice are advisory
// - Human Arbiter explicitly records canon
// - NO auto-commit, ever
// - One record action per draft (guarded)
//
// This file exists to PROVE:
// Solace cannot act without human consent.
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual";

export type ResolutionContext = {
  optionDescription: string;
  optionKind?: "safe" | "environmental" | "risky" | "contested";
};

type TrapState = "armed" | "sprung" | "disarmed";

type Props = {
  context: ResolutionContext;
  role: "arbiter";

  // Optional, invisible bias from tribe history / skills
  tribeBias?: {
    dcShift: number;
    narrative?: string;
  };

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
      resources?: {
        foodDelta?: number;
      };
    };
  }) => void;
};

/* ------------------------------------------------------------
   Difficulty framing (language-only, advisory)
------------------------------------------------------------ */

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return { dc: 6, justification: "Low immediate risk" };
    case "environmental":
      return { dc: 8, justification: "Environmental uncertainty" };
    case "risky":
      return { dc: 10, justification: "Meaningful risk involved" };
    case "contested":
      return { dc: 14, justification: "Active opposition expected" };
    default:
      return { dc: 10, justification: "Outcome uncertain" };
  }
}

function inferRoomName(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("hunt")) return "Hunting Grounds";
  if (t.includes("scout")) return "Nearby Ridge";
  if (t.includes("defend")) return "Camp Perimeter";
  if (t.includes("move")) return "New Camp";
  return "The Wilds";
}

function diceMax(mode: DiceMode): number {
  return parseInt(mode.replace("d", ""), 10);
}

/* ------------------------------------------------------------ */

export default function ResolutionDraftAdvisoryPanel({
  context,
  role,
  tribeBias,
  onRecord,
}: Props) {
  const base = difficultyFor(context.optionKind);

  // Bias applied here (never exposed directly)
  const dc = Math.max(base.dc + (tribeBias?.dcShift ?? 0), 1);
  const justification =
    base.justification +
    (tribeBias?.dcShift
      ? " (shaped by tribal experience)"
      : "");

  const [diceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);

  const inferredRoomName = useMemo(
    () => inferRoomName(context.optionDescription),
    [context.optionDescription]
  );

  const [audit, setAudit] = useState<string[]>([
    "Drafted by Solace",
    ...(tribeBias?.narrative ? [tribeBias.narrative] : []),
  ]);

  // Prevent double-record
  const committedRef = useRef(false);

  // Reset when intent changes
  useEffect(() => {
    setRoll(null);
    committedRef.current = false;
  }, [context.optionDescription]);

  const draftDescription = useMemo(() => {
    if (roll === null) {
      return "Solace weighs the moment, holding consequence in view.";
    }
    if (roll >= dc) {
      return "The tribe acts decisively. Fortune favors them.";
    }
    return "The attempt falters. The land pushes back.";
  }, [roll, dc]);

  function handleRoll() {
    const max = diceMax(diceMode);
    const r = Math.ceil(Math.random() * max);
    setRoll(r);
    setAudit((a) => [
      ...a,
      `Dice rolled (${diceMode}, advisory): ${r}`,
    ]);
  }

  function handleRecord() {
    if (committedRef.current) return;
    committedRef.current = true;

    const success = roll !== null && roll >= dc;

    onRecord({
      description: draftDescription,
      dice: {
        mode: diceMode,
        roll,
        dc,
        justification,
        source: "manual",
      },
      audit: [...audit, "Recorded by Arbiter"],
      world: {
        primary: "location",
        roomId: inferredRoomName,
        scope: "local",
        resources:
          context.optionKind === "contested" && success
            ? { foodDelta: 2 }
            : undefined,
      },
    });
  }

  return (
    <section style={{ border: "1px dashed #666", padding: 16 }}>
      <h3>Resolution Draft (Advisory)</h3>

      <p className="muted">
        Difficulty {dc} — {justification}
      </p>

      <button onClick={handleRoll}>
        Roll (Advisory)
      </button>

      {roll !== null && (
        <p>
          🎲 Result: <strong>{roll}</strong> vs DC{" "}
          <strong>{dc}</strong>
        </p>
      )}

      {role === "arbiter" && (
        <button
          onClick={handleRecord}
          disabled={roll === null}
        >
          Record Outcome
        </button>
      )}

      <p className="muted">{audit.join(" · ")}</p>
    </section>
  );
}
