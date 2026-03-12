"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PressureGauge from "./PressureGauge";
import PressurePlate from "./PressurePlate";

type PlateId = "sun" | "moon" | "cross" | "crown";

type PuzzleStatus = "idle" | "building" | "failed" | "solved";

const TARGET_GAUGES = [4, 2, 3] as const;

const EXPECTED_BUILD: PlateId[] = [
  "sun",
  "sun",
  "sun",
  "sun",
  "moon",
  "moon",
  "cross",
  "cross",
  "cross",
];

const ROOM_IMAGE =
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/corridor_puzzle_room.png";

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

function plateLabel(plate: PlateId) {
  switch (plate) {
    case "sun":
      return "Sun";
    case "moon":
      return "Moon";
    case "cross":
      return "Cross";
    case "crown":
      return "Crown";
    default:
      return plate;
  }
}

function gaugesMatch(values: number[]) {
  return (
    values[0] === TARGET_GAUGES[0] &&
    values[1] === TARGET_GAUGES[1] &&
    values[2] === TARGET_GAUGES[2]
  );
}

function bleedNetwork(values: number[]) {
  return [
    clampGauge(values[0] - 1),
    clampGauge(values[1] - 1),
    clampGauge(values[2] - 1),
  ];
}

function incrementGauge(values: number[], plate: Exclude<PlateId, "crown">) {
  if (plate === "sun") {
    return [clampGauge(values[0] + 1), values[1], values[2]];
  }

  if (plate === "moon") {
    return [values[0], clampGauge(values[1] + 1), values[2]];
  }

  return [values[0], values[1], clampGauge(values[2] + 1)];
}

