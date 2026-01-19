"use client";

// ------------------------------------------------------------
// ThemeProvider.tsx
// ------------------------------------------------------------
// Visual-only theme wrapper.
// Applies semantic theme classes.
// ------------------------------------------------------------

import React from "react";
import { ThemeName, THEMES } from "./ThemeTokens";

type Props = {
  theme?: ThemeName;
  children: React.ReactNode;
};

export default function ThemeProvider({
  theme = "neutral",
  children,
}: Props) {
  const tokens = THEMES[theme];

  return (
    <div className={tokens.shellClass} data-theme={tokens.name}>
      {children}
    </div>
  );
}
