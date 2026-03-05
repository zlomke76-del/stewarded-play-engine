"use client";

// ------------------------------------------------------------
// CanonChronicleSection.tsx
// ------------------------------------------------------------
// Visual wrapper for canon + chronicle surfaces.
// ------------------------------------------------------------

import React from "react";
import CanonEventsPanel from "@/components/world/CanonEventsPanel";
import WorldLedgerPanelLegacy from "@/components/world/WorldLedgerPanel.legacy";

type Props = {
  events: readonly any[];
};

export default function CanonChronicleSection({ events }: Props) {
  return (
    <>
      <CanonEventsPanel events={events as any[]} />
      <WorldLedgerPanelLegacy events={events as any} />
    </>
  );
}
