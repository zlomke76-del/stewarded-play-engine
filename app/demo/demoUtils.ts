// app/demo/demoUtils.ts

import type { InitialTable, DemoSectionId, Direction, XY, OptionKind } from "./demoTypes";

// ------------------------------------------------------------
// UI helpers: chapter nav + anchors
// ------------------------------------------------------------

export function anchorId(section: DemoSectionId) {
  return `demo-${section}`;
}

export function scrollToSection(section: DemoSectionId) {
  const el = document.getElementById(anchorId(section));
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function sectionLabel(section: DemoSectionId) {
  switch (section) {
    case "mode":
      return "Mode";
    case "table":
      return "Table";
    case "pressure":
      return "Pressure";
    case "map":
      return "Map";
    case "combat":
      return "Combat";
    case "action":
      return "Action";
    case "resolution":
      return "Resolution";
    case "canon":
      return "Canon";
    case "ledger":
      return "Ledger";
  }
}

// ------------------------------------------------------------
// Random helpers
// ------------------------------------------------------------

export function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickManyUnique<T>(arr: T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (pool.length > 0 && out.length < count) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

export function normalizeName(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export function randomName(): string {
  const a = [
    "Astra",
    "Kara",
    "Thorne",
    "Hex",
    "Rook",
    "Nyx",
    "Vex",
    "Dax",
    "Mara",
    "Rune",
    "Sable",
    "Orin",
    "Juno",
    "Kade",
    "Iris",
    "Zeph",
  ];
  const b = [
    "of Ember",
    "of Glass",
    "of Iron",
    "of Neon",
    "of Ash",
    "of Dawn",
    "of Night",
    "of the Grid",
    "the Quiet",
    "the Bold",
    "the Warden",
    "the Runner",
    "the Signal",
    "the Echo",
  ];
  const base = pick(a);
  const tail = pick([true, false, false]) ? ` ${pick(b)}` : "";
  return `${base}${tail}`;
}

// ------------------------------------------------------------
// Initial table helpers
// ------------------------------------------------------------

export function generateInitialTable(): InitialTable {
  const factionNames = [
    "The Whisperers",
    "The Vaultwardens",
    "The Ash Circle",
    "The Night Ledger",
    "The Bell-Silent",
    "The Cobble Court",
  ];

  const desires = [
    "control what sleeps below",
    "seal the vaults forever",
    "profit from forbidden knowledge",
    "redeem an ancient failure",
    "expose the truth no matter the cost",
    "keep the city calm at any price",
  ];

  const pressures = [
    "time is running out",
    "someone is leaking secrets",
    "an old oath is failing",
    "a rival faction is moving first",
    "witnesses keep vanishing",
    "the city above is starting to notice",
  ];

  const factionCount = pick([2, 3, 3]);
  const chosenNames = pickManyUnique(factionNames, factionCount);

  return {
    openingFrame: pick([
      "A low fog coils between narrow streets as evening bells fade.",
      "Rain-dark stone reflects lanternlight in uneasy patterns.",
      "Voices echo where they shouldn’t, carrying fragments of argument.",
      "The city hums, unaware of the pressure building beneath it.",
    ]),
    locationTraits: [
      pick(["crowded", "echoing", "claustrophobic", "uneasily quiet"]),
      pick(["ancient stone", "rotting wood", "slick cobblestone"]),
    ],
    latentFactions: chosenNames.map((name) => ({
      name,
      desire: pick(desires),
      pressure: pick(pressures),
    })),
    environmentalOddities: [
      pick([
        "Lantern flames gutter without wind",
        "Stone walls seem to absorb sound",
        "Whispers surface near old drains",
        "Footsteps echo twice",
      ]),
    ],
    dormantHooks: [
      pick([
        "A name scratched into stone repeats across districts",
        "A missing city clerk last seen near the underways",
        "A sealed door recently disturbed",
      ]),
    ],
  };
}

export function renderInitialTableNarration(t: InitialTable): string {
  const [traitA, traitB] = t.locationTraits;
  const oddity = t.environmentalOddities[0] ?? "Something feels off";
  const hook = t.dormantHooks[0] ?? "A sign repeats";
  const factions = t.latentFactions;

  const lines: string[] = [];
  lines.push(t.openingFrame);
  lines.push(`The place feels ${traitA}, and the air carries the stink of ${traitB}.`);

  if (/footsteps echo twice/i.test(oddity)) {
    lines.push("Every step answers itself — once, then again — like the street remembers you a beat too late.");
  } else if (/lantern/i.test(oddity.toLowerCase())) {
    lines.push("Lanternlight can’t decide what it wants to be — steady one second, starving the next.");
  } else if (/absorb sound/i.test(oddity.toLowerCase())) {
    lines.push("Sound doesn’t travel right. Words die early, like the walls are swallowing them.");
  } else if (/whispers/i.test(oddity.toLowerCase())) {
    lines.push(
      "You keep catching whispers at the edge of hearing — not loud enough to understand, not quiet enough to ignore."
    );
  } else {
    lines.push(`${oddity}.`);
  }

  if (factions.length > 0) {
    lines.push("There are pressures under the surface:");
    factions.forEach((f) => lines.push(`• ${f.name} want to ${f.desire} — but ${f.pressure}.`));
  }

  lines.push(`${hook}.`);
  lines.push("That repetition feels deliberate. And it feels recent.");

  return lines.join("\n\n");
}

/**
 * inferOptionKind
 *
 * This exists solely to map the *option description text* (generated by OptionGenerator)
 * into an OptionKind for DC selection.
 *
 * Key requirement for your current demo:
 * - Solace-neutral auto-selects options[0], so options[0] must not always map to "safe".
 * - Combat/movement/environmental/influence options should correctly yield higher tiers.
 */
export function inferOptionKind(description: string): OptionKind {
  const text = (description ?? "").toLowerCase().trim();

  // Helper: word-ish contains without being too strict
  const has = (...needles: string[]) => needles.some((n) => text.includes(n));

  // ------------------------------------------------------------
  // 1) CONTESTED (DC 14)
  // - Direct adversary / opposition / confrontation / attack framing
  // - Social contests (influence checks) also treated as contested in this demo
  // ------------------------------------------------------------
  if (
    has(
      "attack",
      "hostile",
      "fight",
      "combat",
      "confrontation",
      "oppose",
      "opposition",
      "contest",
      "contested",
      "disarm",
      "surrender",
      "intimidat",
      "deceiv",
      "persuad",
      "threat",
      "duel"
    ) ||
    // OptionGenerator exact phrases we want to strongly classify:
    has("resolve as an attack", "hostile action", "interrupt or escalate the confrontation") ||
    // Social check is usually opposed by an NPC's will/insight in many tables -> contested tier for demo punch
    has("social or influence check", "influence check")
  ) {
    return "contested";
  }

  // ------------------------------------------------------------
  // 2) ENVIRONMENTAL (DC 8)
  // - Terrain, obstacles, tool use, movement costs, environment consequences
  // ------------------------------------------------------------
  if (
    has(
      "terrain",
      "surroundings",
      "obstacle",
      "obstacles",
      "cost",
      "costs",
      "environment",
      "environmental",
      "tool use",
      "tools",
      "strength",
      "force it open",
      "climb",
      "cross",
      "navigate",
      "hazard",
      "hazards",
      "trap",
      "traps",
      "fall",
      "ledge",
      "door",
      "gate",
      "hatch"
    ) ||
    // OptionGenerator exact phrases
    has(
      "account for terrain or surroundings",
      "resolve movement with obstacles or costs",
      "trigger environmental reactions",
      "alter an object or location state",
      "apply environmental consequences",
      "allow magic to affect the environment"
    )
  ) {
    return "environmental";
  }

  // ------------------------------------------------------------
  // 3) RISKY (DC 10)
  // - Stealth, theft, escalation, ritualized magic, partial/ambiguous info, high-variance moves
  // ------------------------------------------------------------
  if (
    has(
      "steal",
      "sneak",
      "risk",
      "risky",
      "gamble",
      "rush",
      "dash",
      "leap",
      "jump",
      "ritual",
      "spell",
      "magical",
      "partial",
      "ambiguous",
      "interrupt",
      "escalate",
      "consequence",
      "consequences"
    ) ||
    // OptionGenerator exact phrases
    has(
      "treat as a spell or magical effect",
      "interpret as a ritual or symbolic act",
      "reveal partial or ambiguous information"
    )
  ) {
    return "risky";
  }

  // ------------------------------------------------------------
  // 4) SAFE (DC 6)
  // - Clarification, roleplay resolution, simple interactions, “defer”, “without a roll”
  // ------------------------------------------------------------
  return "safe";
}

// ------------------------------------------------------------
// Exploration helpers
// ------------------------------------------------------------

export function withinBounds(p: XY, w: number, h: number) {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}

export function deriveCurrentPosition(events: readonly any[], w: number, h: number): XY {
  let pos: XY = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
  for (const e of events) {
    if (e?.type === "PLAYER_MOVED") {
      const to = e?.payload?.to;
      if (to && typeof to.x === "number" && typeof to.y === "number" && withinBounds(to, w, h)) {
        pos = { x: to.x, y: to.y };
      }
    }
  }
  return pos;
}

export function revealRadius(center: XY, radius: number, w: number, h: number): XY[] {
  const out: XY[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const p = { x: center.x + dx, y: center.y + dy };
      if (withinBounds(p, w, h)) out.push(p);
    }
  }
  return out;
}

export function inferDirection(text: string): Direction | null {
  const t = text.toLowerCase();
  if (/\b(north|up|forward|ahead)\b/.test(t)) return "north";
  if (/\b(south|down|back|backward)\b/.test(t)) return "south";
  if (/\b(east|right)\b/.test(t)) return "east";
  if (/\b(west|left)\b/.test(t)) return "west";
  return null;
}

export function stepFrom(pos: XY, dir: Direction): XY {
  switch (dir) {
    case "north":
      return { x: pos.x, y: pos.y - 1 };
    case "south":
      return { x: pos.x, y: pos.y + 1 };
    case "east":
      return { x: pos.x + 1, y: pos.y };
    case "west":
      return { x: pos.x - 1, y: pos.y };
  }
}

export function textSuggestsDoor(text: string) {
  const t = text.toLowerCase();
  return /\b(door|gate|hatch|threshold|archway)\b/.test(t);
}

export function textSuggestsLocked(text: string) {
  const t = text.toLowerCase();
  return /\b(locked|sealed|barred|jammed)\b/.test(t);
}

// ------------------------------------------------------------
// Combat-ended detection (local helper)
// ------------------------------------------------------------

export function isCombatEndedForId(combatId: string, events: readonly any[]) {
  let seenStart = false;

  for (const e of events) {
    if (e?.type === "COMBAT_STARTED" && e?.payload?.combatId === combatId) {
      seenStart = true;
      continue;
    }
    if (seenStart && e?.type === "COMBAT_ENDED" && e?.payload?.combatId === combatId) {
      return true;
    }
  }

  return false;
}
