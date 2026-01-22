"use client";

// ------------------------------------------------------------
// WorldLedgerPanel (CANONICAL)
// ------------------------------------------------------------
// Living Chronicle of Canonical Solace Resolutions
//
// HARD RULES:
// - Renders ONLY SolaceResolution (server-authoritative)
// - Never consumes SessionState draft prose
// - Never rewrites or embellishes narration
// - Dice are factual annotation only
// ------------------------------------------------------------

import type { ResolutionRun } from "@/lib/solace/resolution.run";
import type { SolaceResolution } from "@/lib/solace/solaceResolution.schema";
import CardSection from "@/components/layout/CardSection";

/* ------------------------------------------------------------
   Props
------------------------------------------------------------ */

type Props = {
  run: ResolutionRun | null;
};

/* ------------------------------------------------------------
   Dice rendering (annotation only)
------------------------------------------------------------ */

function renderDice(
  resolution: SolaceResolution
) {
  const m = resolution.mechanical_resolution as any;

  if (
    typeof m?.roll !== "number" ||
    typeof m?.dc !== "number"
  ) {
    return null;
  }

  const outcome =
    m.roll >= m.dc ? "Success" : "Setback";

  return (
    <div className="muted" style={{ marginTop: 6 }}>
      🎲 d20 = {m.roll} vs DC {m.dc} —{" "}
      <strong>{outcome}</strong>
    </div>
  );
}

/* ------------------------------------------------------------
   Prologue / Epilogue (derived, not invented)
------------------------------------------------------------ */

function buildPrologue(
  resolutions: SolaceResolution[]
): string | null {
  if (resolutions.length === 0) return null;

  return "The journey begins. The world listens.";
}

function buildEpilogue(
  resolutions: SolaceResolution[]
): string | null {
  if (resolutions.length === 0) return null;

  return "What has been done settles into memory. The world carries it forward.";
}

/* ------------------------------------------------------------
   Component
------------------------------------------------------------ */

export default function WorldLedgerPanel({
  run,
}: Props) {
  if (!run || run.resolutions.length === 0) {
    return (
      <CardSection title="World Ledger">
        <p className="muted">
          No events have yet shaped the world.
        </p>
      </CardSection>
    );
  }

  const { resolutions } = run;

  const prologue = buildPrologue(resolutions);
  const epilogue = buildEpilogue(resolutions);

  return (
    <CardSection title="World Ledger">
      {prologue && (
        <p style={{ marginBottom: 16 }}>
          <em>{prologue}</em>
        </p>
      )}

      <ol style={{ paddingLeft: 18 }}>
        {resolutions.map((r, idx) => (
          <li
            key={idx}
            style={{ marginBottom: 20 }}
          >
            <pre
              style={{
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
{r.opening_signal}

{r.process.join(" ")}

{r.aftermath.join(" ")}
            </pre>

            {renderDice(r)}
          </li>
        ))}
      </ol>

      {epilogue && (
        <p style={{ marginTop: 18 }}>
          <em>{epilogue}</em>
        </p>
      )}
    </CardSection>
  );
}
