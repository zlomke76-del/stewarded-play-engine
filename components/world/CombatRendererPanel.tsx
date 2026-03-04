"use client";

// components/world/CombatRendererPanel.tsx
// ------------------------------------------------------------
// CombatRendererPanel (V1)
// ------------------------------------------------------------
// Visual-only combat theater overlay for the Exploration Map.
// - Reads events + current enemy group name
// - Plays suspenseful animations (telegraph → fire → impact)
// - NEVER writes canon. NEVER mutates state. Renderer only.
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import type { SessionEvent } from "@/lib/session/SessionState";
import { Effects, getEnemySprite, guessEnemyArchetype, Projectiles } from "@/lib/render/SpriteRegistry";

type XY = { x: number; y: number };

type Props = {
  events: readonly SessionEvent[];
  mapW: number;
  mapH: number;

  // If null, overlay stays idle.
  activeEnemyGroupName: string | null;

  // Layout must match ExplorationMapPanel:
  tileSize?: number; // default 22
  gap?: number; // default 4
  padding?: number; // default 10

  // Optional: disable controls and let parent trigger via key change
  hideControls?: boolean;
};

function withinBounds(p: XY, w: number, h: number) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

// Derive player position deterministically from events (same core as map)
function derivePlayerPosition(events: readonly SessionEvent[], mapW: number, mapH: number): XY {
  let pos: XY = { x: Math.floor(mapW / 2), y: Math.floor(mapH / 2) };

  for (const e of events as any[]) {
    if (e?.type === "PLAYER_MOVED") {
      const to = e?.payload?.to;
      if (to && typeof to.x === "number" && typeof to.y === "number" && withinBounds(to, mapW, mapH)) {
        pos = { x: to.x, y: to.y };
      }
    }
  }

  return pos;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

type Phase =
  | "idle"
  | "telegraph"
  | "release"
  | "flight"
  | "impact"
  | "cooldown";

type VolleyParticle = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  dur: number;
};

