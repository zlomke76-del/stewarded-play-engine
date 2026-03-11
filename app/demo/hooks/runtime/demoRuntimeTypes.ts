import type { EnemyEncounterTheme } from "@/lib/game/EnemyDatabase";

export type PartyMember = {
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

export type PartyDeclaredPayload = {
  partyId: string;
  members: PartyMember[];
};

export type PresentationPhase =
  | "onboarding"
  | "chronicle"
  | "party-declaration"
  | "tavern"
  | "gameplay";

export type GameplayFocusStep = "pressure" | "map" | "puzzle" | "action";

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

export type MusicMode = "none" | "intro" | "ambient" | "combat";

export type RoomInteractionMode =
  | "threshold"
  | "navigation"
  | "trial"
  | "command"
  | "combat";
