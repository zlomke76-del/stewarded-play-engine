// app/demo/components/InitialTableSection.tsx
"use client";

import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";
import type { DMMode, InitialTable } from "../demoTypes";

type Props = {
  dmMode: DMMode | null;
  initialTable: InitialTable | null;
  tableAccepted: boolean;
  tableDraftText: string;
  setTableDraftText: (next: string) => void;
  onAccept: () => void;
};

const ACCEPT_LABEL = "Begin the Descent";

const SFX = {
  buttonClick: "/assets/audio/sfx_button_click_01.mp3",
  uiSuccess: "/assets/audio/sfx_success_01.mp3",
  uiFailure: "/assets/audio/sfx_failure_01.mp3",
  stoneDoor: "/assets/audio/sfx_stone_door_01.mp3",
} as const;

function playSfx(src: string, volume = 0.68) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // fail silently; UI audio should never block flow
    });
  } catch {
    // fail silently
  }
}

export default function InitialTableSection({
  dmMode,
  initialTable,
  tableAccepted,
  tableDraftText,
  setTableDraftText,
  onAccept,
}: Props) {
  // Gate: nothing below should be reachable until mode is chosen
  if (dmMode === null) return <Disclaimer />;

  // Once accepted, we don’t need to show the setup block again.
  if (tableAccepted) return null;

  // Defensive: mode chosen but table not ready yet
  if (!initialTable) {
    return (
      <CardSection title="Initial Table">
        <div className="muted">Preparing the table…</div>
      </CardSection>
    );
  }

  if (dmMode === "solace-neutral") {
    return (
      <CardSection title="Initial Table (Solace)">
        <p className="muted" style={{ marginBottom: 8 }}>
          Table-play narration (finalized):
        </p>

        <div
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            background: "rgba(0,0,0,0.25)",
            padding: "16px",
            borderRadius: "6px",
          }}
        >
          {tableDraftText}
        </div>

        <details style={{ marginTop: 12 }} open>
          <summary className="muted">Show underlying table signals</summary>
          <div style={{ marginTop: 10 }}>
            <p>{initialTable.openingFrame}</p>
            <p className="muted">Traits: {initialTable.locationTraits.join(", ")}</p>
            <ul>
              {initialTable.latentFactions.map((f, i) => (
                <li key={i}>
                  <strong>{f.name}</strong> — {f.desire} ({f.pressure})
                </li>
              ))}
            </ul>
            <p className="muted">Oddity: {initialTable.environmentalOddities.join(", ")}</p>
            <p className="muted">Hook: {initialTable.dormantHooks.join(", ")}</p>
          </div>
        </details>

        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => {
              playSfx(SFX.uiSuccess, 0.72);
              playSfx(SFX.stoneDoor, 0.56);
              onAccept();
            }}
          >
            {ACCEPT_LABEL}
          </button>
        </div>
      </CardSection>
    );
  }

  // Human DM
  return (
    <CardSection title="Solace Setup Helper (Optional)">
      <p className="muted" style={{ marginTop: 0 }}>
        If you want a fast-start table, edit it, then run the game.
      </p>

      <textarea
        rows={10}
        value={tableDraftText}
        onChange={(e) => setTableDraftText(e.target.value)}
        style={{ width: "100%" }}
      />

      <details style={{ marginTop: 12 }} open>
        <summary
          className="muted"
          onClick={() => {
            playSfx(SFX.buttonClick, 0.54);
          }}
          style={{ cursor: "pointer" }}
        >
          Show underlying table signals
        </summary>
        <div style={{ marginTop: 10 }}>
          <p>{initialTable.openingFrame}</p>
          <p className="muted">Traits: {initialTable.locationTraits.join(", ")}</p>
          <ul>
            {initialTable.latentFactions.map((f, i) => (
              <li key={i}>
                <strong>{f.name}</strong> — {f.desire} ({f.pressure})
              </li>
            ))}
          </ul>
          <p className="muted">Oddity: {initialTable.environmentalOddities.join(", ")}</p>
          <p className="muted">Hook: {initialTable.dormantHooks.join(", ")}</p>
        </div>
      </details>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => {
            playSfx(SFX.uiSuccess, 0.72);
            playSfx(SFX.stoneDoor, 0.56);
            onAccept();
          }}
        >
          {ACCEPT_LABEL}
        </button>
      </div>
    </CardSection>
  );
}
