"use client";

// ------------------------------------------------------------
// DungeonPressurePanel
// ------------------------------------------------------------
// Advisory-only dungeon tension model
// - Reads turn count
// - Computes pressure tier
// - Performs wandering monster advisory roll
// ------------------------------------------------------------

import { useMemo } from "react";

export type PressureTier =
  | "Calm"
  | "Tense"
  | "Dangerous"
  | "Critical";

type Props = {
  turn: number;
};

function pressureForTurn(turn: number): PressureTier {
  if (turn < 3) return "Calm";
  if (turn < 6) return "Tense";
  if (turn < 10) return "Dangerous";
  return "Critical";
}

function wanderingAdvisory(tier: PressureTier): string {
  const roll = Math.ceil(Math.random() * 6);

  switch (tier) {
    case "Calm":
      return "No unusual activity.";
    case "Tense":
      return roll === 6
        ? "You hear distant movement."
        : "The dungeon is quiet.";
    case "Dangerous":
      return roll >= 4
        ? "Something is moving nearby."
        : "Uneasy silence.";
    case "Critical":
      return "An encounter is imminent.";
  }
}

export default function DungeonPressurePanel({ turn }: Props) {
  const tier = useMemo(() => pressureForTurn(turn), [turn]);
  const advisory = useMemo(
    () => wanderingAdvisory(tier),
    [tier, turn]
  );

  return (
    <section className="card">
      <h3>Dungeon Pressure</h3>

      <p>
        <strong>Turn:</strong> {turn}
      </p>

      <p>
        <strong>Pressure Tier:</strong> {tier}
      </p>

      <p className="muted">
        🎲 Wandering Monster Check: {advisory}
      </p>

      <p className="muted small">
        Advisory only · No encounters are forced
      </p>
    </section>
  );
}
