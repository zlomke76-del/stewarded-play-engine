"use client";

// ------------------------------------------------------------
// ActionSection.tsx
// ------------------------------------------------------------
// Player action input surface.
// Orchestrator passes party + state + callbacks.
// Upgraded:
// - supports acting-player class skills / species traits
// - renders loadout chips for the active player
// - adds specialty quick-action buttons driven by skill labels
// - adds browser speech-to-text dictation for the action textarea
// - adds component-level SFX wiring for action UI + arbiter cues
// ------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "@/components/layout/CardSection";

type PartyMemberLite = {
  id: string;
  label: string;
  skills?: string[];
  traits?: string[];
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

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: null | (() => void);
  onend: null | (() => void);
  onerror: null | ((event: { error?: string }) => void);
  onresult: null | ((event: any) => void);
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const SFX = {
  buttonClick: "/assets/audio/sfx_button_click_01.mp3",
  arbiterRoll: "/assets/audio/sfx_arbiter_resolution_roll_01.mp3",
  arbiterCanonRecord: "/assets/audio/sfx_arbiter_cannon_record_01.mp3",
} as const;

function playSfx(src: string, volume = 0.72) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // fail silently; SFX should never block gameplay
    });
  } catch {
    // fail silently
  }
}

function appendIntent(prev: string, addition: string) {
  const base = String(prev ?? "");
  if (base.trim().length === 0) return addition;
  return base.endsWith("\n") ? `${base}${addition}` : `${base}\n${addition}`;
}

function appendDictation(prev: string, addition: string) {
  const base = String(prev ?? "").trimEnd();
  const next = String(addition ?? "").trim();
  if (!next) return String(prev ?? "");
  if (!base) return next;
  if (/[.!?]$/.test(base)) return `${base} ${next}`;
  return `${base} ${next}`;
}

