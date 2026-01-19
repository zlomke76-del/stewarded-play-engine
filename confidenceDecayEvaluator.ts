// confidenceDecayEvaluator.ts
// ------------------------------------------------------------
// Confidence Decay Evaluator v1.0
// Pure, deterministic confidence decay computation
// ------------------------------------------------------------

export type DecayCurve = "LINEAR" | "EXPONENTIAL" | "STEP" | "CUSTOM";

export type ConfidenceSpec = {
  value: number; // initial confidence, 0–1
  decay_curve: DecayCurve;
  decay_params: Record<string, unknown>;
};

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function parseTime(ts: string): number {
  const t = Date.parse(ts);
  if (isNaN(t)) {
    throw new Error("Invalid RFC3339 timestamp");
  }
  return t;
}

export function computeConfidence(
  confidence: ConfidenceSpec,
  issuedAt: string, // RFC3339
  now: string // RFC3339
): number {
  const start = parseTime(issuedAt);
  const end = parseTime(now);

  if (end <= start) {
    return clamp(confidence.value);
  }

  const elapsedMs = end - start;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  let current: number;

  switch (confidence.decay_curve) {
    case "LINEAR": {
      const rate = Number(confidence.decay_params["rate"]);
      if (!isFinite(rate) || rate < 0) {
        throw new Error("LINEAR decay requires non-negative numeric rate");
      }
      current = confidence.value - rate * elapsedDays;
      break;
    }

    case "EXPONENTIAL": {
      const rate = Number(confidence.decay_params["rate"]);
      if (!isFinite(rate) || rate < 0) {
        throw new Error(
          "EXPONENTIAL decay requires non-negative numeric rate"
        );
      }
      current = confidence.value * Math.exp(-rate * elapsedDays);
      break;
    }

    case "STEP": {
      const thresholdDays = Number(confidence.decay_params["threshold_days"]);
      const dropTo = Number(confidence.decay_params["drop_to"]);
      if (
        !isFinite(thresholdDays) ||
        thresholdDays < 0 ||
        !isFinite(dropTo)
      ) {
        throw new Error(
          "STEP decay requires numeric threshold_days and drop_to"
        );
      }
      current =
        elapsedDays >= thresholdDays ? dropTo : confidence.value;
      break;
    }

    case "CUSTOM": {
      throw new Error("CUSTOM decay curve is not implemented");
    }

    default:
      throw new Error("Unknown decay curve");
  }

  return clamp(current);
}

/* --------- Minimal invariant tests --------- */

function assertApprox(a: number, b: number, eps = 1e-6) {
  if (Math.abs(a - b) > eps) {
    throw new Error(`Assertion failed: ${a} ≉ ${b}`);
  }
}

// LINEAR
assertApprox(
  computeConfidence(
    { value: 1, decay_curve: "LINEAR", decay_params: { rate: 0.1 } },
    "2024-01-01T00:00:00Z",
    "2024-01-06T00:00:00Z"
  ),
  0.5
);

// EXPONENTIAL
assertApprox(
  computeConfidence(
    { value: 1, decay_curve: "EXPONENTIAL", decay_params: { rate: 1 } },
    "2024-01-01T00:00:00Z",
    "2024-01-02T00:00:00Z"
  ),
  Math.exp(-1)
);

// STEP
assertApprox(
  computeConfidence(
    {
      value: 0.8,
      decay_curve: "STEP",
      decay_params: { threshold_days: 3, drop_to: 0.2 },
    },
    "2024-01-01T00:00:00Z",
    "2024-01-05T00:00:00Z"
  ),
  0.2
);
