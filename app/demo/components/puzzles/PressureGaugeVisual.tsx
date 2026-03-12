"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PressurePlateId = "Sun" | "Moon" | "Cross" | "Crown";

type PuzzleResultLike = {
  success?: boolean;
  summary?: string;
  narration?: string[];
} | null;

type Props = {
  currentRoomTitle?: string | null;
  intendedRouteLabel?: string | null;
  puzzleResult?: PuzzleResultLike;
  playerInput: string;
  setPlayerInput: (value: string) => void;
  isSubmitting?: boolean;
};

type PuzzleStatus = "idle" | "building" | "failed" | "solved";

const TARGET_GAUGES = [4, 2, 3] as const;
const ROOM_IMAGE =
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/corridor_puzzle_room.png";

const GAUGE_STATES = [
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_1.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_2.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_3.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_full.png",
] as const;

const PLATE_IMAGES = {
  Sun: {
    idle: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_sun_idle.png",
    pressed: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_sun_pressed.png",
  },
  Moon: {
    idle: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_moon_idle.png",
    pressed: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_moon_pressed.png",
  },
  Cross: {
    idle: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_cross_idle.png",
    pressed: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_cross_pressed.png",
  },
  Crown: {
    idle: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_crown_idle.png",
    pressed: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_crown_pressed.png",
  },
} as const;

const SFX = {
  plate: "/assets/audio/Puzzles/Pressure_Plates/sfx_CLANK.mp3",
  tick: "/assets/audio/Puzzles/Pressure_Plates/sfx_gauge_needle_tick.mp3",
  reject: "/assets/audio/Puzzles/Pressure_Plates/sfx_metal_latch.mp3",
  validate: "/assets/audio/Puzzles/Pressure_Plates/sfx_multiple_lock_clicks.mp3",
  release: "/assets/audio/Puzzles/Pressure_Plates/sfx_pressure_release.mp3",
  gateOpen: "/assets/audio/Puzzles/Pressure_Plates/sfx_stone_gate_rumble_open.mp3",
} as const;

type AudioMap = Record<keyof typeof SFX, HTMLAudioElement>;

function clampGauge(value: number) {
  return Math.max(0, Math.min(4, value));
}

function formatPlate(plate: PressurePlateId) {
  return plate;
}

function gaugesMatch(values: number[]) {
  return (
    values[0] === TARGET_GAUGES[0] &&
    values[1] === TARGET_GAUGES[1] &&
    values[2] === TARGET_GAUGES[2]
  );
}

function gaugeImage(value: number) {
  return GAUGE_STATES[clampGauge(value)];
}

function plateStatusLabel(plate: PressurePlateId, lastPressedPlate: PressurePlateId | null) {
  if (lastPressedPlate === plate) return "Engaged";
  return "Idle";
}

function appendSequenceTextToInput(
  current: string,
  sequence: PressurePlateId[],
  gauges: number[]
) {
  const sequenceText = `Plate sequence: ${sequence.join(" -> ")}.`;
  const gaugeText = `Gauge pattern: ${gauges[0]} / ${gauges[1]} / ${gauges[2]}.`;
  const combined = `${sequenceText} ${gaugeText}`;

  const trimmed = current.trim();
  if (!trimmed) return combined;
  return `${trimmed}\n${combined}`;
}

