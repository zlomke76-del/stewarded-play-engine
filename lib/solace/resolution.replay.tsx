"use client";

// ------------------------------------------------------------
// Solace Resolution Replay
// ------------------------------------------------------------
// Read-Only Playback UI
//
// Purpose:
// - Replay a completed run
// - Prevent mutation or re-resolution
// ------------------------------------------------------------

import React, { useState } from "react";
import type { ResolutionRun } from "./resolution.run";
import ResolutionRenderer from "./resolution.renderer";

interface ResolutionReplayProps {
  run: ResolutionRun;
}

export default function ResolutionReplay({
  run,
}: ResolutionReplayProps) {
  const [index, setIndex] = useState(0);

  const resolution = run.resolutions[index];

  if (!resolution) {
    return <div>No resolution data.</div>;
  }

  return (
    <div className="resolution-replay">
      <div className="controls">
        <button
          onClick={() =>
            setIndex((i) => Math.max(0, i - 1))
          }
          disabled={index === 0}
        >
          Previous
        </button>

        <span>
          Turn {index + 1} of{" "}
          {run.resolutions.length}
        </span>

        <button
          onClick={() =>
            setIndex((i) =>
              Math.min(
                run.resolutions.length - 1,
                i + 1
              )
            )
          }
          disabled={
            index === run.resolutions.length - 1
          }
        >
          Next
        </button>
      </div>

      <ResolutionRenderer
        resolution={resolution}
        verbosity="rich"
      />

      {run.isComplete && index === run.resolutions.length - 1 && (
        <p className="terminal">
          The run has ended.
        </p>
      )}
    </div>
  );
}
