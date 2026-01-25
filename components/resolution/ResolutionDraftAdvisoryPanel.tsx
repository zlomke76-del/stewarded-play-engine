"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract:
// - Dice decide success/failure
// - CreativeNarrator drafts narration
// - Human Arbiter may EDIT narration
// - Arbiter commits canon
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import {
  generateNarration,
  NarrativeLens,
} from "@/lib/narration/CreativeNarrator";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

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
      roll: number;
      dc: number;
      source: RollSource;
    };
    audit: string[];
  }) => void;
};

/* ------------------------------------------------------------
   Difficulty (mechanical truth only)
------------------------------------------------------------ */

function difficultyFor(
  kind?: ResolutionContext["optionKind"]
): number {
  switch (kind) {
    case "safe":
      return 6;
    case "environmental":
      return 8;
    case "risky":
      return 10;
    case "contested":
      return 14;
    default:
      return 10;
  }
}

/* ------------------------------------------------------------ */

export default function ResolutionDraftAdvisoryPanel({
  context,
  role,
  onRecord,
}: Props) {
  const dc = difficultyFor(context.optionKind);

  const [diceMode, setDiceMode] =
    useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(
    null
  );
  const [manualRoll, setManualRoll] = useState("");

  const committedRef = useRef(false);

  // Editable narration
  const [draftText, setDraftText] = useState("");

  // Reset on new intent
  useEffect(() => {
    setRoll(null);
    setManualRoll("");
    setDraftText("");
    committedRef.current = false;
  }, [context.optionDescription]);

  /* ----------------------------------------------------------
     Dice handling
  ---------------------------------------------------------- */

  function rollDice() {
    const max = Number(diceMode.slice(1));
    setRoll(Math.ceil(Math.random() * max));
  }

  function acceptManualRoll() {
    const r = Number(manualRoll);
    if (!Number.isInteger(r) || r <= 0) return;
    setRoll(r);
  }

  /* ----------------------------------------------------------
     Creative narration (NON-AUTHORITATIVE)
  ---------------------------------------------------------- */

  const generatedNarration = useMemo(() => {
    if (roll === null) return "";

    return generateNarration({
      intentText: context.optionDescription,
      margin: roll - dc,
      lens: "heroic" as NarrativeLens,
    });
  }, [roll, dc, context.optionDescription]);

  // Seed editable text once per roll
  useEffect(() => {
    if (roll !== null && draftText === "") {
      setDraftText(generatedNarration);
    }
  }, [roll, generatedNarration, draftText]);

  /* ----------------------------------------------------------
     Commit (human-only authority)
  ---------------------------------------------------------- */

  function handleRecord() {
    if (roll === null || committedRef.current) return;
    committedRef.current = true;

    onRecord({
      description: draftText.trim(),
      dice: {
        mode: diceMode,
        roll,
        dc,
        source: manualRoll ? "manual" : "solace",
      },
      audit: [
        "Drafted by CreativeNarrator",
        "Edited by Arbiter",
      ],
    });
  }

  /* ---------------------------------------------------------- */

  return (
    <section
      style={{
        border: "1px dashed #666",
        padding: 16,
      }}
    >
      <h3>Resolution Draft</h3>

      <p className="muted">Difficulty {dc}</p>

      <label>
        Dice:
        <select
          value={diceMode}
          onChange={(e) =>
            setDiceMode(
              e.target.value as DiceMode
            )
          }
        >
          <option>d4</option>
          <option>d6</option>
          <option>d8</option>
          <option>d10</option>
          <option>d12</option>
          <option>d20</option>
        </select>
      </label>

      <div style={{ marginTop: 8 }}>
        <button onClick={rollDice}>
          Roll Here
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <input
          placeholder="Enter physical roll"
          value={manualRoll}
          onChange={(e) =>
            setManualRoll(e.target.value)
          }
        />
        <button onClick={acceptManualRoll}>
          Accept Roll
        </button>
      </div>

      {roll !== null && (
        <p>
          🎲 {diceMode} rolled{" "}
          <strong>{roll}</strong> vs DC{" "}
          <strong>{dc}</strong>
        </p>
      )}

      {roll !== null && (
        <>
          <label className="muted">
            Narration (editable)
          </label>
          <textarea
            rows={4}
            value={draftText}
            onChange={(e) =>
              setDraftText(e.target.value)
            }
            style={{ width: "100%" }}
          />
        </>
      )}

      {role === "arbiter" && (
        <button
          onClick={handleRecord}
          disabled={roll === null}
        >
          Record Outcome
        </button>
      )}
    </section>
  );
}
