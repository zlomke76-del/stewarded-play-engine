"use client";

import { useEffect, useRef, useState } from "react";

type PlateSymbol = "sun" | "moon" | "cross" | "crown";

type Props = {
  symbol: PlateSymbol;
  left: number;
  top: number;
  onPress: () => void;
  disabled?: boolean;
};

const IMAGE_BY_SYMBOL: Record<
  PlateSymbol,
  { idle: string; pressed: string; alt: string }
> = {
  sun: {
    idle: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_sun_idle.png",
    pressed: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_sun_pressed.png",
    alt: "Sun pressure plate",
  },
  moon: {
    idle: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_moon_idle.png",
    pressed: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_moon_pressed.png",
    alt: "Moon pressure plate",
  },
  cross: {
    idle: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_cross_idle.png",
    pressed: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_cross_pressed.png",
    alt: "Cross pressure plate",
  },
  crown: {
    idle: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_crown_idle.png",
    pressed: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/plate_crown_pressed.png",
    alt: "Crown pressure plate",
  },
};

const PRESS_DURATION_MS = 180;

export default function PressurePlate(props: Props) {
  const { symbol, left, top, onPress, disabled = false } = props;

  const [pressed, setPressed] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  function triggerPress() {
    if (disabled) return;

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    setPressed(true);
    onPress();

    resetTimerRef.current = window.setTimeout(() => {
      setPressed(false);
      resetTimerRef.current = null;
    }, PRESS_DURATION_MS);
  }

  const images = IMAGE_BY_SYMBOL[symbol];
  const src = pressed ? images.pressed : images.idle;

  return (
    <button
      type="button"
      onClick={triggerPress}
      disabled={disabled}
      aria-label={images.alt}
      style={{
        position: "absolute",
        left,
        top,
        width: 150,
        height: 150,
        padding: 0,
        margin: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        cursor: disabled ? "default" : "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        transform: "translate(-50%, -50%)",
        display: "grid",
        placeItems: "center",
        opacity: disabled ? 0.72 : 1,
      }}
    >
      <img
        src={src}
        alt={images.alt}
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          userSelect: "none",
          pointerEvents: "none",
          filter: pressed
            ? "drop-shadow(0 0 12px rgba(255,230,170,0.18))"
            : "drop-shadow(0 8px 18px rgba(0,0,0,0.26))",
          transform: pressed ? "translateY(4px) scale(0.985)" : "translateY(0) scale(1)",
          transition:
            "transform 110ms ease, filter 110ms ease, opacity 110ms ease",
        }}
      />
    </button>
  );
}
