"use client";

// ------------------------------------------------------------
// SurvivalResourcePanel
// ------------------------------------------------------------
// Soft survival resource tracking
// - Advisory only
// - Turn-based decay
// - No forced outcomes
// ------------------------------------------------------------

import CardSection from "@/components/layout/CardSection";

type Props = {
  turn: number;
};

function remaining(start: number, turn: number) {
  return Math.max(start - turn, 0);
}

export default function SurvivalResourcePanel({ turn }: Props) {
  const fire = remaining(10, turn);
  const stamina = remaining(6, turn);
  const food = remaining(8, turn);

  return (
    <CardSection title="Survival Resources">
      <ul>
        <li>
          🔥 Fire: {fire}
          {fire === 0 && " (Cold, darkness spreads)"}
        </li>
        <li>
          💪 Stamina: {stamina}
          {stamina === 0 && " (Exhausted)"}
        </li>
        <li>
          🍖 Food: {food}
          {food === 0 && " (Hungry)"}
        </li>
      </ul>
      <p className="muted">
        Resources fade as time passes. Conditions worsen, but nothing acts on its own.
      </p>
    </CardSection>
  );
}
