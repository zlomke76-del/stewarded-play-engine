"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Canon Chronicle (ResolutionRun)
//
// Purpose:
// - Render canonical SolaceResolution history
// - NEVER rewrite narrative
// - Ledger is neutral memory (no dice, no theatrics)
// ------------------------------------------------------------

import type { ResolutionRun } from "@/lib/solace/resolution.run";
import type { SolaceResolution } from "@/lib/solace/solaceResolution.schema";
import CardSection from "@/components/layout/CardSection";

type Props = {
  run: ResolutionRun;
};

// ------------------------------------------------------------

export default function WorldLedgerPanel({ run }: Props) {
  const resolutions: SolaceResolution[] = Array.isArray(run?.resolutions)
    ? (run.resolutions as SolaceResolution[])
    : [];

  return (
    <CardSection title="World Ledger">
      {resolutions.length === 0 && (
        <p className="muted">No events have yet shaped the world.</p>
      )}

      {resolutions.length > 0 && (
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {resolutions.map((r, idx) => (
            <li key={`${run.id}-turn-${idx}`} style={{ marginBottom: 16 }}>
              {/* Opening signal */}
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {r.opening_signal}
              </div>

              {/* Situation frame */}
              {Array.isArray(r.situation_frame) &&
                r.situation_frame.length > 0 && (
                  <div
                    className="muted"
                    style={{
                      marginTop: 6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {r.situation_frame.join(" ")}
                  </div>
                )}

              {/* Process (condensed, neutral) */}
              {Array.isArray(r.process) && r.process.length > 0 && (
                <div
                  className="muted"
                  style={{
                    marginTop: 6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {r.process.join(" ")}
                </div>
              )}

              {/* Aftermath */}
              {Array.isArray(r.aftermath) &&
                r.aftermath.length > 0 && (
                  <div
                    className="muted"
                    style={{
                      marginTop: 6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {r.aftermath.join(" ")}
                  </div>
                )}
            </li>
          ))}
        </ol>
      )}

      {resolutions.length > 0 && (
        <p style={{ marginTop: 18 }}>
          <em>
            What has been done settles into memory. The world carries it forward.
          </em>
        </p>
      )}
    </CardSection>
  );
}
