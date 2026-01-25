"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract:
// - Dice decide success/failure
// - Solace narrates consequences-in-motion
// - Narration derives from PLAYER INTENT
// - Human Arbiter commits canon
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

export type ResolutionContext = {
  optionDescription: string; // RAW player intent
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
   Difficulty (advisory only)
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
   Intent + party analysis
------------------------------------------------------------ */

function analyzeIntent(text: string) {
  const t = text.toLowerCase();

  return {
    stealth: /stealth|sneak|scout|hide|quiet/.test(t),
    magic: /cantrip|spell|detect|murmur|ritual/.test(t),
    blessing: /bless|prayer|divine/.test(t),
    martial: /grip|sword|ready|guard|fight/.test(t),

    characters: {
      cragHack: /crag hack/.test(t),
      resurrector: /resurrector/.test(t),
      titi: /titi/.test(t),
    },
  };
}

/* ------------------------------------------------------------
   Narrative engine
------------------------------------------------------------ */

function narrateOutcome(
  intent: string,
  roll: number,
  dc: number
): string {
  const margin = roll - dc;
  const shape = analyzeIntent(intent);

  const lines: string[] = [];

  // ---------- EXTREME SUCCESS ----------
  if (margin >= 6) {
    lines.push(
      "Everything aligns perfectly. The timing, spacing, and silence all cooperate."
    );

    if (shape.stealth) {
      lines.push(
        "Your movement leaves no trace — even chance seems to look the other way."
      );
    }

    if (shape.characters.cragHack) {
      lines.push(
        "Crag Hack never needs to draw steel. The threat dissolves before it can form."
      );
    }

    if (shape.characters.resurrector) {
      lines.push(
        "The cantrip confirms what you hoped: nothing watches, nothing waits."
      );
    }

    lines.push(
      "Momentum is yours. You’re ahead of the world, not reacting to it."
    );
  }

  // ---------- STRONG SUCCESS ----------
  else if (margin >= 3) {
    lines.push(
      "The plan executes cleanly. Each role holds, each signal lands."
    );

    if (shape.stealth) {
      lines.push(
        "Sound and shadow cooperate just enough to keep you unseen."
      );
    }

    if (shape.blessing) {
      lines.push(
        "Titi’s quiet blessing settles in at exactly the right moment."
      );
    }

    lines.push(
      "You move forward without drawing attention — but you know luck won’t always be this kind."
    );
  }

  // ---------- NARROW SUCCESS ----------
  else if (margin >= 0) {
    lines.push(
      "It works — but not comfortably. The plan bends under its own complexity."
    );

    if (shape.magic) {
      lines.push(
        "The magic offers no warning, only the absence of alarm."
      );
    }

    lines.push(
      "You advance, aware that one more misstep would have changed everything."
    );
  }

  // ---------- SOFT FAILURE ----------
  else if (margin >= -2) {
    lines.push(
      "The plan holds together, but friction creeps in."
    );

    if (shape.stealth) {
      lines.push(
        "Footsteps carry farther than expected. A shutter shifts somewhere nearby."
      );
    }

    lines.push(
      "Nothing breaks — yet — but the margin for error shrinks."
    );
  }

  // ---------- HARD FAILURE ----------
  else if (margin >= -5) {
    lines.push(
      "Something goes wrong. Not loudly — but unmistakably."
    );

    if (shape.characters.cragHack) {
      lines.push(
        "Crag Hack tightens his grip, realizing too late that steel may be needed."
      );
    }

    if (shape.magic) {
      lines.push(
        "The cantrip falters, offering no clarity when it matters most."
      );
    }

    lines.push(
      "The environment pushes back. You’re no longer invisible — only unconfirmed."
    );
  }

  // ---------- CATASTROPHIC ----------
  else {
    lines.push(
      "The plan fractures the moment it meets reality."
    );

    lines.push(
      "Multiple elements fail at once — timing, silence, and positioning unravel together."
    );

    if (shape.characters.titi) {
      lines.push(
        "Titi’s blessing lands too late to prevent the fallout."
      );
    }

    lines.push(
      "You’re exposed, reacting instead of choosing. Consequences begin stacking."
    );
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

  useEffect(() => {
    setRoll(null);
    setManualRoll("");
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

  const narration =
    roll !== null
      ? narrateOutcome(context.optionDescription, roll, dc)
      : "The moment stretches. Everyone waits on the dice.";

  function handleRecord() {
    if (roll === null || committedRef.current) return;
    committedRef.current = true;

    onRecord({
      description: narration,
      dice: {
        mode: diceMode,
        roll,
        dc,
        source: manualRoll ? "manual" : "solace",
      },
      audit: ["Drafted by Solace", "Recorded by Arbiter"],
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
          onChange={(e) =>
            setDiceMode(e.target.value as DiceMode)
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

      <p>{narration}</p>

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
