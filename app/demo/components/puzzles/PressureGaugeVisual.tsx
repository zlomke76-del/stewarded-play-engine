"use client";

type PlateId = "Sun" | "Moon" | "Cross" | "Crown";

type Props = {
  currentRoomTitle?: string | null;
  intendedRouteLabel?: string | null;
  puzzleResult: any | null;
  plateSequence: PlateId[];
  onPressPlate: (plate: PlateId) => void;
  onClearSequence: () => void;
  isSubmitting?: boolean;
};

function PuzzleGaugeFace(props: {
  src: string;
  left: string;
  top: string;
  size?: string;
  opacity?: number;
}) {
  const { src, left, top, size = "10.8%", opacity = 1 } = props;

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        aspectRatio: "1 / 1",
        objectFit: "contain",
        pointerEvents: "none",
        opacity,
        filter:
          opacity > 0
            ? "drop-shadow(0 0 8px rgba(120,180,255,0.16))"
            : "none",
        mixBlendMode: "screen",
      }}
    />
  );
}

function PuzzlePlateToken(props: {
  label: string;
  symbol: string;
  state: "idle" | "pressed";
}) {
  const { label, symbol, state } = props;

  const tone =
    state === "pressed"
      ? {
          border: "1px solid rgba(214,188,120,0.28)",
          background:
            "linear-gradient(180deg, rgba(214,188,120,0.15), rgba(214,188,120,0.05))",
          text: "rgba(245,236,216,0.98)",
        }
      : {
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          text: "rgba(228,232,240,0.84)",
        };

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: tone.border,
        background: tone.background,
        display: "grid",
        gap: 4,
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: 19,
          lineHeight: 1,
          color: tone.text,
        }}
      >
        {symbol}
      </div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.75,
          textTransform: "uppercase",
          opacity: 0.6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.4,
          color: tone.text,
          fontWeight: 700,
        }}
      >
        {state === "pressed" ? "Engaged" : "Idle"}
      </div>
    </div>
  );
}

function CornerBadge(props: {
  title: string;
  value: string;
  align?: "left" | "right";
}) {
  const { title, value, align = "left" } = props;

  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        [align]: 14,
        padding: "7px 9px",
        borderRadius: 11,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(8,10,16,0.60)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "grid",
        gap: 2,
        maxWidth: "32%",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: 0.75,
          textTransform: "uppercase",
          opacity: 0.58,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "rgba(245,236,216,0.96)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FloorPlateButton(props: {
  plate: PlateId;
  symbol: string;
  left: string;
  top: string;
  pressed: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { plate, symbol, left, top, pressed, disabled, onClick } = props;

  return (
    <button
      type="button"
      aria-label={`${plate} plate`}
      disabled={disabled}
      onClick={onClick}
      style={{
        position: "absolute",
        left,
        top,
        width: "9.2%",
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        border: pressed
          ? "1px solid rgba(214,188,120,0.34)"
          : "1px solid rgba(255,255,255,0.12)",
        background: pressed
          ? "radial-gradient(circle at 35% 30%, rgba(255,227,179,0.28), rgba(214,188,120,0.10) 55%, rgba(15,18,28,0.74) 100%)"
          : "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 55%, rgba(15,18,28,0.72) 100%)",
        boxShadow: pressed
          ? "0 0 22px rgba(214,188,120,0.18), inset 0 1px 0 rgba(255,246,226,0.30)"
          : "0 8px 18px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.10)",
        color: pressed ? "rgba(255,240,214,0.98)" : "rgba(226,231,239,0.88)",
        cursor: disabled ? "not-allowed" : "pointer",
        transform: pressed ? "translateY(2px) scale(0.98)" : "translateY(0) scale(1)",
        transition:
          "transform 120ms ease, box-shadow 150ms ease, border-color 150ms ease, background 150ms ease",
        display: "grid",
        placeItems: "center",
        fontSize: "1.35vw",
        fontWeight: 900,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontSize: 20,
          filter: pressed ? "drop-shadow(0 0 8px rgba(255,220,160,0.28))" : "none",
        }}
      >
        {symbol}
      </span>
    </button>
  );
}

