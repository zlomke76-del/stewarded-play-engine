"use client";

// ------------------------------------------------------------
// Solace Resolution Renderer
// ------------------------------------------------------------
// UI Consumption Layer
//
// - Renders a SolaceResolution payload
// - Verbosity controlled by renderer, not Solace
// - No mechanics altered here
// ------------------------------------------------------------

import React from "react";
import type { SolaceResolution } from "./solaceResolution.schema";

export type ResolutionVerbosity =
  | "short"
  | "standard"
  | "rich";

// ------------------------------------------------------------
// Type Guards
// ------------------------------------------------------------

type Outcome =
  | "success"
  | "partial"
  | "setback"
  | "failure"
  | "no_roll";

function hasDice(
  m: SolaceResolution["mechanical_resolution"]
): m is {
  roll: number;
  dc: number;
  outcome: Outcome;
} {
  return (
    typeof (m as any).roll === "number" &&
    typeof (m as any).dc === "number" &&
    typeof (m as any).outcome === "string"
  );
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

interface ResolutionRendererProps {
  resolution: SolaceResolution;
  verbosity?: ResolutionVerbosity;
}

export default function ResolutionRenderer({
  resolution,
  verbosity = "standard",
}: ResolutionRendererProps) {
  const mechanics = resolution.mechanical_resolution;

  return (
    <div className="solace-resolution">
      {/* Opening Signal */}
      <p className="opening">
        {resolution.opening_signal}
      </p>

      {/* Situation Frame */}
      {(verbosity === "standard" ||
        verbosity === "rich") && (
        <div className="section situation">
          {resolution.situation_frame.map(
            (line, i) => (
              <p key={i}>{line}</p>
            )
          )}
        </div>
      )}

      {/* Pressures */}
      {verbosity === "rich" && (
        <div className="section pressures">
          <strong>Relevant pressures:</strong>
          <ul>
            {resolution.pressures.map(
              (p, i) => (
                <li key={i}>{p}</li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Process */}
      {(verbosity === "standard" ||
        verbosity === "rich") && (
        <div className="section process">
          {resolution.process.map(
            (line, i) => (
              <p key={i}>{line}</p>
            )
          )}
        </div>
      )}

      {/* Mechanical Resolution */}
      <div className="section mechanics">
        <strong>Resolution:</strong>

        {hasDice(mechanics) ? (
          <p>
            d20 rolled{" "}
            <b>{mechanics.roll}</b> vs DC{" "}
            <b>{mechanics.dc}</b> —{" "}
            <b>{mechanics.outcome}</b>
          </p>
        ) : (
          <p>
            <em>
              No mechanical roll was invoked.
            </em>
          </p>
        )}
      </div>

      {/* Aftermath */}
      {(verbosity === "standard" ||
        verbosity === "rich") && (
        <div className="section aftermath">
          {resolution.aftermath.map(
            (line, i) => (
              <p key={i}>{line}</p>
            )
          )}
        </div>
      )}

      {/* Closure */}
      {"closure" in resolution &&
        resolution.closure && (
          <p className="closure">
            {resolution.closure}
          </p>
        )}
    </div>
  );
}

/* ------------------------------------------------------------
   EOF
   - UI narrows mechanics safely
   - Dice shown only when real
   - No schema assumptions
   - No downstream breakage
------------------------------------------------------------ */
