"use client";

// ------------------------------------------------------------
// InitialTablePanel
// ------------------------------------------------------------
// Authority model:
// - Solace drafts (optional)
// - Human DM may edit freely
// - Acceptance freezes table for session
// - No canon, no state mutation
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import CardSection from "@/components/layout/CardSection";

type Mode = "human" | "solace-neutral";

type Props = {
  mode: Mode;
  generatedTable: string;
  onAccept: (finalText: string) => void;
};

export default function InitialTablePanel({
  mode,
  generatedTable,
  onAccept,
}: Props) {
  const [text, setText] = useState(generatedTable);
  const [accepted, setAccepted] = useState(false);

  // Reset if Solace regenerates
  useEffect(() => {
    if (!accepted) {
      setText(generatedTable);
    }
  }, [generatedTable, accepted]);

  function handleAccept() {
    setAccepted(true);
    onAccept(text.trim());
  }

  return (
    <CardSection title="Initial Table">
      <p className="muted">
        {mode === "solace-neutral"
          ? "Drafted by Solace. Human DM may edit before accepting."
          : "Human DM controlled."}
      </p>

      {mode === "human" || !accepted ? (
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%" }}
        />
      ) : (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {text}
        </pre>
      )}

      {!accepted && (
        <button
          onClick={handleAccept}
          style={{ marginTop: 8 }}
        >
          Accept Table
        </button>
      )}

      {accepted && (
        <p className="muted" style={{ marginTop: 8 }}>
          Table accepted. This framing is now fixed
          unless the DM chooses to revise it manually.
        </p>
      )}
    </CardSection>
  );
}
