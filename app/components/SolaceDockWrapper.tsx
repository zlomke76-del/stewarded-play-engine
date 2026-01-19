// app/components/SolaceDockWrapper.tsx
"use client";

import dynamic from "next/dynamic";

/**
 * Solace must NEVER participate in server render,
 * routing resolution, or partial hydration.
 *
 * This guarantees hook order stability.
 */
const SolaceDock = dynamic(() => import("./SolaceDock"), {
  ssr: false,
});

export default function SolaceDockWrapper() {
  return <SolaceDock />;
}
