"use client";

// ------------------------------------------------------------
// StewardedShell.tsx
// ------------------------------------------------------------
// Visual layout shell ONLY.
// Theme-aware, no logic.
// ------------------------------------------------------------

import React from "react";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { ThemeName } from "@/components/theme/ThemeTokens";

type Props = {
  theme?: ThemeName;
  children: React.ReactNode;
};

export default function StewardedShell({
  theme = "neutral",
  children,
}: Props) {
  return (
    <ThemeProvider theme={theme}>
      <main className="demo-shell">{children}</main>
    </ThemeProvider>
  );
}