export default function PressureGaugePuzzle() {
  const [gauges, setGauges] = useState<number[]>([0, 0, 0]);
  const [sequence, setSequence] = useState<PlateId[]>([]);
  const [status, setStatus] = useState<PuzzleStatus>("idle");
  const [message, setMessage] = useState(
    "Build the pressure pattern in order, then use the Crown plate to validate the network."
  );
  const [solved, setSolved] = useState(false);

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

    audioMap.plate.volume = 0.6;
    audioMap.tick.volume = 0.42;
    audioMap.reject.volume = 0.66;
    audioMap.validate.volume = 0.78;
    audioMap.release.volume = 0.82;
    audioMap.gateOpen.volume = 0.9;

    Object.values(audioMap).forEach((audio) => {
      audio.preload = "auto";
    });

    audioRef.current = audioMap;

    return () => {
      Object.values(audioMap).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioRef.current = null;
    };
  }, []);

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
      void audio.play().catch((err) => {
        console.warn("SFX failed:", name, err);
      });
    } catch (err) {
      console.warn("SFX error:", name, err);
    }
  }

  const buildSequence = useMemo(
    () =>
      sequence.filter(
        (plate): plate is Exclude<PlateId, "crown"> => plate !== "crown"
      ),
    [sequence]
  );

  const sequenceLabel = useMemo(() => {
    if (sequence.length === 0) return "No plates engaged yet.";
    return sequence.map(plateLabel).join(" → ");
  }, [sequence]);

  function clearPuzzle() {
    setGauges([0, 0, 0]);
    setSequence([]);
    setStatus("idle");
    setSolved(false);
    setMessage(
      "Build the pressure pattern in order, then use the Crown plate to validate the network."
    );
  }

  function failBuildAttempt(pressedPlate: Exclude<PlateId, "crown">) {
    const next = bleedNetwork(gauges);

    setSequence((prev) => [...prev, pressedPlate]);
    setGauges(next);
    setStatus("failed");
    setMessage(
      `The ${plateLabel(
        pressedPlate
      )} plate engages out of order. The mechanism rejects the step and pressure bleeds from the network.`
    );

    playSfx("reject");
  }

  function handleBuildPlate(pressedPlate: Exclude<PlateId, "crown">) {
    if (solved) return;

    unlockAudio();
    playSfx("plate");

    const nextExpected = EXPECTED_BUILD[buildSequence.length];

    if (!nextExpected) {
      failBuildAttempt(pressedPlate);
      return;
    }

    if (pressedPlate !== nextExpected) {
      failBuildAttempt(pressedPlate);
      return;
    }

    const next = incrementGauge(gauges, pressedPlate);

    setGauges(next);
    setSequence((prev) => [...prev, pressedPlate]);
    setStatus("building");

    if (pressedPlate === "sun") {
      setMessage(
        next[0] === TARGET_GAUGES[0]
          ? "The left gauge settles into the needed range."
          : "Pressure enters the left channel."
      );
    } else if (pressedPlate === "moon") {
      setMessage(
        next[1] === TARGET_GAUGES[1]
          ? "The center gauge aligns with the chamber’s demand."
          : "Pressure rises in the center channel."
      );
    } else {
      setMessage(
        next[2] === TARGET_GAUGES[2]
          ? "The right gauge steadies near release."
          : "The cross plate redistributes force into the right channel."
      );
    }

    playSfx("tick");
  }

  function pressSun() {
    handleBuildPlate("sun");
  }

  function pressMoon() {
    handleBuildPlate("moon");
  }

  function pressCross() {
    handleBuildPlate("cross");
  }

  function pressCrown() {
    if (solved) return;

    unlockAudio();
    playSfx("plate");
    setSequence((prev) => [...prev, "crown"]);

    const buildMatches =
      buildSequence.length === EXPECTED_BUILD.length &&
      buildSequence.every((plate, index) => plate === EXPECTED_BUILD[index]);

    if (buildMatches && gaugesMatch(gauges)) {
      setSolved(true);
      setStatus("solved");
      setMessage("The mechanism accepts the pattern. Stone answers stone.");
      playSfx("validate");

      window.setTimeout(() => {
        playSfx("release");
      }, 240);

      window.setTimeout(() => {
        playSfx("gateOpen");
      }, 760);

      return;
    }

    const vented = bleedNetwork(gauges);

    setGauges(vented);
    setStatus("failed");
    setMessage(
      "The crown plate rejects the pattern. The chamber vents pressure and the passage remains sealed."
    );
    playSfx("reject");
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 1600,
        margin: "0 auto",
        display: "grid",
        gap: 14,
      }}
    >
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
              fontSize: 14,
              fontWeight: 800,
              color: "rgba(245,236,216,0.96)",
            }}
          >
            Target: 4 · 2 · 3
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 18,
            top: 18,
            padding: "10px 12px",
            borderRadius: 12,
            border:
              status === "solved"
                ? "1px solid rgba(118,188,132,0.26)"
                : "1px solid rgba(255,255,255,0.10)",
            background:
              status === "solved"
                ? "rgba(118,188,132,0.14)"
                : "rgba(8,10,16,0.66)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "grid",
            gap: 3,
            minWidth: 180,
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
            Trial State
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color:
                status === "solved"
                  ? "rgba(176,235,188,0.96)"
                  : "rgba(245,236,216,0.96)",
            }}
          >
            {status === "solved"
              ? "Mechanism Released"
              : status === "failed"
                ? "Sequence Rejected"
                : status === "building"
                  ? "Pressure Building"
                  : "Passage Blocked"}
          </div>
        </div>

        <PressureGauge value={gauges[0]} left={610} top={430} />
        <PressureGauge value={gauges[1]} left={825} top={430} />
        <PressureGauge value={gauges[2]} left={1040} top={430} />

        <PressurePlate
          symbol="sun"
          left={500}
          top={650}
          onPress={pressSun}
          disabled={solved}
        />
        <PressurePlate
          symbol="moon"
          left={750}
          top={650}
          onPress={pressMoon}
          disabled={solved}
        />
        <PressurePlate
          symbol="cross"
          left={1000}
          top={650}
          onPress={pressCross}
          disabled={solved}
        />
        <PressurePlate
          symbol="crown"
          left={1250}
          top={650}
          onPress={pressCrown}
          disabled={solved}
        />

        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: 18,
            maxWidth: 430,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8,10,16,0.66)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "grid",
            gap: 6,
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
            Sequence
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

          <button
            type="button"
            onClick={clearPuzzle}
            style={{
              justifySelf: "start",
              marginTop: 2,
              padding: "7px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(240,242,246,0.88)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Clear Sequence
          </button>
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
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            opacity: 0.58,
          }}
        >
          Chamber Read
        </div>

        <div
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            color: "rgba(244,238,225,0.96)",
          }}
        >
          Four symbolic plates feed a three-channel mechanism. The first three plates
          build pressure in strict order. The Crown does not fill a gauge — it judges
          the finished pattern.
        </div>

        <div
          style={{
            display: "grid",
            gap: 6,
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(228,232,240,0.78)",
          }}
        >
          <div>Sun raises the left gauge.</div>
          <div>Moon raises the center gauge.</div>
          <div>Cross raises the right gauge.</div>
          <div>Crown validates the current pressure pattern.</div>
        </div>

        <div
          style={{
            marginTop: 2,
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
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              opacity: 0.58,
              marginBottom: 6,
            }}
          >
            Mechanism Response
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "rgba(244,238,225,0.96)",
            }}
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
