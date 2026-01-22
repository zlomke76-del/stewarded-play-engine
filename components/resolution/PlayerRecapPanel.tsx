"use client";

// ------------------------------------------------------------
// PlayerRecapPanel
// ------------------------------------------------------------
// Player-facing explanation of the last resolved intent
//
// Purpose:
// - Display Solace’s explanatory narration
// - Reflect dice + outcome in human terms
// - NEVER writes canon
// - NEVER mutates state
// ------------------------------------------------------------

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

type Props = {
  payload: {
    description: string;
    dice?: {
      mode: DiceMode;
      roll: number | null;
      dc: number;
      justification: string;
      source: "auto" | "manual";
    };
    audit?: string[];
  } | null;
};

// ------------------------------------------------------------

export default function PlayerRecapPanel({ payload }: Props) {
  if (!payload) return null;

  const dice = payload.dice;

  const outcome =
    dice && typeof dice.roll === "number"
      ? dice.roll >= dice.dc
        ? "Success"
        : "Setback"
      : null;

  return (
    <section
      style={{
        border: "1px solid #2b3a4a",
        borderRadius: 6,
        padding: 14,
        marginTop: 12,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        Solace’s Assessment
      </h3>

      <p style={{ whiteSpace: "pre-wrap" }}>
        {payload.description}
      </p>

      {dice && typeof dice.dc === "number" && (
        <div
          className="muted"
          style={{ marginTop: 10 }}
        >
          🎲{" "}
          <strong>{dice.mode}</strong>{" "}
          {dice.roll !== null
            ? `rolled ${dice.roll} vs DC ${dice.dc}`
            : `DC ${dice.dc}`}{" "}
          {outcome && (
            <>
              — <strong>{outcome}</strong>
            </>
          )}
          <div style={{ marginTop: 4 }}>
            <em>{dice.justification}</em>
          </div>
        </div>
      )}

      {payload.audit && payload.audit.length > 0 && (
        <div
          className="muted"
          style={{ marginTop: 10, fontSize: 12 }}
        >
          {payload.audit.join(" · ")}
        </div>
      )}
    </section>
  );
}
