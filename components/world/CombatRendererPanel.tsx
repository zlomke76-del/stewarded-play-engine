"use client";

// components/world/CombatRendererPanel.tsx
// ------------------------------------------------------------
// CombatRendererPanel (V1)
// ------------------------------------------------------------
// Visual-only combat theater overlay for the Exploration Map.
// - Reads events + current enemy group name
// - Plays suspenseful animations (telegraph → release → flight → impact)
// - NEVER writes canon. NEVER mutates state. Renderer only.
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import type { SessionEvent } from "@/lib/session/SessionState";
import {
  Effects,
  getEnemySprite,
  guessEnemyArchetype,
  Projectiles,
} from "@/lib/render/SpriteRegistry";

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

  // If this number changes, the renderer will auto-play (if possible).
  playSignal?: number;
};

function withinBounds(p: XY, w: number, h: number) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

// Derive player position deterministically from events (same core as map)
function derivePlayerPosition(
  events: readonly SessionEvent[],
  mapW: number,
  mapH: number
): XY {
  let pos: XY = { x: Math.floor(mapW / 2), y: Math.floor(mapH / 2) };

  for (const e of events as any[]) {
    if (e?.type === "PLAYER_MOVED") {
      const to = e?.payload?.to;
      if (
        to &&
        typeof to.x === "number" &&
        typeof to.y === "number" &&
        withinBounds(to, mapW, mapH)
      ) {
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

type Phase = "idle" | "telegraph" | "release" | "flight" | "impact" | "cooldown";

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
  playSignal,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseStartedAt, setPhaseStartedAt] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const [enemyImg, setEnemyImg] = useState<HTMLImageElement | null>(null);
  const [arrowImg, setArrowImg] = useState<HTMLImageElement | null>(null);
  const [impactImg, setImpactImg] = useState<HTMLImageElement | null>(null);
  const [targetRingImg, setTargetRingImg] = useState<HTMLImageElement | null>(
    null
  );

  const playerPos = useMemo(
    () => derivePlayerPosition(events, mapW, mapH),
    [events, mapW, mapH]
  );

  // Not strictly required for V1 rendering yet, but kept for V2 branching.
  const archetype = useMemo(
    () => guessEnemyArchetype(activeEnemyGroupName),
    [activeEnemyGroupName]
  );

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
  const canvasW = useMemo(
    () => padding * 2 + mapW * tileSize + (mapW - 1) * gap,
    [padding, mapW, tileSize, gap]
  );
  const canvasH = useMemo(
    () => padding * 2 + mapH * tileSize + (mapH - 1) * gap,
    [padding, mapH, tileSize, gap]
  );

  function tileCenterPx(p: XY) {
    return {
      x: padding + p.x * (tileSize + gap) + tileSize / 2,
      y: padding + p.y * (tileSize + gap) + tileSize / 2,
    };
  }

  // Enemy “spawn” positions (left edge, staggered by player's y)
  function enemyVolleyOrigins() {
    const baseY = playerPos.y;
    const ys = [baseY - 1, baseY, baseY + 1].filter(
      (y) => y >= 0 && y < mapH
    );
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

  function playEnemyAnimation() {
    if (!activeEnemyGroupName) return;
    if (busy) return;

    setBusy(true);

    // V1: all archetypes share telegraph → release → flight → impact pacing.
    // (We branch by archetype in V2 for different projectile/effects.)
    startPhase("telegraph");
  }

  // Parent-triggered autoplay
  useEffect(() => {
    if (playSignal === undefined) return;
    if (!activeEnemyGroupName) return;
    if (busy) return;

    playEnemyAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSignal]);

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

    // Flight ends when last projectile would land
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

    const g = canvas.getContext("2d");
    if (!g) return;

    // Clean, portable rounded-rect path: uses roundRect if available, else draws fallback.
    function roundRectPath(
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));

      const anyG = g as any;
      if (typeof anyG.roundRect === "function") {
        anyG.roundRect(x, y, w, h, rr);
        return;
      }

      // fallback path (no roundRect)
      g.moveTo(x + rr, y);
      g.lineTo(x + w - rr, y);
      g.quadraticCurveTo(x + w, y, x + w, y + rr);
      g.lineTo(x + w, y + h - rr);
      g.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      g.lineTo(x + rr, y + h);
      g.quadraticCurveTo(x, y + h, x, y + h - rr);
      g.lineTo(x, y + rr);
      g.quadraticCurveTo(x, y, x + rr, y);
    }

    function clear() {
      g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    }

    function drawTelegraph() {
      const center = tileCenterPx(playerPos);
      const pulse = Math.min(1, (performance.now() - phaseStartedAt) / 650);
      const r = 10 + pulse * 14;

      if (targetRingImg) {
        const s = 48;
        g.globalAlpha = 0.65 + 0.25 * Math.sin(pulse * Math.PI);
        g.drawImage(targetRingImg, center.x - s / 2, center.y - s / 2, s, s);
        g.globalAlpha = 1;
      } else {
        g.strokeStyle = "rgba(138,180,255,0.75)";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(center.x, center.y, r, 0, Math.PI * 2);
        g.stroke();
      }
    }

    function drawEnemyBadges() {
      if (!activeEnemyGroupName) return;

      const origins = enemyVolleyOrigins().map(tileCenterPx);
      const size = 42;

      for (const o of origins) {
        // subtle background plate
        g.globalAlpha = 0.9;
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.beginPath();
        roundRectPath(o.x - size / 2, o.y - size / 2, size, size, 10);
        g.fill();
        g.globalAlpha = 1;

        if (enemyImg) {
          g.drawImage(enemyImg, o.x - size / 2, o.y - size / 2, size, size);
        } else {
          // fallback glyph
          g.fillStyle = "rgba(255,255,255,0.85)";
          g.font = "16px system-ui";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText("EN", o.x, o.y);
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
        g.globalAlpha = 0.55;
        g.strokeStyle = "rgba(200,220,255,0.55)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(p.x0, p.y0);
        g.lineTo(x, y);
        g.stroke();
        g.globalAlpha = 1;

        // Arrow sprite or fallback
        if (arrowImg) {
          const s = 22;
          const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
          g.save();
          g.translate(x, y);
          g.rotate(ang);
          g.drawImage(arrowImg, -s / 2, -s / 2, s, s);
          g.restore();
        } else {
          g.fillStyle = "rgba(255,255,255,0.9)";
          g.beginPath();
          g.arc(x, y, 2.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    }

    function drawImpact() {
      const center = tileCenterPx(playerPos);
      const t = Math.min(1, (performance.now() - phaseStartedAt) / 380);

      // tile flash
      g.globalAlpha = 0.25 + 0.25 * (1 - t);
      g.fillStyle = "rgba(255,200,120,0.7)";
      g.beginPath();
      roundRectPath(
        center.x - tileSize / 2,
        center.y - tileSize / 2,
        tileSize,
        tileSize,
        6
      );
      g.fill();
      g.globalAlpha = 1;

      // impact sprite
      if (impactImg) {
        const s = 64;
        g.globalAlpha = 0.9 * (1 - t * 0.35);
        g.drawImage(impactImg, center.x - s / 2, center.y - s / 2, s, s);
        g.globalAlpha = 1;
      } else {
        g.strokeStyle = "rgba(255,200,120,0.9)";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(center.x, center.y, 10 + t * 16, 0, Math.PI * 2);
        g.stroke();
      }
    }

    function frame() {
      clear();

      // Always show enemy badges during non-idle enemy phase
      if (activeEnemyGroupName && (busy || phase !== "idle")) {
        drawEnemyBadges();
      }

      if (phase === "telegraph" || phase === "release") drawTelegraph();

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
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Combat Theater
            </div>

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

            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
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
