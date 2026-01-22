"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Living Chronicle of Canonical Resolutions
//
// Purpose:
// - Render Solace-authored canon from ResolutionRun
// - Group entries by location when present
// - Display dice as factual annotation only
//
// HARD RULE:
// - This component NEVER rewrites narrative
// ------------------------------------------------------------

import type { ResolutionRun } from "@/lib/solace/resolution.run";
import CardSection from "@/components/layout/CardSection";

/* ------------------------------------------------------------
   Props
------------------------------------------------------------ */

type Props = {
  run: ResolutionRun;
};

/* ------------------------------------------------------------
   Dice rendering (factual annotation only)
------------------------------------------------------------ */

function renderDice(resolution: any) {
  const mech = resolution?.mechanical_resolution;
  if (!mech) return null;

  const { roll, dc } = mech;
  if (typeof roll !== "number" || typeof dc !== "number") return null;

  const outcome = roll >= dc ? "Success" : "Setback";

  return (
    <div className="muted" style={{ marginTop: 6 }}>
      🎲 d20 = {roll} vs DC {dc} — {outcome}
    </div>
  );
}

/* ------------------------------------------------------------
   Prologue / Epilogue (derived, not invented)
------------------------------------------------------------ */

function buildPrologue(count: number): string | null {
  if (count === 0) return null;
  return "The journey begins. The world listens.";
}

function buildEpilogue(count: number): string | null {
  if (count === 0) return null;
  return "What has been done settles into memory. The world carries it forward.";
}

/* ------------------------------------------------------------
   Component
------------------------------------------------------------ */

export default function WorldLedgerPanel({ run }: Props) {
  const resolutions = run.resolutions ?? [];

  const byLocation = new Map<string, typeof resolutions>();
  const global: typeof resolutions = [];

  for (const r of resolutions) {
    const location =
      (r as any)?.world?.roomId ??
      (r as any)?.world?.primary ??
      null;

    if (location) {
      if (!byLocation.has(location)) {
        byLocation.set(location, []);
      }
      byLocation.get(location)!.push(r);
    } else {
      global.push(r);
    }
  }

  const prologue = buildPrologue(resolutions.length);
  const epilogue = buildEpilogue(resolutions.length);

  return (
    <CardSection title="World Ledger">
      {resolutions.length === 0 && (
        <p className="muted">No events have yet shaped the world.</p>
      )}

      {prologue && (
        <p style={{ marginBottom: 16 }}>
          <em>{prologue}</em>
        </p>
      )}

      {[...byLocation.entries()].map(([place, items]) => (
        <div key={place} style={{ marginBottom: 24 }}>
          <strong>📍 {place}</strong>
          <ul>
            {items.map((r, i) => (
              <li key={i} style={{ marginBottom: 14 }}>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {r.opening_signal}
                </pre>
                {renderDice(r)}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {global.length > 0 && (
        <>
          <strong>🌍 Beyond Any Single Place</strong>
          <ul>
            {global.map((r, i) => (
              <li key={i} style={{ marginBottom: 14 }}>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {r.opening_signal}
                </pre>
                {renderDice(r)}
              </li>
            ))}
          </ul>
        </>
      )}

      {epilogue && (
        <p style={{ marginTop: 18 }}>
          <em>{epilogue}</em>
        </p>
      )}
    </CardSection>
  );
}
