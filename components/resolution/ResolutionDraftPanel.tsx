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

  // 🔑 NEW (optional, non-breaking)
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
   Difficulty framing (language-only)
------------------------------------------------------------ */

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
  switch (kind) {
    case "safe":
      return { dc: 0, justification: "Low immediate risk" };
    case "environmental":
      return { dc: 6, justification: "Environmental uncertainty" };
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

export default function ResolutionDraftPanel({
  context,
  role,
  autoResolve = false,
  tribeBias,
  onRecord,
}: Props) {
  const base = difficultyFor(context.optionKind);

  // 🔑 Bias applied here — invisible to player
  const dc = Math.max(base.dc + (tribeBias?.dcShift ?? 0), 0);
  const justification =
    base.justification +
    (tribeBias?.dcShift
      ? " (shaped by tribal experience)"
      : "");

  const [diceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [rollSource, setRollSource] =
    useState<RollSource>("auto");

  const inferredRoomName = useMemo(
    () => inferRoomName(context.optionDescription),
    [context.optionDescription]
  );

  const [audit, setAudit] = useState<string[]>([
    "Drafted by Solace",
    ...(tribeBias?.narrative ? [tribeBias.narrative] : []),
  ]);

  const draftDescription = useMemo(() => {
    if (roll === null || dc === 0) {
      return "The tribe moves cautiously, conserving strength.";
    }
    if (roll >= dc) {
      return "The tribe acts decisively. Fortune favors them.";
    }
    return "The attempt falters. The land pushes back.";
  }, [roll, dc]);

  /* ----------------------------------------------------------
     AUTO RESOLUTION
  ---------------------------------------------------------- */

  useEffect(() => {
    if (!autoResolve) return;
    if (roll !== null) return;

    const max = diceMax(diceMode);
    const r = Math.ceil(Math.random() * max);

    setRoll(r);
    setRollSource("auto");
    setAudit((a) => [
      ...a,
      `Dice rolled (${diceMode}, auto): ${r}`,
    ]);
  }, [autoResolve, roll, diceMode]);

  useEffect(() => {
    if (!autoResolve) return;
    if (roll === null) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResolve, roll]);

  /* ----------------------------------------------------------
     AUTO UI (DICE VISIBLE)
  ---------------------------------------------------------- */

  if (autoResolve) {
    const outcome =
      roll === null || dc === 0
        ? "No roll required"
        : roll >= dc
        ? "Success"
        : "Setback";

    return (
      <section
        style={{
          border: "1px dashed #666",
          padding: 12,
          marginTop: 12,
          opacity: 0.95,
        }}
      >
        <p className="muted">
          Solace weighs risk… fate turns…
        </p>

        {roll !== null && (
          <p>
            🎲 <strong>{diceMode}</strong> rolled{" "}
            <strong>{roll}</strong> vs DC{" "}
            <strong>{dc}</strong> —{" "}
            <strong>{outcome}</strong>
          </p>
        )}
      </section>
    );
  }

  /* ----------------------------------------------------------
     ARBITER UI (UNCHANGED)
  ---------------------------------------------------------- */

  function handleRecord() {
    const success = roll !== null && roll >= dc;

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
          const max = diceMax(diceMode);
          const r = Math.ceil(Math.random() * max);
          setRoll(r);
          setRollSource("auto");
          setAudit((a) => [
            ...a,
            `Dice rolled (${diceMode}, auto): ${r}`,
          ]);
        }}
      >
        Roll (Auto)
      </button>

      {roll !== null && (
        <p>
          Result: <strong>{roll}</strong> ({rollSource})
        </p>
      )}

      {role === "arbiter" && (
        <button onClick={handleRecord}>
          Record Outcome
        </button>
      )}

      <p className="muted">{audit.join(" · ")}</p>
    </section>
  );
}
