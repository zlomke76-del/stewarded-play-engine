"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PressurePlateId = "Sun" | "Moon" | "Cross" | "Crown";

type PuzzleResultLike = {
  success?: boolean;
  summary?: string;
  narration?: string[];
} | null;

type PressurePuzzleVictoryState = {
  isOpen: boolean;
  xpGranted: number;
  destinationLabel: string;
  selectedText: string;
  selectedConnectionId: string | null;
  floorId: string;
  roomId: string;
  isFirstPuzzleCompletion: boolean;
} | null;

type Props = {
  currentRoomTitle?: string | null;
  intendedRouteLabel?: string | null;
  puzzleResult?: PuzzleResultLike;
  playerInput: string;
  setPlayerInput: (value: string) => void;
  isSubmitting?: boolean;
  riddleLines?: string[];
  onSolved?: () => void | Promise<void>;
  victoryState?: PressurePuzzleVictoryState;
  onConfirmTraversal?: () => void | Promise<void>;
  isConfirmingTraversal?: boolean;
};

type PuzzleStatus = "idle" | "building" | "failed" | "solved";

const TARGET_GAUGES = [4, 2, 3] as const;
const EXPECTED_BUILD: Exclude<PressurePlateId, "Crown">[] = [
  "Sun",
  "Sun",
  "Sun",
  "Sun",
  "Moon",
  "Moon",
  "Cross",
  "Cross",
  "Cross",
] as const;

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

function bleedNetwork(values: number[]) {
  return [
    clampGauge(values[0] - 1),
    clampGauge(values[1] - 1),
    clampGauge(values[2] - 1),
  ];
}

function incrementGauge(values: number[], plate: Exclude<PressurePlateId, "Crown">) {
  if (plate === "Sun") {
    return [clampGauge(values[0] + 1), values[1], values[2]];
  }

  if (plate === "Moon") {
    return [values[0], clampGauge(values[1] + 1), values[2]];
  }

  return [values[0], values[1], clampGauge(values[2] + 1)];
}

function buildIndexFromSequence(sequence: PressurePlateId[]) {
  return sequence.filter((plate) => plate !== "Crown").length;
}

function plateStatusLabel(args: {
  plate: PressurePlateId;
  gauges: number[];
  solved: boolean;
  status: PuzzleStatus;
}) {
  const { plate, gauges, solved, status } = args;

  if (plate === "Sun") {
    if (gauges[0] >= TARGET_GAUGES[0]) return "Aligned";
    if (gauges[0] > 0) return "Charging";
    return status === "failed" ? "Drained" : "Idle";
  }

  if (plate === "Moon") {
    if (gauges[1] >= TARGET_GAUGES[1]) return "Aligned";
    if (gauges[1] > 0) return "Charging";
    return status === "failed" ? "Drained" : "Idle";
  }

  if (plate === "Cross") {
    if (gauges[2] >= TARGET_GAUGES[2]) return "Aligned";
    if (gauges[2] > 0) return "Charging";
    return status === "failed" ? "Drained" : "Idle";
  }

  if (solved) return "Released";
  if (gaugesMatch(gauges)) return "Ready";
  return status === "failed" ? "Rejecting" : "Idle";
}

