"use client";

import { useEffect, useRef, useState } from "react";

type AxeState = {
  x: number;
  y: number;
  rotation: number;
  flying: boolean;
};

export default function TavernAxeThrow() {
  const [axe, setAxe] = useState<AxeState>({
    x: 120,
    y: 340,
    rotation: 0,
    flying: false,
  });

  const [throwsLeft, setThrowsLeft] = useState(3);

  const hitAudio = useRef<HTMLAudioElement | null>(null);
  const missAudio = useRef<HTMLAudioElement | null>(null);
  const tavernAmbience = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    tavernAmbience.current = new Audio("/assets/audio/sfx_tavern_01.mp3");
    tavernAmbience.current.loop = true;
    tavernAmbience.current.volume = 0.4;
    tavernAmbience.current.play();

    return () => {
      tavernAmbience.current?.pause();
    };
  }, []);

  function throwAxe() {
    if (axe.flying || throwsLeft <= 0) return;

    const start = performance.now();
    const duration = 750;

    const startX = 120;
    const startY = 340;

    const endX = 720 + (Math.random() * 80 - 40);
    const endY = 250 + (Math.random() * 80 - 40);

    const arcHeight = 200;
    const spin = 720;

    setThrowsLeft((v) => v - 1);

    function frame(now: number) {
      const t = Math.min((now - start) / duration, 1);

      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t - arcHeight * 4 * t * (1 - t);
      const rotation = spin * t;

      setAxe({
        x,
        y,
        rotation,
        flying: t < 1,
      });

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        resolveImpact(endX, endY);
      }
    }

    requestAnimationFrame(frame);
  }

  function resolveImpact(x: number, y: number) {
    const targetCenterX = 740;
    const targetCenterY = 260;

    const dx = x - targetCenterX;
    const dy = y - targetCenterY;

    const dist = Math.sqrt(dx * dx + dy * dy);

    const hit = dist < 120;

    if (hit) {
      hitAudio.current?.play();
    } else {
      missAudio.current?.play();
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: 960,
        height: 540,
        overflow: "hidden",
      }}
    >
      <img
        src="/assets/V3/Dungeon/Tavern/tavern_01.png"
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />

      <img
        src="/assets/V3/Dungeon/Tavern/Axe_Throwing/target_01.png"
        style={{
          position: "absolute",
          left: 720,
          top: 180,
          width: 160,
        }}
      />

      <img
        src="/assets/V3/Dungeon/Tavern/Axe_Throwing/axe_01.png"
        style={{
          position: "absolute",
          width: 80,
          transform: `translate(${axe.x}px, ${axe.y}px) rotate(${axe.rotation}deg)`,
          transition: axe.flying ? "none" : "transform 0.15s ease-out",
        }}
      />

      <button
        onClick={throwAxe}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          padding: "12px 18px",
          fontSize: 16,
        }}
      >
        Throw Axe ({throwsLeft})
      </button>

      <audio ref={hitAudio} src="/assets/audio/sfx_axe_hit_01.mp3" />
      <audio ref={missAudio} src="/assets/audio/sfx_axe_miss_01.mp3" />
    </div>
  );
}
