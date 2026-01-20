"use client";

// ------------------------------------------------------------
// EnvironmentalPressurePanel
// ------------------------------------------------------------
// Soft survival pressure tracker
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
      description:
        "The land is still. The tribe has breathing room.",
    };
  }

  if (turn < 6) {
    return {
      label: "Strained",
      description:
        "Time passes. Hunger and fatigue creep in. The wild grows watchful.",
    };
  }

  return {
    label: "Harsh",
    description:
      "The environment presses back. Resources thin. Predators may stir.",
    };
  }
}

export default function EnvironmentalPressurePanel({
  turn,
}: Props) {
  const pressure = pressureForTurn(turn);

  return (
    <CardSection title="Environmental Pressure">
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
