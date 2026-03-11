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
  forcedMiss?: "low" | "high" | null;
};

type AxeVisualState = {
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
  flying: boolean;
  embedded: boolean;
};

type BarmaidTopic = "dungeon" | "people" | "you" | null;

const LANE_BG_SRC = "/assets/V3/Dungeon/Tavern/Axe_Throwing/target_01.png";
const AXE_SRC = "/assets/V3/Dungeon/Tavern/Axe_Throwing/axe_01.png";

const BARMAID_SRC_SOFT = "/assets/V3/Dungeon/Tavern/bar_maid_01.png";
const BARMAID_SRC_WARM = "/assets/V3/Dungeon/Tavern/bar_maid_02.png";

const HIT_SFX = "/assets/audio/sfx_axe_hit_01.mp3";
const MISS_SFX = "/assets/audio/sfx_axe_miss_01.mp3";

const SCENE_W = 992;
const SCENE_H = 1536;

const TARGET_CENTER_X = 496;
const TARGET_CENTER_Y = 476;

const START_X = 128;
const START_Y = 1165;

const AXE_W = 240;
const AXE_H = 430;

// tighter blade-tip approximation
const AXE_TIP_X = AXE_W * 0.735;
const AXE_TIP_Y = AXE_H * 0.155;

// aim slider range
const AIM_MIN = -150;
const AIM_MAX = 150;

// power gating
const MIN_STICK_POWER = 0.28;
const MAX_STICK_POWER = 0.84;

// floor miss landing spots
const FLOOR_MISS_LOW_Y = 1210;
const FLOOR_MISS_HIGH_Y = 980;
const FLOOR_MISS_X = 420;

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
  if (distance <= 18) {
    return { score: 100, label: "Bullseye", distance };
  }
  if (distance <= 48) {
    return { score: 60, label: "Inner Ring", distance };
  }
  if (distance <= 86) {
    return { score: 30, label: "Outer Ring", distance };
  }
  if (distance <= 118) {
    return { score: 10, label: "Graze", distance };
  }
  return { score: 0, label: "Miss", distance };
}

function finalStickRotation(outcome: ThrowOutcome): number {
  switch (outcome.label) {
    case "Bullseye":
      return -14 + Math.random() * 6;
    case "Inner Ring":
      return -18 + Math.random() * 8;
    case "Outer Ring":
      return -22 + Math.random() * 10;
    case "Graze":
      return -28 + Math.random() * 12;
    default:
      return 78 + Math.random() * 18;
  }
}

function getBarmaidGreeting(score: number): string {
  if (score >= 100) {
    return "Well now… that throw will be talked about all night.";
  }
  if (score >= 60) {
    return "You've got a steady hand. Most travelers can't even strike the board clean.";
  }
  return "Not bad. The regulars noticed that one.";
}

function getBarmaidReply(score: number, topic: BarmaidTopic): string {
  if (!topic) return "";

  if (topic === "dungeon") {
    if (score >= 100) {
      return "The stone below does not fear bold hands. It punishes careless ones. If a path feels too quiet, trust the quiet less than the noise.";
    }
    if (score >= 60) {
      return "The first rooms teach before they kill. Read the place before you try to conquer it.";
    }
    return "Down below, the place watches longer than most realize. Listen first. Move second.";
  }

  if (topic === "people") {
    if (score >= 100) {
      return "The ones who come back are rarely the loudest. They're the ones who learn what the dark is trying to say.";
    }
    if (score >= 60) {
      return "Every hero thinks they descend alone. Most carry ghosts, debts, or promises with them.";
    }
    return "A lot of people go below wanting glory. Fewer come back wanting it.";
  }

  if (topic === "you") {
    if (score >= 100) {
      return "You throw like someone who's already survived worse than wood and iron.";
    }
    if (score >= 60) {
      return "Calm breath. Strong wrist. That kind of focus carries a person farther than bravado ever will.";
    }
    return "You've got enough control to be worth watching. That's more than most.";
  }

  return "";
}

