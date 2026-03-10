"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ThrowOutcome = {
  score: number;
  label: "Bullseye" | "Inner Ring" | "Outer Ring" | "Graze" | "Miss";
  distance: number;
};

type Props = {
  initialThrows?: number;
  onExit?: () => void;
  onRoundComplete?: (summary: {
    totalScore: number;
    throwsUsed: number;
    bestThrow: ThrowOutcome | null;
  }) => void;
};

type ActiveFlight = {
  startedAt: number;
  durationMs: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  arcHeight: number;
  spinDeg: number;
  finalStickDeg: number;
};

type AxeVisualState = {
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
  flying: boolean;
  embedded: boolean;
};

const LANE_BG = "/assets/V3/Dungeon/Tavern/axe_01.png";
const TARGET_SRC = "/assets/V3/Dungeon/Tavern/Axe_Throwing/target_01.png";
const AXE_SRC = "/assets/V3/Dungeon/Tavern/Axe_Throwing/axe_01.png";

const HIT_SFX = "/assets/audio/sfx_axe_hit_01.mp3";
const MISS_SFX = "/assets/audio/sfx_axe_miss_01.mp3";

const SCENE_W = 920;
const SCENE_H = 920;

const TARGET_W = 310;
const TARGET_H = 310;
const TARGET_X = 505;
const TARGET_Y = 168;

const TARGET_CENTER_X = TARGET_X + TARGET_W / 2;
const TARGET_CENTER_Y = TARGET_Y + TARGET_H / 2;

const AXE_W = 200;
const AXE_H = 360;

const START_X = 88;
const START_Y = 610;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function evaluateThrow(distance: number): ThrowOutcome {
  if (distance <= 22) {
    return { score: 100, label: "Bullseye", distance };
  }
  if (distance <= 52) {
    return { score: 60, label: "Inner Ring", distance };
  }
  if (distance <= 92) {
    return { score: 30, label: "Outer Ring", distance };
  }
  if (distance <= 128) {
    return { score: 10, label: "Graze", distance };
  }
  return { score: 0, label: "Miss", distance };
}

