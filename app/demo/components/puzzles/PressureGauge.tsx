"use client";

import Image from "next/image";

const states = [
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_1.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_2.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_3.png",
  "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_full.png",
];

type Props = {
  value: number;
  left: number;
  top: number;
};

export default function PressureGauge({ value, left, top }: Props) {
  const src = states[Math.min(value, 4)];

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
      }}
    />
  );
}
