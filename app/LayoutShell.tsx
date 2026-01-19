"use client";

import { usePathname } from "next/navigation";
import NeuralSidebar from "@/app/components/NeuralSidebar";
import LayoutDebugOverlay from "@/app/components/LayoutDebugOverlay";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";

  // ─────────────────────────────────────────────
  // Route classification
  // ─────────────────────────────────────────────

  const isAppShell =
    pathname === "/app" || pathname.startsWith("/app/");

  const isWorkspace =
    pathname.startsWith("/w/");

  // ─────────────────────────────────────────────
  // APP SHELL (with sidebar)
  // ─────────────────────────────────────────────
  if (isAppShell) {
    return (
      <>
        <div
          data-app-shell
          className="grid grid-cols-[minmax(280px,20vw)_1fr]
                     h-screen min-h-0 relative z-10"
        >
          {/* SIDEBAR */}
          <aside
            data-neural-sidebar
            className="h-full overflow-y-auto
                       border-r border-neutral-800
                       bg-neutral-950/60 backdrop-blur-xl"
          >
            <NeuralSidebar />
          </aside>

          {/* MAIN */}
          <main
            data-app-main
            className="h-full min-h-0
                       flex flex-col
                       overflow-hidden"
          >
            <div
              data-app-content
              className="w-full h-full min-h-0
                         flex flex-col overflow-hidden
                         px-10 py-12"
            >
              {children}
            </div>
          </main>
        </div>

        <LayoutDebugOverlay />
        <SpeedInsights />
      </>
    );
  }

  // LayoutShell.tsx — WORKSPACE BRANCH ONLY

if (isWorkspace) {
  return (
    <>
      <div
        data-workspace-canvas
        className="w-screen h-screen overflow-hidden"
      >
        {children}
      </div>

      <LayoutDebugOverlay />
      <SpeedInsights />
    </>
  );
}


  // ─────────────────────────────────────────────
  // STANDALONE (marketing / auth)
  // ─────────────────────────────────────────────
  return (
    <>
      <main
        data-standalone
        className="min-h-screen w-full
                   flex flex-col
                   items-center justify-start
                   px-6 py-16"
      >
        {children}
      </main>

      <LayoutDebugOverlay />
      <SpeedInsights />
    </>
  );
}
