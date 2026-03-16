"use client";

// ------------------------------------------------------------
// ActionSection.tsx
// ------------------------------------------------------------
// Combat / action cockpit
// - keeps the acting hero card as the single identity anchor
// - removes duplicate meta/turn chrome inside combat
// - keeps quick actions, dictation, pass-turn, and skill access
// - collapses party-turn management + loadout detail
// - reuses the same 3D hero portrait system as the header
// ------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import CardSection from "@/components/layout/CardSection";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import HeroRitualPortrait from "./hero-ritual/HeroRitualPortrait";

type PartyMemberLite = {
  id: string;
  label: string;
  species?: string;
  className?: string;
  portrait?: "Male" | "Female";
  skills?: string[];
  traits?: string[];
  ac?: number;
  hpMax?: number;
  hpCurrent?: number;
  initiativeMod?: number;
};

type PromptBanner = {
  visible?: boolean;
  promptText?: string | null;
  prefillText?: string | null;
};

type FinisherPrompt = PromptBanner & {
  skillId?: string | null;
  skillLabel?: string | null;
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

  dmMode: "human" | "solace-neutral" | null;
  isEnemyTurn: boolean;
  isWrongPlayerForTurn: boolean;
  activeTurnLabel: string | null;

  showPartyButtons: boolean;
  onCommitParty?: () => void;
  onRandomNames?: () => void;

  commitDisabled?: boolean;

  title?: string;
  eyebrow?: string;
  description?: string;
  inputPlaceholder?: string;
  showTurnCards?: boolean;
  showLoadoutDetails?: boolean;

  finisherPrompt?: FinisherPrompt | null;
  retreatPrompt?: PromptBanner | null;
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
    void audio.play().catch(() => {});
  } catch {
    // no-op
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

function extractDisplayName(label: string) {
  const raw = String(label ?? "").trim();
  const idx = raw.indexOf("(");
  return idx > 0 ? raw.slice(0, idx).trim() : raw;
}

function extractMetaLabel(label: string) {
  const raw = String(label ?? "").trim();
  const open = raw.indexOf("(");
  const close = raw.indexOf(")");
  if (open >= 0 && close > open) return raw.slice(open + 1, close).trim();
  return "";
}

function roleLineForMember(member: PartyMemberLite | null) {
  if (!member) return "Adventurer";

  const cls = String(member.className ?? "").toLowerCase();
  if (cls === "warrior" || cls === "paladin" || cls === "barbarian") return "Frontline Defender";
  if (cls === "rogue" || cls === "monk" || cls === "ranger") return "Mobile Striker";
  if (cls === "mage" || cls === "sorcerer" || cls === "warlock") return "Arcane Control";
  if (cls === "cleric" || cls === "bard" || cls === "druid") return "Support Specialist";
  if (cls === "artificer") return "Utility Tactician";
  return "Adventurer";
}

function flavorLineForMember(label: string, skills: string[], traits: string[]) {
  const name = extractDisplayName(label);

  if (skills.includes("arc_bolt")) {
    return `${name} gathers arcane force and watches the field for the right release.`;
  }
  if (skills.includes("frost_bind")) {
    return `${name} studies movement lanes, waiting to pin the enemy in place.`;
  }
  if (skills.includes("backstab")) {
    return `${name} searches for the exposed angle and the unguarded flank.`;
  }
  if (skills.includes("smite")) {
    return `${name} steadies conviction, ready to break the line at the crucial moment.`;
  }
  if (skills.includes("heal")) {
    return `${name} keeps one eye on the wounded, prepared to restore the faltering.`;
  }
  if (skills.includes("volley")) {
    return `${name} measures distance and spacing, ready to pressure the whole formation.`;
  }
  if (traits.includes("elf_keen_senses")) {
    return `${name} listens beyond the torchlight, reading danger before it shows itself.`;
  }
  if (traits.includes("human_resolve")) {
    return `${name} braces with steady resolve, ready to answer the next threat.`;
  }

  return `${name} studies the chamber, weighing position, risk, and the next decisive move.`;
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

function ActionChipButton(props: {
  label: string;
  title?: string;
  disabled?: boolean;
  onClick: () => void;
  accent?: "default" | "skill" | "dictate" | "clear" | "finisher";
}) {
  const { label, title, disabled, onClick, accent = "default" } = props;

  const styleByAccent: Record<NonNullable<typeof accent>, React.CSSProperties> = {
    default: {
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.06)",
    },
    skill: {
      border: "1px solid rgba(255,196,118,0.22)",
      background: "rgba(255,196,118,0.08)",
    },
    dictate: {
      border: "1px solid rgba(170,140,255,0.24)",
      background: "rgba(170,140,255,0.09)",
    },
    clear: {
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
    },
    finisher: {
      border: "1px solid rgba(255,174,88,0.36)",
      background:
        "linear-gradient(180deg, rgba(255,196,118,0.16), rgba(255,196,118,0.08))",
      boxShadow: "0 0 0 1px rgba(255,196,118,0.06)",
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      style={{
        padding: "8px 10px",
        borderRadius: 12,
        color: "inherit",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.56 : 1,
        transition:
          "transform 140ms ease, filter 140ms ease, border-color 140ms ease, background 140ms ease",
        ...styleByAccent[accent],
      }}
    >
      {label}
    </button>
  );
}

function StatMiniChip(props: { label: string; value: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 7px",
        borderRadius: 999,
        fontSize: 10,
        lineHeight: 1,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.05)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.58, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {props.label}
      </span>
      <strong style={{ fontSize: 11 }}>{props.value}</strong>
    </span>
  );
}

function TurnOrderRail(props: {
  members: PartyMemberLite[];
  actingPlayerId: string;
}) {
  const { members, actingPlayerId } = props;

  if (!members.length) return null;

  const actingIndex = members.findIndex((m) => m.id === actingPlayerId);
  const ordered =
    actingIndex >= 0
      ? [...members.slice(actingIndex), ...members.slice(0, actingIndex)]
      : members;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {ordered.map((member, idx) => {
        const active = member.id === actingPlayerId;
        const label = extractDisplayName(member.label);

        return (
          <React.Fragment key={`turn_${member.id}`}>
            <div
              style={{
                padding: "7px 10px",
                borderRadius: 999,
                border: active
                  ? "1px solid rgba(255,196,118,0.28)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: active ? "rgba(255,196,118,0.10)" : "rgba(255,255,255,0.04)",
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                whiteSpace: "nowrap",
              }}
            >
              {idx === 0 ? "Current: " : idx === 1 ? "Next: " : "Then: "}
              {label}
            </div>
            {idx < ordered.length - 1 ? (
              <span style={{ opacity: 0.36, fontSize: 14 }}>→</span>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CompactHeroPortrait3D(props: {
  species?: string;
  className?: string;
  portrait?: "Male" | "Female";
  alt: string;
  size: number;
  borderRadius: number;
  border: string;
  background: string;
  boxShadow?: string;
  objectPosition?: string;
}) {
  const {
    species = "Human",
    className = "Warrior",
    portrait = "Male",
    alt,
    size,
    borderRadius,
    border,
    background,
    boxShadow,
    objectPosition = "center 18%",
  } = props;

  const fallbackImageSrc = getPortraitPath(species, className, portrait);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        overflow: "hidden",
        border,
        background,
        boxShadow,
        position: "relative",
      }}
    >
      <HeroRitualPortrait
        species={species}
        className={className}
        portrait={portrait}
        imageSrc={fallbackImageSrc}
        fallbackImageSrc={fallbackImageSrc}
        alt={alt}
        height={size}
        objectPosition={objectPosition}
      />
    </div>
  );
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
  title = "Player Action",
  eyebrow = "Command",
  description = "Issue one clear command.",
  inputPlaceholder,
  showTurnCards = true,
  showLoadoutDetails = true,
  finisherPrompt = null,
  retreatPrompt = null,
}: Props) {
  const hasParty = partyMembers.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasAutoFocusedRef = useRef(false);
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

  const actingDisplayName = useMemo(() => extractDisplayName(actingLabel), [actingLabel]);
  const actingMetaLabel = useMemo(() => extractMetaLabel(actingLabel), [actingLabel]);
  const actingRoleLine = useMemo(() => roleLineForMember(actingMember), [actingMember]);

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

  const actingFlavorLine = useMemo(() => {
    return flavorLineForMember(actingLabel, actingSkillIds, actingTraitIds);
  }, [actingLabel, actingSkillIds, actingTraitIds]);

  const finisherSkillLabel = String(finisherPrompt?.skillLabel ?? "").trim();
  const finisherSkillId = String(finisherPrompt?.skillId ?? "").trim();

  const specialtyButtons = useMemo(() => {
    const base = actingSkillLabels.slice(0, 3);

    if (!finisherPrompt?.visible || !finisherSkillLabel) {
      return base;
    }

    const alreadyPresent = base.some(
      (skill) =>
        skill.id === finisherSkillId ||
        skill.label.toLowerCase() === finisherSkillLabel.toLowerCase()
    );

    if (alreadyPresent) return base;

    return [
      {
        id: finisherSkillId || finisherSkillLabel.toLowerCase().replace(/\s+/g, "_"),
        label: finisherSkillLabel,
      },
      ...base,
    ].slice(0, 3);
  }, [actingSkillLabels, finisherPrompt?.visible, finisherSkillId, finisherSkillLabel]);

  const lockReason = useMemo(() => {
    if (!combatActive) return null;
    if (dmMode === "human") return null;
    if (isEnemyTurn) return "Enemy movement is unfolding.";
    if (isWrongPlayerForTurn) return "This opening belongs to another ally.";
    return null;
  }, [combatActive, dmMode, isEnemyTurn, isWrongPlayerForTurn]);

  const actingCardsLocked = combatActive && dmMode !== "human";

  useEffect(() => {
    if (!canSubmit) return;
    if (hasAutoFocusedRef.current) return;

    const id = window.setTimeout(() => {
      textareaRef.current?.focus();
      hasAutoFocusedRef.current = true;
    }, 50);

    return () => window.clearTimeout(id);
  }, [canSubmit]);

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
      if (code === "no-speech") setSpeechError("No speech detected.");
      else if (code === "audio-capture") setSpeechError("No microphone detected.");
      else if (code === "not-allowed") setSpeechError("Microphone permission was denied.");
      else setSpeechError("Speech recognition error.");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = String(event.results[i]?.[0]?.transcript ?? "").trim();
        if (!transcript) continue;

        if (event.results[i].isFinal) finalTranscript += `${transcript} `;
        else interimTranscript += `${transcript} `;
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

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 9px",
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

  function insertFinisherIntent() {
    if (!canSubmit) return;
    playSfx(SFX.buttonClick, 0.58);

    const custom = String(finisherPrompt?.prefillText ?? "").trim();
    if (custom) {
      onSetPlayerInput(appendIntent(playerInput, custom));
      return;
    }

    if (finisherSkillId && finisherSkillLabel) {
      onSetPlayerInput(
        appendIntent(
          playerInput,
          `I commit fully and use ${finisherSkillLabel} to end this fight, even if the weapon fails in the strike.`
        )
      );
      return;
    }

    onSetPlayerInput(
      appendIntent(
        playerInput,
        "I commit to a decisive finishing strike and try to end the fight here."
      )
    );
  }

  function insertRetreatIntent() {
    if (!canSubmit) return;
    playSfx(SFX.buttonClick, 0.58);

    const custom = String(retreatPrompt?.prefillText ?? "").trim();
    if (custom) {
      onSetPlayerInput(appendIntent(playerInput, custom));
      return;
    }

    onSetPlayerInput(
      appendIntent(
        playerInput,
        "I disengage carefully, evade the immediate threat, and try to pull back toward a safer lane."
      )
    );
  }

  const showFinisherPrompt = !!finisherPrompt?.visible && !lockReason;
  const showRetreatPrompt = !!retreatPrompt?.visible && !lockReason;

  return (
    <div id="player-action" style={{ scrollMarginTop: 90 }}>
      <CardSection title={title}>
        <div style={{ display: "grid", gap: 12 }}>
          {hasParty ? (
            <div
              style={{
                display: "grid",
                gap: 10,
                padding: "14px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: canSubmit
                  ? "linear-gradient(180deg, rgba(255,196,118,0.05), rgba(0,0,0,0.28) 24%, rgba(0,0,0,0.24))"
                  : "rgba(0,0,0,0.24)",
                boxShadow: canSubmit ? "0 16px 36px rgba(0,0,0,0.22)" : "none",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr auto",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <CompactHeroPortrait3D
                  species={actingMember?.species ?? "Human"}
                  className={actingMember?.className ?? "Warrior"}
                  portrait={actingMember?.portrait ?? "Male"}
                  alt={`${actingDisplayName} portrait`}
                  size={64}
                  borderRadius={14}
                  border="1px solid rgba(255,196,118,0.24)"
                  background="rgba(255,196,118,0.08)"
                  boxShadow={canSubmit ? "0 0 0 4px rgba(255,196,118,0.05)" : "none"}
                  objectPosition="center 16%"
                />

                <div style={{ minWidth: 0, display: "grid", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{actingDisplayName}</div>
                    {actingMetaLabel ? (
                      <div style={{ fontSize: 12, opacity: 0.66 }}>{actingMetaLabel}</div>
                    ) : null}
                    {combatActive && activeTurnLabel ? (
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        Active: <strong>{activeTurnLabel}</strong>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.68, fontWeight: 700 }}>{actingRoleLine}</div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <StatMiniChip
                      label="HP"
                      value={`${actingMember?.hpCurrent ?? 0}/${actingMember?.hpMax ?? 0}`}
                    />
                    <StatMiniChip label="AC" value={actingMember?.ac ?? "—"} />
                    <StatMiniChip label="Init" value={actingMember?.initiativeMod ?? "—"} />
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.55 }}>
                    {lockReason ?? description}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      if (!combatActive || passDisabled) return;
                      playSfx(SFX.buttonClick, 0.66);
                      onPassTurn();
                    }}
                    disabled={!combatActive || passDisabled}
                    title="Advance to the next turn"
                    style={{
                      padding: "9px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "inherit",
                      opacity: !combatActive || passDisabled ? 0.5 : 1,
                      cursor: !combatActive || passDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    Pass / End Turn
                  </button>

                  {showPartyButtons ? (
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
                        style={{
                          padding: "9px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,196,118,0.24)",
                          background: "rgba(255,196,118,0.08)",
                          color: "inherit",
                          opacity: commitDisabled ? 0.5 : 0.92,
                          cursor: commitDisabled ? "not-allowed" : "pointer",
                        }}
                      >
                        Commit Party
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playSfx(SFX.buttonClick, 0.6);
                          onRandomNames?.();
                        }}
                        title="Fill missing party names"
                        style={{
                          padding: "9px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.04)",
                          color: "inherit",
                          opacity: 0.7,
                          cursor: "pointer",
                        }}
                      >
                        Random Names
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {showTurnCards ? (
                <details
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,0.18)",
                    overflow: "hidden",
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      padding: "11px 12px",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      opacity: 0.64,
                    }}
                  >
                    Party Turn Cards
                  </summary>

                  <div
                    style={{
                      padding: "0 12px 12px",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <TurnOrderRail members={partyMembers} actingPlayerId={actingPlayerId} />

                    {partyMembers.map((member) => {
                      const active = member.id === actingPlayerId;
                      const lockedByTurn = actingCardsLocked;
                      const displayName = extractDisplayName(member.label);
                      const meta = extractMetaLabel(member.label);

                      return (
                        <button
                          key={member.id}
                          type="button"
                          disabled={lockedByTurn}
                          onClick={() => {
                            if (lockedByTurn) return;
                            playSfx(SFX.buttonClick, 0.56);
                            onSetActingPlayerId(member.id);
                          }}
                          title={
                            lockedByTurn
                              ? "Locked during combat (Solace-neutral) to preserve turn integrity."
                              : `Act as ${displayName}`
                          }
                          style={{
                            textAlign: "left",
                            padding: "10px",
                            borderRadius: 14,
                            border: active
                              ? "1px solid rgba(255,196,118,0.34)"
                              : "1px solid rgba(255,255,255,0.10)",
                            background: active
                              ? "linear-gradient(180deg, rgba(255,196,118,0.10), rgba(255,255,255,0.03))"
                              : "rgba(255,255,255,0.04)",
                            color: "inherit",
                            opacity: lockedByTurn ? 0.7 : 1,
                            cursor: lockedByTurn ? "not-allowed" : "pointer",
                            display: "grid",
                            gridTemplateColumns: "40px 1fr",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <CompactHeroPortrait3D
                            species={member.species ?? "Human"}
                            className={member.className ?? "Warrior"}
                            portrait={member.portrait ?? "Male"}
                            alt={`${displayName} portrait`}
                            size={40}
                            borderRadius={10}
                            border={
                              active
                                ? "1px solid rgba(255,196,118,0.28)"
                                : "1px solid rgba(255,255,255,0.10)"
                            }
                            background="rgba(255,255,255,0.04)"
                            objectPosition="center 14%"
                          />

                          <div style={{ minWidth: 0, display: "grid", gap: 3 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                lineHeight: 1.2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {displayName}
                            </div>

                            <div
                              style={{
                                fontSize: 11,
                                opacity: 0.66,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {meta || member.id}
                            </div>

                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              <StatMiniChip label="HP" value={`${member.hpCurrent ?? 0}/${member.hpMax ?? 0}`} />
                              <StatMiniChip label="AC" value={member.ac ?? "—"} />
                              <StatMiniChip label="Init" value={member.initiativeMod ?? "—"} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </details>
              ) : null}

              {(showFinisherPrompt || showRetreatPrompt) && (
                <div style={{ display: "grid", gap: 8 }}>
                  {showFinisherPrompt ? (
                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,174,88,0.28)",
                        background:
                          "linear-gradient(180deg, rgba(255,196,118,0.12), rgba(255,196,118,0.05))",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.7,
                          color: "rgba(255,220,176,0.86)",
                          fontWeight: 800,
                        }}
                      >
                        Decisive Move
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              lineHeight: 1.55,
                              color: "rgba(245,236,216,0.96)",
                              fontWeight: 700,
                            }}
                          >
                            {finisherPrompt?.promptText ||
                              "The enemy is exposed. A decisive class skill could end this fight."}
                          </div>
                          {finisherSkillLabel ? (
                            <div style={{ fontSize: 12, opacity: 0.76 }}>
                              Skill: <strong>{finisherSkillLabel}</strong>
                            </div>
                          ) : null}
                        </div>

                        <ActionChipButton
                          label={finisherSkillLabel ? `⚡ ${finisherSkillLabel}` : "⚡ Decisive Strike"}
                          disabled={!canSubmit}
                          accent="finisher"
                          title="Insert the decisive combat skill into your command"
                          onClick={insertFinisherIntent}
                        />
                      </div>
                    </div>
                  ) : null}

                  {showRetreatPrompt ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(160,190,255,0.22)",
                        background: "rgba(160,190,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.55,
                          color: "rgba(228,232,240,0.90)",
                        }}
                      >
                        {retreatPrompt?.promptText ||
                          "You can now evade, disengage, or try to withdraw from the fight."}
                      </div>

                      <ActionChipButton
                        label="↩ Evade / Withdraw"
                        disabled={!canSubmit}
                        accent="default"
                        title="Insert an evade or withdrawal command"
                        onClick={insertRetreatIntent}
                      />
                    </div>
                  ) : null}
                </div>
              )}

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        opacity: 0.6,
                      }}
                    >
                      Quick Actions
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.72 }}>
                      Best commands usually include <strong>movement + target + intent</strong>.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <ActionChipButton
                      label="🛡 Guard"
                      disabled={!canSubmit}
                      title="Insert a cover + posture intent"
                      onClick={() => {
                        if (!canSubmit) return;
                        playSfx(SFX.buttonClick, 0.58);
                        onSetPlayerInput(
                          appendIntent(playerInput, "I move to cover and take a guarded stance, watching for openings.")
                        );
                      }}
                    />

                    <ActionChipButton
                      label="⚔ Strike"
                      disabled={!canSubmit}
                      title="Insert an attack intent"
                      onClick={() => {
                        if (!canSubmit) return;
                        playSfx(SFX.buttonClick, 0.58);
                        onSetPlayerInput(
                          appendIntent(playerInput, "I attack the nearest threat decisively.")
                        );
                      }}
                    />

                    <ActionChipButton
                      label="🏃 Reposition"
                      disabled={!canSubmit}
                      title="Insert a reposition intent"
                      onClick={() => {
                        if (!canSubmit) return;
                        playSfx(SFX.buttonClick, 0.58);
                        onSetPlayerInput(
                          appendIntent(
                            playerInput,
                            "I reposition to a better angle and try to draw attention off an ally."
                          )
                        );
                      }}
                    />

                    <ActionChipButton
                      label="🤝 Aid Ally"
                      disabled={!canSubmit}
                      title="Insert a help/assist intent"
                      onClick={() => {
                        if (!canSubmit) return;
                        playSfx(SFX.buttonClick, 0.58);
                        onSetPlayerInput(
                          appendIntent(
                            playerInput,
                            "I assist an ally—calling out timing and creating an opening for them."
                          )
                        );
                      }}
                    />

                    {speechSupported ? (
                      <ActionChipButton
                        label={isListening ? "■ Stop Dictation" : "🎙 Dictate"}
                        disabled={!canSubmit}
                        title={isListening ? "Stop microphone dictation" : "Start microphone dictation"}
                        accent="dictate"
                        onClick={toggleListening}
                      />
                    ) : null}

                    <ActionChipButton
                      label="Clear"
                      disabled={!canSubmit}
                      title="Clear intent text"
                      accent="clear"
                      onClick={() => {
                        if (!canSubmit) return;
                        playSfx(SFX.buttonClick, 0.54);
                        onSetPlayerInput("");
                      }}
                    />
                  </div>
                </div>

                {specialtyButtons.length > 0 ? (
                  <details
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.18)",
                      overflow: "hidden",
                    }}
                  >
                    <summary
                      style={{
                        cursor: "pointer",
                        padding: "11px 12px",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        opacity: 0.64,
                      }}
                    >
                      Class Skills
                    </summary>

                    <div
                      style={{
                        padding: "0 12px 12px",
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {specialtyButtons.map((skill) => {
                        const isFinisherSkill =
                          !!finisherPrompt?.visible &&
                          (skill.id === finisherSkillId ||
                            skill.label.toLowerCase() === finisherSkillLabel.toLowerCase());

                        return (
                          <ActionChipButton
                            key={skill.id}
                            label={skill.label}
                            disabled={!canSubmit}
                            title={`Insert ${skill.label} intent`}
                            accent={isFinisherSkill ? "finisher" : "skill"}
                            onClick={() => {
                              if (!canSubmit) return;
                              playSfx(SFX.buttonClick, 0.58);

                              if (isFinisherSkill) {
                                insertFinisherIntent();
                                return;
                              }

                              onSetPlayerInput(
                                appendIntent(playerInput, buildSkillIntent(skill.id, skill.label))
                              );
                            }}
                          />
                        );
                      })}
                    </div>
                  </details>
                ) : null}

                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      opacity: 0.6,
                    }}
                  >
                    Command
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={playerInput}
                    onChange={(e) => onSetPlayerInput(e.target.value)}
                    placeholder={
                      inputPlaceholder ??
                      (lockReason
                        ? "Hold position while the current turn resolves…"
                        : "Describe what your character does…")
                    }
                    disabled={!canSubmit}
                    style={{
                      width: "100%",
                      minHeight: "136px",
                      resize: "vertical",
                      boxSizing: "border-box",
                      lineHeight: 1.55,
                      borderRadius: 14,
                      border: canSubmit
                        ? "1px solid rgba(255,196,118,0.16)"
                        : "1px solid rgba(255,255,255,0.10)",
                      background: canSubmit ? "rgba(0,0,0,0.34)" : "rgba(0,0,0,0.22)",
                      color: "inherit",
                      padding: "12px 12px",
                      outline: "none",
                      opacity: canSubmit ? 1 : 0.86,
                      boxShadow: canSubmit ? "inset 0 0 0 1px rgba(255,196,118,0.03)" : "none",
                    }}
                  />
                </div>

                {showLoadoutDetails && (actingSkillLabels.length > 0 || actingTraitLabels.length > 0) ? (
                  <details
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.18)",
                      overflow: "hidden",
                    }}
                  >
                    <summary
                      style={{
                        cursor: "pointer",
                        padding: "11px 12px",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        opacity: 0.64,
                      }}
                    >
                      Active Loadout
                    </summary>

                    <div
                      style={{
                        padding: "0 12px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 12, opacity: 0.74 }}>Class Skills</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 22 }}>
                          {actingSkillLabels.length > 0 ? (
                            actingSkillLabels.map((skill) => (
                              <span key={skill.id} style={chipStyle} title={skill.id}>
                                {skill.label}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, opacity: 0.6 }}>No class skills</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 12, opacity: 0.74 }}>Species Traits</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 22 }}>
                          {actingTraitLabels.length > 0 ? (
                            actingTraitLabels.map((trait) => (
                              <span key={trait.id} style={traitChipStyle} title={trait.id}>
                                {trait.label}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, opacity: 0.6 }}>No species traits</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                ) : null}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,196,118,0.28)",
                        background: canSubmit
                          ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                          : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
                        color: canSubmit ? "#2f1606" : "rgba(244,227,201,0.75)",
                        boxShadow: canSubmit
                          ? "0 10px 28px rgba(255,145,42,0.16), inset 0 1px 0 rgba(255,244,220,0.72)"
                          : "none",
                        fontWeight: 900,
                        cursor: canSubmit ? "pointer" : "not-allowed",
                      }}
                    >
                      Resolve Action
                    </button>

                    {speechSupported || speechError ? (
                      <div
                        style={{
                          fontSize: 12,
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                          alignItems: "center",
                          opacity: 0.74,
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
                              background: isListening
                                ? "rgba(255,120,120,0.08)"
                                : "rgba(255,255,255,0.04)",
                            }}
                          >
                            {isListening ? "Listening..." : "Microphone ready"}
                          </span>
                        ) : null}

                        {speechBufferRef.current ? <span>Hearing: “{speechBufferRef.current}”</span> : null}
                        {speechError ? <span>{speechError}</span> : null}
                      </div>
                    ) : null}
                  </div>

                  {!canSubmit && combatActive && dmMode !== "human" ? (
                    <span style={{ fontSize: 12, opacity: 0.72 }}>
                      {isEnemyTurn
                        ? "Enemy turn — watch the battlefield above."
                        : "Turn locked — wait for the next opening."}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardSection>
    </div>
  );
}
