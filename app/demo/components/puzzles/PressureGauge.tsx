"use client";

import Image from "next/image";

type Props = {
  value: number;
  left: number;
  top: number;
};

const states = [
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_1.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_2.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_3.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_full.png",
];

export default function PressureGauge({ value, left, top }: Props) {
  const index = Math.max(0, Math.min(4, value));
  const src = states[index];

  return (
    <Image
      src={src}
      alt="pressure gauge"
      width={150}
      height={150}
      style={{
        position: "absolute",
        left,
        top,
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}
