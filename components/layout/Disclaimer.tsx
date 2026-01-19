"use client";

// ------------------------------------------------------------
// Disclaimer.tsx
// ------------------------------------------------------------
// Single source of truth for legal / scope clarification.
// Visual-only. No logic.
// ------------------------------------------------------------

import React from "react";

type Props = {
  className?: string;
};

export default function Disclaimer({ className = "" }: Props) {
  return (
    <footer className={`disclaimer ${className}`}>
      <p>
        This software provides a system-agnostic facilitation framework for
        human-led tabletop roleplaying sessions and does not reproduce,
        automate, or emulate any proprietary game rules, content, or narrative.
      </p>
    </footer>
  );
}