export default function PressureGaugeVisual(props: Props) {
  const {
    currentRoomTitle,
    intendedRouteLabel,
    puzzleResult,
    playerInput,
    setPlayerInput,
    isSubmitting = false,
    riddleLines = [],
    onSolved,
    victoryState,
    onConfirmTraversal,
    isConfirmingTraversal = false,
  } = props;

  const [gauges, setGauges] = useState<number[]>([0, 0, 0]);
  const [sequence, setSequence] = useState<PressurePlateId[]>([]);
  const [status, setStatus] = useState<PuzzleStatus>("idle");
  const [message, setMessage] = useState(
    "Build the chamber in order: four Sun charges, two Moon charges, three Cross charges, then Crown to judge."
  );
  const [solved, setSolved] = useState(false);
  const [pressedPlate, setPressedPlate] = useState<PressurePlateId | null>(null);

  const pressTimerRef = useRef<number | null>(null);
  const audioRef = useRef<AudioMap | null>(null);
  const audioUnlockedRef = useRef(false);
  const solvedCallbackFiredRef = useRef(false);

  const victoryOpen = Boolean(victoryState?.isOpen);

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

  async function fireSolvedCallback() {
    if (solvedCallbackFiredRef.current) return;
    solvedCallbackFiredRef.current = true;

    try {
      await onSolved?.();
    } catch {
      solvedCallbackFiredRef.current = false;
    }
  }

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

    pressTimerRef.current = window.setTimeout(() => {
      setPressedPlate(null);
      pressTimerRef.current = null;
    }, 180);
  }

  function clearSequence() {
    if (victoryOpen || isConfirmingTraversal) return;

    setGauges([0, 0, 0]);
    setSequence([]);
    setStatus("idle");
    setSolved(false);
    setPressedPlate(null);
    setMessage(
      "Build the chamber in order: four Sun charges, two Moon charges, three Cross charges, then Crown to judge."
    );
    solvedCallbackFiredRef.current = false;
  }

  function appendSequenceToInput() {
    if (sequence.length === 0 || victoryOpen) return;
    setPlayerInput(appendSequenceTextToInput(playerInput, sequence, gauges));
  }

  function failBuildAttempt(plate: Exclude<PressurePlateId, "Crown">) {
    const next = bleedNetwork(gauges);

    setSequence((prev) => [...prev, plate]);
    setGauges(next);
    setStatus("failed");
    setMessage(
      `${plate} engages out of order. The mechanism rejects the step and bleeds pressure from the network.`
    );

    playSfx("reject");
  }

  function handleBuildPlate(plate: Exclude<PressurePlateId, "Crown">) {
    if (solved || isSubmitting || victoryOpen || isConfirmingTraversal) return;

    unlockAudio();
    pulsePlate(plate);
    playSfx("plate");

    const buildIndex = buildIndexFromSequence(sequence);
    const expectedPlate = EXPECTED_BUILD[buildIndex];

    if (!expectedPlate || plate !== expectedPlate) {
      failBuildAttempt(plate);
      return;
    }

    const next = incrementGauge(gauges, plate);

    setGauges(next);
    setSequence((prev) => [...prev, plate]);
    setStatus("building");

    if (plate === "Sun") {
      setMessage(
        next[0] === TARGET_GAUGES[0]
          ? "The Sun lane locks in. The left channel now holds its full charge."
          : "The Sun lane gathers force."
      );
    } else if (plate === "Moon") {
      setMessage(
        next[1] === TARGET_GAUGES[1]
          ? "The Moon lane aligns. The center channel now holds."
          : "The Moon lane takes the hidden weight."
      );
    } else {
      setMessage(
        next[2] === TARGET_GAUGES[2]
          ? "The Cross lane completes. The chamber is ready for judgment."
          : "The Cross lane draws in the remaining charge."
      );
    }

    playSfx("tick");
  }

  function handleCrown() {
    if (isSubmitting || solved || victoryOpen || isConfirmingTraversal) return;

    unlockAudio();
    pulsePlate("Crown");
    playSfx("plate");
    setSequence((prev) => [...prev, "Crown"]);

    const buildSequence = sequence.filter(
      (plate): plate is Exclude<PressurePlateId, "Crown"> => plate !== "Crown"
    );

    const buildMatches =
      buildSequence.length === EXPECTED_BUILD.length &&
      buildSequence.every((plate, index) => plate === EXPECTED_BUILD[index]);

    if (buildMatches && gaugesMatch(gauges)) {
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

      void fireSolvedCallback();
      return;
    }

    const vented = bleedNetwork(gauges);

    setGauges(vented);
    setStatus("failed");
    setMessage(
      "The crown rejects the pattern. Pressure bleeds away and the passage remains sealed."
    );
    playSfx("reject");
  }

  const sequenceLabel = useMemo(() => {
    if (sequence.length === 0) return "Select plates in the chamber floor.";
    return sequence.join(" -> ");
  }, [sequence]);

  const trialStateLabel =
    status === "solved"
      ? "Mechanism Released"
      : status === "failed"
        ? "Sequence Rejected"
        : status === "building"
          ? "Pressure Building"
          : "Passage Blocked";

  const sunAligned = gauges[0] >= TARGET_GAUGES[0];
  const moonAligned = gauges[1] >= TARGET_GAUGES[1];
  const crossAligned = gauges[2] >= TARGET_GAUGES[2];

  const sunStarted = gauges[0] > 0;
  const moonStarted = gauges[1] > 0;
  const crossStarted = gauges[2] > 0;

  const plateGlowState: Record<PressurePlateId, "idle" | "active" | "aligned"> = {
    Sun: sunAligned ? "aligned" : sunStarted ? "active" : "idle",
    Moon: moonAligned ? "aligned" : moonStarted ? "active" : "idle",
    Cross: crossAligned ? "aligned" : crossStarted ? "active" : "idle",
    Crown: solved ? "aligned" : gaugesMatch(gauges) ? "active" : "idle",
  };

  const confirmLabel = victoryState?.destinationLabel
    ? `Enter ${victoryState.destinationLabel}`
    : `Enter ${intendedRouteLabel ?? "Passage forward"}`;

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
          aspectRatio: "16 / 9",
        }}
      >
        <img
          src={ROOM_IMAGE}
          alt="Pressure gauge chamber"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: victoryOpen
              ? "radial-gradient(circle at center, rgba(186,220,146,0.12), rgba(0,0,0,0.18) 56%, rgba(0,0,0,0.34) 100%)"
              : "transparent",
            pointerEvents: "none",
            transition: "background 240ms ease",
            zIndex: 2,
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
            border: victoryOpen
              ? "1px solid rgba(118,188,132,0.26)"
              : "1px solid rgba(255,255,255,0.10)",
            background: victoryOpen
              ? "rgba(28,48,28,0.74)"
              : "rgba(8,10,16,0.66)",
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
              color: victoryOpen
                ? "rgba(214,245,220,0.98)"
                : "rgba(245,236,216,0.96)",
            }}
          >
            {victoryState?.destinationLabel ?? intendedRouteLabel ?? "Passage forward"}
          </div>
        </div>

        <img
          src={gaugeImage(gauges[0])}
          alt="Left pressure gauge"
          style={{
            position: "absolute",
            left: "39.5%",
            top: "56.2%",
            width: 88,
            height: 88,
            transform: "translate(-50%, -50%)",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 4,
            filter: sunAligned
              ? "drop-shadow(0 0 14px rgba(255,212,120,0.42))"
              : sunStarted
                ? "drop-shadow(0 0 8px rgba(255,212,120,0.22))"
                : "none",
          }}
        />

        <img
          src={gaugeImage(gauges[1])}
          alt="Center pressure gauge"
          style={{
            position: "absolute",
            left: "50%",
            top: "56.2%",
            width: 88,
            height: 88,
            transform: "translate(-50%, -50%)",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 4,
            filter: moonAligned
              ? "drop-shadow(0 0 14px rgba(255,212,120,0.42))"
              : moonStarted
                ? "drop-shadow(0 0 8px rgba(255,212,120,0.22))"
                : "none",
          }}
        />

        <img
          src={gaugeImage(gauges[2])}
          alt="Right pressure gauge"
          style={{
            position: "absolute",
            left: "60.5%",
            top: "56.2%",
            width: 88,
            height: 88,
            transform: "translate(-50%, -50%)",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 4,
            filter: crossAligned
              ? "drop-shadow(0 0 14px rgba(255,212,120,0.42))"
              : crossStarted
                ? "drop-shadow(0 0 8px rgba(255,212,120,0.22))"
                : "none",
          }}
        />

        {(
          [
            { plate: "Sun", left: "40.5%", top: "81.2%" },
            { plate: "Moon", left: "50.5%", top: "81.2%" },
            { plate: "Cross", left: "60.5%", top: "81.2%" },
            { plate: "Crown", left: "68.8%", top: "81.2%" },
          ] as const
        ).map((item) => {
          const plate = item.plate;
          const transientPressed = pressedPlate === plate;
          const glowState = plateGlowState[plate];
          const persistentActive = glowState === "active" || glowState === "aligned";
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
              disabled={isSubmitting || victoryOpen || isConfirmingTraversal}
              aria-label={`${plate} plate`}
              style={{
                position: "absolute",
                left: item.left,
                top: item.top,
                width: 76,
                height: 76,
                transform: "translate(-50%, -50%) rotate(45deg)",
                padding: 0,
                margin: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                cursor:
                  isSubmitting || victoryOpen || isConfirmingTraversal
                    ? "not-allowed"
                    : "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                display: "grid",
                placeItems: "center",
                zIndex: 7,
                opacity: victoryOpen ? 0.96 : 1,
              }}
            >
              <img
                src={transientPressed || persistentActive ? images.pressed : images.idle}
                alt={`${plate} plate`}
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  userSelect: "none",
                  pointerEvents: "none",
                  filter:
                    glowState === "aligned"
                      ? "drop-shadow(0 0 16px rgba(255,226,148,0.42))"
                      : glowState === "active"
                        ? "drop-shadow(0 0 10px rgba(255,230,170,0.24))"
                        : "drop-shadow(0 8px 18px rgba(0,0,0,0.30))",
                  transform:
                    transientPressed || persistentActive
                      ? "translateY(4px) scale(0.985) rotate(-45deg)"
                      : "translateY(0) scale(1) rotate(-45deg)",
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
            maxWidth: 280,
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
              disabled={sequence.length === 0 || isSubmitting || victoryOpen || isConfirmingTraversal}
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
                  sequence.length === 0 || isSubmitting || victoryOpen || isConfirmingTraversal
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  sequence.length === 0 || isSubmitting || victoryOpen || isConfirmingTraversal
                    ? 0.5
                    : 1,
              }}
            >
              Use Sequence
            </button>

            <button
              type="button"
              onClick={clearSequence}
              disabled={isSubmitting || victoryOpen || isConfirmingTraversal}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(240,242,246,0.88)",
                fontSize: 11,
                fontWeight: 700,
                cursor:
                  isSubmitting || victoryOpen || isConfirmingTraversal
                    ? "not-allowed"
                    : "pointer",
                opacity: isSubmitting || victoryOpen || isConfirmingTraversal ? 0.5 : 1,
              }}
            >
              Clear Sequence
            </button>
          </div>
        </div>

        {victoryOpen ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 24,
              transform: "translateX(-50%)",
              width: "min(720px, calc(100% - 48px))",
              padding: "18px 20px",
              borderRadius: 18,
              border: "1px solid rgba(118,188,132,0.26)",
              background:
                "linear-gradient(180deg, rgba(18,28,18,0.94), rgba(12,18,12,0.90))",
              boxShadow: "0 18px 42px rgba(0,0,0,0.34)",
              display: "grid",
              gap: 12,
              zIndex: 10,
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.85,
                  textTransform: "uppercase",
                  color: "rgba(214,245,220,0.78)",
                }}
              >
                Mechanism Released
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  lineHeight: 1.06,
                  color: "rgba(236,250,240,0.98)",
                }}
              >
                The way to the {victoryState?.destinationLabel ?? "next chamber"} opens.
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                justifySelf: "start",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(214,188,120,0.20)",
                background: "rgba(214,188,120,0.10)",
                color: "rgba(245,236,216,0.98)",
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              <span>+{victoryState?.xpGranted ?? 25} XP</span>
              <span style={{ opacity: 0.7 }}>Hero progress updated</span>
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(228,236,232,0.90)",
              }}
            >
              {message}
            </div>

            {victoryState?.isFirstPuzzleCompletion ? (
              <div
                style={{
                  padding: "12px 13px",
                  borderRadius: 14,
                  border: "1px solid rgba(214,188,120,0.18)",
                  background:
                    "linear-gradient(180deg, rgba(214,188,120,0.10), rgba(214,188,120,0.04))",
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: "rgba(245,236,216,0.94)",
                }}
              >
                Your earlier choice set the destination. Solving the chamber’s trial opened
                the path and earned experience. Press continue to enter the{" "}
                {victoryState.destinationLabel}.
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "rgba(210,218,214,0.72)",
                }}
              >
                The path is unlocked. Movement will occur only when you confirm it.
              </div>

              <button
                type="button"
                onClick={() => {
                  void onConfirmTraversal?.();
                }}
                disabled={isConfirmingTraversal}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(118,188,132,0.28)",
                  background: isConfirmingTraversal
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(180deg, rgba(118,188,132,0.20), rgba(118,188,132,0.08))",
                  color: "rgba(236,250,240,0.98)",
                  fontWeight: 900,
                  cursor: isConfirmingTraversal ? "not-allowed" : "pointer",
                  opacity: isConfirmingTraversal ? 0.65 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {isConfirmingTraversal ? "Entering..." : confirmLabel}
              </button>
            </div>
          </div>
        ) : solved ? (
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

      {riddleLines.length > 0 ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(214,188,120,0.18)",
            background:
              "linear-gradient(180deg, rgba(20,18,14,0.84), rgba(10,9,8,0.78))",
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
            display: "grid",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.85,
              textTransform: "uppercase",
              opacity: 0.58,
              color: "rgba(240,242,246,0.84)",
            }}
          >
            Stone Inscription
          </div>

          <div
            style={{
              display: "grid",
              gap: 4,
              fontSize: 13,
              lineHeight: 1.6,
              color: "rgba(239,226,198,0.94)",
            }}
          >
            {riddleLines.map((line, index) => (
              <div key={`${index}-${line}`}>{line}</div>
            ))}
          </div>
        </div>
      ) : null}

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
                {plateStatusLabel({
                  plate,
                  gauges,
                  solved,
                  status,
                })}
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
