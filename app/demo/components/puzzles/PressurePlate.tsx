"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  symbol: "sun" | "moon" | "cross" | "crown";
  left: number;
  top: number;
  onPress: () => void;
};

export default function PressurePlate({ symbol, left, top, onPress }: Props) {
  const [pressed, setPressed] = useState(false);

  const idle = `/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_${symbol}_idle.png`;
  const down = `/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_${symbol}_pressed.png`;

  function press() {
    setPressed(true);

    new Audio(
      "/assets/audio/Puzzles/Pressure_Plates/sfx_stone_grind.mp3"
    ).play();

    onPress();
  }

  return (
    <Image
      src={pressed ? down : idle}
      alt={symbol}
      width={150}
      height={150}
      onClick={press}
      style={{
        position: "absolute",
        left,
        top,
        cursor: "pointer",
        userSelect: "none",
      }}
    />
  );
}
