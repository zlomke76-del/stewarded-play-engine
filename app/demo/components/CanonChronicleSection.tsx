"use client";

// ------------------------------------------------------------
// CanonChronicleSection.tsx
// ------------------------------------------------------------
// Visual wrapper for canon + chronicle surfaces.
// Upgraded:
// - adds subtle canon-record SFX when new canon events arrive
// - skips initial mount so historical events do not trigger audio
// ------------------------------------------------------------

import React, { useEffect, useRef } from "react";
import CanonEventsPanel from "@/components/world/CanonEventsPanel";
import WorldLedgerPanelLegacy from "@/components/world/WorldLedgerPanel.legacy";

type Props = {
  events: readonly any[];
};

const SFX = {
  arbiterCanonRecord: "/assets/audio/sfx_arbiter_cannon_record_01.mp3",
} as const;

function playSfx(src: string, volume = 0.5) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // fail silently; chronicle audio should never interrupt flow
    });
  } catch {
    // fail silently
  }
}

export default function CanonChronicleSection({ events }: Props) {
  const didMountRef = useRef(false);
  const prevCountRef = useRef<number>(events.length);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      prevCountRef.current = events.length;
      return;
    }

    const prevCount = prevCountRef.current;
    const nextCount = events.length;

    if (nextCount > prevCount) {
      const latest = events[nextCount - 1];
      if (latest?.type) {
        playSfx(SFX.arbiterCanonRecord, 0.52);
      }
    }

    prevCountRef.current = nextCount;
  }, [events]);

  return (
    <>
      <CanonEventsPanel events={events as any[]} />
      <WorldLedgerPanelLegacy events={events as any} />
    </>
  );
}
