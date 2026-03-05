"use client";

// ------------------------------------------------------------
// MapSection.tsx
// ------------------------------------------------------------
// Visual wrapper for exploration map + combat overlay.
// ------------------------------------------------------------

import React from "react";
import ExplorationMapPanel from "@/components/world/ExplorationMapPanel";
import CombatRendererPanel from "@/components/world/CombatRendererPanel";

type Props = {
  events: readonly any[];
  mapW: number;
  mapH: number;

  activeEnemyGroupName: string | null;
  playSignal: number;
};

export default function MapSection({ events, mapW, mapH, activeEnemyGroupName, playSignal }: Props) {
  return (
    <div style={{ position: "relative" }}>
      <ExplorationMapPanel events={events as any} mapW={mapW} mapH={mapH} />

      <CombatRendererPanel
        events={events as any}
        mapW={mapW}
        mapH={mapH}
        activeEnemyGroupName={activeEnemyGroupName}
        hideControls={true}
        playSignal={playSignal}
      />
    </div>
  );
}
