"use client";

// ------------------------------------------------------------
// StewardedShell.tsx
// ------------------------------------------------------------
// Visual layout shell ONLY.
// No game logic, no state, no assumptions.
// ------------------------------------------------------------

import React from "react";

type Props = {
  title: string;
  onShare?: () => void;
  children: React.ReactNode;
};

export default function StewardedShell({
  title,
  onShare,
  children,
}: Props) {
  return (
    <main className="demo-shell">
      <header className="demo-header">
        <h1>{title}</h1>

        {onShare && (
          <button onClick={onShare} className="share-btn">
            🔗 Share
          </button>
        )}
      </header>

      {children}
    </main>
  );
}
