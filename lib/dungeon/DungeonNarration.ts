// lib/dungeon/DungeonNarration.ts
// ------------------------------------------------------------
// Echoes of Fate — Dungeon Narration
// ------------------------------------------------------------
// Purpose:
// - Turn deterministic dungeon structure into playable room language
// - Bind opening chronicle seed elements into room presentation
// - Keep narration deterministic from stable inputs
//
// Design rules:
// - PURE module: no mutation, no side effects
// - NO canon writes here
// - Same inputs -> same outputs
// - Tone should feel authored, not generic
// ------------------------------------------------------------

import type { DungeonFloorTheme, RoomFeatureKind, RoomType } from "@/lib/dungeon/RoomTypes";
import type { ConnectionType } from "@/lib/dungeon/RoomTypes";
import type { EnemyEncounterTheme } from "@/lib/game/EnemyDatabase";

export type OpeningChronicleSeed = {
  openingFrame: string;
  locationTraits: string[];
  oddities: string[];
  factionNames: string[];
  factionDesires: string[];
  factionPressures: string[];
  dormantHook: string;
};

export type NarrationFeature = {
  kind: string;
  note?: string | null;
};

export type NarrationExit = {
  type: string;
  targetLabel: string;
  locked?: boolean;
  note?: string | null;
};

export type DescribeRoomEntryArgs = {
  dungeonSeed: string;
  floorTheme: string;
  roomType: string;
  roomLabel: string;
  features: NarrationFeature[];
  exits: NarrationExit[];
  lootHint?: string | null;
  storyHint?: string | null;
  chronicle?: OpeningChronicleSeed | null;
};

export type DescribeRoomFeaturesArgs = {
  dungeonSeed?: string;
  floorTheme?: string;
  roomType: string;
  roomLabel?: string;
  features: NarrationFeature[];
  chronicle?: OpeningChronicleSeed | null;
};

export type DescribeRoomExitsArgs = {
  dungeonSeed?: string;
  roomType: string;
  exits: NarrationExit[];
};