export default function TavernAxeThrow({
  initialThrows = 3,
  onExit,
  onRoundComplete,
}: Props) {
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

  const [roundMessage, setRoundMessage] = useState(
    "Set your aim with the slider. Hold the throw button to build power."
  );
  const [impactFlash, setImpactFlash] = useState(false);
  const [boardShake, setBoardShake] = useState(false);

  const [showBarmaid, setShowBarmaid] = useState(false);
  const [barmaidTopic, setBarmaidTopic] = useState<BarmaidTopic>(null);

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
  const barmaidUnlocked = totalScore > 30;
  const barmaidPortrait = totalScore >= 60 ? BARMAID_SRC_WARM : BARMAID_SRC_SOFT;
  const aimPercent = Math.round(((aimOffsetY - AIM_MIN) / (AIM_MAX - AIM_MIN)) * 100);
  const aimMarkerY = clamp(
    TARGET_CENTER_Y + aimOffsetY,
    TARGET_CENTER_Y - 180,
    TARGET_CENTER_Y + 180
  );

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

    const flight = activeFlight;

    function step(now: number) {
      setAxe(() => {
        const rawT = clamp((now - flight.startedAt) / flight.durationMs, 0, 1);
        const t = easeOutCubic(rawT);

        const x = lerp(flight.startX, flight.endX, t);
        const yBase = lerp(flight.startY, flight.endY, t);
        const arcLift = flight.arcHeight * 4 * t * (1 - t);
        const y = yBase - arcLift;
        const rotation = lerp(-16, flight.spinDeg, t);

        return {
          x,
          y,
          rotation,
          visible: true,
          flying: rawT < 1,
          embedded: false,
        };
      });

      const done = now >= flight.startedAt + flight.durationMs;
      if (!done) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      resolveImpact(flight);
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

  function beginCharge() {
    if (activeFlight || throwsLeft <= 0) return;
    if (isCharging) return;

    setIsCharging(true);
    const startedAt = performance.now();

    function tick(now: number) {
      const elapsed = now - startedAt;
      const wave = (Math.sin(elapsed / 520) + 1) / 2;
      const power = 0.12 + wave * 0.88;
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
    const tooSoft = power < MIN_STICK_POWER;
    const tooHard = power > MAX_STICK_POWER;

    const accuracyPenalty = (1 - power) * 42;
    const randomDriftX = (Math.random() * 2 - 1) * accuracyPenalty;
    const randomDriftY = (Math.random() * 2 - 1) * (accuracyPenalty + 14);

    const aimedY = TARGET_CENTER_Y + aimOffsetY * 0.55;

    let endX = TARGET_CENTER_X - AXE_W * 0.39 + randomDriftX;
    let endY = aimedY - AXE_H * 0.19 + randomDriftY;
    let forcedMiss: "low" | "high" | null = null;

    if (tooSoft) {
      forcedMiss = "low";
      endX = FLOOR_MISS_X + (Math.random() * 80 - 40);
      endY = FLOOR_MISS_LOW_Y + (Math.random() * 36 - 18);
    } else if (tooHard) {
      forcedMiss = "high";
      endX = FLOOR_MISS_X + 90 + (Math.random() * 70 - 35);
      endY = FLOOR_MISS_HIGH_Y + (Math.random() * 30 - 15);
    }

    const durationMs = Math.round(620 + (1 - power) * 260);
    const arcHeight = tooSoft ? 90 : tooHard ? 290 : 220 + power * 180;
    const spinDeg = 520 + power * 720;

    setThrowsLeft((v) => Math.max(0, v - 1));

    if (tooSoft) {
      setRoundMessage("Too soft. The axe dies early and drops short.");
    } else if (tooHard) {
      setRoundMessage("Too hard. The throw overdrives and fails to bite cleanly.");
    } else {
      setRoundMessage("The axe cuts through the smoky tavern air...");
    }

    setActiveFlight({
      startedAt: performance.now(),
      durationMs,
      startX: START_X,
      startY: START_Y,
      endX,
      endY,
      arcHeight,
      spinDeg,
      finalStickDeg: -18,
      forcedMiss,
    });
  }

  function resolveImpact(flight: ActiveFlight) {
    setActiveFlight(null);

    if (flight.forcedMiss) {
      const missRotation = flight.forcedMiss === "high" ? 126 : 102;

      setAxe({
        x: flight.endX,
        y: flight.endY,
        rotation: missRotation,
        visible: true,
        flying: false,
        embedded: false,
      });

      if (missAudioRef.current) {
        missAudioRef.current.currentTime = 0;
        missAudioRef.current.play().catch(() => {});
      }

      const outcome: ThrowOutcome = {
        score: 0,
        label: "Miss",
        distance: 999,
      };

      setBestThrow((prev) => {
        if (!prev) return outcome;
        return prev.score >= outcome.score ? prev : outcome;
      });

      if (flight.forcedMiss === "low") {
        setRoundMessage("Too soft. The axe drops to the floor before it can stick.");
      } else {
        setRoundMessage("Too hard. The throw glances and crashes to the floor.");
      }

      return;
    }

    const axeTipX = flight.endX + AXE_TIP_X;
    const axeTipY = flight.endY + AXE_TIP_Y;

    const dx = axeTipX - TARGET_CENTER_X;
    const dy = axeTipY - TARGET_CENTER_Y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const outcome = evaluateThrow(distance);

    const hit = outcome.score > 0;
    const stickDeg = finalStickRotation(outcome);

    if (!hit) {
      const floorX = flight.endX + 36;
      const floorY = FLOOR_MISS_LOW_Y + 8;

      setAxe({
        x: floorX,
        y: floorY,
        rotation: 108,
        visible: true,
        flying: false,
        embedded: false,
      });

      if (missAudioRef.current) {
        missAudioRef.current.currentTime = 0;
        missAudioRef.current.play().catch(() => {});
      }

      setBestThrow((prev) => {
        if (!prev) return outcome;
        return prev.score >= outcome.score ? prev : outcome;
      });

      setRoundMessage("Miss. The blade skids off and drops to the floor.");
      return;
    }

    const embeddedX = flight.endX - 22;
    const embeddedY = flight.endY - 10;

    setAxe({
      x: embeddedX,
      y: embeddedY,
      rotation: stickDeg,
      visible: true,
      flying: false,
      embedded: true,
    });

    setImpactFlash(true);
    setBoardShake(true);
    window.setTimeout(() => setImpactFlash(false), 130);
    window.setTimeout(() => setBoardShake(false), 220);

    if (hitAudioRef.current) {
      hitAudioRef.current.currentTime = 0;
      hitAudioRef.current.play().catch(() => {});
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
    } else {
      setRoundMessage("A scrape. The blade bites, but not cleanly.");
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
    setShowBarmaid(false);
    setBarmaidTopic(null);
    setAxe({
      x: START_X,
      y: START_Y,
      rotation: -18,
      visible: true,
      flying: false,
      embedded: false,
    });
    setRoundMessage("Set your aim with the slider. Hold the throw button to build power.");
  }

  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gap: 18,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>Tavern Axe Lane</div>
        <div style={{ fontSize: 14, opacity: 0.78, lineHeight: 1.55 }}>
          Warm up before the descent. Three throws. A steady hand earns more than applause.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 560px) 180px",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 560,
            aspectRatio: `${SCENE_W} / ${SCENE_H}`,
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            background: "#120b07",
            userSelect: "none",
          }}
        >
          <img
            src={LANE_BG_SRC}
            alt="Tavern axe lane"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: boardShake ? "translateX(1px)" : "translateX(0px)",
              transition: "transform 120ms ease-out",
              filter: impactFlash ? "brightness(1.08)" : "brightness(1)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: `${((TARGET_CENTER_X - 160) / SCENE_W) * 100}%`,
              top: `${(aimMarkerY / SCENE_H) * 100}%`,
              width: `${(320 / SCENE_W) * 100}%`,
              height: 2,
              background: "rgba(255, 244, 214, 0.24)",
              boxShadow: "0 0 12px rgba(255, 220, 140, 0.22)",
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
                transition: axe.flying
                  ? "none"
                  : "transform 140ms ease-out, left 140ms ease-out, top 140ms ease-out",
              }}
            />
          ) : null}

          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: impactFlash
                ? "radial-gradient(circle at 50% 31%, rgba(255,210,140,0.16), rgba(255,255,255,0) 24%)"
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
                        chargePower < MIN_STICK_POWER || chargePower > MAX_STICK_POWER
                          ? "linear-gradient(90deg, rgba(160,70,70,0.92), rgba(220,110,90,0.92))"
                          : chargePower >= 0.74
                            ? "linear-gradient(90deg, rgba(196,176,122,0.92), rgba(255,189,92,0.92))"
                            : "linear-gradient(90deg, rgba(128,148,182,0.92), rgba(196,176,122,0.92))",
                      transition: isCharging ? "none" : "width 140ms ease-out",
                    }}
                  />
                </div>

                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  Red zones will miss completely.
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
            gap: 12,
            alignContent: "start",
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
              Aim Height
            </div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>{aimPercent}%</div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "grid",
              gap: 12,
              justifyItems: "center",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.68, textTransform: "uppercase", letterSpacing: 0.7 }}>
              Aim Control
            </div>

            <input
              type="range"
              min={AIM_MIN}
              max={AIM_MAX}
              step={1}
              value={aimOffsetY}
              onChange={(e) => setAimOffsetY(Number(e.target.value))}
              style={
                {
                  writingMode: "vertical-lr",
                  WebkitAppearance: "slider-vertical",
                  width: 28,
                  height: 240,
                  cursor: "pointer",
                } as React.CSSProperties
              }
            />

            <div style={{ fontSize: 12, opacity: 0.72, textAlign: "center", lineHeight: 1.5 }}>
              Slide up or down to set the throw line before charging.
            </div>
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

        {barmaidUnlocked && (
          <button
            type="button"
            onClick={() => {
              setShowBarmaid((prev) => !prev);
              if (showBarmaid) {
                setBarmaidTopic(null);
              }
            }}
            style={{
              height: 48,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,212,160,0.18)",
              background: "linear-gradient(180deg, rgba(98,66,34,0.95), rgba(72,46,24,0.95))",
              color: "rgba(255,247,233,0.96)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {showBarmaid ? "Close Barmaid" : "Speak to the Barmaid"}
          </button>
        )}
      </div>

      {barmaidUnlocked && showBarmaid && (
        <div
          style={{
            display: "grid",
            gap: 14,
            padding: 18,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              "linear-gradient(180deg, rgba(28,18,12,0.92), rgba(14,10,8,0.94))",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px minmax(0, 1fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            <img
              src={barmaidPortrait}
              alt="Barmaid"
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                objectFit: "cover",
                boxShadow: "0 12px 30px rgba(0,0,0,0.32)",
              }}
            />

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    opacity: 0.65,
                  }}
                >
                  Tavern Conversation
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>
                  The Barmaid
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 15,
                    lineHeight: 1.6,
                    opacity: 0.88,
                  }}
                >
                  {getBarmaidGreeting(totalScore)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setBarmaidTopic("dungeon")}
                  style={{
                    height: 42,
                    padding: "0 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                      barmaidTopic === "dungeon"
                        ? "linear-gradient(180deg, rgba(104,72,38,0.95), rgba(74,46,24,0.95))"
                        : "rgba(255,255,255,0.05)",
                    color: "rgba(255,247,233,0.96)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Ask about the dungeon
                </button>

                <button
                  type="button"
                  onClick={() => setBarmaidTopic("people")}
                  style={{
                    height: 42,
                    padding: "0 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                      barmaidTopic === "people"
                        ? "linear-gradient(180deg, rgba(104,72,38,0.95), rgba(74,46,24,0.95))"
                        : "rgba(255,255,255,0.05)",
                    color: "rgba(255,247,233,0.96)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Ask about the people below
                </button>

                <button
                  type="button"
                  onClick={() => setBarmaidTopic("you")}
                  style={{
                    height: 42,
                    padding: "0 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                      barmaidTopic === "you"
                        ? "linear-gradient(180deg, rgba(104,72,38,0.95), rgba(74,46,24,0.95))"
                        : "rgba(255,255,255,0.05)",
                    color: "rgba(255,247,233,0.96)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Ask what she noticed
                </button>
              </div>

              <div
                style={{
                  minHeight: 96,
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  opacity: 0.9,
                }}
              >
                {barmaidTopic ? (
                  getBarmaidReply(totalScore, barmaidTopic)
                ) : (
                  "She waits with the kind of calm that suggests she has heard many brave promises and watched many of them tested."
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
