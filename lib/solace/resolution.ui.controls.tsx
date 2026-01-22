"use client";

// ------------------------------------------------------------
// Solace Resolution UI Controls
// ------------------------------------------------------------
// Verbosity + Replay Toggles
//
// Purpose:
// - Let users control display richness
// - Navigate replay without mutating state
// ------------------------------------------------------------

import React from "react";
import {
  VerbosityProfile,
} from "./resolution.verbosity";

interface ResolutionUIControlsProps {
  verbosity: VerbosityProfile;
  onVerbosityChange: (v: VerbosityProfile) => void;
  onReplayToggle?: () => void;
  isReplaying?: boolean;
}

export default function ResolutionUIControls({
  verbosity,
  onVerbosityChange,
  onReplayToggle,
  isReplaying = false,
}: ResolutionUIControlsProps) {
  return (
    <div className="resolution-ui-controls">
      <label>
        Verbosity:
        <select
          value={verbosity}
          onChange={(e) =>
            onVerbosityChange(
              e.target.value as VerbosityProfile
            )
          }
        >
          <option value="minimal">Minimal</option>
          <option value="standard">Standard</option>
          <option value="rich">Rich</option>
        </select>
      </label>

      {onReplayToggle && (
        <button onClick={onReplayToggle}>
          {isReplaying
            ? "Exit Replay"
            : "Replay Run"}
        </button>
      )}
    </div>
  );
}
