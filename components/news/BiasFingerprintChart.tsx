"use client";

type BiasFingerprintProps = {
  language: number;
  framing: number;
  source: number;
  context: number;
  intent: number;
  size?: number; // px
};

/*
  AXES (in order):
  1. Language Bias
  2. Framing Bias
  3. Source Bias
  4. Context Bias
  5. Intent Bias
*/

const AXIS_LABELS = [
  "Language",
  "Framing",
  "Source",
  "Context",
  "Intent",
];

export default function BiasFingerprintChart({
  language,
  framing,
  source,
  context,
  intent,
  size = 260,
}: BiasFingerprintProps) {
  const values = [language, framing, source, context, intent];

  // Radar geometry
  const center = size / 2;
  const radius = size * 0.38;
  const angleStep = (Math.PI * 2) / values.length;

  // Convert each score (0–1) to a point in the pentagon
  const points = values.map((v, i) => {
    const angle = -Math.PI / 2 + i * angleStep; // start at top
    const r = v * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Axis label positions
  const labelPoints = AXIS_LABELS.map((label, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const lx = center + (radius + 22) * Math.cos(angle);
    const ly = center + (radius + 22) * Math.sin(angle);
    return { label, x: lx, y: ly };
  });

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-lg shadow-slate-900/50">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">
        Bias Fingerprint
      </h3>

      <svg width={size} height={size} className="overflow-visible">
        {/* Background rings */}
        {[0.25, 0.5, 0.75, 1].map((r, idx) => (
          <polygon
            key={idx}
            points={AXIS_LABELS.map((_, i) => {
              const angle = -Math.PI / 2 + i * angleStep;
              const rr = r * radius;
              const x = center + rr * Math.cos(angle);
              const y = center + rr * Math.sin(angle);
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            className="opacity-30"
          />
        ))}

        {/* Axes */}
        {AXIS_LABELS.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#475569"
              strokeWidth="1"
              className="opacity-50"
            />
          );
        })}

        {/* Primary bias polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(16, 185, 129, 0.25)" /* emerald-500 w/ opacity */
          stroke="rgb(16, 185, 129)"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="rgb(16,185,129)"
            stroke="black"
          />
        ))}

        {/* Labels */}
        {labelPoints.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            fontSize="10"
            textAnchor="middle"
            fill="#94a3b8"
          >
            {l.label}
          </text>
        ))}
      </svg>

      {/* Value summary */}
      <div className="mt-2 grid w-full grid-cols-2 gap-2 text-xs text-slate-300">
        <Value label="Language" value={language} />
        <Value label="Framing" value={framing} />
        <Value label="Source" value={source} />
        <Value label="Context" value={context} />
        <Value label="Intent" value={intent} />
      </div>
    </div>
  );
}

function Value({ label, value }: { label: string; value: number }) {
  let tone = "text-slate-300";
  if (value <= 0.33) tone = "text-emerald-400";
  else if (value <= 0.66) tone = "text-amber-400";
  else tone = "text-red-500";

  return (
    <div className="flex items-center justify-between rounded-md bg-slate-900 px-2 py-1">
      <span>{label}</span>
      <span className={`font-semibold ${tone}`}>{value.toFixed(2)}</span>
    </div>
  );
}
