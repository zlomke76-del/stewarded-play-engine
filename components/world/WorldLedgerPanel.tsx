"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Canon Chronicle (ResolutionRun)
// Purpose:
// - Render canonical SolaceResolution history (server-authoritative)
// - Display narrative fields without rewriting
// - Show dice as factual annotation only (no invention)
// ------------------------------------------------------------

import type { ResolutionRun } from "@/lib/solace/resolution.run";
import type { SolaceResolution } from "@/lib/solace/solaceResolution.schema";
import CardSection from "@/components/layout/CardSection";

type Props = {
  run: ResolutionRun;
};

// ------------------------------------------------------------
// Dice rendering (factual annotation only)
// ------------------------------------------------------------

function renderDice(r: SolaceResolution) {
  const m: any = (r as any).mechanical_resolution;

  if (!m || typeof m !== "object") return null;

  const roll = typeof m.roll === "number" ? m.roll : null;
  const dc = typeof m.dc === "number" ? m.dc : null;
  const outcome = typeof m.outcome === "string" ? m.outcome : "no_roll";

  // If canon says no roll, show that explicitly (still factual)
  if (outcome === "no_roll" || roll === null || dc === null || dc === 0) {
    return (
      <div className="muted" style={{ marginTop: 6 }}>
        🎲 No roll
      </div>
    );
  }

  // Outcome label is derived from roll vs dc, but does not override canonical outcome string.
  // We surface both: roll vs dc AND canonical outcome token.
  return (
    <div className="muted" style={{ marginTop: 6 }}>
      🎲 d20 = {roll} vs DC {dc} — {outcome}
    </div>
  );
}

// ------------------------------------------------------------
// Prologue / Epilogue (derived, not rewritten)
// ------------------------------------------------------------

function buildPrologue(resolutions: SolaceResolution[]): string | null {
  if (resolutions.length === 0) return null;
  return "The journey begins. The world listens.";
}

function buildEpilogue(resolutions: SolaceResolution[]): string | null {
  if (resolutions.length === 0) return null;
  return "What has been done settles into memory. The world carries it forward.";
}

// ------------------------------------------------------------

export default function WorldLedgerPanel({ run }: Props) {
  const resolutions: SolaceResolution[] = Array.isArray(run?.resolutions)
    ? (run.resolutions as SolaceResolution[])
    : [];

  const prologue = buildPrologue(resolutions);
  const epilogue = buildEpilogue(resolutions);

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

      {resolutions.length > 0 && (
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {resolutions.map((r, idx) => {
            const opening =
              typeof r.opening_signal === "string" && r.opening_signal.trim().length > 0
                ? r.opening_signal
                : "The moment resolves.";

            const frame = Array.isArray(r.situation_frame) ? r.situation_frame : [];
            const process = Array.isArray(r.process) ? r.process : [];
            const aftermath = Array.isArray(r.aftermath) ? r.aftermath : [];

            return (
              <li key={`${run.id}-turn-${idx}`} style={{ marginBottom: 14 }}>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{opening}</pre>

                {/* Canonical narrative fields — surfaced, not rewritten */}
                {frame.length > 0 && (
                  <div className="muted" style={{ marginTop: 6 }}>
                    {frame.join(" ")}
                  </div>
                )}

                {process.length > 0 && (
                  <div className="muted" style={{ marginTop: 6 }}>
                    {process.join(" ")}
                  </div>
                )}

                {aftermath.length > 0 && (
                  <div className="muted" style={{ marginTop: 6 }}>
                    {aftermath.join(" ")}
                  </div>
                )}

                {renderDice(r)}
              </li>
            );
          })}
        </ol>
      )}

      {epilogue && (
        <p style={{ marginTop: 18 }}>
          <em>{epilogue}</em>
        </p>
      )}
    </CardSection>
  );
}
