"use client";

import { Suspense } from "react";
import SolaceGuard from "@/app/components/SolaceGuard";
import SolaceDockWrapper from "@/app/components/SolaceDockWrapper";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 🔒 Solace exists ONLY inside /app */}
      <Suspense fallback={null}>
        <SolaceGuard />
      </Suspense>

      {/* 🔒 Do NOT re-render LayoutShell here */}
      {children}

      {/* 🔒 Dock is /app-only */}
      <SolaceDockWrapper />
    </>
  );
}
