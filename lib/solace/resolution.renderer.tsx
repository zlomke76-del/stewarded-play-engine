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

export type ResolutionVerbosity = "short" | "standard" | "rich";

interface ResolutionRendererProps {
  resolution: SolaceResolution;
  verbosity?: ResolutionVerbosity;
}

export default function ResolutionRenderer({
  resolution,
  verbosity = "standard",
}: ResolutionRendererProps) {
  return (
    <div className="solace-resolution">
      {/* Opening Signal */}
      <p className="opening">{resolution.opening_signal}</p>

      {/* Situation Frame */}
      {(verbosity === "standard" || verbosity === "rich") && (
        <div className="section situation">
          {resolution.situation_frame.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {/* Pressures */}
      {verbosity === "rich" && (
        <div className="section pressures">
          <strong>Relevant pressures:</strong>
          <ul>
            {resolution.pressures.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Process */}
      {(verbosity === "standard" || verbosity === "rich") && (
        <div className="section process">
          {resolution.process.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {/* Mechanical Resolution */}
      <div className="section mechanics">
        <strong>Resolution:</strong>
        <p>
          d20 rolled <b>{resolution.mechanical_resolution.roll}</b> vs DC{" "}
          <b>{resolution.mechanical_resolution.dc}</b> —{" "}
          <b>{resolution.mechanical_resolution.outcome}</b>
        </p>
      </div>

      {/* Aftermath */}
      {(verbosity === "standard" || verbosity === "rich") && (
        <div className="section aftermath">
          {resolution.aftermath.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
