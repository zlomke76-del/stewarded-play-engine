"use client";

// ------------------------------------------------------------
// ResourceClockPanel
// ------------------------------------------------------------
// Soft resource tracking
// ------------------------------------------------------------

import CardSection from "@/components/layout/CardSection";

type Props = {
  turn: number;
};

function remaining(start: number, turn: number) {
  return Math.max(start - turn, 0);
}

export default function ResourceClockPanel({ turn }: Props) {
  const torches = remaining(10, turn);
  const spells = remaining(6, turn);
  const rations = remaining(8, turn);

  return (
    <CardSection title="Resources">
      <ul>
        <li>
          🕯 Torches: {torches}
          {torches === 0 && " (Darkness)"}
        </li>
        <li>
          ✨ Spells: {spells}
          {spells === 0 && " (Exhausted)"}
        </li>
        <li>
          🍖 Rations: {rations}
          {rations === 0 && " (Hungry)"}
        </li>
      </ul>
      <p className="muted">
        Resources diminish as time passes.
      </p>
    </CardSection>
  );
}