export default function PressureGaugeVisual(props: Props) {
  const {
    currentRoomTitle,
    intendedRouteLabel,
    puzzleResult,
    plateSequence,
    onPressPlate,
    onClearSequence,
    isSubmitting = false,
  } = props;

  const success = Boolean(puzzleResult?.success);
  const attemptStarted = plateSequence.length > 0 || Boolean(puzzleResult);

  const fillCount = success ? 3 : Math.min(plateSequence.length, 3);

  const gaugeImages = [
    fillCount >= 1
      ? success
        ? "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_full.png"
        : "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_1.png"
      : "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
    fillCount >= 2
      ? success
        ? "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_2.png"
        : "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_2.png"
      : "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
    fillCount >= 3
      ? success
        ? "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_3.png"
        : "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_3.png"
      : "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
  ] as const;

  const pressedSet = new Set<PlateId>(plateSequence);

  function plateState(name: PlateId): "idle" | "pressed" {
    return pressedSet.has(name) ? "pressed" : "idle";
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(214,188,120,0.16)",
          background: "rgba(0,0,0,0.22)",
          boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#090b12",
          }}
        >
          <img
            src="/assets/V3/Dungeon/Puzzles/Pressure_Gauges/corridor_puzzle_room.png"
            alt="Pressure gauge chamber"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.12) 100%)",
              pointerEvents: "none",
            }}
          />

          <PuzzleGaugeFace
            src={gaugeImages[0]}
            left="33.4%"
            top="49.9%"
            size="10.8%"
            opacity={1}
          />
          <PuzzleGaugeFace
            src={gaugeImages[1]}
            left="44.55%"
            top="49.9%"
            size="10.8%"
            opacity={1}
          />
          <PuzzleGaugeFace
            src={gaugeImages[2]}
            left="55.7%"
            top="49.9%"
            size="10.8%"
            opacity={1}
          />

          <FloorPlateButton
            plate="Sun"
            symbol="☼"
            left="36.4%"
            top="69.6%"
            pressed={pressedSet.has("Sun")}
            disabled={isSubmitting}
            onClick={() => onPressPlate("Sun")}
          />
          <FloorPlateButton
            plate="Moon"
            symbol="☾"
            left="45.2%"
            top="69.6%"
            pressed={pressedSet.has("Moon")}
            disabled={isSubmitting}
            onClick={() => onPressPlate("Moon")}
          />
          <FloorPlateButton
            plate="Cross"
            symbol="✚"
            left="54%"
            top="69.6%"
            pressed={pressedSet.has("Cross")}
            disabled={isSubmitting}
            onClick={() => onPressPlate("Cross")}
          />
          <FloorPlateButton
            plate="Crown"
            symbol="◇"
            left="62.8%"
            top="69.6%"
            pressed={pressedSet.has("Crown")}
            disabled={isSubmitting}
            onClick={() => onPressPlate("Crown")}
          />

          <CornerBadge
            title="Current Chamber"
            value={currentRoomTitle ?? "Corridor"}
            align="left"
          />

          <CornerBadge
            title="Intended Route"
            value={intendedRouteLabel ?? "Passage forward"}
            align="right"
          />

          <div
            style={{
              position: "absolute",
              left: 14,
              bottom: 14,
              padding: "7px 9px",
              borderRadius: 11,
              border: success
                ? "1px solid rgba(118,188,132,0.24)"
                : "1px solid rgba(214,188,120,0.20)",
              background: success ? "rgba(118,188,132,0.12)" : "rgba(8,10,16,0.60)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "grid",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                fontWeight: 800,
                color: success
                  ? "rgba(176,235,188,0.96)"
                  : "rgba(245,236,216,0.92)",
              }}
            >
              {success
                ? "Mechanism Released"
                : attemptStarted
                  ? "Pressure Building"
                  : "Pressure Network"}
            </div>

            <div
              style={{
                fontSize: 11,
                lineHeight: 1.4,
                color: "rgba(228,232,240,0.80)",
              }}
            >
              {plateSequence.length > 0
                ? `Sequence: ${plateSequence.join(" → ")}`
                : "Select plates in the chamber floor."}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={isSubmitting || plateSequence.length === 0}
                onClick={onClearSequence}
                style={{
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(240,242,246,0.88)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor:
                    isSubmitting || plateSequence.length === 0
                      ? "not-allowed"
                      : "pointer",
                  opacity: isSubmitting || plateSequence.length === 0 ? 0.5 : 1,
                }}
              >
                Clear Sequence
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        }}
      >
        <PuzzlePlateToken label="Sun Plate" symbol="☼" state={plateState("Sun")} />
        <PuzzlePlateToken label="Moon Plate" symbol="☾" state={plateState("Moon")} />
        <PuzzlePlateToken label="Cross Plate" symbol="✚" state={plateState("Cross")} />
        <PuzzlePlateToken label="Crown Plate" symbol="◇" state={plateState("Crown")} />
      </div>
    </div>
  );
}
