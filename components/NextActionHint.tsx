"use client";

import { SessionState } from "@/lib/session/SessionState";

export default function NextActionHint({ state }: { state: SessionState }) {
  let text = "Awaiting next action (any player).";

  if (state.pending.length > 0) {
    text = "DM confirmation required.";
  } else if (state.events.at(-1)?.type === "outcome") {
    text = "Awaiting next player action.";
  }

  return (
    <div className="next-hint fade-in">
      {text}
    </div>
  );
}
