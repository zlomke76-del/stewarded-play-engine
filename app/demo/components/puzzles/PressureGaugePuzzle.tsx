"use client";

import { useState } from "react";
import PressureGauge from "./PressureGauge";
import PressurePlate from "./PressurePlate";

export default function PressureGaugePuzzle() {
  const [gauges, setGauges] = useState([0, 0, 0]);
  const [solved, setSolved] = useState(false);

  function updateGauge(index: number, amount: number) {
    const next = [...gauges];

    next[index] = Math.max(0, Math.min(4, next[index] + amount));

    setGauges(next);

    new Audio(
      "/assets/audio/Puzzles/Pressure_Plates/sfx_gauge_needle_tick.mp3"
    ).play();

    checkSolved(next);
  }

  function checkSolved(values: number[]) {
    if (values[0] === 4 && values[1] === 2 && values[2] === 3) {
      setSolved(true);

      new Audio(
        "/assets/audio/Puzzles/Pressure_Plates/sfx_multiple_lock_clicks.mp3"
      ).play();

      setTimeout(() => {
        new Audio(
          "/assets/audio/Puzzles/Pressure_Plates/sfx_stone_gate_rumble_open.mp3"
        ).play();
      }, 700);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 1600,
        margin: "0 auto",
      }}
    >
      <img
        src="/assets/V3/Dungeon/Puzzles/Pressure_Gauges/corridor_puzzle_room.png"
        style={{ width: "100%" }}
      />

      {/* Gauges */}

      <PressureGauge value={gauges[0]} left={610} top={430} />
      <PressureGauge value={gauges[1]} left={825} top={430} />
      <PressureGauge value={gauges[2]} left={1040} top={430} />

      {/* Plates */}

      <PressurePlate
        symbol="sun"
        left={500}
        top={650}
        onPress={() => updateGauge(0, 1)}
      />

      <PressurePlate
        symbol="moon"
        left={750}
        top={650}
        onPress={() => updateGauge(1, 1)}
      />

      <PressurePlate
        symbol="cross"
        left={1000}
        top={650}
        onPress={() => updateGauge(2, 1)}
      />

      <PressurePlate
        symbol="crown"
        left={1250}
        top={650}
        onPress={() => {
          updateGauge(0, 1);
          updateGauge(1, 1);
          updateGauge(2, 1);
        }}
      />

      {solved && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "14px 30px",
            background: "rgba(0,0,0,0.8)",
            borderRadius: 8,
            color: "#fff",
            fontSize: 18,
          }}
        >
          Mechanism Released
        </div>
      )}
    </div>
  );
}