export default function PressureGaugeVisual(props: Props) {
  const {
    currentRoomTitle,
    intendedRouteLabel,
    puzzleResult,
    playerInput,
    setPlayerInput,
    isSubmitting = false,
  } = props;

  const [gauges, setGauges] = useState<number[]>([0, 0, 0]);
  const [sequence, setSequence] = useState<PressurePlateId[]>([]);
  const [status, setStatus] = useState<PuzzleStatus>("idle");
  const [message, setMessage] = useState(
    "Build pressure with Sun, Moon, and Cross. Use Crown only when the mechanism is ready to judge the pattern."
  );
  const [solved, setSolved] = useState(false);
  const [lastPressedPlate, setLastPressedPlate] = useState<PressurePlateId | null>(null);
  const [pressedPlate, setPressedPlate] = useState<PressurePlateId | null>(null);

  const pressTimerRef = useRef<number | null>(null);
  const audioRef = useRef<AudioMap | null>(null);
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    const audioMap: AudioMap = {
      plate: new Audio(SFX.plate),
      tick: new Audio(SFX.tick),
      reject: new Audio(SFX.reject),
      validate: new Audio(SFX.validate),
      release: new Audio(SFX.release),
      gateOpen: new Audio(SFX.gateOpen),
    };

    audioMap.plate.volume = 0.62;
    audioMap.tick.volume = 0.44;
    audioMap.reject.volume = 0.66;
    audioMap.validate.volume = 0.78;
    audioMap.release.volume = 0.82;
    audioMap.gateOpen.volume = 0.9;

    Object.values(audioMap).forEach((audio) => {
      audio.preload = "auto";
    });

    audioRef.current = audioMap;

    return () => {
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }

      Object.values(audioMap).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });

      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (puzzleResult?.success === true) {
      setSolved(true);
      setStatus("solved");
      setMessage(
        puzzleResult.summary ??
          "The chamber answers. The pressure pattern has been accepted."
      );
    }
  }, [puzzleResult]);

  function unlockAudio() {
    if (audioUnlockedRef.current) return;

    const audioMap = audioRef.current;
    if (!audioMap) return;

    audioUnlockedRef.current = true;

    Object.values(audioMap).forEach((audio) => {
      try {
        audio.muted = true;
        audio.currentTime = 0;
        const playPromise = audio.play();

        if (playPromise && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.muted = false;
            })
            .catch(() => {
              audio.muted = false;
            });
        } else {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        }
      } catch {
        audio.muted = false;
      }
    });
  }

  function playSfx(name: keyof typeof SFX) {
    const audioMap = audioRef.current;
    if (!audioMap) return;

    const audio = audioMap[name];

    try {
      audio.pause();
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }

  function pulsePlate(plate: PressurePlateId) {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    setPressedPlate(plate);
    setLastPressedPlate(plate);

    pressTimerRef.current = window.setTimeout(() => {
      setPressedPlate(null);
      pressTimerRef.current = null;
    }, 160);
  }

  function clearSequence() {
    setGauges([0, 0, 0]);
    setSequence([]);
    setStatus("idle");
    setSolved(false);
    setLastPressedPlate(null);
    setPressedPlate(null);
    setMessage(
      "Build pressure with Sun, Moon, and Cross. Use Crown only when the mechanism is ready to judge the pattern."
    );
  }

  function appendSequenceToInput() {
    if (sequence.length === 0) return;
    setPlayerInput(appendSequenceTextToInput(playerInput, sequence, gauges));
  }

  function handleBuildPlate(plate: Exclude<PressurePlateId, "Crown">) {
    if (solved || isSubmitting) return;

    unlockAudio();
    pulsePlate(plate);
    playSfx("plate");

    const next = [...gauges];

    if (plate === "Sun") {
      next[0] = clampGauge(next[0] + 1);
      setMessage(
        next[0] === TARGET_GAUGES[0]
          ? "The left gauge settles into the chamber’s demanded range."
          : "Pressure rises through the left channel."
      );
    } else if (plate === "Moon") {
      next[1] = clampGauge(next[1] + 1);
      setMessage(
        next[1] === TARGET_GAUGES[1]
          ? "The center gauge aligns with the hidden demand."
          : "Pressure gathers in the center channel."
      );
    } else {
      next[2] = clampGauge(next[2] + 1);
      setMessage(
        next[2] === TARGET_GAUGES[2]
          ? "The right gauge steadies close to release."
          : "The right channel takes more weight."
      );
    }

    setGauges(next);
    setSequence((prev) => [...prev, plate]);
    setStatus("building");
    playSfx("tick");
  }

  function handleCrown() {
    if (isSubmitting) return;

    unlockAudio();
    pulsePlate("Crown");
    playSfx("plate");
    setSequence((prev) => [...prev, "Crown"]);
    setLastPressedPlate("Crown");

    if (gaugesMatch(gauges)) {
      setSolved(true);
      setStatus("solved");
      setMessage("The crown accepts the built pressure. Stone answers stone.");
      playSfx("validate");

      window.setTimeout(() => {
        playSfx("release");
      }, 240);

      window.setTimeout(() => {
        playSfx("gateOpen");
      }, 760);

      return;
    }

    const vented = [
      clampGauge(gauges[0] - 1),
      clampGauge(gauges[1] - 1),
      clampGauge(gauges[2] - 1),
    ];

    setGauges(vented);
    setStatus("failed");
    setMessage(
      "The crown rejects the pattern. Pressure bleeds away and the passage remains sealed."
    );
    playSfx("reject");
  }

  const sequenceLabel = useMemo(() => {
    if (sequence.length === 0) return "Select plates in the chamber floor.";
    return sequence.map(formatPlate).join(" -> ");
  }, [sequence]);

  const trialStateLabel =
    status === "solved"
      ? "Mechanism Released"
      : status === "failed"
        ? "Sequence Rejected"
        : status === "building"
          ? "Pressure Building"
          : "Passage Blocked";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(214,188,120,0.16)",
          background: "rgba(0,0,0,0.24)",
          boxShadow: "0 20px 48px rgba(0,0,0,0.28)",
        }}
      >
        <img
          src={ROOM_IMAGE}
          alt="Pressure gauge chamber"
          style={{
            width: "100%",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 18,
            top: 18,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8,10,16,0.66)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "grid",
            gap: 3,
            zIndex: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              opacity: 0.58,
              color: "rgba(240,242,246,0.84)",
            }}
          >
            Current Chamber
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "rgba(245,236,216,0.96)",
            }}
          >
            {currentRoomTitle ?? "Corridor"}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 18,
            top: 18,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8,10,16,0.66)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "grid",
            gap: 3,
            minWidth: 160,
            zIndex: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              opacity: 0.58,
              color: "rgba(240,242,246,0.84)",
            }}
          >
            Intended Route
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "rgba(245,236,216,0.96)",
            }}
          >
            {intendedRouteLabel ?? "Passage forward"}
          </div>
        </div>

        <img
          src={gaugeImage(gauges[0])}
          alt="Left pressure gauge"
          style={{
            position: "absolute",
            left: 610,
            top: 430,
            width: 150,
            height: 150,
            transform: "translate(-50%, -50%)",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        <img
          src={gaugeImage(gauges[1])}
          alt="Center pressure gauge"
          style={{
            position: "absolute",
            left: 825,
            top: 430,
            width: 150,
            height: 150,
            transform: "translate(-50%, -50%)",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        <img
          src={gaugeImage(gauges[2])}
          alt="Right pressure gauge"
          style={{
            position: "absolute",
            left: 1040,
            top: 430,
            width: 150,
            height: 150,
            transform: "translate(-50%, -50%)",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        {(
          [
            { plate: "Sun", left: 720, top: 590 },
            { plate: "Moon", left: 860, top: 590 },
            { plate: "Cross", left: 1000, top: 590 },
            { plate: "Crown", left: 1140, top: 590 },
          ] as const
        ).map((item) => {
          const plate = item.plate;
          const pressed = pressedPlate === plate;
          const images = PLATE_IMAGES[plate];

          const handleClick = () => {
            if (plate === "Sun" || plate === "Moon" || plate === "Cross") {
              handleBuildPlate(plate);
            } else {
              handleCrown();
            }
          };

          return (
            <button
              key={plate}
              type="button"
              onClick={handleClick}
              disabled={isSubmitting}
              aria-label={`${plate} plate`}
              style={{
                position: "absolute",
                left: item.left,
                top: item.top,
                width: 132,
                height: 132,
                transform: "translate(-50%, -50%)",
                padding: 0,
                margin: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                display: "grid",
                placeItems: "center",
                zIndex: 7,
              }}
            >
              <img
                src={pressed ? images.pressed : images.idle}
                alt={`${plate} plate`}
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  userSelect: "none",
                  pointerEvents: "none",
                  filter: pressed
                    ? "drop-shadow(0 0 10px rgba(255,230,170,0.22))"
                    : "drop-shadow(0 8px 18px rgba(0,0,0,0.30))",
                  transform: pressed
                    ? "translateY(5px) scale(0.985)"
                    : "translateY(0) scale(1)",
                  transition:
                    "transform 90ms ease, filter 90ms ease, opacity 90ms ease",
                }}
              />
            </button>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: 18,
            maxWidth: 420,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8,10,16,0.66)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "grid",
            gap: 6,
            zIndex: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              opacity: 0.58,
              color: "rgba(240,242,246,0.84)",
            }}
          >
            Pressure Network
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: "rgba(245,236,216,0.94)",
            }}
          >
            {sequenceLabel}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={appendSequenceToInput}
              disabled={sequence.length === 0 || isSubmitting}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(214,188,120,0.22)",
                background:
                  "linear-gradient(180deg, rgba(214,188,120,0.14), rgba(214,188,120,0.05))",
                color: "rgba(245,236,216,0.96)",
                fontSize: 11,
                fontWeight: 800,
                cursor:
                  sequence.length === 0 || isSubmitting ? "not-allowed" : "pointer",
                opacity: sequence.length === 0 || isSubmitting ? 0.5 : 1,
              }}
            >
              Use Sequence
            </button>

            <button
              type="button"
              onClick={clearSequence}
              disabled={isSubmitting}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(240,242,246,0.88)",
                fontSize: 11,
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Clear Sequence
            </button>
          </div>
        </div>

        {solved ? (
          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "14px 30px",
              background: "rgba(18,28,18,0.84)",
              border: "1px solid rgba(118,188,132,0.26)",
              boxShadow: "0 14px 36px rgba(0,0,0,0.30)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 0.3,
              zIndex: 9,
            }}
          >
            Mechanism Released
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          padding: "14px 16px",
          borderRadius: 18,
          border: "1px solid rgba(214,188,120,0.16)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.018))",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {(["Sun", "Moon", "Cross", "Crown"] as const).map((plate) => (
            <div
              key={plate}
              style={{
                padding: "12px 13px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                display: "grid",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.75,
                  textTransform: "uppercase",
                  opacity: 0.58,
                }}
              >
                {plate} Plate
              </div>
              <div style={{ fontWeight: 700, lineHeight: 1.5 }}>
                {plateStatusLabel(plate, lastPressedPlate)}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "12px 13px",
            borderRadius: 14,
            border:
              status === "solved"
                ? "1px solid rgba(118,188,132,0.24)"
                : status === "failed"
                  ? "1px solid rgba(188,118,118,0.22)"
                  : "1px solid rgba(255,255,255,0.08)",
            background:
              status === "solved"
                ? "linear-gradient(180deg, rgba(118,188,132,0.10), rgba(118,188,132,0.04))"
                : status === "failed"
                  ? "linear-gradient(180deg, rgba(188,118,118,0.10), rgba(188,118,118,0.04))"
                  : "rgba(255,255,255,0.03)",
            display: "grid",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.75,
              textTransform: "uppercase",
              opacity: 0.58,
            }}
          >
            Trial State
          </div>
          <div style={{ fontWeight: 700, lineHeight: 1.5 }}>{trialStateLabel}</div>
        </div>

        <div
          style={{
            padding: "12px 13px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            display: "grid",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.75,
              textTransform: "uppercase",
              opacity: 0.58,
            }}
          >
            Mechanism Response
          </div>
          <div style={{ lineHeight: 1.6 }}>{message}</div>
        </div>
      </div>
    </div>
  );
}
