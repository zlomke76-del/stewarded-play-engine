// app/demo/components/AmbientBackground.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function easeInOutCubic(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function flickerValue(nowMs: number, seed: number) {
  const t = (nowMs / 1000) * (0.9 + (seed % 7) * 0.03);
  const s1 = Math.sin(t * 2.3 + seed);
  const s2 = Math.sin(t * 5.1 + seed * 1.7);
  const s3 = Math.sin(t * 9.2 + seed * 0.6);
  const raw = (s1 * 0.6 + s2 * 0.3 + s3 * 0.1) * 0.5 + 0.5;
  return easeInOutCubic(clamp01(raw));
}

export default function AmbientBackground({ children }: { children: React.ReactNode }) {
  const [fxNow, setFxNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setFxNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fogShiftA = useMemo(() => {
    const t = fxNow / 1000;
    const x = (t * 6) % 240;
    const y = (t * 3.5) % 180;
    return { x, y };
  }, [fxNow]);

  const fogShiftB = useMemo(() => {
    const t = fxNow / 1000;
    const x = (t * 3.2 + 120) % 260;
    const y = (t * 2.1 + 80) % 200;
    return { x, y };
  }, [fxNow]);

  const torchFlicker = useMemo(() => flickerValue(fxNow, 1337), [fxNow]);

  const torchAlphaLeft = lerp(0.10, 0.22, torchFlicker);
  const torchAlphaRight = lerp(0.08, 0.19, torchFlicker);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/dungeon_background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Base readability overlay + subtle blur */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.84) 40%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.65) 100%)",
          backdropFilter: "blur(2px)",
          pointerEvents: "none",
        }}
      />

      {/* Torchlight flicker */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: [
            `radial-gradient(520px 820px at 8% 55%, rgba(255,170,90,${torchAlphaLeft.toFixed(3)}), transparent 62%)`,
            `radial-gradient(460px 760px at 92% 60%, rgba(255,150,70,${torchAlphaRight.toFixed(3)}), transparent 60%)`,
            "radial-gradient(700px 520px at 50% 110%, rgba(255,140,80,0.06), transparent 65%)",
          ].join(", "),
          mixBlendMode: "screen",
          opacity: 0.85,
        }}
      />

      {/* Fog drift */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.22,
          filter: "blur(10px)",
          background: [
            `radial-gradient(600px 380px at ${30 + (fogShiftA.x % 40)}% ${
              30 + (fogShiftA.y % 30)
            }%, rgba(255,255,255,0.12), transparent 68%)`,
            `radial-gradient(780px 520px at ${60 + (fogShiftB.x % 35)}% ${
              55 + (fogShiftB.y % 25)
            }%, rgba(255,255,255,0.10), transparent 70%)`,
            "radial-gradient(900px 600px at 50% 40%, rgba(255,255,255,0.06), transparent 72%)",
          ].join(", "),
          transform: `translate3d(${(fogShiftA.x % 120) - 60}px, ${(fogShiftA.y % 80) - 40}px, 0)`,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
