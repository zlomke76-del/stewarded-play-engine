"use client";

// ------------------------------------------------------------
// ResolutionDraftPanel
// ------------------------------------------------------------
// Governing contract:
// - Drafted by Solace (non-authoritative)
// - Dice are advisory only UNLESS autoResolve enabled
// - Arbiter explicitly commits world state OR Solace auto-commits
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

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
  autoResolve?: boolean;

  tribeBias?: {
    dcShift: number;
    narrative?: string;
  };

  onRecord: (payload: {
    description: string;
    dice: {
      mode: DiceMode;
      roll: number;
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
   Difficulty framing (INVARIANT)
------------------------------------------------------------ */

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return { dc: 4, justification: "Low risk, but not risk-free" };
    case "environmental":
      return { dc: 6, justification: "Environmental uncertainty" };
    case "risky":
      return { dc: 10, justification: "Meaningful risk involved" };
    case "contested":
      return { dc: 14, justification: "Active opposition expected" };
    default:
      return { dc: 6, justification: "Outcome uncertain" };
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

export default function ResolutionDraftPanel({
  context,
  role,
  autoResolve = false,
  tribeBias,
  onRecord,
}: Props) {
  const base = difficultyFor(context.optionKind);

  const dc = Math.max(base.dc + (tribeBias?.dcShift ?? 0), 1);
  const justification =
    base.justification +
    (tribeBias?.dcShift ? " (shaped by tribal experience)" : "");

  const [diceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [rollSource, setRollSource] = useState<RollSource>("auto");

  const inferredRoomName = useMemo(
    () => inferRoomName(context.optionDescription),
    [context.optionDescription]
  );

  const [audit, setAudit] = useState<string[]>([
    "Drafted by Solace",
    ...(tribeBias?.narrative ? [tribeBias.narrative] : []),
  ]);

  const committedRef = useRef(false);

  useEffect(() => {
    setRoll(null);
    committedRef.current = false;
  }, [context.optionDescription]);

  const draftDescription = useMemo(() => {
    if (roll === null) {
      return "The tribe prepares, weighing timing and position.";
    }
    return roll >= dc
      ? "The tribe acts decisively. Fortune favors them."
      : "The attempt falters. The land pushes back.";
  }, [roll, dc]);

  /* ----------------------------------------------------------
     AUTO RESOLUTION
  ---------------------------------------------------------- */

  useEffect(() => {
    if (!autoResolve) return;
    if (roll !== null) return;

    const r = Math.ceil(Math.random() * diceMax(diceMode));
    setRoll(r);
    setRollSource("auto");
    setAudit((a) => [...a, `Dice rolled (${diceMode}, auto): ${r}`]);
  }, [autoResolve, roll, diceMode]);

  useEffect(() => {
    if (!autoResolve) return;
    if (roll === null) return;
    if (committedRef.current) return;

    committedRef.current = true;

    const success = roll >= dc;

    onRecord({
      description: draftDescription,
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
        roomId: inferredRoomName,
        scope: "local",
        resources:
          context.optionKind === "contested" && success
            ? { foodDelta: 2 }
            : undefined,
      },
    });
  }, [
    autoResolve,
    roll,
    dc,
    draftDescription,
    audit,
    justification,
    inferredRoomName,
    diceMode,
    rollSource,
    context.optionKind,
    onRecord,
  ]);

  /* ----------------------------------------------------------
     AUTO UI
  ---------------------------------------------------------- */

  if (autoResolve) {
    if (roll === null) {
      return (
        <section style={{ border: "1px dashed #666", padding: 12, marginTop: 12 }}>
          <p className="muted">Solace weighs risk…</p>
        </section>
      );
    }

    const outcome = roll >= dc ? "Success" : "Setback";

    return (
      <section style={{ border: "1px dashed #666", padding: 12, marginTop: 12 }}>
        <p className="muted">Solace weighs risk… fate turns…</p>
        <p>
          🎲 <strong>{diceMode}</strong> rolled{" "}
          <strong>{roll}</strong> vs DC{" "}
          <strong>{dc}</strong> — <strong>{outcome}</strong>
        </p>
      </section>
    );
  }

  /* ----------------------------------------------------------
     ARBITER UI
  ---------------------------------------------------------- */

  function handleRecord() {
    if (committedRef.current || roll === null) return;
    committedRef.current = true;

    const success = roll >= dc;

    onRecord({
      description: draftDescription,
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
      <h3>Resolution Draft</h3>

      <p className="muted">
        Difficulty {dc} — {justification}
      </p>

      <button
        onClick={() => {
          const r = Math.ceil(Math.random() * diceMax(diceMode));
          setRoll(r);
          setRollSource("auto");
          setAudit((a) => [...a, `Dice rolled (${diceMode}, auto): ${r}`]);
        }}
      >
        Roll (Auto)
      </button>

      {roll !== null && (
        <p>
          Result: <strong>{roll}</strong> ({rollSource})
        </p>
      )}

      {role === "arbiter" && roll !== null && (
        <button onClick={handleRecord}>Record Outcome</button>
      )}

      <p className="muted">{audit.join(" · ")}</p>
    </section>
  );
}

/* ------------------------------------------------------------
   EOF
   - Build-safe
   - Dice invariant preserved
   - No silent outcomes
------------------------------------------------------------ */
