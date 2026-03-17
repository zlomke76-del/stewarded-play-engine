"use client";

import type { EnemyEncounterTheme } from "@/lib/game/EnemyDatabase";

export type PartyMemberLite = {
  id: string;
  name: string;
  species?: string;
  className: string;
  portrait: "Male" | "Female";
  skills?: string[];
  traits?: string[];
  ac: number;
  hpMax: number;
  hpCurrent: number;
  initiativeMod: number;
};

export type EnemyTelegraphHint = {
  enemyName: string;
  targetName: string;
  attackStyleHint: "volley" | "beam" | "charge" | "unknown";
};

export type DerivedCombatLite = {
  combatId: string;
  round: number;
  order: string[];
  activeCombatantId: string | null;
  participants: any[];
  initiative: any[];
};

export type CombatEncounterContext = {
  zoneId?: string | null;
  zoneTheme?: EnemyEncounterTheme | null;
  objective?: string | null;
  lockState?: string | null;
  rewardHint?: string | null;
  keyEnemyName?: string | null;
  relicEnemyName?: string | null;
  cacheGuardEnemyName?: string | null;
};

export type ActionSurfacePartyMember = {
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

export type ActionSurfaceProps = {
  partyMembers: ActionSurfacePartyMember[];
  actingPlayerId: string;
  onSetActingPlayerId: (id: string) => void;
  playerInput: string;
  onSetPlayerInput: (v: string) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  onPassTurn: () => void;
  onRecord: (payload: any) => void;
  options: any[] | null;
  selectedOption: any | null;
  onSetSelectedOption: (option: any | null) => void;
  dmMode: "human" | "solace-neutral" | null;
  role: string;
  resolutionDmMode: string;
  currentRoomTitle?: string;
  roomSummary?: string;
  resolutionMovement?: {
    from?: { x: number; y: number } | null;
    to?: { x: number; y: number } | null;
    direction?: "north" | "south" | "east" | "west" | "none" | null;
  } | null;
  resolutionCombat?: {
    activeEnemyGroupName?: string | null;
    isEnemyTurn?: boolean;
    attackStyleHint?: "volley" | "beam" | "charge" | "unknown";
  } | null;
  actingRollModifier?: number;
  actingPlayerInjuryStacks?: number;
  title?: string;
  eyebrow?: string;
  description?: string;
  inputPlaceholder?: string;
};

export type CombatSectionProps = {
  events: any[];
  dmMode: "human" | "solace-neutral" | null;

  onAppendCanon: (type: string, payload: any) => void;

  openingCombatRound?: number;
  canAttemptCombatRetreat?: boolean;
  openingBattleFinisherAvailable?: boolean;
  openingBattleFinisherSkillLabel?: string | null;
  isOpeningThresholdCombat?: boolean;

  partyMembers: PartyMemberLite[];
  pressureTier: "low" | "medium" | "high";
  allowDevControls: boolean;

  encounterContext?: CombatEncounterContext | null;

  showEnemyResolver: boolean;
  activeEnemyGroupName: string | null;
  activeEnemyGroupId: string | null;
  playerNames: string[];
  onTelegraph: (info: EnemyTelegraphHint) => void;
  onCommitOutcomeOnly: (payload: any) => void;
  onAdvanceTurn: () => void;
  enemyTelegraphHint: EnemyTelegraphHint | null;

  derivedCombat: DerivedCombatLite | null;
  activeCombatantSpec: any | null;
  combatEnded: boolean;
  isEnemyTurn: boolean;
  isWrongPlayerForTurn: boolean;

  onAdvanceTurnBtn: () => void;
  onPassTurnBtn: () => void;
  onEndCombatBtn: () => void;

  actionSurface: ActionSurfaceProps;
};

export type HpState = {
  hpMax: number;
  hpCurrent: number;
  downed: boolean;
};

export type EnemyRosterCard = {
  combatantId: string;
  enemyName: string;
  label: string;
  hpMax: number;
  hpCurrent: number;
  ac: number;
  defeated: boolean;
  initiativeMod: number;
  portraitSrc: string;
  portraitKey: string | null;
  factionLabel: string;
  roleLabel: string;
  isActive: boolean;
  isKeybearer: boolean;
  isRelicBearer: boolean;
  isCacheGuard: boolean;
};

export type StageCombatantView = {
  name: string;
  species?: string;
  className?: string;
  portrait?: "Male" | "Female";
  imageSrc?: string | null;
  fallbackImageSrc?: string | null;
  modelSrc?: string | null;
  hpCurrent?: number;
  hpMax?: number;
  ac?: number;
  defeated?: boolean;
  active?: boolean;
};

export type TurnTone = {
  label: string;
  border: string;
  bg: string;
  text: string;
};

export type PressureTone = {
  border: string;
  bg: string;
};

export type CombatSectionModel = {
  combatId: string | null;
  playerHpById: Record<string, HpState>;
  enemyHpById: Record<string, HpState>;
  partyMembersForDisplay: PartyMemberLite[];
  activePlayerId: string | null;
  telegraphTargetKey: string | null;
  enemyRoster: EnemyRosterCard[];
  activeEnemyCard: EnemyRosterCard | null;
  turnTone: TurnTone;
  pressureTone: PressureTone;
  stageHero: StageCombatantView | null;
  stageEnemy: StageCombatantView | null;
};
