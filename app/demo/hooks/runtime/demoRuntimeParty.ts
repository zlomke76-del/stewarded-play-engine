import { normalizeName } from "../../demoUtils";
import type { PartyDeclaredPayload, PartyMember } from "./demoRuntimeTypes";
import { resolvePartyLoadout } from "@/lib/skills/loadoutResolver";

export const SOLO_STARTER_CLASS: "Warrior" = "Warrior";

export const STARTER_SPECIES_PLAN = [
  "Human",
  "Elf",
  "Dwarf",
  "Tiefling",
  "Halfling",
  "Dragonborn",
] as const;

export const STARTER_PORTRAIT_PLAN: ReadonlyArray<"Male" | "Female"> = [
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

export function displayName(m: PartyMember, i1: number) {
  const n = normalizeName(m.name || "");
  return n.length > 0 ? n : `Player ${i1}`;
}

export function buildStarterMember(slotIndex: number): PartyMember {
  const className = SOLO_STARTER_CLASS;
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

export function defaultParty(): PartyDeclaredPayload {
  return {
    partyId: crypto.randomUUID(),
    members: [buildStarterMember(0)],
  };
}

export function deriveLatestParty(events: readonly any[]): PartyDeclaredPayload | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e?.type !== "PARTY_DECLARED") continue;
    const p = e?.payload as PartyDeclaredPayload;
    if (!p || !Array.isArray(p.members)) continue;

    return {
      ...p,
      members: p.members.slice(0, 1),
    };
  }
  return null;
}

export function deriveInjuryStacksForPlayer(events: readonly any[], playerId: string): number {
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

export function cleanCommittedSoloParty(partyDraft: PartyDeclaredPayload): PartyDeclaredPayload {
  const onlyMember = (partyDraft.members || [buildStarterMember(0)]).slice(0, 1);

  return {
    partyId: partyDraft.partyId || crypto.randomUUID(),
    members: onlyMember.map((m, idx) => {
      const i1 = idx + 1;
      const id = normalizeName(m.id || `player_${i1}`) || `player_${i1}`;
      const hpMax = safeInt(m.hpMax, 12, 1, 999);
      const hpCurrent = safeInt(m.hpCurrent, hpMax, 0, 999);

      return {
        id,
        name: normalizeName(m.name || ""),
        species: String(m.species || "").trim() || "Human",
        className: normalizeName(m.className || "") || SOLO_STARTER_CLASS,
        portrait: m.portrait === "Female" ? "Female" : "Male",
        skills: Array.isArray(m.skills) ? m.skills : [],
        traits: Array.isArray(m.traits) ? m.traits : [],
        ac: safeInt(m.ac, 14, 1, 40),
        hpMax,
        hpCurrent: Math.min(hpCurrent, hpMax),
        initiativeMod: safeInt(m.initiativeMod, 1, -10, 20),
      };
    }),
  };
}