function titleCaseFromId(value: string) {
  return String(value ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSkillIntent(skillId: string, label: string) {
  switch (skillId) {
    case "guard_break":
      return "I close hard and use Guard Break on the enemy's defense, trying to crack their stance open for the party.";
    case "shield_wall":
      return "I form a Shield Wall and protect the most exposed ally, bracing for the incoming strike.";
    case "second_wind":
      return "I draw a Second Wind, steady myself, and recover before pressing forward.";
    case "rage":
      return "I enter a Rage and surge forward with overwhelming force, committing fully to the fight.";
    case "reckless_strike":
      return "I launch a Reckless Strike at the nearest dangerous enemy, accepting the risk to hit hard.";
    case "intimidating_roar":
      return "I unleash an Intimidating Roar to shake enemy nerve and break their momentum.";
    case "backstab":
      return "I slip into position and use Backstab on the most exposed target.";
    case "shadowstep":
      return "I Shadowstep to a better angle, slipping out of danger and setting up my next move.";
    case "disarm_trap":
      return "I carefully Disarm Trap, searching for the trigger and neutralizing the hazard.";
    case "arc_bolt":
      return "I fire an Arc Bolt at the most dangerous enemy at range.";
    case "frost_bind":
      return "I cast Frost Bind to slow and pin the target in place.";
    case "detect_arcana":
      return "I use Detect Arcana and search the area for magical residue, hidden wards, or unstable pathways.";
    case "heal":
      return "I cast Heal on the ally who needs it most.";
    case "bless":
      return "I cast Bless on our front-line ally to steady their aim and spirit.";
    case "turn_undead":
      return "I invoke Turn Undead and drive the undead back with sacred force.";
    case "mark_target":
      return "I Mark Target on the highest-priority enemy and call the focus to the party.";
    case "volley":
      return "I loose a Volley into the clustered enemies to pressure the whole group.";
    case "track":
      return "I Track the signs ahead, reading movement, prints, and disturbance to reveal the safest route.";
    case "smite":
      return "I bring down a Smite on the enemy in front of me with full conviction.";
    case "protect":
      return "I Protect the ally under the most pressure and step into the threat lane for them.";
    case "rally":
      return "I Rally the party, restoring courage and pulling everyone back into formation.";
    case "inspire":
      return "I Inspire my ally, sharpening their confidence and timing for the next exchange.";
    case "distract":
      return "I Distract the enemy and create an opening for the party to exploit.";
    case "soothing_verse":
      return "I use a Soothing Verse to calm and restore the ally who is faltering.";
    case "vinesnare":
      return "I cast Vinesnare to bind the target and disrupt their movement.";
    case "wild_shape":
      return "I use Wild Shape, taking on a tougher form to control the battlefield.";
    case "nature_sense":
      return "I use Nature Sense and read the living pattern of the area for danger or hidden paths.";
    case "flurry":
      return "I unleash a Flurry of rapid strikes to overwhelm the target's rhythm.";
    case "deflect":
      return "I prepare to Deflect the next incoming blow with timing and discipline.";
    case "center_self":
      return "I Center Self, clearing my mind and readying a precise follow-up.";
    case "gadget_trap":
      return "I deploy a Gadget Trap to hinder the enemy and create a tactical opening.";
    case "infuse_weapon":
      return "I Infuse Weapon, empowering an ally's strike with focused energy.";
    case "deploy_device":
      return "I Deploy Device and scan the area for hazards, structure, and tactical advantage.";
    case "chaos_bolt":
      return "I unleash a Chaos Bolt at the enemy and let raw arcane force break across them.";
    case "surge":
      return "I draw on a Surge of power to amplify my next spell.";
    case "quickened_cast":
      return "I use Quickened Cast to compress the casting window and keep tempo.";
    case "hex":
      return "I place a Hex on the enemy, weakening them and making them easier to punish.";
    case "eldritch_blast":
      return "I fire Eldritch Blast at the most dangerous enemy in sight.";
    case "pact_ward":
      return "I raise a Pact Ward around the ally under the greatest threat.";
    default:
      return `I use ${label} to shape the situation in our favor.`;
  }
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBufferRef = useRef<string>("");
  const shouldResumeListeningRef = useRef(false);

  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const actingMember = useMemo(() => {
    return partyMembers.find((m) => m.id === actingPlayerId) ?? null;
  }, [partyMembers, actingPlayerId]);

  const actingLabel = useMemo(() => {
    return actingMember?.label ?? (hasParty ? "—" : "Player 1 (player_1)");
  }, [actingMember, hasParty]);

  const actingSkillIds = useMemo(() => {
    return Array.isArray(actingMember?.skills) ? actingMember.skills.filter(Boolean) : [];
  }, [actingMember]);

  const actingTraitIds = useMemo(() => {
    return Array.isArray(actingMember?.traits) ? actingMember.traits.filter(Boolean) : [];
  }, [actingMember]);

  const actingSkillLabels = useMemo(() => {
    return actingSkillIds.map((id) => ({
      id,
      label: titleCaseFromId(id),
    }));
  }, [actingSkillIds]);

  const actingTraitLabels = useMemo(() => {
    return actingTraitIds.map((id) => ({
      id,
      label: titleCaseFromId(id),
    }));
  }, [actingTraitIds]);

  const specialtyButtons = useMemo(() => {
    return actingSkillLabels.slice(0, 3);
  }, [actingSkillLabels]);

  const nextActingPlayerId = useMemo(() => {
    if (partyMembers.length <= 1) return null;

    const currentIndex = partyMembers.findIndex((m) => m.id === actingPlayerId);
    if (currentIndex === -1) return partyMembers[0]?.id ?? null;

    const nextIndex = (currentIndex + 1) % partyMembers.length;
    return partyMembers[nextIndex]?.id ?? null;
  }, [partyMembers, actingPlayerId]);

  const lockReason = useMemo(() => {
    if (!combatActive) return null;
    if (dmMode === "human") return null;
    if (isEnemyTurn) return "Enemy turn in progress.";
    if (isWrongPlayerForTurn) return "Not your turn.";
    return null;
  }, [combatActive, dmMode, isEnemyTurn, isWrongPlayerForTurn]);

  const modeLabel = useMemo(() => {
    if (dmMode === "human") return "Human DM";
    if (dmMode === "solace-neutral") return "Solace-neutral";
    return "Unselected";
  }, [dmMode]);

  useEffect(() => {
    if (!canSubmit) return;
    const id = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [canSubmit, actingPlayerId]);

  useEffect(() => {
    const RecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSpeechSupported(!!RecognitionCtor);

    if (!RecognitionCtor) return;

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldResumeListeningRef.current && canSubmit) {
        try {
          recognition.start();
        } catch {
          // no-op
        }
      }
    };

    recognition.onerror = (event) => {
      const code = String(event?.error ?? "");
      if (code === "no-speech") {
        setSpeechError("No speech detected.");
      } else if (code === "audio-capture") {
        setSpeechError("No microphone detected.");
      } else if (code === "not-allowed") {
        setSpeechError("Microphone permission was denied.");
      } else {
        setSpeechError("Speech recognition error.");
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = String(event.results[i]?.[0]?.transcript ?? "").trim();
        if (!transcript) continue;

        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += `${transcript} `;
        }
      }

      speechBufferRef.current = interimTranscript.trim();

      const finalClean = finalTranscript.trim();
      if (finalClean) {
        onSetPlayerInput(appendDictation(playerInput, finalClean));
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldResumeListeningRef.current = false;
      try {
        recognition.stop();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    };
  }, [canSubmit, onSetPlayerInput, playerInput]);

  useEffect(() => {
    if (canSubmit) return;

    shouldResumeListeningRef.current = false;
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // no-op
      }
    }
  }, [canSubmit, isListening]);

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

  const lockActingSelect = combatActive && dmMode !== "human";

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 11,
    lineHeight: 1.3,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  };

  const traitChipStyle: React.CSSProperties = {
    ...chipStyle,
    background: "rgba(120,180,255,0.10)",
    border: "1px solid rgba(120,180,255,0.22)",
  };

  function handleSubmit() {
    if (!canSubmit) return;

    playSfx(SFX.arbiterRoll, 0.78);

    if (isListening) {
      shouldResumeListeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // no-op
      }
    }

    onSubmit();

    if (nextActingPlayerId) {
      onSetActingPlayerId(nextActingPlayerId);
    }
  }

  function toggleListening() {
    if (!speechSupported || !canSubmit) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;

    playSfx(SFX.buttonClick, 0.6);
    setSpeechError(null);

    if (isListening) {
      shouldResumeListeningRef.current = false;
      try {
        recognition.stop();
      } catch {
        // no-op
      }
      return;
    }

    shouldResumeListeningRef.current = true;
    speechBufferRef.current = "";

    try {
      recognition.start();
      textareaRef.current?.focus();
    } catch {
      setSpeechError("Unable to start microphone input.");
    }
  }

  return (
    <div id="player-action" style={{ scrollMarginTop: 90 }}>
      <CardSection title="Player Action">
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
                onChange={(e) => {
                  playSfx(SFX.buttonClick, 0.56);
                  onSetActingPlayerId(e.target.value);
                }}
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

            <button
              onClick={() => {
                if (!combatActive || passDisabled) return;
                playSfx(SFX.buttonClick, 0.66);
                onPassTurn();
              }}
              disabled={!combatActive || passDisabled}
              title="Advance to the next turn"
            >
              Pass / End Turn
            </button>

            {showPartyButtons && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (commitDisabled) return;
                    playSfx(SFX.arbiterCanonRecord, 0.78);
                    onCommitParty?.();
                  }}
                  disabled={!!commitDisabled}
                  title="Commit PARTY_DECLARED (canon)"
                  style={{ opacity: 0.8 }}
                >
                  Commit Party (Canon)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSfx(SFX.buttonClick, 0.6);
                    onRandomNames?.();
                  }}
                  title="Fill missing party names"
                  style={{ opacity: 0.6 }}
                >
                  Random Names
                </button>
              </>
            )}
          </div>
        </div>

        {(actingSkillLabels.length > 0 || actingTraitLabels.length > 0) && (
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.18)",
              padding: "10px 12px",
              marginBottom: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Active Loadout
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Class Skills
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 22 }}>
                {actingSkillLabels.length > 0 ? (
                  actingSkillLabels.map((skill) => (
                    <span key={skill.id} style={chipStyle} title={skill.id}>
                      {skill.label}
                    </span>
                  ))
                ) : (
                  <span className="muted" style={{ fontSize: 12 }}>
                    No class skills
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Species Traits
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 22 }}>
                {actingTraitLabels.length > 0 ? (
                  actingTraitLabels.map((trait) => (
                    <span key={trait.id} style={traitChipStyle} title={trait.id}>
                      {trait.label}
                    </span>
                  ))
                ) : (
                  <span className="muted" style={{ fontSize: 12 }}>
                    No species traits
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

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

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, marginBottom: 10 }}>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                playSfx(SFX.buttonClick, 0.58);
                onSetPlayerInput(
                  appendIntent(playerInput, "I move to cover and take a guarded stance, watching for openings.")
                );
              }}
              style={{ opacity: canSubmit ? 1 : 0.6 }}
              title="Insert a cover + posture intent"
            >
              Take Cover
            </button>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                playSfx(SFX.buttonClick, 0.58);
                onSetPlayerInput(appendIntent(playerInput, "I attack the nearest threat decisively."));
              }}
              style={{ opacity: canSubmit ? 1 : 0.6 }}
              title="Insert an attack intent"
            >
              Attack
            </button>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                playSfx(SFX.buttonClick, 0.58);
                onSetPlayerInput(
                  appendIntent(playerInput, "I reposition to a better angle and try to draw attention off an ally.")
                );
              }}
              style={{ opacity: canSubmit ? 1 : 0.6 }}
              title="Insert a reposition intent"
            >
              Reposition
            </button>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                playSfx(SFX.buttonClick, 0.58);
                onSetPlayerInput(
                  appendIntent(playerInput, "I assist an ally—calling out timing and creating an opening for them.")
                );
              }}
              style={{ opacity: canSubmit ? 1 : 0.6 }}
              title="Insert a help/assist intent"
            >
              Help Ally
            </button>

            {specialtyButtons.map((skill) => (
              <button
                key={skill.id}
                type="button"
                disabled={!canSubmit}
                onClick={() => {
                  if (!canSubmit) return;
                  playSfx(SFX.buttonClick, 0.58);
                  onSetPlayerInput(appendIntent(playerInput, buildSkillIntent(skill.id, skill.label)));
                }}
                style={{ opacity: canSubmit ? 1 : 0.6 }}
                title={`Insert ${skill.label} intent`}
              >
                {skill.label}
              </button>
            ))}

            {speechSupported && (
              <button
                type="button"
                disabled={!canSubmit}
                onClick={toggleListening}
                style={{
                  opacity: canSubmit ? 1 : 0.6,
                  border: isListening ? "1px solid rgba(255,120,120,0.35)" : undefined,
                  background: isListening ? "rgba(255,120,120,0.10)" : undefined,
                }}
                title={isListening ? "Stop microphone dictation" : "Start microphone dictation"}
              >
                {isListening ? "Stop Mic" : "🎤 Dictate"}
              </button>
            )}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                playSfx(SFX.buttonClick, 0.54);
                onSetPlayerInput("");
              }}
              style={{ opacity: canSubmit ? 0.85 : 0.5 }}
              title="Clear intent text"
            >
              Clear
            </button>
          </div>

          {(speechSupported || speechError) && (
            <div
              className="muted"
              style={{
                marginBottom: 10,
                fontSize: 12,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {speechSupported ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: isListening
                      ? "1px solid rgba(255,120,120,0.32)"
                      : "1px solid rgba(255,255,255,0.10)",
                    background: isListening ? "rgba(255,120,120,0.08)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  {isListening ? "Listening..." : "Microphone ready"}
                </span>
              ) : null}

              {speechBufferRef.current ? <span>Hearing: “{speechBufferRef.current}”</span> : null}

              {speechError ? <span>{speechError}</span> : null}
            </div>
          )}

          {!speechSupported && (
            <div className="muted" style={{ marginBottom: 10, fontSize: 12 }}>
              Microphone dictation is not available in this browser.
            </div>
          )}

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
              <button onClick={handleSubmit} disabled={!canSubmit}>
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
