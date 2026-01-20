"use client";

// ------------------------------------------------------------
// TurnPressurePanel
// ------------------------------------------------------------
// Soft turn-based pressure tracker
// - No timers
// - No forced outcomes
// - Advisory only
// ------------------------------------------------------------

import CardSection from "@/components/layout/CardSection";

type Props = {
  turn: number;
};

function pressureForTurn(turn: number) {
  if (turn < 3) {
    return {
      label: "Calm",
      description: "The dungeon is quiet. No external pressure.",
    };
  }

  if (turn < 6) {
    return {
      label: "Tense",
      description:
        "Time passes. Sounds echo. Wandering threats feel closer.",
    };
  }

  return {
    label: "Dangerous",
    description:
      "The dungeon reacts. Enemies may mobilize. Resources strain.",
    };
  }
}

export default function TurnPressurePanel({ turn }: Props) {
  const pressure = pressureForTurn(turn);

  return (
    <CardSection title="Turn Pressure">
      <p>
        <strong>Turn:</strong> {turn}
      </p>
      <p>
        <strong>Status:</strong> {pressure.label}
      </p>
      <p className="muted">{pressure.description}</p>
    </CardSection>
  );
}
