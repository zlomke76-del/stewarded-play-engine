"use client";

// components/world/CombatRendererPanel.tsx
// ------------------------------------------------------------
// CombatRendererPanel (V2)
// ------------------------------------------------------------
// Visual-only combat theater overlay for the Exploration Map.
// - Reads events + current enemy group name
// - Plays suspenseful animations (telegraph → attack → impact)
// - Archetype-aware visuals (archers volley, brutes charge, casters beam, etc.)
// - NEVER writes canon. NEVER mutates session state. Renderer only.
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

// Generic particle for projectiles OR “charge” motion
type Particle = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  dur: number;
  kind: "projectile" | "charge";
};

type Beam = {
  t0: number;
  dur: number;
  // from enemy origin (px) to player (px)
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function easeOutCubic(t: number) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutQuad(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

// Rounded rect path helper (no roundRect dependency)
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function pickProjectileForArchetype(archetype: string) {
  // Keep V1 asset compatibility: use arrow everywhere for now,
  // but allow future expansion if SpriteRegistry adds more.
  // If you later add Projectiles.bolt / Projectiles.dagger, etc,
  // just map them here.
  if (archetype === "archers") return Projectiles.arrow;
  if (archetype === "casters") return Projectiles.arrow; // placeholder
  if (archetype === "drones") return Projectiles.arrow; // placeholder
  if (archetype === "sentries") return Projectiles.arrow; // placeholder
  if (archetype === "stalkers") return Projectiles.arrow; // placeholder
  return Projectiles.arrow;
}

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
  const [projImg, setProjImg] = useState<HTMLImageElement | null>(null);
  const [impactImg, setImpactImg] = useState<HTMLImageElement | null>(null);
  const [targetRingImg, setTargetRingImg] = useState<HTMLImageElement | null>(
    null
  );

  const playerPos = useMemo(
    () => derivePlayerPosition(events, mapW, mapH),
    [events, mapW, mapH]
  );

  // IMPORTANT:
  // `guessEnemyArchetype`'s return type in SpriteRegistry may be narrower than
  // the full string set the renderer supports (e.g. missing "sentries").
  // We intentionally widen to `string` here to keep comparisons type-safe.
  const archetype = useMemo<string>(() => {
    const a = guessEnemyArchetype(activeEnemyGroupName);
    return typeof a === "string" ? a : String(a);
  }, [activeEnemyGroupName]);

  // Preload images when enemy changes
  useEffect(() => {
    let alive = true;

    async function go() {
      const enemyUrl = getEnemySprite(activeEnemyGroupName);
      const projUrl = pickProjectileForArchetype(archetype);

      const [e, p, i, r] = await Promise.all([
        loadImage(enemyUrl),
        loadImage(projUrl),
        loadImage(Effects.impact),
        loadImage(Effects.targetRing),
      ]);

      if (!alive) return;
      setEnemyImg(e);
      setProjImg(p);
      setImpactImg(i);
      setTargetRingImg(r);
    }

    go();
    return () => {
      alive = false;
    };
  }, [activeEnemyGroupName, archetype]);

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

  // Enemy “spawn” positions (varies by archetype for richer staging)
  function enemyOriginsTiles(): XY[] {
    const baseY = playerPos.y;

    // Helpful lane set near player row
    const ys = [baseY - 1, baseY, baseY + 1].filter((y) => y >= 0 && y < mapH);

    // default: left edge “ambush line”
    if (
      archetype === "archers" ||
      archetype === "sentries" ||
      archetype === "drones"
    ) {
      const origins: XY[] = ys.map((y) => ({ x: 0, y }));
      return origins.length > 0 ? origins : [{ x: 0, y: Math.floor(mapH / 2) }];
    }

    // brutes/shields: closer “frontline” (x=2)
    if (archetype === "brutes" || archetype === "shields") {
      const origins: XY[] = ys.map((y) => ({ x: Math.min(2, mapW - 1), y }));
      return origins.length > 0
        ? origins
        : [{ x: Math.min(2, mapW - 1), y: Math.floor(mapH / 2) }];
    }

    // casters/wraiths: backline (x=1) but slightly higher rows
    if (archetype === "casters" || archetype === "wraiths") {
      const ys2 = [baseY - 2, baseY, baseY + 2].filter(
        (y) => y >= 0 && y < mapH
      );
      const origins: XY[] = ys2.map((y) => ({ x: Math.min(1, mapW - 1), y }));
      return origins.length > 0
        ? origins
        : [{ x: Math.min(1, mapW - 1), y: Math.floor(mapH / 2) }];
    }

    // stalkers: right edge (flank)
    if (archetype === "stalkers") {
      const origins: XY[] = ys.map((y) => ({ x: mapW - 1, y }));
      return origins.length > 0
        ? origins
        : [{ x: mapW - 1, y: Math.floor(mapH / 2) }];
    }

    // fallback
    const origins: XY[] = ys.map((y) => ({ x: 0, y }));
    return origins.length > 0 ? origins : [{ x: 0, y: Math.floor(mapH / 2) }];
  }

  const particles = useRef<Particle[]>([]);
  const beamRef = useRef<Beam | null>(null);

  function startPhase(next: Phase) {
    setPhase(next);
    setPhaseStartedAt(performance.now());
  }

  function reset() {
    setBusy(false);
    startPhase("idle");
    particles.current = [];
    beamRef.current = null;
  }

  async function playEnemyAnimation() {
    if (!activeEnemyGroupName) return;
    if (busy) return;

    setBusy(true);
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

  // Phase transitions (suspenseful pacing)
  useEffect(() => {
    if (!busy) return;

    const now = performance.now();
    const elapsed = now - phaseStartedAt;

    // Telegraph time
    if (phase === "telegraph" && elapsed > 650) {
      startPhase("release");
      return;
    }

    // Release beat: construct attack representation
    if (phase === "release" && elapsed > 250) {
      const target = tileCenterPx(playerPos);
      const origins = enemyOriginsTiles().map(tileCenterPx);
      const t0 = performance.now();

      // Archetype behaviors:
      // - archers/sentries/drones/stalkers => projectiles
      // - brutes/shields => charge (enemy badge surges in, then impact)
      // - casters => beam (hold for a moment, then impact)
      // - wraiths => “blink” (beam-like + jitter)
      if (
        archetype === "archers" ||
        archetype === "sentries" ||
        archetype === "drones" ||
        archetype === "stalkers"
      ) {
        particles.current = origins.map((o, idx) => ({
          x0: o.x,
          y0: o.y,
          x1: target.x,
          y1: target.y,
          t0: t0 + idx * 70,
          dur: 560,
          kind: "projectile",
        }));
        beamRef.current = null;
        startPhase("flight");
        return;
      }

      if (archetype === "casters" || archetype === "wraiths") {
        const o = origins[0] ?? { x: target.x - 80, y: target.y };
        beamRef.current = {
          t0,
          dur: archetype === "wraiths" ? 520 : 640,
          x0: o.x,
          y0: o.y,
          x1: target.x,
          y1: target.y,
        };
        particles.current = [];
        startPhase("flight");
        return;
      }

      // brutes/shields/default => charge
      particles.current = origins.map((o, idx) => ({
        x0: o.x,
        y0: o.y,
        x1: target.x - 18, // stop slightly before center for “slam”
        y1: target.y,
        t0: t0 + idx * 90,
        dur: 520,
        kind: "charge",
      }));
      beamRef.current = null;
      startPhase("flight");
      return;
    }

    // Flight ends when last particle/beam completes
    if (phase === "flight") {
      const parts = particles.current;
      const b = beamRef.current;

      let landingAt = 0;

      if (b) {
        landingAt = b.t0 + b.dur;
      } else if (parts.length > 0) {
        const last = parts[parts.length - 1];
        landingAt = last.t0 + last.dur;
      } else {
        landingAt = performance.now();
      }

      if (performance.now() > landingAt) {
        startPhase("impact");
        return;
      }
    }

    // Impact flash
    if (phase === "impact" && elapsed > 420) {
      startPhase("cooldown");
      return;
    }

    // Cooldown ends
    if (phase === "cooldown" && elapsed > 520) {
      reset();
      return;
    }
  }, [
    busy,
    phase,
    phaseStartedAt,
    playerPos,
    archetype,
    mapW,
    mapH,
    tileSize,
    gap,
    padding,
  ]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Non-nullable alias for TS (prevents ctx null errors inside nested funcs)
    const ctx: CanvasRenderingContext2D = context;

    function clear() {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    function drawTelegraph() {
      const center = tileCenterPx(playerPos);
      const pulse = clamp01((performance.now() - phaseStartedAt) / 650);
      const r = 10 + pulse * 14;

      // Archetype tint (subtle, readable)
      const ringColor =
        archetype === "casters" || archetype === "wraiths"
          ? "rgba(170,120,255,0.78)"
          : archetype === "brutes" || archetype === "shields"
          ? "rgba(255,120,120,0.78)"
          : "rgba(138,180,255,0.78)";

      if (targetRingImg) {
        const s = 48;
        ctx.globalAlpha = 0.65 + 0.25 * Math.sin(pulse * Math.PI);
        ctx.drawImage(targetRingImg, center.x - s / 2, center.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawEnemyBadges() {
      if (!activeEnemyGroupName) return;

      const origins = enemyOriginsTiles().map(tileCenterPx);
      const size = 42;

      for (const o of origins) {
        // plate
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        roundedRectPath(ctx, o.x - size / 2, o.y - size / 2, size, size, 10);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (enemyImg) {
          ctx.drawImage(enemyImg, o.x - size / 2, o.y - size / 2, size, size);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.font = "16px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("EN", o.x, o.y);
        }
      }
    }

    function drawProjectiles() {
      const now = performance.now();
      const parts = particles.current.filter((p) => p.kind === "projectile");

      for (const p of parts) {
        const tRaw = (now - p.t0) / p.dur;
        if (tRaw < 0 || tRaw > 1) continue;

        const t = easeInOutQuad(tRaw);

        const x = p.x0 + (p.x1 - p.x0) * t;
        const y = p.y0 + (p.y1 - p.y0) * t;

        // Trail
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle =
          archetype === "stalkers"
            ? "rgba(170,255,200,0.55)"
            : archetype === "drones"
            ? "rgba(170,220,255,0.55)"
            : "rgba(200,220,255,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x0, p.y0);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Projectile sprite or fallback
        if (projImg) {
          const s = 22;
          const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ang);
          ctx.drawImage(projImg, -s / 2, -s / 2, s, s);
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawChargeMotion() {
      const now = performance.now();
      const parts = particles.current.filter((p) => p.kind === "charge");
      if (parts.length === 0) return;

      for (const p of parts) {
        const tRaw = (now - p.t0) / p.dur;
        if (tRaw < 0 || tRaw > 1) continue;

        const t = easeOutCubic(tRaw);
        const x = p.x0 + (p.x1 - p.x0) * t;
        const y = p.y0 + (p.y1 - p.y0) * t;

        // slam shadow
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(255,120,120,0.35)";
        ctx.beginPath();
        ctx.arc(x, y + 8, 10 + 8 * t, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // moving “badge” (reuse enemy image or fallback block)
        const size = 44;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        roundedRectPath(ctx, x - size / 2, y - size / 2, size, size, 10);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (enemyImg) {
          ctx.drawImage(enemyImg, x - size / 2, y - size / 2, size, size);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.font = "16px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("EN", x, y);
        }
      }
    }

    function drawBeam() {
      const b = beamRef.current;
      if (!b) return;

      const now = performance.now();
      const tRaw = (now - b.t0) / b.dur;
      if (tRaw < 0 || tRaw > 1) return;

      const t = easeInOutQuad(tRaw);

      // Wraiths: jittery blink-beam
      const jitter =
        archetype === "wraiths"
          ? 4 * Math.sin(now / 45) + 3 * Math.cos(now / 33)
          : 0;

      const x0 = b.x0;
      const y0 = b.y0 + jitter;
      const x1 = b.x1;
      const y1 = b.y1;

      // beam grows in intensity
      const alpha = 0.25 + 0.55 * Math.sin(t * Math.PI);
      ctx.globalAlpha = alpha;

      ctx.lineWidth = archetype === "wraiths" ? 5 : 4;
      ctx.strokeStyle =
        archetype === "wraiths"
          ? "rgba(190,150,255,0.95)"
          : "rgba(170,120,255,0.95)";
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // inner core
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      ctx.globalAlpha = 1;

      // small source spark
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(170,120,255,0.85)";
      ctx.beginPath();
      ctx.arc(x0, y0, 6 + 4 * t, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    function drawImpact() {
      const center = tileCenterPx(playerPos);
      const t = clamp01((performance.now() - phaseStartedAt) / 420);

      // tile flash
      ctx.globalAlpha = 0.22 + 0.28 * (1 - t);
      ctx.fillStyle =
        archetype === "casters" || archetype === "wraiths"
          ? "rgba(200,140,255,0.7)"
          : archetype === "brutes" || archetype === "shields"
          ? "rgba(255,160,120,0.7)"
          : "rgba(255,200,120,0.7)";
      roundedRectPath(
        ctx,
        center.x - tileSize / 2,
        center.y - tileSize / 2,
        tileSize,
        tileSize,
        6
      );
      ctx.fill();
      ctx.globalAlpha = 1;

      // impact sprite
      if (impactImg) {
        const s = 64;
        ctx.globalAlpha = 0.9 * (1 - t * 0.35);
        ctx.drawImage(impactImg, center.x - s / 2, center.y - s / 2, s, s);
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = "rgba(255,200,120,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(center.x, center.y, 10 + t * 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      // subtle shock ring
      ctx.globalAlpha = 0.25 * (1 - t);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 16 + t * 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function frame() {
      clear();

      // Always show enemy badges during non-idle enemy phase
      if (activeEnemyGroupName && (busy || phase !== "idle")) {
        drawEnemyBadges();
      }

      if (phase === "telegraph" || phase === "release") {
        drawTelegraph();
      }

      if (phase === "flight") {
        drawTelegraph();
        drawBeam();
        drawProjectiles();
        drawChargeMotion();
      }

      if (phase === "impact") {
        drawImpact();
      }

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
    projImg,
    impactImg,
    targetRingImg,
    tileSize,
    gap,
    padding,
    mapW,
    mapH,
    archetype,
  ]);

  const canPlay = !!activeEnemyGroupName && !busy;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
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
            pointerEvents: "auto",
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
              maxWidth: 280,
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
                  Archetype: <strong>{String(archetype)}</strong>
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
