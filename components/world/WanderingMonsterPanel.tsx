"use client";

// ------------------------------------------------------------
// WanderingMonsterPanel
// ------------------------------------------------------------
// Turn-based threat advisory
// ------------------------------------------------------------

import CardSection from "@/components/layout/CardSection";

type Props = {
  turn: number;
};

export default function WanderingMonsterPanel({ turn }: Props) {
  if (turn === 0 || turn % 4 !== 0) {
    return (
      <CardSection title="Wandering Monsters">
        <p className="muted">
          No wandering monsters detected.
        </p>
      </CardSection>
    );
  }

  return (
    <CardSection title="Wandering Monsters">
      <p>
        ⚠️ <strong>Threat Check</strong>
      </p>
      <p className="muted">
        Time has passed. Wandering monsters may
        appear in nearby rooms.
      </p>
    </CardSection>
  );
}
