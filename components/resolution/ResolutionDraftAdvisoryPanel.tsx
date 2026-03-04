"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract:
// - Dice decide success/failure
// - CreativeNarrator drafts narration (NON-AUTHORITATIVE)
// - Human DM mode: Arbiter may EDIT narration
// - Solace (Neutral Facilitator) DM mode: narration is NOT editable
// - Arbiter commits canon (Record Outcome)
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { generateNarration, NarrativeLens } from "@/lib/narration/CreativeNarrator";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

export type ResolutionContext = {
  optionDescription: string;
  optionKind?: "safe" | "environmental" | "risky" | "contested";
};

type DMMode = "human" | "solace_neutral";

type Props = {
  context: ResolutionContext;
  role: "arbiter";

  /**
   * Controls whether narration is editable.
   * - "human": editable narration (current behavior)
   * - "solace_neutral": Solace-as-Arbiter narration, read-only
   *
   * Defaults to "human" to avoid changing existing flows unless explicitly set.
   */
  dmMode?: DMMode;

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

function difficultyFor(kind?: ResolutionContext["optionKind"]): number {
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
  dmMode = "human",
  onRecord,
}: Props) {
  const dc = difficultyFor(context.optionKind);
  const isSolaceNeutral = dmMode === "solace_neutral";

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [manualRoll, setManualRoll] = useState("");

  const committedRef = useRef(false);

  // Draft narration (editable in human DM mode; read-only in Solace Neutral mode)
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
      // Mythic tone requested (cast keeps compatibility with your existing lens type)
      lens: "mythic" as NarrativeLens,
    });
  }, [roll, dc, context.optionDescription]);

  // Seed draft text:
  // - Human DM mode: seed once, then allow edits
  // - Solace Neutral mode: always keep draftText aligned to generated narration
  useEffect(() => {
    if (roll === null) return;

    if (isSolaceNeutral) {
      setDraftText(generatedNarration);
      return;
    }

    if (draftText === "") {
      setDraftText(generatedNarration);
    }
  }, [roll, generatedNarration, draftText, isSolaceNeutral]);

  /* ----------------------------------------------------------
     Commit (arbiter authority)
  ---------------------------------------------------------- */

  function handleRecord() {
    if (roll === null || committedRef.current) return;
    committedRef.current = true;

    const source: RollSource = manualRoll ? "manual" : "solace";

    const audit: string[] = [];
    if (isSolaceNeutral) {
      audit.push("Drafted by CreativeNarrator");
      audit.push("Presented as Solace (Neutral Facilitator) Arbiter narration (read-only)");
      audit.push("Recorded by Arbiter");
    } else {
      audit.push("Drafted by CreativeNarrator");
      audit.push("Edited by Arbiter");
    }

    onRecord({
      description: draftText.trim(),
      dice: { mode: diceMode, roll, dc, source },
      audit,
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
          onChange={(e) => setDiceMode(e.target.value as DiceMode)}
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
        <button onClick={rollDice}>Roll Here</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <input
          placeholder="Enter physical roll"
          value={manualRoll}
          onChange={(e) => setManualRoll(e.target.value)}
        />
        <button onClick={acceptManualRoll}>Accept Roll</button>
      </div>

      {roll !== null && (
        <p>
          🎲 {diceMode} rolled <strong>{roll}</strong> vs DC{" "}
          <strong>{dc}</strong>
        </p>
      )}

      {roll !== null && (
        <>
          {isSolaceNeutral ? (
            <>
              <div
                className="muted"
                style={{ marginTop: 10, marginBottom: 6, fontSize: 12 }}
              >
                Arbiter Narration — <strong>Solace (Neutral Facilitator)</strong>{" "}
                <span style={{ opacity: 0.75 }}>(read-only)</span>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.35)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.45,
                }}
              >
                {draftText || generatedNarration || "—"}
              </div>

              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.75 }}>
                Narration is DM-authoritative in Solace mode and cannot be edited.
              </div>
            </>
          ) : (
            <>
              <label className="muted">Narration (editable)</label>
              <textarea
                rows={4}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                style={{ width: "100%" }}
              />
            </>
          )}
        </>
      )}

      {role === "arbiter" && (
        <button onClick={handleRecord} disabled={roll === null}>
          Record Outcome
        </button>
      )}
    </section>
  );
}