function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function normalizeText(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function toTitle(v: string) {
  return normalizeText(v)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugKey(v: string) {
  return normalizeText(v).toLowerCase();
}

function pickDeterministic<T>(seed: string, items: readonly T[], fallback: T): T {
  if (!items.length) return fallback;
  const idx = hash32(seed) % items.length;
  return items[idx] ?? fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function featureKinds(features: NarrationFeature[]) {
  return features
    .map((f) => slugKey(f.kind))
    .filter(Boolean);
}

function hasFeature(features: NarrationFeature[], kind: RoomFeatureKind | string) {
  const target = slugKey(kind);
  return features.some((f) => slugKey(f.kind) === target);
}

function lockedExitCount(exits: NarrationExit[]) {
  return exits.filter((e) => e.locked || slugKey(e.type) === "locked_door").length;
}

function stairsExitCount(exits: NarrationExit[]) {
  return exits.filter((e) => slugKey(e.type) === "stairs").length;
}

function visibleDoorCount(exits: NarrationExit[]) {
  return exits.filter((e) => {
    const t = slugKey(e.type);
    return t === "door" || t === "locked_door";
  }).length;
}

function inferThemeLabel(floorTheme: string) {
  const key = slugKey(floorTheme) as DungeonFloorTheme;

  const map: Record<DungeonFloorTheme, string> = {
    ruined_outpost: "a ruined military outpost",
    forgotten_crypt: "an old crypt level",
    cult_temple: "a temple warped by ritual practice",
    arcane_forge: "an arcane forge complex",
    wild_depths: "a feral underdepth",
    ancient_vault: "an ancient vault layer",
  };

  return map[key] ?? "a buried dungeon layer";
}

function inferAmbientLine(floorTheme: string, roomType: string, seed: string): string {
  const themeKey = slugKey(floorTheme) as DungeonFloorTheme;
  const roomKey = slugKey(roomType) as RoomType;
  const key = `${themeKey}:${roomKey}:${seed}:ambient`;

  const byTheme: Record<string, string[]> = {
    ruined_outpost: [
      "Torchlight breaks across damaged stone and old defensive scars.",
      "Broken fortification lines still shape the room, even in ruin.",
      "The stone here remembers order, but not safety.",
    ],
    forgotten_crypt: [
      "Cold air hangs low, carrying dust, bone, and a silence that feels preserved.",
      "The room holds the stillness of old burial architecture.",
      "Stone and death sit close together here.",
    ],
    cult_temple: [
      "The chamber feels arranged for devotion, but not mercy.",
      "Ritual geometry lingers in the space like a wound that never shut.",
      "The air feels watched, as if reverence curdled into threat.",
    ],
    arcane_forge: [
      "The room hums with disciplined force and old engineered purpose.",
      "Arcane residue clings to the air with a metallic sharpness.",
      "This place feels built to obey logic harsher than flesh.",
    ],
    wild_depths: [
      "The chamber feels claimed by instinct, growth, and predatory patience.",
      "The air carries rot, damp stone, and the sense that something nests nearby.",
      "Nothing here feels fully abandoned; it feels occupied by the wrong things.",
    ],
    ancient_vault: [
      "The room feels deliberate, sealed, and older than the habits of the living.",
      "Authority lingers here more strongly than dust does.",
      "The architecture is too intentional to feel dead.",
    ],
  };

  const byRoom: Partial<Record<RoomType, string[]>> = {
    entrance: [
      "This first threshold still carries the feeling of crossing from rumor into consequence.",
      "The room feels like a formal beginning, not just a place to stand.",
    ],
    corridor: [
      "The passage compresses attention; every sound feels like a decision.",
      "This corridor does not invite rest. It funnels intent.",
    ],
    guard_post: [
      "Whoever held this post once meant to control movement through it.",
      "The room still reads like a place where others were expected to stop.",
    ],
    shrine: [
      "Something about the room asks for reverence, even now.",
      "The chamber holds a spiritual center, though not necessarily a safe one.",
    ],
    armory: [
      "The room feels practical, stripped toward weapons, tools, and preparedness.",
      "This chamber was built for use, not beauty.",
    ],
    storage: [
      "Supplies once mattered here enough to be gathered and hidden.",
      "The room feels like a place of provisions, secrets, or both.",
    ],
    beast_den: [
      "The chamber feels lived in by appetite rather than reason.",
      "Everything here suggests territory, not shelter.",
    ],
    crypt: [
      "The room was built to preserve the dead, not welcome the living.",
      "The silence here feels arranged rather than natural.",
    ],
    bone_pit: [
      "The chamber feels unstable, as if memory and remains were dumped together.",
      "This is less a room than a wound in the dungeon's body.",
    ],
    ritual_chamber: [
      "The room feels like a place where intention hardened into rite.",
      "Something here was meant to be repeated until it changed the world around it.",
    ],
    arcane_hall: [
      "The chamber feels measured, dangerous, and exact.",
      "This room was made to channel force, not merely contain it.",
    ],
    sentinel_hall: [
      "The room feels supervised, even when empty.",
      "Defense here feels procedural rather than emotional.",
    ],
    relic_vault: [
      "The chamber is arranged around value that was meant to outlast intrusion.",
      "This room feels like a promise made by old power to itself.",
    ],
    treasure_room: [
      "The space suggests deliberate keeping, not accidental accumulation.",
      "Something worth guarding once defined the room's purpose.",
    ],
    boss_chamber: [
      "The chamber feels like an answer waiting at the end of too many smaller questions.",
      "This room was built to hold authority, force, or revelation.",
    ],
    stairs_up: [
      "The room bends around transition rather than occupation.",
      "This place exists to move bodies and fate between levels.",
    ],
    stairs_down: [
      "The chamber carries the pressure of deeper commitment.",
      "The room feels like the dungeon asking whether you really mean to continue.",
    ],
    rest_site: [
      "The room feels briefly survivable, which in this place is its own kind of rarity.",
      "Someone once believed this was the least dangerous place nearby.",
    ],
  };

  const roomLines = byRoom[roomKey] ?? [];
  const themeLines = byTheme[themeKey] ?? ["The room carries the pressure of an older design."];
  const pool = [...roomLines, ...themeLines];

  return pickDeterministic(key, pool, pool[0] ?? "The room carries the pressure of an older design.");
}

function inferSensoryLine(floorTheme: string, roomType: string, seed: string): string {
  const key = `${slugKey(floorTheme)}:${slugKey(roomType)}:${seed}:sensory`;

  const pool = [
    "Light catches unevenly across the surfaces, leaving the edges of the room harder to trust.",
    "Dust, cold stone, and old residue hang in the air with more insistence than comfort.",
    "The room seems to hold onto sound instead of releasing it cleanly.",
    "Shadows gather in the places that matter most: corners, thresholds, and whatever waits beyond them.",
    "Every surface feels like it has been touched by time, pressure, or both.",
  ];

  const themePool: Record<string, string[]> = {
    forgotten_crypt: [
      "The air is colder than it should be, and the stone seems to keep that cold on purpose.",
      "Dust lies thick, but the room still feels inhabited by memory.",
    ],
    cult_temple: [
      "The room carries stale incense, metal, and the trace of repeated intention.",
      "The air feels worked on, not merely breathed in.",
    ],
    arcane_forge: [
      "There is a metallic edge to the air, as if force itself has a smell here.",
      "The room feels charged even when it appears still.",
    ],
    wild_depths: [
      "The air carries damp rot, animal trace, and the warning of unstable ground.",
      "The room smells like something nested here first and left recently.",
    ],
    ancient_vault: [
      "The chamber feels dry, sealed, and too deliberate to be truly empty.",
      "The air has the stillness of something preserved rather than forgotten.",
    ],
  };

  return pickDeterministic(key, [...(themePool[slugKey(floorTheme)] ?? []), ...pool], pool[0]);
}

function inferFeatureLine(feature: NarrationFeature, floorTheme: string, roomType: string, seed: string): string {
  const kind = slugKey(feature.kind) as RoomFeatureKind;
  const note = normalizeText(feature.note ?? "");
  const key = `${slugKey(floorTheme)}:${slugKey(roomType)}:${kind}:${seed}:${note}`;

  const generic: Record<string, string[]> = {
    door: [
      "A doorway offers another route, but not necessarily a safer one.",
      "One visible threshold suggests progress deeper into the structure.",
    ],
    locked_door: [
      "A sealed route interrupts the room's promise of easy passage.",
      "A locked barrier turns the room into a problem, not just a location.",
    ],
    stairs: [
      "A stair route bends the room toward another depth.",
      "The presence of stairs makes the chamber feel transitional and dangerous.",
    ],
    altar: [
      "An altar anchors the room with ritual weight.",
      "The chamber's center feels claimed by a sacred or profaned purpose.",
    ],
    cache: [
      "Something useful was hidden here deliberately.",
      "The room offers the possibility of supplies, value, or leverage.",
    ],
    hazard: [
      "The room contains a danger that changes how it can be crossed.",
      "Something in the chamber makes care more important than speed.",
    ],
    relic: [
      "A relic presence gives the room a gravity beyond ordinary treasure.",
      "Whatever is kept here matters more than simple wealth.",
    ],
    boss: [
      "The room feels like it was built to hold a singular answer.",
      "This chamber centers on force, authority, or both.",
    ],
    patrol_signs: [
      "Signs of movement suggest the room is not outside the dungeon's notice.",
      "The chamber carries evidence of recent traffic and watchfulness.",
    ],
  };

  const pool = generic[kind] ?? ["The room contains a notable feature."];
  const base = pickDeterministic(key, pool, pool[0]);

  if (!note) return base;
  return `${base} (${note}.)`.replace("..", ".");
}

function inferLootLine(lootHint: string | null | undefined, seed: string): string | null {
  const key = slugKey(lootHint ?? "");
  if (!key) return null;

  const map: Record<string, string[]> = {
    cache: [
      "The room suggests provisions or practical value worth securing.",
      "There is reason to believe useful supplies were meant to remain hidden here.",
    ],
    treasure: [
      "The chamber carries the pressure of guarded wealth.",
      "Something about the room implies kept value rather than random debris.",
    ],
    relic: [
      "The room feels organized around an object of meaning, not merely price.",
      "Whatever matters here feels old, deliberate, and worth protecting.",
    ],
    supplies: [
      "This place reads like somewhere resources were staged, stored, or rationed.",
      "The chamber suggests practical gain for anyone able to hold it.",
    ],
  };

  const pool = map[key];
  if (!pool?.length) return null;
  return pickDeterministic(`${seed}:${key}:loot`, pool, pool[0]);
}

function buildChronicleEchoes(
  chronicle: OpeningChronicleSeed | null | undefined,
  roomType: string,
  floorTheme: string,
  seed: string
): string[] {
  if (!chronicle) return [];

  const echoes: string[] = [];
  const roomKey = slugKey(roomType);
  const themeKey = slugKey(floorTheme);

  const oddity = chronicle.oddities[0] ? normalizeText(chronicle.oddities[0]) : "";
  const dormantHook = normalizeText(chronicle.dormantHook);
  const openingFrame = normalizeText(chronicle.openingFrame);
  const locationTraits = chronicle.locationTraits.map(normalizeText).filter(Boolean);
  const factionNames = chronicle.factionNames.map(normalizeText).filter(Boolean);

  if (oddity) {
    if (/footsteps echo twice/i.test(oddity) && ["corridor", "entrance", "guard_post", "stairs_down", "stairs_up"].includes(roomKey)) {
      echoes.push("Every shift of weight feels like it answers itself a beat too late.");
    } else if (/whisper/i.test(oddity)) {
      echoes.push("The edges of the room seem ready to carry speech that does not belong to the party.");
    } else if (/lantern/i.test(oddity) || /flame/i.test(oddity)) {
      echoes.push("The light here feels unstable enough to be read as a warning.");
    } else if (/absorb sound/i.test(oddity)) {
      echoes.push("Sound seems to die early here, as though the room refuses to return it.");
    }
  }

  if (dormantHook) {
    if (/name scratched into stone/i.test(dormantHook) && ["crypt", "ritual_chamber", "relic_vault", "boss_chamber", "corridor"].includes(roomKey)) {
      echoes.push("Marks in the stone feel less like damage and more like repetition with intent.");
    } else if (/sealed door/i.test(dormantHook) && ["guard_post", "relic_vault", "treasure_room"].includes(roomKey)) {
      echoes.push("The room feels tied to a threshold someone wanted disturbed as little as possible.");
    } else if (/missing/i.test(dormantHook)) {
      echoes.push("The place carries the mood of a story interrupted before it was finished.");
    }
  }

  if (openingFrame && themeKey === "ruined_outpost" && /city hums/i.test(openingFrame)) {
    echoes.push("It feels impossible not to remember that a whole city continues above this pressure.");
  }

  if (locationTraits.length > 0) {
    const trait = pickDeterministic(`${seed}:${roomKey}:${themeKey}:trait`, locationTraits, locationTraits[0]);
    if (trait) {
      echoes.push(`The room still carries that same ${trait} quality first felt at the threshold.`);
    }
  }

  if (factionNames.length > 0 && ["guard_post", "ritual_chamber", "shrine", "relic_vault", "boss_chamber"].includes(roomKey)) {
    const faction = pickDeterministic(`${seed}:${roomKey}:${themeKey}:faction`, factionNames, factionNames[0]);
    echoes.push(`The chamber feels like a place where traces of ${faction} could surface more clearly.`);
  }

  return dedupeStrings(echoes);
}

function describeExitLine(exit: NarrationExit, roomType: string, seed: string): string {
  const type = slugKey(exit.type) as ConnectionType;
  const targetLabel = normalizeText(exit.targetLabel) || "an unknown chamber";
  const note = normalizeText(exit.note ?? "");
  const locked = exit.locked || type === "locked_door";

  const key = `${roomType}:${type}:${targetLabel}:${locked}:${note}:${seed}`;

  if (type === "stairs") {
    const pool = [
      `A stair route leads toward ${targetLabel}, turning this room into a choice of depth.`,
      `Stairs draw the eye toward ${targetLabel}, asking whether the party is ready to commit further.`,
    ];
    return pickDeterministic(key, pool, pool[0]);
  }

  if (locked) {
    const pool = [
      `A locked way toward ${targetLabel} interrupts easy progress.`,
      `A sealed route points toward ${targetLabel}, but the room refuses to yield it freely.`,
    ];
    const base = pickDeterministic(key, pool, pool[0]);
    return note ? `${base} (${note}.)`.replace("..", ".") : base;
  }

  if (type === "door") {
    const pool = [
      `A doorway opens toward ${targetLabel}.`,
      `A visible threshold offers a route into ${targetLabel}.`,
    ];
    const base = pickDeterministic(key, pool, pool[0]);
    return note ? `${base} (${note}.)`.replace("..", ".") : base;
  }

  if (type === "secret") {
    const pool = [
      `A concealed route suggests access to ${targetLabel}.`,
      `Something about the walling implies a hidden way toward ${targetLabel}.`,
    ];
    const base = pickDeterministic(key, pool, pool[0]);
    return note ? `${base} (${note}.)`.replace("..", ".") : base;
  }

  const pool = [
    `A passage continues toward ${targetLabel}.`,
    `The room opens onward into ${targetLabel}.`,
  ];
  const base = pickDeterministic(key, pool, pool[0]);
  return note ? `${base} (${note}.)`.replace("..", ".") : base;
}

function dedupeStrings(lines: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of lines) {
    const line = normalizeText(raw);
    if (!line) continue;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }

  return out;
}

function compactSentences(lines: string[], max = 5) {
  return dedupeStrings(lines).slice(0, max);
}

function inferEncounterTone(features: NarrationFeature[], roomType: string, lootHint?: string | null): string | null {
  if (hasFeature(features, "boss") || slugKey(roomType) === "boss_chamber") {
    return "The room feels like it was meant to hold the strongest answer on this floor.";
  }

  if (hasFeature(features, "relic") || slugKey(lootHint ?? "") === "relic") {
    return "Whatever matters here feels guarded by meaning as much as force.";
  }

  if (hasFeature(features, "patrol_signs")) {
    return "The room gives the sense that others pass through it with purpose.";
  }

  if (hasFeature(features, "hazard")) {
    return "Crossing the room safely already feels like part of the challenge.";
  }

  return null;
}

function buildEntryParagraphs(args: DescribeRoomEntryArgs): string[] {
  const roomType = slugKey(args.roomType) as RoomType;
  const floorTheme = slugKey(args.floorTheme) as DungeonFloorTheme;
  const roomLabel = normalizeText(args.roomLabel) || toTitle(roomType.replaceAll("_", " "));
  const storyHint = normalizeText(args.storyHint ?? "");
  const lootHint = normalizeText(args.lootHint ?? "");
  const seedBase = `${args.dungeonSeed}:${floorTheme}:${roomType}:${roomLabel}`;

  const paragraphs: string[] = [];

  paragraphs.push(`You enter ${roomLabel}.`);

  const opener = inferAmbientLine(floorTheme, roomType, seedBase);
  const sensory = inferSensoryLine(floorTheme, roomType, seedBase);
  paragraphs.push(`${opener} ${sensory}`);

  if (storyHint) {
    paragraphs.push(storyHint);
  }

  const featureLines = describeRoomFeatures({
    dungeonSeed: args.dungeonSeed,
    floorTheme: args.floorTheme,
    roomType: args.roomType,
    roomLabel: args.roomLabel,
    features: args.features,
    chronicle: args.chronicle,
  });

  if (featureLines.length > 0) {
    paragraphs.push(featureLines.join(" "));
  }

  const lootLine = inferLootLine(lootHint, seedBase);
  if (lootLine) {
    paragraphs.push(lootLine);
  }

  const encounterTone = inferEncounterTone(args.features, roomType, lootHint);
  if (encounterTone) {
    paragraphs.push(encounterTone);
  }

  const chronicleEchoes = buildChronicleEchoes(args.chronicle, roomType, floorTheme, seedBase);
  if (chronicleEchoes.length > 0) {
    paragraphs.push(chronicleEchoes[0]);
  }

  const exitLines = describeRoomExits({
    dungeonSeed: args.dungeonSeed,
    roomType: args.roomType,
    exits: args.exits,
  });

  if (exitLines.length > 0) {
    paragraphs.push(exitLines.join(" "));
  }

  return compactSentences(paragraphs, 7);
}

export function describeRoomEntry(args: DescribeRoomEntryArgs): string {
  const lines = buildEntryParagraphs(args);
  return lines.join("\n\n");
}

export function describeRoomFeatures(args: DescribeRoomFeaturesArgs): string[] {
  const roomType = slugKey(args.roomType);
  const floorTheme = slugKey(args.floorTheme ?? "");
  const seed = `${args.dungeonSeed ?? "echoes"}:${floorTheme}:${roomType}:${normalizeText(args.roomLabel ?? "")}:features`;

  const lines: string[] = [];
  const features = args.features ?? [];

  if (!features.length) {
    const chronicleEchoes = buildChronicleEchoes(args.chronicle, roomType, floorTheme, seed);
    return compactSentences(chronicleEchoes, 2);
  }

  for (let i = 0; i < features.length; i++) {
    lines.push(inferFeatureLine(features[i], floorTheme, roomType, `${seed}:${i}`));
  }

  if (hasFeature(features, "altar") && hasFeature(features, "stairs")) {
    lines.push("The combination of altar and descent makes the room feel spiritually charged and strategically significant.");
  }

  if (hasFeature(features, "cache") && hasFeature(features, "hazard")) {
    lines.push("Whatever value the room offers is not being offered freely.");
  }

  if (hasFeature(features, "locked_door") && hasFeature(features, "relic")) {
    lines.push("The room is structured like something valuable was meant to remain protected behind intention, not merely stone.");
  }

  const chronicleEchoes = buildChronicleEchoes(args.chronicle, roomType, floorTheme, seed);
  lines.push(...chronicleEchoes.slice(0, 2));

  return compactSentences(lines, 6);
}

export function describeRoomExits(args: DescribeRoomExitsArgs): string[] {
  const exits = args.exits ?? [];
  const roomType = slugKey(args.roomType);
  const seed = `${args.dungeonSeed ?? "echoes"}:${roomType}:exits`;

  if (!exits.length) {
    return ["No obvious route presents itself from here."];
  }

  const lines = exits.map((exit, idx) => describeExitLine(exit, roomType, `${seed}:${idx}`));

  const lockedCount = lockedExitCount(exits);
  const stairCount = stairsExitCount(exits);
  const doorCount = visibleDoorCount(exits);

  if (lockedCount > 1) {
    lines.push("More than one route is being intentionally denied, which makes the room feel controlled rather than merely old.");
  } else if (lockedCount === 1) {
    lines.push("One route clearly demands more than simple confidence to cross.");
  }

  if (stairCount > 0) {
    lines.push("At least one path here is not just lateral movement, but a deeper commitment.");
  }

  if (doorCount > 1 && lockedCount === 0) {
    lines.push("The room offers multiple thresholds, which broadens choice but dilutes certainty.");
  }

  return compactSentences(lines, 5);
}

export function describeRoomSummary(args: {
  dungeonSeed: string;
  floorTheme: DungeonFloorTheme | string;
  roomType: RoomType | string;
  roomLabel: string;
  features?: NarrationFeature[];
  lootHint?: string | null;
  chronicle?: OpeningChronicleSeed | null;
  encounterTheme?: EnemyEncounterTheme | null;
}): string {
  const lines: string[] = [];

  const ambient = inferAmbientLine(args.floorTheme, args.roomType, `${args.dungeonSeed}:summary`);
  lines.push(`${normalizeText(args.roomLabel)} feels like part of ${inferThemeLabel(String(args.floorTheme))}.`);
  lines.push(ambient);

  if ((args.features ?? []).length > 0) {
    const featureNames = (args.features ?? [])
      .map((f) => slugKey(f.kind).replaceAll("_", " "))
      .filter(Boolean);

    if (featureNames.length > 0) {
      lines.push(`Known features include ${featureNames.join(", ")}.`);
    }
  }

  const lootLine = inferLootLine(args.lootHint, `${args.dungeonSeed}:summary:loot`);
  if (lootLine) lines.push(lootLine);

  const chronicleEcho = buildChronicleEchoes(
    args.chronicle,
    String(args.roomType),
    String(args.floorTheme),
    `${args.dungeonSeed}:summary:chronicle`
  )[0];
  if (chronicleEcho) lines.push(chronicleEcho);

  if (args.encounterTheme) {
    lines.push(`Its threat profile feels aligned with a ${args.encounterTheme.replaceAll("_", " ")} encounter space.`);
  }

  return compactSentences(lines, 5).join(" ");
}
