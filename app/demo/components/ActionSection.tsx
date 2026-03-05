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

  // NEW (turn truth)
  dmMode: "human" | "solace-neutral" | null;
  isEnemyTurn: boolean;
  isWrongPlayerForTurn: boolean;
  activeTurnLabel: string | null;

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

  dmMode,
  isEnemyTurn,
  isWrongPlayerForTurn,
  activeTurnLabel,

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

  // true lock reasons (turn-aware)
  const lockReason = useMemo(() => {
    if (!combatActive) return null;
    if (dmMode === "human") return null; // human can always run the table
    if (isEnemyTurn) return "Enemy turn in progress.";
    if (isWrongPlayerForTurn) return "Not your turn.";
    return null;
  }, [combatActive, dmMode, isEnemyTurn, isWrongPlayerForTurn]);

  const modeLabel = useMemo(() => {
    if (dmMode === "human") return "Human DM";
    if (dmMode === "solace-neutral") return "Solace-neutral";
    return "Unselected";
  }, [dmMode]);

  // Focus when it becomes actionable (ties UX to “your turn”)
  useEffect(() => {
    if (!canSubmit) return;
    const id = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [canSubmit, actingPlayerId]);

  const bannerTone = useMemo(() => {
    if (!combatActive) return "free";
    if (dmMode === "human") return "human";
    if (isEnemyTurn) return "enemy";
    if (isWrongPlayerForTurn) return "blocked";
    return "yourturn";
  }, [combatActive, dmMode, isEnemyTurn, isWrongPlayerForTurn]);

  const bannerStyle: React.CSSProperties =
    bannerTone === "yourturn"
      ? { border: "1px solid rgba(255,255,255,0.16)", background: "rgba(0,0,0,0.30)" }
      : bannerTone === "enemy"
        ? { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.22)" }
        : bannerTone === "blocked"
          ? { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.20)" }
          : bannerTone === "human"
            ? { border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.22)" }
            : { border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.16)" };

  const bannerTitle = useMemo(() => {
    if (!combatActive) return "Action";
    if (dmMode === "human") return "DM Control";
    if (isEnemyTurn) return "Enemy Turn";
    if (isWrongPlayerForTurn) return "Turn Locked";
    return "Your Turn";
  }, [combatActive, dmMode, isEnemyTurn, isWrongPlayerForTurn]);

  // lock acting-player selection during combat in solace-neutral (turn discipline)
  const lockActingSelect = combatActive && dmMode !== "human";

  return (
    <div id="player-action" style={{ scrollMarginTop: 90 }}>
      <CardSection title="Player Action">
        {/* Turn / Mode Banner */}
        <div
          style={{
            ...bannerStyle,
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
              {combatActive ? "Combat Turn" : "Scene"} · {modeLabel}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
              <strong style={{ fontSize: 14 }}>{bannerTitle}</strong>
              {combatActive && activeTurnLabel ? (
                <span className="muted" style={{ fontSize: 12 }}>
                  · Active: <strong>{activeTurnLabel}</strong>
                </span>
              ) : null}
              <span className="muted" style={{ fontSize: 12 }}>
                · Acting: <strong>{actingLabel}</strong>
              </span>
            </div>
            {lockReason ? (
              <div className="muted" style={{ fontSize: 12 }}>
                {lockReason}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 12 }}>
                Declare intent and submit. Resolution will follow.
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Acting player
              </span>
              <select
                value={actingPlayerId}
                onChange={(e) => onSetActingPlayerId(e.target.value)}
                disabled={!hasParty || lockActingSelect}
                style={{ minWidth: 240 }}
                title={
                  lockActingSelect
                    ? "Locked during combat (Solace-neutral) to preserve turn integrity."
                    : "Select who is acting."
                }
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
                Concrete actions work best. Example: “I sprint to the pillar, take cover, then fire at the nearest
                archer.”
              </div>
            </div>

            <div className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {combatActive ? "Turn-locked" : "Freeform"} · <strong>{modeLabel}</strong>
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
              onClick={() => onSetPlayerInput((prev) => appendIntent(prev, "I attack the nearest threat decisively."))}
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
                  appendIntent(prev, "I reposition to a better angle and try to draw attention off an ally.")
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
            placeholder={lockReason ? "Input locked during this turn…" : "Describe what your character does…"}
            disabled={!canSubmit}
            style={{
              width: "100%",
              minHeight: "160px",
              resize: "vertical",
              boxSizing: "border-box",
              lineHeight: 1.55,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: canSubmit ? "rgba(0,0,0,0.34)" : "rgba(0,0,0,0.22)",
              padding: "12px 12px",
              outline: "none",
              opacity: canSubmit ? 1 : 0.86,
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

            {!canSubmit && combatActive && dmMode !== "human" ? (
              <span className="muted" style={{ fontSize: 12 }}>
                {isEnemyTurn ? "Enemy turn — watch the theater above." : "Turn locked — match the active player."}
              </span>
            ) : null}
          </div>
        </div>
      </CardSection>
    </div>
  );
}
