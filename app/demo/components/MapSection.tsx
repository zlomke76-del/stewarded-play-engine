"use client";

// ------------------------------------------------------------
// MapSection.tsx
// ------------------------------------------------------------
// Visual wrapper for exploration map + combat overlay.
//
// Upgraded:
// - adds local exploration / world SFX
// - plays subtle map-reveal, movement, trap, and mark sounds from canon events
// - skips initial mount so historical events do not trigger audio on first render
// ------------------------------------------------------------

import React, { useEffect, useRef } from "react";
import ExplorationMapPanel from "@/components/world/ExplorationMapPanel";
import CombatRendererPanel from "@/components/world/CombatRendererPanel";

type Props = {
  events: readonly any[];
  mapW: number;
  mapH: number;

  activeEnemyGroupName: string | null;
  playSignal: number;
};

const SFX = {
  footstep: "/assets/audio/sfx_button_click_01.mp3",
  mapReveal: "/assets/audio/sfx_success_01.mp3",
  trapTrigger: "/assets/audio/sfx_dungeon_spike_trap_01.mp3",
  stoneDoor: "/assets/audio/sfx_stone_door_01.mp3",
  canonRecord: "/assets/audio/sfx_arbiter_cannon_record_01.mp3",
} as const;

function playSfx(src: string, volume = 0.62) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // fail silently; map audio should never interrupt flow
    });
  } catch {
    // fail silently
  }
}

export default function MapSection({ events, mapW, mapH, activeEnemyGroupName, playSignal }: Props) {
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

    if (nextCount <= prevCount) {
      prevCountRef.current = nextCount;
      return;
    }

    const newEvents = events.slice(prevCount);

    for (const e of newEvents) {
      const type = String(e?.type ?? "");
      const payload = e?.payload ?? {};

      if (type === "PLAYER_MOVED") {
        playSfx(SFX.footstep, 0.42);
        continue;
      }

      if (type === "MAP_REVEALED") {
        playSfx(SFX.mapReveal, 0.44);
        continue;
      }

      if (type === "MAP_MARKED") {
        const kind = String(payload?.kind ?? "").toLowerCase();
        const note = String(payload?.note ?? "").toLowerCase();

        if (kind === "door") {
          playSfx(SFX.stoneDoor, 0.42);
          continue;
        }

        if (kind === "hazard" || note.includes("trap") || note.includes("spike")) {
          playSfx(SFX.trapTrigger, 0.46);
          continue;
        }

        playSfx(SFX.canonRecord, 0.34);
        continue;
      }
    }

    prevCountRef.current = nextCount;
  }, [events]);

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
