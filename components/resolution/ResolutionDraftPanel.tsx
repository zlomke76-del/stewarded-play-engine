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
  autoResolve?: boolean;
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

  const draft = `Outcome resolved: ${context.optionDescription}`;

  const [audit, setAudit] = useState<string[]>([
    "Drafted by Solace",
  ]);

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
    setAudit((a) => [
      ...a,
      `Dice rolled (${diceMode}, auto): ${r}`,
    ]);
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
  // AUTO-RESOLVE UI (SHOW THE DICE)
  // ----------------------------------------------------------

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
          opacity: 0.9,
        }}
      >
        <p className="muted">
          Solace weighs risk… rolls fate… commits canon.
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

  // ----------------------------------------------------------
  // ARBITER UI (UNCHANGED)
  // ----------------------------------------------------------

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
        <button onClick={() => handleRecord()}>
          Record Outcome
        </button>
      )}

      <p className="muted">{audit.join(" · ")}</p>
    </section>
  );

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
}