export default function TavernAxeThrow({
  initialThrows = 3,
  onExit,
  onRoundComplete,
}: Props) {
  const laneRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const chargeRafRef = useRef<number | null>(null);

  const hitAudioRef = useRef<HTMLAudioElement | null>(null);
  const missAudioRef = useRef<HTMLAudioElement | null>(null);

  const [throwsLeft, setThrowsLeft] = useState(initialThrows);
  const [totalScore, setTotalScore] = useState(0);
  const [bestThrow, setBestThrow] = useState<ThrowOutcome | null>(null);

  const [aimOffsetY, setAimOffsetY] = useState(0);
  const [chargePower, setChargePower] = useState(0.35);
  const [isCharging, setIsCharging] = useState(false);

  const [roundMessage, setRoundMessage] = useState<string>(
    "Hold the throw button to build power. Move your pointer up or down to aim."
  );
  const [impactFlash, setImpactFlash] = useState(false);
  const [boardShake, setBoardShake] = useState(false);

  const [axe, setAxe] = useState<AxeVisualState>({
    x: START_X,
    y: START_Y,
    rotation: -18,
    visible: true,
    flying: false,
    embedded: false,
  });

  const [activeFlight, setActiveFlight] = useState<ActiveFlight | null>(null);

  const throwsUsed = useMemo(() => initialThrows - throwsLeft, [initialThrows, throwsLeft]);
  const isRoundOver = throwsLeft <= 0 && !activeFlight && !isCharging;

  useEffect(() => {
    hitAudioRef.current = new Audio(HIT_SFX);
    hitAudioRef.current.volume = 0.72;

    missAudioRef.current = new Audio(MISS_SFX);
    missAudioRef.current.volume = 0.7;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (chargeRafRef.current) cancelAnimationFrame(chargeRafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!activeFlight) return;

    function step(now: number) {
      setAxe((prev) => {
        if (!activeFlight) return prev;

        const rawT = clamp((now - activeFlight.startedAt) / activeFlight.durationMs, 0, 1);
        const t = easeOutCubic(rawT);

        const x = lerp(activeFlight.startX, activeFlight.endX, t);
        const yBase = lerp(activeFlight.startY, activeFlight.endY, t);
        const arcLift = activeFlight.arcHeight * 4 * t * (1 - t);
        const y = yBase - arcLift;
        const rotation = lerp(-16, activeFlight.spinDeg, t);

        return {
          x,
          y,
          rotation,
          visible: true,
          flying: rawT < 1,
          embedded: false,
        };
      });

      const done = now >= activeFlight.startedAt + activeFlight.durationMs;
      if (!done) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      resolveImpact(activeFlight);
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeFlight]);

  useEffect(() => {
    if (!isRoundOver) return;
    onRoundComplete?.({
      totalScore,
      throwsUsed,
      bestThrow,
    });
  }, [isRoundOver, onRoundComplete, totalScore, throwsUsed, bestThrow]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = laneRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = event.clientY - rect.top;
    const relative = y - TARGET_CENTER_Y;
    setAimOffsetY(clamp(relative, -120, 120));
  }

  function beginCharge() {
    if (activeFlight || throwsLeft <= 0) return;
    if (isCharging) return;

    setIsCharging(true);
    const startedAt = performance.now();

    function tick(now: number) {
      const elapsed = now - startedAt;
      const wave = (Math.sin(elapsed / 260) + 1) / 2;
      const power = 0.18 + wave * 0.82;
      setChargePower(power);

      chargeRafRef.current = requestAnimationFrame(tick);
    }

    chargeRafRef.current = requestAnimationFrame(tick);
  }

  function endCharge() {
    if (!isCharging || activeFlight || throwsLeft <= 0) return;

    setIsCharging(false);
    if (chargeRafRef.current) cancelAnimationFrame(chargeRafRef.current);

    const power = chargePower;
    const accuracyPenalty = (1 - power) * 34;
    const randomDriftX = (Math.random() * 2 - 1) * accuracyPenalty;
    const randomDriftY = (Math.random() * 2 - 1) * (accuracyPenalty + 10);

    const endX = TARGET_CENTER_X - AXE_W / 2 + randomDriftX;
    const aimedY = TARGET_CENTER_Y + aimOffsetY * 0.45;
    const endY = aimedY - AXE_H / 2 + randomDriftY;

    const durationMs = Math.round(560 + (1 - power) * 220);
    const arcHeight = 160 + power * 160;
    const spinDeg = 540 + power * 720;
    const finalStickDeg = -26 + Math.random() * 18;

    setThrowsLeft((v) => Math.max(0, v - 1));
    setRoundMessage("The axe cuts through the smoky tavern air...");

    setActiveFlight({
      startedAt: performance.now(),
      durationMs,
      startX: START_X,
      startY: START_Y,
      endX,
      endY,
      arcHeight,
      spinDeg,
      finalStickDeg,
    });
  }

  function resolveImpact(flight: ActiveFlight) {
    setActiveFlight(null);

    const axeHeadX = flight.endX + AXE_W * 0.7;
    const axeHeadY = flight.endY + AXE_H * 0.28;

    const dx = axeHeadX - TARGET_CENTER_X;
    const dy = axeHeadY - TARGET_CENTER_Y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const outcome = evaluateThrow(distance);

    const hit = outcome.score > 0;

    setAxe({
      x: flight.endX,
      y: flight.endY,
      rotation: hit ? flight.finalStickDeg : flight.finalStickDeg + 95,
      visible: true,
      flying: false,
      embedded: hit,
    });

    setImpactFlash(true);
    setBoardShake(true);
    window.setTimeout(() => setImpactFlash(false), 130);
    window.setTimeout(() => setBoardShake(false), 220);

    if (hit) {
      hitAudioRef.current?.currentTime && (hitAudioRef.current.currentTime = 0);
      hitAudioRef.current?.play().catch(() => {});
    } else {
      missAudioRef.current?.currentTime && (missAudioRef.current.currentTime = 0);
      missAudioRef.current?.play().catch(() => {});
    }

    setTotalScore((v) => v + outcome.score);
    setBestThrow((prev) => {
      if (!prev) return outcome;
      return outcome.score > prev.score ? outcome : prev;
    });

    if (outcome.label === "Bullseye") {
      setRoundMessage("Bullseye. The tavern notices.");
    } else if (outcome.label === "Inner Ring") {
      setRoundMessage("A strong throw. Clean steel, solid wood.");
    } else if (outcome.label === "Outer Ring") {
      setRoundMessage("Good enough to earn a few nods.");
    } else if (outcome.label === "Graze") {
      setRoundMessage("A scrape. You had the line, but not the finish.");
    } else {
      setRoundMessage("Miss. The floor remembers the clatter.");
    }
  }

  function resetRound() {
    setThrowsLeft(initialThrows);
    setTotalScore(0);
    setBestThrow(null);
    setAimOffsetY(0);
    setChargePower(0.35);
    setIsCharging(false);
    setActiveFlight(null);
    setAxe({
      x: START_X,
      y: START_Y,
      rotation: -18,
      visible: true,
      flying: false,
      embedded: false,
    });
    setRoundMessage("Hold the throw button to build power. Move your pointer up or down to aim.");
  }

  const aimMarkerY = clamp(TARGET_CENTER_Y + aimOffsetY, TARGET_Y + 18, TARGET_Y + TARGET_H - 18);

  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gap: 18,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 900 }}>Tavern Axe Lane</div>
        <div style={{ fontSize: 14, opacity: 0.78, lineHeight: 1.55 }}>
          Warm up before the descent. Three throws. A steady hand earns more than applause.
        </div>
      </div>

      <div
        ref={laneRef}
        onPointerMove={handlePointerMove}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 920,
          aspectRatio: "1 / 1",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          background: "#120b07",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <img
          src={LANE_BG}
          alt="Tavern axe lane"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        <img
          src={TARGET_SRC}
          alt="Target"
          draggable={false}
          style={{
            position: "absolute",
            left: `${(TARGET_X / SCENE_W) * 100}%`,
            top: `${(TARGET_Y / SCENE_H) * 100}%`,
            width: `${(TARGET_W / SCENE_W) * 100}%`,
            height: `${(TARGET_H / SCENE_H) * 100}%`,
            objectFit: "contain",
            transform: boardShake ? "translateX(2px) rotate(0.35deg)" : "translateX(0px) rotate(0deg)",
            transition: "transform 120ms ease-out",
            filter: impactFlash ? "brightness(1.15)" : "brightness(1)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: `${((TARGET_X + TARGET_W * 0.08) / SCENE_W) * 100}%`,
            top: `${(aimMarkerY / SCENE_H) * 100}%`,
            width: `${(TARGET_W * 0.84 / SCENE_W) * 100}%`,
            height: 2,
            background: "rgba(255, 244, 214, 0.28)",
            boxShadow: "0 0 12px rgba(255, 220, 140, 0.25)",
            pointerEvents: "none",
          }}
        />

        {axe.visible ? (
          <img
            src={AXE_SRC}
            alt="Throwing axe"
            draggable={false}
            style={{
              position: "absolute",
              left: `${(axe.x / SCENE_W) * 100}%`,
              top: `${(axe.y / SCENE_H) * 100}%`,
              width: `${(AXE_W / SCENE_W) * 100}%`,
              height: `${(AXE_H / SCENE_H) * 100}%`,
              objectFit: "contain",
              pointerEvents: "none",
              transform: `rotate(${axe.rotation}deg)`,
              transformOrigin: "62% 34%",
              filter: axe.flying
                ? "drop-shadow(0 20px 18px rgba(0,0,0,0.35))"
                : axe.embedded
                  ? "drop-shadow(0 8px 12px rgba(0,0,0,0.32))"
                  : "drop-shadow(0 12px 12px rgba(0,0,0,0.32))",
              transition: axe.flying ? "none" : "transform 140ms ease-out",
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: impactFlash
              ? "radial-gradient(circle at 72% 28%, rgba(255,210,140,0.18), rgba(255,255,255,0) 26%)"
              : "transparent",
            transition: "background 120ms ease-out",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 16,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(8,8,8,0.52)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
              Throws Left
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{throwsLeft}</div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(8,8,8,0.52)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(6px)",
              minWidth: 140,
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
              Tavern Score
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{totalScore}</div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(8,8,8,0.56)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
              Lane Read
            </div>
            <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>{roundMessage}</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(8,8,8,0.56)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 12,
                  opacity: 0.76,
                }}
              >
                <span>Power</span>
                <span>{Math.round(chargePower * 100)}%</span>
              </div>

              <div
                style={{
                  marginTop: 8,
                  height: 12,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    width: `${Math.round(chargePower * 100)}%`,
                    height: "100%",
                    background:
                      chargePower >= 0.8
                        ? "linear-gradient(90deg, rgba(255,189,92,0.92), rgba(255,120,72,0.92))"
                        : "linear-gradient(90deg, rgba(196,176,122,0.92), rgba(255,189,92,0.92))",
                    transition: isCharging ? "none" : "width 140ms ease-out",
                  }}
                />
              </div>

              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                Move your pointer to aim high or low. Hold to build force, release to throw.
              </div>
            </div>

            <button
              type="button"
              disabled={throwsLeft <= 0 || !!activeFlight}
              onMouseDown={beginCharge}
              onMouseUp={endCharge}
              onMouseLeave={() => {
                if (isCharging) endCharge();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                beginCharge();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                endCharge();
              }}
              style={{
                height: 56,
                padding: "0 18px",
                borderRadius: 14,
                border: "1px solid rgba(255,214,150,0.26)",
                background:
                  throwsLeft <= 0 || !!activeFlight
                    ? "rgba(255,255,255,0.08)"
                    : "linear-gradient(180deg, rgba(122,78,38,0.96), rgba(84,52,28,0.96))",
                color: "rgba(255,247,233,0.96)",
                fontWeight: 900,
                cursor: throwsLeft <= 0 || !!activeFlight ? "not-allowed" : "pointer",
                boxShadow: throwsLeft <= 0 || !!activeFlight ? "none" : "0 16px 30px rgba(0,0,0,0.32)",
              }}
            >
              {activeFlight ? "In Flight..." : isCharging ? "Release" : "Hold To Throw"}
            </button>

            <button
              type="button"
              onClick={onExit}
              style={{
                height: 56,
                padding: "0 18px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(10,10,10,0.52)",
                color: "rgba(255,247,233,0.92)",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Back To Tavern
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
            Best Throw
          </div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>
            {bestThrow ? `${bestThrow.label} · ${bestThrow.score}` : "—"}
          </div>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
            Throws Used
          </div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>{throwsUsed}</div>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
            Round
          </div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>
            {isRoundOver ? "Complete" : "Active"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={resetRound}
          style={{
            height: 48,
            padding: "0 16px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,247,233,0.92)",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Reset Round
        </button>

        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            style={{
              height: 48,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,247,233,0.92)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Leave Lane
          </button>
        ) : null}
      </div>
    </div>
  );
}
