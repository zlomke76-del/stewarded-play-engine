"use client";

// ------------------------------------------------------------
// ActionSection.tsx
// ------------------------------------------------------------
// Player action input surface.
// Orchestrator passes party + state + callbacks.
// ------------------------------------------------------------

import React, { useEffect, useMemo, useRef } from "react";
import CardSection from "@/components/layout/CardSection";

type PartyMemberLite = {
  id: string;
  label: string;
};

type Props = {
  partyMembers: PartyMemberLite[];
  actingPlayerId: string;
  onSetActingPlayerId: (id: string) => void;

  playerInput: string;
  onSetPlayerInput: (v: string) => void;

  canSubmit: boolean;
  onSubmit: () => void;

  combatActive: boolean;
  passDisabled: boolean;
  onPassTurn: () => void;

  showPartyButtons: boolean;
  onCommitParty?: () => void;
  onRandomNames?: () => void;

  commitDisabled?: boolean;
};

function appendIntent(prev: string, addition: string) {
  const base = String(prev ?? "");
  if (base.trim().length === 0) return addition;
  return base.endsWith("\n") ? `${base}${addition}` : `${base}\n${addition}`;
}

export default function ActionSection({
  partyMembers,
  actingPlayerId,
  onSetActingPlayerId,
  playerInput,
  onSetPlayerInput,
  canSubmit,
  onSubmit,
  combatActive,
  passDisabled,
  onPassTurn,
  showPartyButtons,
  onCommitParty,
  onRandomNames,
  commitDisabled,
}: Props) {
  const hasParty = partyMembers.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const actingLabel = useMemo(() => {
    const found = partyMembers.find((m) => m.id === actingPlayerId);
    return found?.label ?? (hasParty ? "—" : "Player 1 (player_1)");
  }, [partyMembers, actingPlayerId, hasParty]);

  // Focus when it becomes actionable (ties UX to “your turn”)
  useEffect(() => {
    if (!canSubmit) return;
    const id = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [canSubmit, actingPlayerId]);

  const status = useMemo(() => {
    if (!combatActive) return { tone: "free", label: "Freeform", detail: "No combat turn lock." };
    if (canSubmit) return { tone: "yourturn", label: "Your Turn", detail: "Declare intent and submit." };
    return { tone: "waiting", label: "Waiting", detail: "Turn is locked (enemy turn or gated state)." };
  }, [combatActive, canSubmit]);

  const statusStyle: React.CSSProperties =
    status.tone === "yourturn"
      ? {
          border: "1px solid rgba(255,255,255,0.16)",
          background: "rgba(0,0,0,0.28)",
        }
      : status.tone === "waiting"
        ? {
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.18)",
            opacity: 0.9,
          }
        : {
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.16)",
            opacity: 0.92,
          };

  return (
    <CardSection title="Player Action">
      {/* Turn Status Banner */}
      <div
        style={{
          ...statusStyle,
          borderRadius: 14,
          padding: "10px 12px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase" }} className="muted">
            {combatActive ? "Combat Turn" : "Scene"}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <strong style={{ fontSize: 14 }}>{status.label}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              · Acting: <strong>{actingLabel}</strong>
            </span>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            {status.detail}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              Acting player
            </span>
            <select
              value={actingPlayerId}
              onChange={(e) => onSetActingPlayerId(e.target.value)}
              disabled={!hasParty || combatActive} // lock selection during combat (ties to turn discipline)
              style={{ minWidth: 240 }}
              title={combatActive ? "Locked during combat to preserve turn integrity." : "Select who is acting."}
            >
              {hasParty ? (
                partyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))
              ) : (
                <option value="player_1">Player 1 (player_1)</option>
              )}
            </select>
          </label>

          <button onClick={onPassTurn} disabled={!combatActive || passDisabled} title="Advance to the next turn">
            Pass / End Turn
          </button>

          {showPartyButtons && (
            <>
              <button
                type="button"
                onClick={onCommitParty}
                disabled={!!commitDisabled}
                title="Commit PARTY_DECLARED (canon)"
                style={{ opacity: 0.8 }}
              >
                Commit Party (Canon)
              </button>

              <button
                type="button"
                onClick={onRandomNames}
                title="Fill missing party names"
                style={{ opacity: 0.6 }}
              >
                Random Names
              </button>
            </>
          )}
        </div>
      </div>

      {/* Intent Console */}
      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.26)",
          backdropFilter: "blur(10px)",
          padding: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase" }} className="muted">
              Intent
            </div>
            <div style={{ fontSize: 13 }} className="muted">
              Speak in concrete actions. The resolver will translate into outcomes.
            </div>
          </div>

          <div className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            Acting: <strong>{actingLabel}</strong>
          </div>
        </div>

        {/* Quick intent chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, marginBottom: 10 }}>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSetPlayerInput((prev) =>
                appendIntent(prev, "I move to cover and take a guarded stance, watching for openings.")
              )
            }
            style={{ opacity: canSubmit ? 1 : 0.6 }}
            title="Insert a cover + posture intent"
          >
            Take Cover
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSetPlayerInput((prev) => appendIntent(prev, "I attack the nearest threat with decisive force."))
            }
            style={{ opacity: canSubmit ? 1 : 0.6 }}
            title="Insert an attack intent"
          >
            Attack
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSetPlayerInput((prev) =>
                appendIntent(prev, "I reposition to a better angle and try to draw attention away from allies.")
              )
            }
            style={{ opacity: canSubmit ? 1 : 0.6 }}
            title="Insert a reposition intent"
          >
            Reposition
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSetPlayerInput((prev) =>
                appendIntent(prev, "I assist an ally—calling out timing and creating an opening for them.")
              )
            }
            style={{ opacity: canSubmit ? 1 : 0.6 }}
            title="Insert a help/assist intent"
          >
            Help Ally
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSetPlayerInput("")}
            style={{ opacity: canSubmit ? 0.85 : 0.5 }}
            title="Clear intent text"
          >
            Clear
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={playerInput}
          onChange={(e) => onSetPlayerInput(e.target.value)}
          placeholder="Describe what your character does…"
          disabled={!canSubmit}
          style={{
            width: "100%",
            minHeight: "150px",
            resize: "vertical",
            boxSizing: "border-box",
            lineHeight: 1.55,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: canSubmit ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.22)",
            padding: "12px 12px",
            outline: "none",
            opacity: canSubmit ? 1 : 0.85,
          }}
        />

        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={onSubmit} disabled={!canSubmit}>
              Submit Action
            </button>
            <span className="muted" style={{ fontSize: 12 }}>
              Tip: After you submit, the page jumps to Resolution automatically.
            </span>
          </div>

          {!canSubmit && (
            <span className="muted" style={{ fontSize: 12 }}>
              Input locked — waiting on the next valid turn/state.
            </span>
          )}
        </div>
      </div>
    </CardSection>
  );
}
