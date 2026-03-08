"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// Orchestrator only.
// UI sections are composed here.
//
// Recent focus upgrades implemented in this file:
// - New top-of-page onboarding: "Echoes of Fate" + consequence hook
// - Play Style: Human vs Solace as a toggle (no heavy explanation up front)
// - Party Size selection up-front + simple party visual (⚔ icons)
// - "Enter the Dungeon" as the singular primary CTA into the next section
// - Chapters grid simplified early (progressive disclosure)
// - Canonical escalation events emitted on OUTCOME:
//     ZONE_PRESSURE_CHANGED + ZONE_AWARENESS_CHANGED
//   (DungeonPressurePanel now updates deterministically)
// - OptionKind inference uses combined intent + option text (fixes "everything safe")
//
// Updated flow requirement (this change):
// - Initial Table stays hidden until:
//     1) mode selected
//     2) player count declared
//     3) Enter pressed
// - After Accept Table:
//     user must DECLARE PLAYERS
// - Pressure/Map/Combat/Action stay locked until PARTY_DECLARED exists
// - Chapters "Party" represents PARTY_DECLARED (not just party size)
//
// Gameplay focus update:
// - After PARTY_DECLARED, gameplay is staged:
//     1) Pressure focus
//     2) Map focus
//     3) Action focus
// - The command window no longer steals immediate attention
// - The player first reads danger, then space, then acts
//
// Theme polish update:
// - Stage-transition controls are no longer generic utility buttons
// - Pressure → Map and Map → Action now use ritual prompt rows
// - Prompts are styled as in-world chapter transitions, not app buttons
//
// Audio update:
// - Intro music is owned at page level (not hero component level)
// - Hero "Enter" triggers /audio/music/chronicles_intro.mp3
// - Intro now loops until Initial Table is accepted
// - Ambient dungeon music rotates across two exploration tracks
// - Combat music rotates across two battle tracks
// - Combat transitions override ambient cleanly, then return to ambient
//
// Party defaults update:
// - Starter parties now generate with curated class/species/portrait variety
// - Defaults are balanced and visually diverse instead of blank / all-Human
// - Names remain blank so players can still author identity intentionally
//
// Ecology / encounter-context update:
// - Derives lightweight encounter context from current zone, marks, intent,
//   enemy presence, and lock / cache / relic signals
// - Passes encounterContext into CombatSection so CombatSetupPanel can bias
//   rosters toward meaningful, finite encounters
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { createSession, recordEvent, SessionState } from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";

import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import NextActionHint from "@/components/NextActionHint";
import DungeonPressurePanel from "@/components/world/DungeonPressurePanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";

import { deriveCombatState, findLatestCombatId, nextTurnPointer } from "@/lib/combat/CombatState";
import { resolvePartyLoadout } from "@/lib/skills/loadoutResolver";
import { deriveDiscoveryEvents } from "@/lib/world/ExplorationDiscovery";

import AmbientBackground from "./components/AmbientBackground";
import InitialTableSection from "./components/InitialTableSection";

import HeroOnboarding from "./components/HeroOnboarding";
import PartySetupSection from "./components/PartySetupSection";
import MapSection from "./components/MapSection";
import ActionSection from "./components/ActionSection";
import CombatSection from "./components/CombatSection";
import CanonChronicleSection from "./components/CanonChronicleSection";

import { DMMode, DemoSectionId, DiceMode, RollSource, InitialTable, ExplorationDraft } from "./demoTypes";

import {
  anchorId,
  scrollToSection,
  clampInt,
  normalizeName,
  randomName,
  generateInitialTable,
  renderInitialTableNarration,
  inferOptionKind,
  withinBounds,
  deriveCurrentPosition,
  revealRadius,
  inferDirection,
  stepFrom,
  textSuggestsDoor,
  textSuggestsLocked,
  isCombatEndedForId,
} from "./demoUtils";

// ------------------------------------------------------------
// Party (Session-level truth)
// ------------------------------------------------------------

type PartyMember = {
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

type PartyDeclaredPayload = {
  partyId: string;
  members: PartyMember[];
};

type PresentationPhase =
  | "onboarding"
  | "chronicle"
  | "party-declaration"
  | "gameplay";

type GameplayFocusStep = "pressure" | "map" | "action";

type EncounterTheme =
  | "corridor"
  | "crypt"
  | "ritual"
  | "arcane"
  | "wild"
  | "warband"
  | "vault"
  | null;

type CombatEncounterContext = {
  zoneId?: string | null;
  zoneTheme?: EncounterTheme;
  objective?: string | null;
  lockState?: string | null;
  rewardHint?: string | null;
  keyEnemyName?: string | null;
  relicEnemyName?: string | null;
  cacheGuardEnemyName?: string | null;
};

type MapMarkKind = "door" | "stairs" | "altar" | "cache" | "hazard";

type XY = { x: number; y: number };

const STARTER_CLASS_PLANS: Record<1 | 2 | 3 | 4 | 5 | 6, readonly string[]> = {
  1: ["Warrior"],
  2: ["Warrior", "Cleric"],
  3: ["Warrior", "Rogue", "Mage"],
  4: ["Warrior", "Rogue", "Mage", "Cleric"],
  5: ["Warrior", "Rogue", "Mage", "Cleric", "Ranger"],
  6: ["Warrior", "Rogue", "Mage", "Cleric", "Ranger", "Paladin"],
};

const STARTER_SPECIES_PLAN = [
  "Human",
  "Elf",
  "Dwarf",
  "Tiefling",
  "Halfling",
  "Dragonborn",
] as const;

const STARTER_PORTRAIT_PLAN: ReadonlyArray<"Male" | "Female"> = [
  "Male",
  "Female",
  "Male",
  "Female",
  "Male",
  "Female",
];

function safeInt(n: unknown, fallback: number, lo: number, hi: number) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : fallback;
  return Math.max(lo, Math.min(hi, x));
}

function displayName(m: PartyMember, i1: number) {
  const n = normalizeName(m.name || "");
  return n.length > 0 ? n : `Player ${i1}`;
}

