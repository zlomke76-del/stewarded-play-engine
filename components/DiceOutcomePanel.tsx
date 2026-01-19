"use client";

import { useState } from "react";

export default function DiceOutcomePanel({
  onSubmit,
}: {
  onSubmit: (text: string) => void;
}) {
  const [dice, setDice] = useState("");
  const [summary, setSummary] = useState("");

  function submit() {
    if (!summary.trim()) return;
    const text =
      dice.trim()
        ? `Outcome (${dice}): ${summary}`
        : `Outcome: ${summary}`;
    onSubmit(text);
    setDice("");
    setSummary("");
  }

  return (
    <section className="card fade-in">
      <h2>Dice / Outcome</h2>

      <input
        placeholder="Dice (e.g. d20+5)"
        value={dice}
        onChange={(e) => setDice(e.target.value)}
      />

      <textarea
        rows={2}
        placeholder="Outcome summary…"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />

      <button onClick={submit}>Record Outcome</button>
    </section>
  );
}