export default function CombatRendererPanel({
  events,
  mapW,
  mapH,
  activeEnemyGroupName,
  tileSize = 22,
  gap = 4,
  padding = 10,
  hideControls = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseStartedAt, setPhaseStartedAt] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const [enemyImg, setEnemyImg] = useState<HTMLImageElement | null>(null);
  const [arrowImg, setArrowImg] = useState<HTMLImageElement | null>(null);
  const [impactImg, setImpactImg] = useState<HTMLImageElement | null>(null);
  const [targetRingImg, setTargetRingImg] = useState<HTMLImageElement | null>(null);

  const playerPos = useMemo(() => derivePlayerPosition(events, mapW, mapH), [events, mapW, mapH]);

  const archetype = useMemo(() => guessEnemyArchetype(activeEnemyGroupName), [activeEnemyGroupName]);

  // Preload images when enemy changes
  useEffect(() => {
    let alive = true;

    async function go() {
      const enemyUrl = getEnemySprite(activeEnemyGroupName);
      const [e, a, i, r] = await Promise.all([
        loadImage(enemyUrl),
        loadImage(Projectiles.arrow),
        loadImage(Effects.impact),
        loadImage(Effects.targetRing),
      ]);

      if (!alive) return;
      setEnemyImg(e);
      setArrowImg(a);
      setImpactImg(i);
      setTargetRingImg(r);
    }

    go();
    return () => {
      alive = false;
    };
  }, [activeEnemyGroupName]);

  // Canvas sizing to match the map grid container
  const canvasW = useMemo(() => padding * 2 + mapW * tileSize + (mapW - 1) * gap, [padding, mapW, tileSize, gap]);
  const canvasH = useMemo(() => padding * 2 + mapH * tileSize + (mapH - 1) * gap, [padding, mapH, tileSize, gap]);

  function tileCenterPx(p: XY) {
    return {
      x: padding + p.x * (tileSize + gap) + tileSize / 2,
      y: padding + p.y * (tileSize + gap) + tileSize / 2,
    };
  }

  // Enemy “spawn” positions (left edge, staggered)
  function enemyVolleyOrigins() {
    const baseY = playerPos.y;
    const ys = [baseY - 1, baseY, baseY + 1].filter((y) => y >= 0 && y < mapH);
    const origins: XY[] = ys.map((y) => ({ x: 0, y }));
    return origins.length > 0 ? origins : [{ x: 0, y: Math.floor(mapH / 2) }];
  }

  const volley = useRef<VolleyParticle[]>([]);

  function startPhase(next: Phase) {
    setPhase(next);
    setPhaseStartedAt(performance.now());
  }

  function reset() {
    setBusy(false);
    startPhase("idle");
    volley.current = [];
  }

  async function playEnemyAnimation() {
    if (!activeEnemyGroupName) return;
    if (busy) return;

    setBusy(true);

    // V1: Only special-case archers. Others get a simple telegraph/impact pulse for now.
    if (archetype === "archers") {
      startPhase("telegraph");
    } else {
      startPhase("telegraph");
    }
  }

  // Phase transitions (timings are “suspenseful”, not instant)
  useEffect(() => {
    if (!busy) return;

    const now = performance.now();
    const elapsed = now - phaseStartedAt;

    // Telegraph time
    if (phase === "telegraph" && elapsed > 650) {
      startPhase("release");
      return;
    }

    // Release “beat”
    if (phase === "release" && elapsed > 250) {
      // Build volley particles aimed at player
      const target = tileCenterPx(playerPos);
      const origins = enemyVolleyOrigins().map(tileCenterPx);

      const t0 = performance.now();
      volley.current = origins.map((o, idx) => ({
        x0: o.x,
        y0: o.y,
        x1: target.x,
        y1: target.y,
        t0: t0 + idx * 60, // slight stagger
        dur: 520,
      }));

      startPhase("flight");
      return;
    }

    // Flight ends when last arrow would land
    if (phase === "flight") {
      const parts = volley.current;
      const last = parts[parts.length - 1];
      if (!last) {
        startPhase("impact");
        return;
      }
      const landingAt = last.t0 + last.dur;
      if (performance.now() > landingAt) {
        startPhase("impact");
        return;
      }
    }

    // Impact “flash”
    if (phase === "impact" && elapsed > 380) {
      startPhase("cooldown");
      return;
    }

    // Cooldown ends
    if (phase === "cooldown" && elapsed > 450) {
      reset();
      return;
    }
  }, [busy, phase, phaseStartedAt, playerPos, archetype]); // eslint-disable-line react-hooks/exhaustive-deps

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawTelegraph() {
      const c = tileCenterPx(playerPos);
      const pulse = Math.min(1, (performance.now() - phaseStartedAt) / 650);
      const r = 10 + pulse * 14;

      // Target ring image if present, otherwise draw simple ring
      if (targetRingImg) {
        const s = 48;
        ctx.globalAlpha = 0.65 + 0.25 * Math.sin(pulse * Math.PI);
        ctx.drawImage(targetRingImg, c.x - s / 2, c.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = "rgba(138,180,255,0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawEnemyBadges() {
      if (!activeEnemyGroupName) return;

      const origins = enemyVolleyOrigins().map(tileCenterPx);
      const size = 42;

      for (const o of origins) {
        // subtle background plate
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.roundRect(o.x - size / 2, o.y - size / 2, size, size, 10);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (enemyImg) {
          ctx.drawImage(enemyImg, o.x - size / 2, o.y - size / 2, size, size);
        } else {
          // fallback glyph
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.font = "16px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("EN", o.x, o.y);
        }
      }
    }

    function drawArrows() {
      const now = performance.now();
      const parts = volley.current;

      for (const p of parts) {
        const t = (now - p.t0) / p.dur;
        if (t < 0 || t > 1) continue;

        const x = p.x0 + (p.x1 - p.x0) * t;
        const y = p.y0 + (p.y1 - p.y0) * t;

        // Trail
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "rgba(200,220,255,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x0, p.y0);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Arrow sprite or fallback
        if (arrowImg) {
          const s = 22;
          // rotate to direction
          const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ang);
          ctx.drawImage(arrowImg, -s / 2, -s / 2, s, s);
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawImpact() {
      const c = tileCenterPx(playerPos);
      const t = Math.min(1, (performance.now() - phaseStartedAt) / 380);

      // tile flash
      ctx.globalAlpha = 0.25 + 0.25 * (1 - t);
      ctx.fillStyle = "rgba(255,200,120,0.7)";
      ctx.beginPath();
      ctx.roundRect(c.x - tileSize / 2, c.y - tileSize / 2, tileSize, tileSize, 6);
      ctx.fill();
      ctx.globalAlpha = 1;

      // impact sprite
      if (impactImg) {
        const s = 64;
        ctx.globalAlpha = 0.9 * (1 - t * 0.35);
        ctx.drawImage(impactImg, c.x - s / 2, c.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = "rgba(255,200,120,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 10 + t * 16, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function frame() {
      clear();

      // Always show enemy badges during non-idle enemy phase
      if (activeEnemyGroupName && (busy || phase !== "idle")) {
        drawEnemyBadges();
      }

      if (phase === "telegraph") drawTelegraph();
      if (phase === "release") drawTelegraph();
      if (phase === "flight") {
        drawTelegraph();
        drawArrows();
      }
      if (phase === "impact") drawImpact();

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    activeEnemyGroupName,
    busy,
    phase,
    phaseStartedAt,
    playerPos,
    enemyImg,
    arrowImg,
    impactImg,
    targetRingImg,
    mapW,
    mapH,
    tileSize,
    gap,
    padding,
  ]);

  const canPlay = !!activeEnemyGroupName && !busy;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none", // renderer is visual-only by default
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        style={{
          display: "block",
          width: canvasW,
          height: canvasH,
        }}
      />

      {!hideControls && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            pointerEvents: "auto", // allow clicking UI
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
              color: "rgba(255,255,255,0.85)",
              maxWidth: 260,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Combat Theater</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {activeEnemyGroupName ? (
                <>
                  Active enemy: <strong>{activeEnemyGroupName}</strong>
                  <br />
                  Phase: <strong>{phase}</strong>
                </>
              ) : (
                <>No active enemy turn.</>
              )}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={playEnemyAnimation} disabled={!canPlay}>
                {busy ? "Playing…" : "Play Enemy Animation"}
              </button>
            </div>

            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.8 }}>
              Renderer only — does not write canon.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
