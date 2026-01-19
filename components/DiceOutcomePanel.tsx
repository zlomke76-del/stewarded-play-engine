"use client";

// ------------------------------------------------------------
// DiceOutcomePanel
// ------------------------------------------------------------
// Purpose:
// - Capture DM / Arbiter outcome text
// - Explicit human-authored canon entry
// - No automation, no inference
// ------------------------------------------------------------

import { useState } from "react";

type Props = {
  onSubmit: (text: string) => void;

  /**
   * Enable native browser spellcheck for DM text entry
   * (Pure UX, zero logic impact)
   */
  spellCheck?: boolean;
};

export default function DiceOutcomePanel({
  onSubmit,
  spellCheck = false,
}: Props) {
  const [text, setText] = useState("");

  function handleSubmit() {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  }

  return (
    <section
      style={{
        border: "1px dashed #666",
        padding: "16px",
        borderRadius: "6px",
        marginTop: "16px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Outcome (DM / Arbiter)</h3>

      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe what actually happens…"
        spellCheck={spellCheck}
        style={{ width: "100%" }}
      />

      <button
        onClick={handleSubmit}
        style={{ marginTop: "8px" }}
      >
        Record Outcome
      </button>
    </section>
  );
}