function buildStarterMember(slotIndex: number, partyCount: number): PartyMember {
  const count = clampInt(partyCount, 1, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const classPlan = STARTER_CLASS_PLANS[count];
  const className = classPlan[Math.min(slotIndex, classPlan.length - 1)] ?? "Warrior";
  const species = STARTER_SPECIES_PLAN[slotIndex % STARTER_SPECIES_PLAN.length] ?? "Human";
  const portrait = STARTER_PORTRAIT_PLAN[slotIndex % STARTER_PORTRAIT_PLAN.length] ?? "Male";

  const canonical = resolvePartyLoadout(className, species);

  const hpBaseByClass: Record<string, number> = {
    Warrior: 14,
    Paladin: 14,
    Barbarian: 15,
    Cleric: 12,
    Ranger: 12,
    Rogue: 11,
    Monk: 11,
    Artificer: 11,
    Bard: 10,
    Druid: 10,
    Mage: 9,
    Sorcerer: 9,
    Warlock: 10,
  };

  const acBaseByClass: Record<string, number> = {
    Warrior: 14,
    Paladin: 15,
    Barbarian: 13,
    Cleric: 13,
    Ranger: 13,
    Rogue: 13,
    Monk: 13,
    Artificer: 13,
    Bard: 12,
    Druid: 12,
    Mage: 11,
    Sorcerer: 11,
    Warlock: 12,
  };

  const initBaseByClass: Record<string, number> = {
    Warrior: 1,
    Paladin: 0,
    Barbarian: 1,
    Cleric: 0,
    Ranger: 2,
    Rogue: 3,
    Monk: 3,
    Artificer: 1,
    Bard: 2,
    Druid: 1,
    Mage: 1,
    Sorcerer: 2,
    Warlock: 1,
  };

  const hpMax = hpBaseByClass[className] ?? 12;
  const ac = acBaseByClass[className] ?? 14;
  const initiativeMod = initBaseByClass[className] ?? 1;

  return {
    id: `player_${slotIndex + 1}`,
    name: "",
    species,
    className,
    portrait,
    skills: canonical.skillIds,
    traits: canonical.traitIds,
    ac,
    hpMax,
    hpCurrent: hpMax,
    initiativeMod,
  };
}

function defaultParty(count: number): PartyDeclaredPayload {
  const n = clampInt(count, 1, 6);
  return {
    partyId: crypto.randomUUID(),
    members: Array.from({ length: n }, (_, i) => buildStarterMember(i, n)),
  };
}

function deriveLatestParty(events: readonly any[]): PartyDeclaredPayload | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e?.type !== "PARTY_DECLARED") continue;
    const p = e?.payload as PartyDeclaredPayload;
    if (!p || !Array.isArray(p.members)) continue;
    return p;
  }
  return null;
}

type PressureTier = "low" | "medium" | "high";

function inferPressureTier(outcomesCount: number): PressureTier {
  if (outcomesCount <= 1) return "low";
  if (outcomesCount <= 5) return "medium";
  return "high";
}

// ------------------------------------------------------------
// Injury / Downed (event-derived, safe default)
// ------------------------------------------------------------

function deriveInjuryStacksForPlayer(events: readonly any[], playerId: string): number {
  const pid = String(playerId ?? "").trim();
  if (!pid) return 0;

  let stacks = 0;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const t = e?.type;
    const p = e?.payload ?? {};

    if (t === "INJURY_APPLIED") {
      const ppid = String(p?.playerId ?? "");
      if (ppid === pid) {
        if (Number.isFinite(Number(p?.stacks))) stacks = Math.max(0, Math.trunc(Number(p.stacks)));
        else if (Number.isFinite(Number(p?.delta))) stacks = Math.max(0, stacks + Math.trunc(Number(p.delta)));
        else stacks = Math.max(0, stacks + 1);
      }
      continue;
    }

    if (t === "INJURY_STACK_CHANGED") {
      const ppid = String(p?.playerId ?? "");
      if (ppid === pid) {
        const d = Number.isFinite(Number(p?.delta)) ? Math.trunc(Number(p.delta)) : 0;
        stacks = Math.max(0, stacks + d);
      }
      continue;
    }

    if (t === "PLAYER_DOWNED") {
      const ppid = String(p?.playerId ?? "");
      if (ppid === pid) stacks = Math.max(0, stacks + 1);
      continue;
    }

    if (t === "DAMAGE_APPLIED") {
      const targetId = String(p?.targetId ?? "");
      if (targetId === pid && p?.downed === true) stacks = Math.max(0, stacks + 1);
      continue;
    }
  }

  return stacks;
}

// ------------------------------------------------------------
// Zone derivation helpers
// ------------------------------------------------------------

const ZONE_SIZE_TILES = 4;

function zoneIdFromTileXY(x: number, y: number) {
  const zx = Math.floor(x / ZONE_SIZE_TILES);
  const zy = Math.floor(y / ZONE_SIZE_TILES);
  return `${zx},${zy}`;
}

function clamp01to100(n: number) {
  const x = Math.round(n);
  return Math.max(0, Math.min(100, x));
}

function pressureDeltaFor(kind: ReturnType<typeof inferOptionKind>, success: boolean) {
  const base = 1;
  const byKind = kind === "contested" ? 4 : kind === "risky" ? 3 : kind === "environmental" ? 2 : 1;
  const byResult = success ? 1 : 6;
  return base + byKind + byResult;
}

function awarenessDeltaFor(kind: ReturnType<typeof inferOptionKind>, success: boolean) {
  const base = 0;
  const byKind = kind === "contested" ? 8 : kind === "risky" ? 5 : kind === "environmental" ? 2 : 1;
  const byResult = success ? 1 : 10;
  return base + byKind + byResult;
}

function includesAny(text: string, needles: string[]) {
  const t = String(text || "").toLowerCase();
  return needles.some((n) => t.includes(n));
}

