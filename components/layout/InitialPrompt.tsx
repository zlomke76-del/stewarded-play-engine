"use client";

// ------------------------------------------------------------
// InitialPrompt.tsx
// ------------------------------------------------------------
// Non-canonical opening prompt.
// Suggestive only. No state. No logic.
// ------------------------------------------------------------

import React from "react";

type Props = {
  text: string;
};

export default function InitialPrompt({ text }: Props) {
  return (
    <div className="initial-prompt">
      <p className="prompt-text">{text}</p>
    </div>
  );
}
