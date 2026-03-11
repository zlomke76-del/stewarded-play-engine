"use client";

type Props = {
  currentRoomTitle?: string | null;
  intendedRouteLabel?: string | null;
  puzzleResult: any | null;
};

function PuzzleGaugeFace(props: {
  src: string;
  left: string;
  top: string;
  size?: string;
  opacity?: number;
}) {
  const { src, left, top, size = "13.8%", opacity = 1 } = props;

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
        filter: opacity > 0 ? "drop-shadow(0 0 12px rgba(120,180,255,0.18))" : "none",
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
          border: "1px solid rgba(214,188,120,0.26)",
          background:
            "linear-gradient(180deg, rgba(214,188,120,0.14), rgba(214,188,120,0.05))",
          text: "rgba(245,236,216,0.96)",
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

export default function PressureGaugeVisual(props: Props) {
  const { currentRoomTitle, intendedRouteLabel, puzzleResult } = props;

  const success = Boolean(puzzleResult?.success);

  const gaugeState = success
    ? {
        left: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_full.png",
        center: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_2.png",
        right: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_3.png",
        pressed: ["Sun", "Moon", "Crown"],
      }
    : puzzleResult
      ? {
          left: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_1.png",
          center: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
          right: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_level_2.png",
          pressed: ["Sun"],
        }
      : {
          left: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
          center: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
          right: "/assets/V3/Dungeon/Puzzles/Pressure_Gauges/gauge_empty.png",
          pressed: [] as string[],
        };

  function plateState(name: string): "idle" | "pressed" {
    return gaugeState.pressed.includes(name) ? "pressed" : "idle";
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
                "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.14) 100%)",
              pointerEvents: "none",
            }}
          />

          <PuzzleGaugeFace
            src={gaugeState.left}
            left="31.6%"
            top="57.1%"
            size="13.5%"
            opacity={1}
          />
          <PuzzleGaugeFace
            src={gaugeState.center}
            left="43.25%"
            top="57.1%"
            size="13.5%"
            opacity={1}
          />
          <PuzzleGaugeFace
            src={gaugeState.right}
            left="54.95%"
            top="57.1%"
            size="13.5%"
            opacity={1}
          />

          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(8,10,16,0.64)",
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
              {puzzleResult
                ? `${currentRoomTitle ?? "Corridor"} — Trial Engaged`
                : `${currentRoomTitle ?? "Corridor"} — Passage Blocked`}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              padding: "8px 10px",
              borderRadius: 12,
              border: success
                ? "1px solid rgba(118,188,132,0.24)"
                : "1px solid rgba(214,188,120,0.20)",
              background: success
                ? "rgba(118,188,132,0.12)"
                : "rgba(8,10,16,0.64)",
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

          <div
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              padding: "8px 10px",
              borderRadius: 12,
              border: success
                ? "1px solid rgba(118,188,132,0.24)"
                : "1px solid rgba(214,188,120,0.20)",
              background: success
                ? "rgba(118,188,132,0.12)"
                : "rgba(8,10,16,0.64)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                fontWeight: 800,
                color: success
                  ? "rgba(176,235,188,0.96)"
                  : "rgba(245,236,216,0.92)",
              }}
            >
              {success ? "Mechanism Released" : "Pressure Network"}
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