function deriveMapMarksForZone(events: readonly any[], zoneId: string) {
  const marks: Array<{
    at: XY;
    kind: MapMarkKind;
    note: string | null;
    zoneId: string;
    timestamp: number;
  }> = [];

  for (const e of events) {
    if (e?.type !== "MAP_MARKED") continue;
    const p = e?.payload ?? {};
    const x = Number(p?.at?.x);
    const y = Number(p?.at?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    const zid = zoneIdFromTileXY(x, y);
    if (zid !== zoneId) continue;

    const kind = String(p?.kind ?? "").trim() as MapMarkKind;
    if (!kind) continue;

    marks.push({
      at: { x, y },
      kind,
      note: String(p?.note ?? "").trim() || null,
      zoneId: zid,
      timestamp: Number(e?.timestamp ?? 0),
    });
  }

  return marks.sort((a, b) => b.timestamp - a.timestamp);
}

function inferEncounterTheme(args: {
  activeEnemyName: string | null;
  playerInput: string;
  selectedOptionDescription: string;
  marks: Array<{ kind: MapMarkKind; note: string | null }>;
}): EncounterTheme {
  const text = [
    args.activeEnemyName ?? "",
    args.playerInput,
    args.selectedOptionDescription,
    ...args.marks.map((m) => `${m.kind} ${m.note ?? ""}`),
  ]
    .join(" ")
    .toLowerCase();

  if (includesAny(text, ["wraith", "skeleton", "zombie", "ghoul", "crypt", "grave", "tomb", "bone"])) {
    return "crypt";
  }

  if (includesAny(text, ["cult", "priest", "altar", "ritual", "hex", "acolyte", "unholy"])) {
    return "ritual";
  }

  if (includesAny(text, ["arcane", "construct", "sentinel", "golem", "drone", "vault", "relic"])) {
    return "arcane";
  }

  if (includesAny(text, ["wolf", "dire wolf", "spider", "web", "beast", "hellhound"])) {
    return "wild";
  }

  if (includesAny(text, ["orc", "warlord", "raider", "warband", "hobgoblin"])) {
    return "warband";
  }

  if (includesAny(text, ["cache", "sealed", "locked", "key", "treasure", "chest"])) {
    return "vault";
  }

  if (includesAny(text, ["bandit", "goblin", "door", "corridor", "hall"])) {
    return "corridor";
  }

  return null;
}

function inferLockState(args: {
  playerInput: string;
  selectedOptionDescription: string;
  marks: Array<{ kind: MapMarkKind; note: string | null }>;
}) {
  const noteText = args.marks.map((m) => `${m.kind} ${m.note ?? ""}`).join(" ").toLowerCase();
  const text = `${args.playerInput} ${args.selectedOptionDescription} ${noteText}`.toLowerCase();

  if (includesAny(text, ["locked", "sealed", "barred"])) return "locked";
  if (includesAny(text, ["open", "breached", "unlocked"])) return "open";
  if (args.marks.some((m) => m.kind === "door")) return "door-present";
  return null;
}

function inferRewardHint(args: {
  marks: Array<{ kind: MapMarkKind; note: string | null }>;
  playerInput: string;
  selectedOptionDescription: string;
}) {
  const noteText = args.marks.map((m) => `${m.kind} ${m.note ?? ""}`).join(" ").toLowerCase();
  const text = `${args.playerInput} ${args.selectedOptionDescription} ${noteText}`.toLowerCase();

  if (includesAny(text, ["cache", "supplies", "coin", "stash"])) return "cache";
  if (includesAny(text, ["chest", "treasure", "loot"])) return "treasure";
  if (includesAny(text, ["key"])) return "key";
  if (includesAny(text, ["relic", "altar", "artifact"])) return "relic";
  return null;
}

function defaultKeyEnemyForTheme(theme: EncounterTheme): string | null {
  switch (theme) {
    case "corridor":
      return "Bandit Captain";
    case "crypt":
      return "Hobgoblin Soldier";
    case "ritual":
      return "Cult Priest";
    case "arcane":
      return "Arcane Sentinel";
    case "wild":
      return "Goblin Skirmisher";
    case "warband":
      return "Orc Warlord";
    case "vault":
      return "Ancient Warden";
    default:
      return null;
  }
}

function defaultRelicEnemyForTheme(theme: EncounterTheme): string | null {
  switch (theme) {
    case "crypt":
      return "Wraith";
    case "ritual":
      return "Cult Priest";
    case "arcane":
      return "Iron Guardian";
    case "wild":
      return "Hellhound";
    case "warband":
      return "Orc Warlord";
    case "vault":
      return "Ancient Warden";
    case "corridor":
      return "Bandit Captain";
    default:
      return null;
  }
}

function defaultCacheGuardEnemyForTheme(theme: EncounterTheme): string | null {
  switch (theme) {
    case "corridor":
      return "Bandit Archer";
    case "crypt":
      return "Skeleton Warrior";
    case "ritual":
      return "Cultist Acolyte";
    case "arcane":
      return "Arcane Drone";
    case "wild":
      return "Giant Spider";
    case "warband":
      return "Orc Raider";
    case "vault":
      return "Stone Golem";
    default:
      return null;
  }
}

function inferObjective(args: {
  theme: EncounterTheme;
  lockState: string | null;
  rewardHint: string | null;
}) {
  if (args.lockState === "locked") {
    return "Secure the keyholder and break access deeper into the zone.";
  }

  if (args.rewardHint === "cache") {
    return "Break resistance around the cache and secure the supplies.";
  }

  if (args.rewardHint === "treasure") {
    return "Clear the chamber and claim the chest before the zone escalates.";
  }

  if (args.rewardHint === "relic") {
    return "Defeat the bearer and secure the relic bound to this chamber.";
  }

  switch (args.theme) {
    case "ritual":
      return "Disrupt the ritual cell before they reinforce the chamber.";
    case "arcane":
      return "Disable the sentries controlling the zone.";
    case "crypt":
      return "Push through the dead and stabilize the burial corridor.";
    case "wild":
      return "Clear the predators holding this route.";
    case "warband":
      return "Break the warband's line before pressure spikes.";
    case "vault":
      return "Crack the defenders guarding the zone's valuable hold.";
    case "corridor":
      return "Seize control of the corridor and advance.";
    default:
      return null;
  }
}

type MusicMode = "none" | "intro" | "ambient" | "combat";

const AMBIENT_TRACKS = ["/audio/music/dungeon_ambient1.mp3", "/audio/music/dungeon_ambient2.mp3"] as const;
const COMBAT_TRACKS = ["/audio/music/combat_theme1.mp3", "/audio/music/combat_theme2.mp3"] as const;

function chooseNextTrack(tracks: readonly string[], lastIndexRef: React.MutableRefObject<number>): string {
  if (tracks.length <= 1) {
    lastIndexRef.current = 0;
    return tracks[0] ?? "";
  }

  let nextIndex = Math.floor(Math.random() * tracks.length);
  if (nextIndex === lastIndexRef.current) {
    nextIndex = (nextIndex + 1) % tracks.length;
  }

  lastIndexRef.current = nextIndex;
  return tracks[nextIndex];
}

function RitualPromptRow(props: {
  title: string;
  body: string;
  actionLabel: string;
  hint?: string;
  onActivate: () => void;
}) {
  const { title, body, actionLabel, hint, onActivate } = props;

  return (
    <CardSection title={title}>
      <div style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0, lineHeight: 1.65, opacity: 0.9 }}>{body}</p>

        <button
          type="button"
          onClick={onActivate}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px solid rgba(214, 188, 120, 0.22)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 28px rgba(0,0,0,0.22)",
            cursor: "pointer",
            transition:
              "border-color 160ms ease, background 160ms ease, transform 160ms ease, box-shadow 160ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(214, 188, 120, 0.38)";
            e.currentTarget.style.background =
              "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "inset 0 1px 0 rgba(255,255,255,0.07), 0 14px 34px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(214, 188, 120, 0.22)";
            e.currentTarget.style.background =
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 28px rgba(0,0,0,0.22)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Chapter Transition
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: "rgba(245,236,216,0.96)",
                }}
              >
                {actionLabel}
              </span>
            </div>

            <span
              aria-hidden
              style={{
                fontSize: 20,
                opacity: 0.62,
                transform: "translateX(0)",
              }}
            >
              →
            </span>
          </div>
        </button>

        {hint ? (
          <div style={{ fontSize: 12, opacity: 0.68, lineHeight: 1.5 }}>{hint}</div>
        ) : null}
      </div>
    </CardSection>
  );
}

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));
  const [dmMode, setDmMode] = useState<DMMode | null>(null);

  const MAP_W = 13;
  const MAP_H = 9;

  const HERO_IMAGE_SRC = "/Hero_dungeon.png";
  const [heroImageOk, setHeroImageOk] = useState(true);

  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentMusicModeRef = useRef<MusicMode>("none");
  const lastAmbientIndexRef = useRef(-1);
  const lastCombatIndexRef = useRef(-1);

  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);
  const [tableDraftText, setTableDraftText] = useState("");
  const [enteredDungeon, setEnteredDungeon] = useState(false);

  const [activeSection, setActiveSection] = useState<DemoSectionId>("mode");
  const [gameplayFocusStep, setGameplayFocusStep] = useState<GameplayFocusStep>("pressure");

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const [actingPlayerId, setActingPlayerId] = useState<string>("player_1");

  const [enemyPlayNonce, setEnemyPlayNonce] = useState(0);

  const [enemyTelegraphHint, setEnemyTelegraphHint] = useState<{
    enemyName: string;
    targetName: string;
    attackStyleHint: "volley" | "beam" | "charge" | "unknown";
  } | null>(null);

  const outcomesCount = useMemo(() => state.events.filter((e: any) => e?.type === "OUTCOME").length, [state.events]);

  const canonCount = useMemo(
    () => state.events.filter((e: any) => e?.type && e?.type !== "OUTCOME").length,
    [state.events]
  );

  const partyCanonical = useMemo(() => deriveLatestParty(state.events as any[]) ?? null, [state.events]);
  const [partyDraft, setPartyDraft] = useState<PartyDeclaredPayload | null>(null);

  useEffect(() => {
    if (dmMode === null) return;

    if (partyCanonical) {
      setPartyDraft((prev) => prev ?? partyCanonical);
      return;
    }

    setPartyDraft((prev) => prev ?? defaultParty(4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmMode, partyCanonical?.partyId]);

  const partyEffective: PartyDeclaredPayload | null = partyCanonical ?? partyDraft;
  const partyMembers = partyEffective?.members ?? [];
  const partySize = clampInt(partyMembers.length || 4, 1, 6);

  const effectivePlayerNames = useMemo(() => partyMembers.map((m, idx) => displayName(m, idx + 1)), [partyMembers]);

  useEffect(() => {
    if (!partyMembers.length) {
      setActingPlayerId("player_1");
      return;
    }
    const exists = partyMembers.some((m) => String(m.id) === String(actingPlayerId));
    if (exists) return;

    setActingPlayerId(String(partyMembers[0].id ?? "player_1"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyMembers.map((m) => m.id).join("|")]);

  const latestCombatId = useMemo(() => findLatestCombatId(state.events as any) ?? null, [state.events]);

  const derivedCombat = useMemo(() => {
    if (!latestCombatId) return null;
    return deriveCombatState(latestCombatId, state.events as any);
  }, [latestCombatId, state.events]);

  const combatEnded = useMemo(() => {
    if (!derivedCombat?.combatId) return false;
    return isCombatEndedForId(derivedCombat.combatId, state.events as any[]);
  }, [derivedCombat?.combatId, state.events]);

  const combatActive = !!derivedCombat && !combatEnded;

  const partyLockedByCanon = !!partyCanonical;
  const partyLockedByCombat = combatActive;
  const partyLocked = partyLockedByCanon || partyLockedByCombat;

  const activeCombatantSpec = useMemo(() => {
    if (!derivedCombat?.activeCombatantId) return null;
    return derivedCombat.participants.find((p: any) => p.id === derivedCombat.activeCombatantId) ?? null;
  }, [derivedCombat]);

  const isEnemyTurn = combatActive && activeCombatantSpec?.kind === "enemy_group";
  const isPlayerTurn = combatActive && activeCombatantSpec?.kind === "player";

  const activeTurnLabel = useMemo(() => {
    if (!combatActive || !activeCombatantSpec) return null;
    const name = String((activeCombatantSpec as any)?.name ?? "").trim();
    const id = String((activeCombatantSpec as any)?.id ?? "").trim();
    if (name) return name;
    if (id) return id;
    return null;
  }, [combatActive, activeCombatantSpec]);

  const actingPlayerInjuryStacks = useMemo(() => {
    const pid = String(actingPlayerId ?? "").trim();
    return deriveInjuryStacksForPlayer(state.events as any[], pid);
  }, [state.events, actingPlayerId]);

  const actingRollModifier = useMemo(() => {
    const s = Math.max(0, Math.min(20, Math.trunc(Number(actingPlayerInjuryStacks ?? 0))));
    return -2 * s;
  }, [actingPlayerInjuryStacks]);

  const shareCanon = () => {
    try {
      exportCanon(state.events as any);
    } catch {
      // fail-closed
    }
  };

  function pauseIntroTheme(resetTime = true) {
    const intro = introAudioRef.current;
    if (!intro) return;

    try {
      intro.pause();
      if (resetTime) intro.currentTime = 0;
    } catch {
      // fail silently
    }
  }

  function pauseBackgroundTheme() {
    const bgm = bgmAudioRef.current;
    if (!bgm) return;

    try {
      bgm.pause();
      bgm.currentTime = 0;
      bgm.removeAttribute("src");
      bgm.load();
    } catch {
      // fail silently
    }
  }

  function stopAllMusic() {
    pauseIntroTheme(true);
    pauseBackgroundTheme();
    currentMusicModeRef.current = "none";
  }

  function startLoopingTrack(src: string, volume: number, mode: Exclude<MusicMode, "none" | "intro">) {
    const bgm = bgmAudioRef.current;
    if (!bgm || !src) return;

    try {
      pauseIntroTheme(true);

      const sameSrc = bgm.getAttribute("src") === src;
      bgm.loop = true;
      bgm.volume = volume;

      if (!sameSrc) {
        bgm.src = src;
        bgm.load();
      }

      currentMusicModeRef.current = mode;
      const playPromise = bgm.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // fail silently
        });
      }
    } catch {
      // fail silently
    }
  }

  function startAmbientTheme() {
    const src = chooseNextTrack(AMBIENT_TRACKS, lastAmbientIndexRef);
    startLoopingTrack(src, 0.36, "ambient");
  }

  function startCombatTheme() {
    const src = chooseNextTrack(COMBAT_TRACKS, lastCombatIndexRef);
    startLoopingTrack(src, 0.72, "combat");
  }

  function playIntroTheme(loop = false) {
    const intro = introAudioRef.current;
    if (!intro) return;

    try {
      pauseBackgroundTheme();

      intro.pause();
      intro.currentTime = 0;
      intro.loop = loop;
      intro.volume = 0.72;
      currentMusicModeRef.current = "intro";

      const playPromise = intro.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // fail silently
        });
      }
    } catch {
      // fail silently
    }
  }

  useEffect(() => {
    if (enteredDungeon) return;
    stopAllMusic();
  }, [enteredDungeon]);

  useEffect(() => {
    const intro = introAudioRef.current;
    if (!intro) return;

    intro.loop = enteredDungeon && !tableAccepted;
  }, [enteredDungeon, tableAccepted]);

  useEffect(() => {
    if (!enteredDungeon) return;

    const intro = introAudioRef.current;
    const introIsPlaying = !!intro && !intro.paused && intro.currentTime > 0;

    if (!tableAccepted) {
      if (currentMusicModeRef.current !== "intro" || !introIsPlaying) {
        playIntroTheme(true);
      }
      return;
    }

    if (introIsPlaying) {
      pauseIntroTheme(true);
    }

    if (combatActive) {
      if (currentMusicModeRef.current !== "combat") {
        startCombatTheme();
      }
      return;
    }

    if (currentMusicModeRef.current !== "ambient") {
      startAmbientTheme();
    }
  }, [enteredDungeon, tableAccepted, combatActive]);

  function setPartySize(nextCount: number) {
    const n = clampInt(nextCount, 1, 6);

    if (!partyDraft && !partyCanonical) {
      setPartyDraft(defaultParty(n));
      return;
    }

    setPartyDraft((prev) => {
      const base = prev ?? defaultParty(n);
      const members = [...(base.members || [])];

      if (members.length === n) return base;

      if (members.length > n) {
        return { ...base, members: members.slice(0, n) };
      }

      const startIdx = members.length;
      for (let i = startIdx; i < n; i++) {
        members.push(buildStarterMember(i, n));
      }

      return { ...base, members };
    });
  }

  function randomizePartyNames() {
    if (!partyDraft) return;

    setPartyDraft((prev) => {
      if (!prev) return prev;

      const used = new Set<string>(prev.members.map((m) => normalizeName(m.name || "").toLowerCase()).filter(Boolean));
      const next: PartyDeclaredPayload = { ...prev, members: prev.members.map((m) => ({ ...m })) };

      for (let i = 0; i < next.members.length; i++) {
        const current = normalizeName(next.members[i].name || "");
        if (current) continue;

        let tries = 0;
        let name = randomName();
        while (used.has(name.toLowerCase()) && tries < 12) {
          name = randomName();
          tries++;
        }
        used.add(name.toLowerCase());
        next.members[i].name = name;
      }

      return next;
    });
  }

  function commitParty() {
    if (!partyDraft) return;
    if (partyLocked) return;

    const cleaned: PartyDeclaredPayload = {
      partyId: partyDraft.partyId || crypto.randomUUID(),
      members: (partyDraft.members || [])
        .slice(0, 6)
        .map((m, idx) => {
          const i1 = idx + 1;
          const id = normalizeName(m.id || `player_${i1}`) || `player_${i1}`;
          const hpMax = safeInt(m.hpMax, 12, 1, 999);
          const hpCurrent = safeInt(m.hpCurrent, hpMax, 0, 999);

          return {
            id,
            name: normalizeName(m.name || ""),
            species: String(m.species || "").trim() || "Human",
            className: normalizeName(m.className || ""),
            portrait: (m as any).portrait === "Female" ? "Female" : "Male",
            skills: Array.isArray((m as any).skills) ? (m as any).skills : [],
            traits: Array.isArray((m as any).traits) ? (m as any).traits : [],
            ac: safeInt(m.ac, 14, 1, 40),
            hpMax,
            hpCurrent: Math.min(hpCurrent, hpMax),
            initiativeMod: safeInt(m.initiativeMod, 1, -10, 20),
          };
        }),
    };

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "PARTY_DECLARED",
        payload: cleaned as any,
      })
    );

    if (tableAccepted) {
      setGameplayFocusStep("pressure");
      setActiveSection("pressure");
      queueMicrotask(() => scrollToSection("pressure"));
    }
  }

  const [explorationDraft, setExplorationDraft] = useState<ExplorationDraft>({
    enableMove: false,
    direction: "none",
    enableReveal: true,
    revealRadius: 1,
    enableMark: false,
    markKind: "door",
    markNote: "",
  });

  useEffect(() => {
    if (!selectedOption) return;

    const intentText = `${playerInput}\n${selectedOption.description}`.trim();
    const dir = inferDirection(intentText);
    const door = textSuggestsDoor(intentText);
    const locked = textSuggestsLocked(intentText);

    setExplorationDraft((prev) => ({
      ...prev,
      enableMove: !!dir,
      direction: dir ?? "none",
      enableReveal: true,
      revealRadius: 1,
      enableMark: door,
      markKind: "door",
      markNote: door ? (locked ? "locked" : prev.markNote || "") : prev.markNote,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption?.id]);

  useEffect(() => {
    if (initialTable) return;
    setInitialTable(generateInitialTable());
  }, [initialTable]);

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  useEffect(() => {
    if (!initialTable) return;
    if (tableDraftText.trim() === "") setTableDraftText(renderedTableNarration);
  }, [initialTable, renderedTableNarration, tableDraftText]);

  useEffect(() => {
    if (dmMode === null) return;
    setTableAccepted(false);
    setEnteredDungeon(false);
    setGameplayFocusStep("pressure");
  }, [dmMode]);

  function appendCanon(type: string, payload: any) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type,
        payload,
      })
    );
  }

  const pressureTier = useMemo(() => inferPressureTier(outcomesCount), [outcomesCount]);

  const isWrongPlayerForTurn =
    combatActive &&
    isPlayerTurn &&
    dmMode !== "human" &&
    !!activeCombatantSpec?.id &&
    String(activeCombatantSpec.id) !== String(actingPlayerId);

  const canPlayerSubmitIntent =
    dmMode !== null &&
    ((dmMode === "human" && true) ||
      (!combatActive && !isEnemyTurn) ||
      (combatActive && !isEnemyTurn && !isWrongPlayerForTurn));

  function handlePlayerAction() {
    if (!playerInput.trim()) return;
    if (!canPlayerSubmitIntent) return;

    const actorId = normalizeName(actingPlayerId || "player_1") || "player_1";
    const parsedAction = parseAction(actorId, playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);

    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;

    setSelectedOption(options[0]);
    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }, [dmMode, options]);

  function advanceTurn() {
    if (!derivedCombat) return;
    if (combatEnded) return;

    const payload = nextTurnPointer(derivedCombat);

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "TURN_ADVANCED",
        payload: payload as any,
      })
    );
  }

  function endCombat() {
    if (!derivedCombat) return;
    if (combatEnded) return;

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "COMBAT_ENDED",
        payload: { combatId: derivedCombat.combatId } as any,
      })
    );
  }

  function passTurn() {
    if (!combatActive) return;
    if (dmMode !== "human" && isEnemyTurn) return;
    if (dmMode !== "human" && isPlayerTurn && isWrongPlayerForTurn) return;
    advanceTurn();
  }

  function commitExplorationBundle(nextState: SessionState) {
    const d = explorationDraft;
    let next = nextState;

    const here = deriveCurrentPosition(next.events as any[], MAP_W, MAP_H);
    const to = d.enableMove && d.direction !== "none" ? stepFrom(here, d.direction) : null;
    const canMove = to ? withinBounds(to, MAP_W, MAP_H) : false;

    let movedTo: { x: number; y: number } | null = null;
    let revealedTiles: Array<{ x: number; y: number }> = [];

    if (d.enableMove && canMove && to) {
      movedTo = to;

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "PLAYER_MOVED",
        payload: { from: here, to } as any,
      });

      if (d.enableReveal && d.revealRadius > 0) {
        revealedTiles = revealRadius(to, d.revealRadius, MAP_W, MAP_H);

        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_REVEALED",
          payload: { tiles: revealedTiles } as any,
        });
      }

      if (d.enableMark) {
        const note = d.markNote.trim() ? d.markNote.trim() : null;
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_MARKED",
          payload: { at: to, kind: d.markKind, note } as any,
        });
      }

      const discoveryDrafts = deriveDiscoveryEvents({
        events: next.events as any[],
        movedTo,
        revealedTiles,
        mapW: MAP_W,
        mapH: MAP_H,
      });

      for (const draft of discoveryDrafts) {
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: draft.type,
          payload: draft.payload as any,
        });
      }

      return next;
    }

    if (d.enableReveal && d.revealRadius > 0) {
      revealedTiles = revealRadius(here, d.revealRadius, MAP_W, MAP_H);

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "MAP_REVEALED",
        payload: { tiles: revealedTiles } as any,
      });
    }

    if (d.enableMark) {
      const note = d.markNote.trim() ? d.markNote.trim() : null;
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "MAP_MARKED",
        payload: { at: here, kind: d.markKind, note } as any,
      });
    }

    const discoveryDrafts = deriveDiscoveryEvents({
      events: next.events as any[],
      movedTo: null,
      revealedTiles,
      mapW: MAP_W,
      mapH: MAP_H,
    });

    for (const draft of discoveryDrafts) {
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: draft.type,
        payload: draft.payload as any,
      });
    }

    return next;
  }

  function handleRecord(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  }) {
    const selectedText = selectedOption?.description ?? "";
    const combinedText = `${playerInput}\n${selectedText}`.trim();
    const kind = inferOptionKind(combinedText.length ? combinedText : selectedText);

    setState((prev) => {
      const here = deriveCurrentPosition(prev.events as any[], MAP_W, MAP_H);

      const d = explorationDraft;
      const to = d.enableMove && d.direction !== "none" ? stepFrom(here, d.direction) : null;
      const canMove = to ? withinBounds(to, MAP_W, MAP_H) : false;

      const posForZone = d.enableMove && canMove && to ? to : here;
      const zoneId = zoneIdFromTileXY(posForZone.x, posForZone.y);

      const roll = Number(payload?.dice?.roll ?? 0);
      const dc = Number(payload?.dice?.dc ?? 0);
      const success = Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;

      const pressureDelta = pressureDeltaFor(kind, success);
      const awarenessDelta = awarenessDeltaFor(kind, success);

      const enrichedOutcome = {
        ...payload,
        meta: {
          ...(payload as any)?.meta,
          optionKind: kind,
          optionDescription: selectedText,
          intent: playerInput,
          zoneId,
          success,
        },
      };

      let next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: enrichedOutcome as any,
      });

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "ZONE_PRESSURE_CHANGED",
        payload: { zoneId, delta: clamp01to100(pressureDelta) } as any,
      });

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "ZONE_AWARENESS_CHANGED",
        payload: { zoneId, delta: clamp01to100(awarenessDelta) } as any,
      });

      next = commitExplorationBundle(next);
      return next;
    });

    setPlayerInput("");
    setParsed(null);
    setOptions(null);
    setSelectedOption(null);

    setGameplayFocusStep("action");
    setActiveSection("action");
    queueMicrotask(() => scrollToSection("action"));
  }

  function handleRecordOutcomeOnly(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  }) {
    setState((prev) => {
      const here = deriveCurrentPosition(prev.events as any[], MAP_W, MAP_H);
      const zoneId = zoneIdFromTileXY(here.x, here.y);

      const roll = Number(payload?.dice?.roll ?? 0);
      const dc = Number(payload?.dice?.dc ?? 0);
      const success = Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;

      const kind = "contested" as ReturnType<typeof inferOptionKind>;

      const pressureDelta = pressureDeltaFor(kind, success);
      const awarenessDelta = awarenessDeltaFor(kind, success);

      const enrichedOutcome = {
        ...payload,
        meta: {
          ...(payload as any)?.meta,
          optionKind: kind,
          zoneId,
          success,
        },
      };

      let next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload: enrichedOutcome as any,
      });

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "ZONE_PRESSURE_CHANGED",
        payload: { zoneId, delta: clamp01to100(pressureDelta) } as any,
      });

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "ZONE_AWARENESS_CHANGED",
        payload: { zoneId, delta: clamp01to100(awarenessDelta) } as any,
      });

      return next;
    });

    setGameplayFocusStep("action");
    setActiveSection("canon");
    queueMicrotask(() => scrollToSection("canon"));
  }

  const canEnterDungeon = dmMode !== null && partySize > 0;

  const partyCanonicalExists = !!partyCanonical;
  const showInitialTable = enteredDungeon && dmMode !== null && partySize > 0;

  const chapterState = useMemo(() => {
    const doneMode = dmMode !== null;
    const doneTable = tableAccepted;
    const doneParty = partyCanonicalExists;

    return {
      mode: doneMode ? ("done" as const) : ("next" as const),
      party: doneParty ? ("done" as const) : doneTable ? ("next" as const) : ("locked" as const),
      table: doneTable
        ? ("done" as const)
        : showInitialTable
          ? ("next" as const)
          : doneMode
            ? ("next" as const)
            : ("locked" as const),
      pressure: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      map: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      combat: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      action: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      resolution: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      canon: doneTable && doneParty ? ("open" as const) : ("locked" as const),
      ledger: doneTable && doneParty ? ("open" as const) : ("locked" as const),
    };
  }, [dmMode, tableAccepted, partyCanonicalExists, showInitialTable]);

  const presentationPhase: PresentationPhase = useMemo(() => {
    if (dmMode === null || !enteredDungeon) return "onboarding";
    if (!tableAccepted) return "chronicle";
    if (!partyCanonicalExists) return "party-declaration";
    return "gameplay";
  }, [dmMode, enteredDungeon, tableAccepted, partyCanonicalExists]);

  const showFullHero = presentationPhase === "onboarding";
  const showCompactHero = presentationPhase !== "onboarding";
  const showGameplay = presentationPhase === "gameplay";

  const activeEnemyOverlayName =
    dmMode !== "human" && combatActive && isEnemyTurn ? String(activeCombatantSpec?.name ?? "") : null;

  const activeEnemyOverlayId =
    dmMode !== "human" && combatActive && isEnemyTurn ? String(activeCombatantSpec?.id ?? "") : null;

  const solaceNeutralEnemyTurnEnabled =
    dmMode === "solace-neutral" &&
    combatActive &&
    isEnemyTurn &&
    !!activeEnemyOverlayName &&
    !!activeEnemyOverlayId;

  const resolutionDmMode = useMemo(() => (dmMode === "solace-neutral" ? "solace_neutral" : "human"), [dmMode]);

  const allowGameplay = dmMode !== null && tableAccepted && partyCanonicalExists;

  const gameplayAllowsPressure = showGameplay && allowGameplay;
  const gameplayAllowsMap = gameplayAllowsPressure && (gameplayFocusStep === "map" || gameplayFocusStep === "action");
  const gameplayAllowsAction = gameplayAllowsPressure && gameplayFocusStep === "action";

  const currentPosition = useMemo(
    () => deriveCurrentPosition(state.events as any[], MAP_W, MAP_H),
    [state.events]
  );

  const currentZoneId = useMemo(
    () => zoneIdFromTileXY(currentPosition.x, currentPosition.y),
    [currentPosition]
  );

  const currentZoneMarks = useMemo(
    () => deriveMapMarksForZone(state.events as any[], currentZoneId),
    [state.events, currentZoneId]
  );

  const resolutionMovement = useMemo<{
    from?: { x: number; y: number } | null;
    to?: { x: number; y: number } | null;
    direction?: "north" | "south" | "east" | "west" | "none" | null;
  } | null>(() => {
    if (!selectedOption) return null;

    const intentText = `${playerInput}\n${selectedOption.description}`.trim();

    const inferredDirection: "north" | "south" | "east" | "west" | "none" =
      explorationDraft.enableMove && explorationDraft.direction !== "none"
        ? explorationDraft.direction
        : inferDirection(intentText) ?? "none";

    const from = currentPosition;

    const stepped =
      inferredDirection !== "none"
        ? stepFrom(from, inferredDirection)
        : null;

    const to =
      stepped && withinBounds(stepped, MAP_W, MAP_H)
        ? stepped
        : stepped
          ? from
          : null;

    return {
      from,
      to,
      direction: inferredDirection,
    };
  }, [selectedOption, playerInput, explorationDraft, currentPosition]);

  const resolutionCombat = useMemo(() => {
    if (!combatActive) return null;

    return {
      activeEnemyGroupName:
        activeEnemyOverlayName ||
        enemyTelegraphHint?.enemyName ||
        String(activeCombatantSpec?.name ?? "") ||
        null,
      isEnemyTurn: !!isEnemyTurn,
      attackStyleHint: enemyTelegraphHint?.attackStyleHint ?? "unknown",
    } as const;
  }, [combatActive, activeEnemyOverlayName, enemyTelegraphHint, activeCombatantSpec, isEnemyTurn]);

  const combatEncounterContext = useMemo<CombatEncounterContext>(() => {
    const marksLite = currentZoneMarks.map((m) => ({ kind: m.kind, note: m.note }));
    const selectedOptionDescription = selectedOption?.description ?? "";
    const theme = inferEncounterTheme({
      activeEnemyName: activeEnemyOverlayName ?? activeEnemyOverlayId,
      playerInput,
      selectedOptionDescription,
      marks: marksLite,
    });

    const lockState = inferLockState({
      playerInput,
      selectedOptionDescription,
      marks: marksLite,
    });

    const rewardHint = inferRewardHint({
      marks: marksLite,
      playerInput,
      selectedOptionDescription,
    });

    const objective = inferObjective({
      theme,
      lockState,
      rewardHint,
    });

    const keyEnemyName =
      lockState === "locked" || rewardHint === "key"
        ? defaultKeyEnemyForTheme(theme)
        : null;

    const relicEnemyName =
      rewardHint === "relic" || theme === "vault" || theme === "arcane"
        ? defaultRelicEnemyForTheme(theme)
        : null;

    const cacheGuardEnemyName =
      rewardHint === "cache" || rewardHint === "treasure"
        ? defaultCacheGuardEnemyForTheme(theme)
        : null;

    return {
      zoneId: currentZoneId,
      zoneTheme: theme,
      objective,
      lockState,
      rewardHint,
      keyEnemyName,
      relicEnemyName,
      cacheGuardEnemyName,
    };
  }, [
    currentZoneId,
    currentZoneMarks,
    selectedOption?.description,
    playerInput,
    activeEnemyOverlayName,
    activeEnemyOverlayId,
  ]);

  useEffect(() => {
    if (!showGameplay || !allowGameplay) return;

    if (gameplayFocusStep === "pressure") {
      setActiveSection("pressure");
      queueMicrotask(() => scrollToSection("pressure"));
      return;
    }

    if (gameplayFocusStep === "map") {
      setActiveSection("map");
      queueMicrotask(() => scrollToSection("map"));
      return;
    }

    setActiveSection("action");
    queueMicrotask(() => scrollToSection("action"));
  }, [showGameplay, allowGameplay, gameplayFocusStep]);

  function enterDungeon() {
    if (!canEnterDungeon) return;
    playIntroTheme(true);
    setEnteredDungeon(true);
    setActiveSection("table");
    queueMicrotask(() => scrollToSection("table"));
  }

  function jumpTo(key: any) {
    const nextKey = key as DemoSectionId;

    if (showGameplay && allowGameplay) {
      if (nextKey === "pressure") {
        setGameplayFocusStep("pressure");
      } else if (nextKey === "map") {
        setGameplayFocusStep("map");
      } else if (
        nextKey === "combat" ||
        nextKey === "action" ||
        nextKey === "resolution" ||
        nextKey === "canon" ||
        nextKey === "ledger"
      ) {
        setGameplayFocusStep("action");
      }
    }

    setActiveSection(nextKey);
    scrollToSection(nextKey);
  }

  return (
    <AmbientBackground>
      <audio ref={introAudioRef} preload="auto" src="/audio/music/chronicles_intro.mp3" style={{ display: "none" }} />
      <audio ref={bgmAudioRef} preload="auto" style={{ display: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <StewardedShell>
          <ModeHeader title="Echoes of Fate" onShare={shareCanon} showTitle={false} showRoles={false} showShare={false} />

          <div id={anchorId("mode")} style={{ scrollMarginTop: 90 }}>
            {showFullHero && (
              <HeroOnboarding
                presentationMode="full"
                heroTitle="Echoes of Fate"
                heroSubtitle="Every action leaves an echo."
                dmMode={dmMode}
                onSetDmMode={(nextMode) => {
                  setDmMode(nextMode);
                  setEnteredDungeon(false);
                  setTableAccepted(false);
                  setGameplayFocusStep("pressure");
                  setActiveSection("mode");
                  setPartyDraft((prev) => prev ?? defaultParty(partySize));
                }}
                partySize={partySize}
                partyLocked={partyLocked}
                onSetPartySize={(n) => {
                  if (dmMode === null) return;
                  setEnteredDungeon(false);
                  setTableAccepted(false);
                  setGameplayFocusStep("pressure");
                  setPartySize(n);
                }}
                onEnter={enterDungeon}
                canEnter={canEnterDungeon}
                heroImageSrc={HERO_IMAGE_SRC}
                heroImageOk={heroImageOk}
                onHeroImageError={() => setHeroImageOk(false)}
                chapterState={chapterState as any}
                onJump={(k) => jumpTo(k)}
                outcomesCount={outcomesCount}
                canonCount={canonCount}
              />
            )}

            {showCompactHero && (
              <HeroOnboarding
                presentationMode="compact"
                heroTitle="Echoes of Fate"
                heroSubtitle="Every action leaves an echo."
                dmMode={dmMode}
                onSetDmMode={(nextMode) => {
                  setDmMode(nextMode);
                  setEnteredDungeon(false);
                  setTableAccepted(false);
                  setGameplayFocusStep("pressure");
                  setActiveSection("mode");
                  setPartyDraft((prev) => prev ?? defaultParty(partySize));
                }}
                partySize={partySize}
                partyLocked={partyLocked}
                onSetPartySize={(n) => {
                  if (dmMode === null) return;
                  setEnteredDungeon(false);
                  setTableAccepted(false);
                  setGameplayFocusStep("pressure");
                  setPartySize(n);
                }}
                onEnter={enterDungeon}
                canEnter={canEnterDungeon}
                heroImageSrc={HERO_IMAGE_SRC}
                heroImageOk={heroImageOk}
                onHeroImageError={() => setHeroImageOk(false)}
                chapterState={chapterState as any}
                onJump={(k) => jumpTo(k)}
                outcomesCount={outcomesCount}
                canonCount={canonCount}
              />
            )}
          </div>

          {showInitialTable && (
            <div id={anchorId("table")} style={{ scrollMarginTop: 90, marginTop: 16 }}>
              <InitialTableSection
                dmMode={dmMode}
                initialTable={initialTable}
                tableAccepted={tableAccepted}
                tableDraftText={tableDraftText}
                setTableDraftText={setTableDraftText}
                onAccept={() => {
                  setTableAccepted(true);
                  setGameplayFocusStep("pressure");
                  pauseIntroTheme(true);

                  if (combatActive) {
                    startCombatTheme();
                  } else {
                    startAmbientTheme();
                  }

                  setActiveSection("party");
                  queueMicrotask(() => scrollToSection("party"));
                }}
              />
            </div>
          )}

          <div id={anchorId("party")} style={{ scrollMarginTop: 90, marginTop: 16 }}>
            <PartySetupSection
              enabled={showInitialTable && dmMode !== null && tableAccepted}
              partyDraft={partyDraft}
              partyMembersFallback={partyMembers}
              partyCanonicalExists={partyCanonicalExists}
              partyLocked={partyLocked}
              partyLockedByCombat={partyLockedByCombat}
              setPartySize={(n) => setPartySize(n)}
              randomizePartyNames={randomizePartyNames}
              commitParty={commitParty}
              safeInt={safeInt}
              setPartyDraft={setPartyDraft}
            />
          </div>

          {showGameplay && allowGameplay && (
            <>
              {gameplayFocusStep === "pressure" && (
                <RitualPromptRow
                  title="The Air Tightens"
                  body="The party has crossed the threshold. Read the danger state first, then survey the ground before issuing the first command."
                  actionLabel="Survey the dungeon map"
                  hint="Pressure first. Space second. Action third."
                  onActivate={() => {
                    setGameplayFocusStep("map");
                    setActiveSection("map");
                    queueMicrotask(() => scrollToSection("map"));
                  }}
                />
              )}

              <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
                {gameplayAllowsPressure && <DungeonPressurePanel turn={outcomesCount} events={state.events} />}
              </div>

              {gameplayFocusStep === "map" && (
                <RitualPromptRow
                  title="The Path Reveals Itself"
                  body="The dungeon has shape now. Read the terrain, your position, and remembered marks before choosing how the party moves."
                  actionLabel="Let the first move take shape"
                  hint="Once the space is clear, command can take the stage."
                  onActivate={() => {
                    setGameplayFocusStep("action");
                    setActiveSection("action");
                    queueMicrotask(() => scrollToSection("action"));
                  }}
                />
              )}

              <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
                {gameplayAllowsMap && (
                  <MapSection
                    events={state.events as any[]}
                    mapW={MAP_W}
                    mapH={MAP_H}
                    activeEnemyGroupName={activeEnemyOverlayName}
                    playSignal={enemyPlayNonce}
                  />
                )}
              </div>

              {gameplayAllowsAction && (
                <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
                  <CombatSection
                    events={state.events as any[]}
                    dmMode={dmMode}
                    onAppendCanon={appendCanon}
                    partyMembers={partyMembers.map((m, idx) => ({
                      id: String(m.id),
                      name: displayName(m, idx + 1),
                      species: m.species,
                      className: m.className,
                      portrait: m.portrait ?? "Male",
                      skills: m.skills ?? [],
                      traits: m.traits ?? [],
                      ac: m.ac,
                      hpMax: m.hpMax,
                      hpCurrent: m.hpCurrent,
                      initiativeMod: m.initiativeMod,
                    }))}
                    pressureTier={pressureTier}
                    allowDevControls={false}
                    encounterContext={combatEncounterContext as any}
                    showEnemyResolver={solaceNeutralEnemyTurnEnabled}
                    activeEnemyGroupName={activeEnemyOverlayName}
                    activeEnemyGroupId={activeEnemyOverlayId}
                    playerNames={effectivePlayerNames}
                    onTelegraph={(info) => {
                      setEnemyTelegraphHint(info);
                      setEnemyPlayNonce((n) => n + 1);
                    }}
                    onCommitOutcomeOnly={(payload) => handleRecordOutcomeOnly(payload)}
                    onAdvanceTurn={() => advanceTurn()}
                    enemyTelegraphHint={enemyTelegraphHint}
                    derivedCombat={derivedCombat as any}
                    activeCombatantSpec={activeCombatantSpec}
                    combatEnded={combatEnded}
                    isEnemyTurn={isEnemyTurn}
                    isWrongPlayerForTurn={isWrongPlayerForTurn}
                    onAdvanceTurnBtn={() => advanceTurn()}
                    onPassTurnBtn={() => passTurn()}
                    onEndCombatBtn={() => endCombat()}
                  />
                </div>
              )}

              {gameplayAllowsAction && (
                <div id={anchorId("action")} style={{ scrollMarginTop: 90 }}>
                  <ActionSection
                    partyMembers={
                      partyMembers.length
                        ? partyMembers.map((m, idx) => ({
                            id: String(m.id),
                            label: `${displayName(m, idx + 1)} (${m.id})`,
                            species: m.species ?? "Human",
                            className: m.className || "Warrior",
                            portrait: m.portrait ?? "Male",
                            skills: m.skills ?? [],
                            traits: m.traits ?? [],
                            ac: m.ac,
                            hpMax: m.hpMax,
                            hpCurrent: m.hpCurrent,
                            initiativeMod: m.initiativeMod,
                          }))
                        : []
                    }
                    actingPlayerId={actingPlayerId}
                    onSetActingPlayerId={(id) => setActingPlayerId(id)}
                    playerInput={playerInput}
                    onSetPlayerInput={(v) => setPlayerInput(v)}
                    canSubmit={canPlayerSubmitIntent}
                    onSubmit={handlePlayerAction}
                    combatActive={combatActive}
                    passDisabled={(dmMode === "solace-neutral" && isEnemyTurn) || isWrongPlayerForTurn}
                    onPassTurn={passTurn}
                    dmMode={dmMode}
                    isEnemyTurn={isEnemyTurn}
                    isWrongPlayerForTurn={isWrongPlayerForTurn}
                    activeTurnLabel={activeTurnLabel}
                    showPartyButtons={dmMode === "human" && !partyLocked && !!partyDraft}
                    onCommitParty={commitParty}
                    onRandomNames={randomizePartyNames}
                    commitDisabled={partyLocked}
                  />
                </div>
              )}

              {gameplayAllowsAction && parsed && (
                <CardSection title="Parsed Action">
                  <pre>{JSON.stringify(parsed, null, 2)}</pre>
                </CardSection>
              )}

              {gameplayAllowsAction && options && dmMode === "human" && (
                <CardSection title="Options">
                  <ul>
                    {options.map((opt) => (
                      <li key={opt.id}>
                        <button
                          onClick={() => {
                            setSelectedOption(opt);
                            setActiveSection("resolution");
                            queueMicrotask(() => scrollToSection("resolution"));
                          }}
                        >
                          {opt.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardSection>
              )}

              {gameplayAllowsAction && (
                <div id={anchorId("resolution")} style={{ scrollMarginTop: 90 }}>
                  {selectedOption && (
                    <ResolutionDraftAdvisoryPanel
                      context={{
                        optionDescription: selectedOption.description,
                        optionKind: inferOptionKind(`${playerInput}\n${selectedOption.description}`.trim()),
                      }}
                      role={role}
                      dmMode={resolutionDmMode}
                      setupText={playerInput}
                      movement={resolutionMovement}
                      combat={resolutionCombat}
                      rollModifier={actingRollModifier}
                      rollModifierLabel={
                        actingPlayerInjuryStacks > 0
                          ? `Injury stacks: ${actingPlayerInjuryStacks}`
                          : null
                      }
                      onRecord={handleRecord}
                    />
                  )}
                </div>
              )}

              {gameplayAllowsAction && <NextActionHint state={state} />}

              {gameplayAllowsAction && (
                <div id={anchorId("canon")} style={{ scrollMarginTop: 90 }}>
                  <CanonChronicleSection events={state.events as any[]} />
                </div>
              )}

              {gameplayAllowsAction && (
                <div id={anchorId("ledger")} style={{ height: 1, scrollMarginTop: 90 }} />
              )}
            </>
          )}
        </StewardedShell>
      </div>
    </AmbientBackground>
  );
}
