"use client";

// ------------------------------------------------------------
// StewardedShell.tsx
// ------------------------------------------------------------
// Visual layout shell ONLY.
// Header is injected by pages.
// ------------------------------------------------------------

import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function StewardedShell({ children }: Props) {
  return <main className="demo-shell">{children}</main>;
}
