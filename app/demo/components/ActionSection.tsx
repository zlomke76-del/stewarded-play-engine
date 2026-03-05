"use client";

// ------------------------------------------------------------
// ActionSection.tsx
// ------------------------------------------------------------
// Player action input surface.
// Orchestrator passes party + state + callbacks.
// ------------------------------------------------------------

import React from "react";
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

  return (
    <CardSection title="Player Action">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Acting player:
          <select
            value={actingPlayerId}
            onChange={(e) => onSetActingPlayerId(e.target.value)}
            disabled={!hasParty}
            style={{ minWidth: 240 }}
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

        <button onClick={onPassTurn} disabled={!combatActive || passDisabled}>
          Pass / End Turn
        </button>

        {showPartyButtons && (
          <>
            <button
              type="button"
              onClick={onCommitParty}
              disabled={!!commitDisabled}
              title="Commit PARTY_DECLARED (canon)"
              style={{ opacity: 0.75 }}
            >
              Commit Party (Canon)
            </button>

            <button type="button" onClick={onRandomNames} title="Fill missing party names" style={{ opacity: 0.55 }}>
              Random Names
            </button>
          </>
        )}
      </div>

      <textarea
        value={playerInput}
        onChange={(e) => onSetPlayerInput(e.target.value)}
        placeholder="Describe what your character does…"
        disabled={!canSubmit}
        style={{
          width: "100%",
          minHeight: "120px",
          resize: "vertical",
          boxSizing: "border-box",
          lineHeight: 1.5,
        }}
      />

      <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={onSubmit} disabled={!canSubmit}>
          Submit Action
        </button>
        <span className="muted" style={{ fontSize: 12 }}>
          Tip: After you submit, the page jumps to Resolution automatically.
        </span>
      </div>
    </CardSection>
  );
}
