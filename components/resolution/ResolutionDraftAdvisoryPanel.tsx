"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract:
// - Dice decide success/failure
// - Solace drafts narration
// - Human Arbiter may EDIT narration
// - Arbiter commits canon
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";

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
   Difficulty
------------------------------------------------------------ */

function difficultyFor(kind?: ResolutionContext["optionKind"]) {
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

/* ------------------------------------------------------------
   Intent analysis + narration (unchanged logic)
------------------------------------------------------------ */

function narrateOutcome(intent: string, roll: number, dc: number): string {
  const margin = roll - dc;
  const t = intent.toLowerCase();

  const stealth = /stealth|sneak|scout|hide/.test(t);
  const magic = /cantrip|detect|spell|murmur/.test(t);
  const martial = /sword|grip|ready|guard/.test(t);

  const lines: string[] = [];

  if (margin >= 6) {
    lines.push("Everything aligns perfectly. Timing and silence cooperate.");
    if (stealth) lines.push("You move like rumor — present, but unprovable.");
    lines.push("Momentum is firmly on your side.");
  } else if (margin >= 3) {
    lines.push("The plan executes cleanly.");
    if (magic) lines.push("The magic confirms absence, not safety.");
    lines.push("You advance without drawing notice.");
  } else if (margin >= 0) {
    lines.push("It works, but only just.");
    lines.push("You’re aware how close this came to unraveling.");
  } else if (margin >= -2) {
    lines.push("Something goes wrong — subtle, but real.");
    if (stealth) lines.push("A sound carries farther than intended.");
    lines.push("You are no longer certain you’re unseen.");
  } else if (margin >= -5) {
    lines.push("The plan breaks down under pressure.");
    if (martial) lines.push("Hands tighten on weapons too late.");
    lines.push("The environment pushes back.");
  } else {
    lines.push("The plan collapses outright.");
    lines.push("Multiple elements fail at once.");
    lines.push("You’re reacting now, not choosing.");
  }

  return lines.join(" ");
}

/* ------------------------------------------------------------ */

export default function ResolutionDraftAdvisoryPanel({
  context,
  role,
  onRecord,
}: Props) {
  const dc = difficultyFor(context.optionKind);

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [manualRoll, setManualRoll] = useState("");

  const committedRef = useRef(false);

  // Editable narration state
  const [draftText, setDraftText] = useState<string>("");

  useEffect(() => {
    setRoll(null);
    setManualRoll("");
    setDraftText("");
    committedRef.current = false;
  }, [context.optionDescription]);

  function rollDice() {
    const max = parseInt(diceMode.slice(1), 10);
    setRoll(Math.ceil(Math.random() * max));
  }

  function acceptManualRoll() {
    const r = Number(manualRoll);
    if (!Number.isInteger(r) || r <= 0) return;
    setRoll(r);
  }

  const generatedNarration = useMemo(() => {
    if (roll === null) return "";
    return narrateOutcome(context.optionDescription, roll, dc);
  }, [roll, dc, context.optionDescription]);

  // Seed editable text ONCE after roll
  useEffect(() => {
    if (roll !== null && draftText === "") {
      setDraftText(generatedNarration);
    }
  }, [roll, generatedNarration, draftText]);

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
      audit: ["Drafted by Solace", "Edited by Arbiter"],
    });
  }

  return (
    <section style={{ border: "1px dashed #666", padding: 16 }}>
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
          <label className="muted">Narration (editable)</label>
          <textarea
            rows={4}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
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
