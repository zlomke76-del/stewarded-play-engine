// lib/dungeon/traps/DungeonTrapRegistry.ts

/**
 * DungeonTrapRegistry
 * ------------------------------------------------------------
 * Canonical trap definitions for room-based dungeon generation.
 *
 * Design goals:
 * - single source of truth for trap identity + metadata
 * - compatible with room/floor graph generation
 * - supports:
 *    - generation (what trap fits where?)
 *    - discovery (what clues appear?)
 *    - narration (what should be described?)
 *    - visuals (what artwork resolves?)
 *    - evolution (what state transitions are allowed?)
 *
 * Notes:
 * - This file is intentionally self-contained so it can be added
 *   without creating import churn across the dungeon spine.
 * - Keep IDs stable once they are used in saved sessions/events.
 * ------------------------------------------------------------
 */

export type DungeonTrapId =
  | "trap_spike_pit"
  | "trap_swinging_blades"
  | "trap_poison_darts"
  | "trap_falling_block"
  | "trap_crushing_walls"
  | "trap_gas_chamber";

export type DungeonTrapFamily =
  | "mechanical"
  | "environmental"
  | "crushing"
  | "ranged"
  | "corridor"
  | "floor-collapse"
  | "toxic";

export type DungeonTrapDanger =
  | "low"
  | "moderate"
  | "high"
  | "severe"
  | "deadly";

export type DungeonTrapTrigger =
  | "pressure_plate"
  | "weight_threshold"
  | "false_stone_tile"
  | "tripwire"
  | "stepping_on_tile"
  | "opening_chest"
  | "disturbing_bones"
  | "center_tile"
  | "doorway_pressure_plate"
  | "stepping_into_corridor"
  | "opening_door"
  | "disturbing_shrine"
  | "stepping_on_rune";

export type DungeonTrapClue =
  | "cracked_tiles"
  | "old_bones"
  | "metallic_smell"
  | "grooves_in_walls"
  | "blood_streaks"
  | "chains_above"
  | "tiny_holes_in_wall"
  | "dead_insects"
  | "cracked_ceiling"
  | "dust_falling"
  | "scrape_marks"
  | "flattened_skeletons"
  | "green_residue"
  | "dead_animals"
  | "bitter_chemical_smell"
  | "hollow_echo"
  | "darts_in_stone"
  | "grinding_noise"
  | "visible_floor_gaps";

export type DungeonTrapGameplayTag =
  | "timing_puzzle"
  | "dodge_check"
  | "athletics_check"
  | "perception_counterplay"
  | "disarmable"
  | "lingering_hazard"
  | "area_denial"
  | "path_blocker"
  | "one_shot_burst"
  | "persistent_room_hazard"
  | "movement_tax"
  | "high_telegraph"
  | "low_telegraph";

export type DungeonTrapRoomType =
  | "corridor"
  | "hall"
  | "chokepoint"
  | "passage"
  | "chamber"
  | "shrine"
  | "ritual"
  | "treasure"
  | "crypt"
  | "tomb"
  | "vault"
  | "antechamber"
  | "stair"
  | "prison"
  | "ossuary"
  | "armory";

export type DungeonTheme =
  | "ancient_crypt"
  | "burial_tomb"
  | "dwarven_ruin"
  | "abandoned_keep"
  | "cult_temple"
  | "forgotten_catacomb"
  | "plague_vault"
  | "generic_stone_dungeon";

export type DungeonTrapState =
  | "hidden"
  | "suspected"
  | "revealed"
  | "triggered"
  | "disarmed"
  | "spent"
  | "persistent";

export type DungeonTrapResetBehavior =
  | "none"
  | "manual_reset"
  | "auto_reset"
  | "stays_triggered";

export type DungeonTrapDefinition = {
  id: DungeonTrapId;
  slug: string;
  name: string;
  family: DungeonTrapFamily[];
  danger: DungeonTrapDanger;

  /**
   * Stable relative path from public/
   * Example consumer usage:
   *   <img src={definition.assetPath} />
   */
  assetPath: string;

  triggers: DungeonTrapTrigger[];
  clues: DungeonTrapClue[];
  gameplayTags: DungeonTrapGameplayTag[];

  compatibleRoomTypes: DungeonTrapRoomType[];
  compatibleThemes: DungeonTheme[];

  /**
   * Weighted affinity for generation.
   * Higher value means "pick more often when compatible."
   */
  generationWeight: number;

  /**
   * State semantics help DungeonEvolution remain consistent.
   */
  initialState: Extract<DungeonTrapState, "hidden" | "revealed" | "suspected">;
  persistentAfterTrigger: boolean;
  resetBehavior: DungeonTrapResetBehavior;

  /**
   * Short atmospheric text for narration.
   */
  shortDescription: string;

  /**
   * Human-facing clue phrases for discovery / narration.
   */
  clueText: string[];

  /**
   * Human-facing trigger/impact phrasing.
   */
  triggerText: string;

  /**
   * Room flavor / aftermath language.
   */
  aftermathText: string;

  /**
   * Optional prompt-like tags for visual resolver / content tools.
   */
  visualTags: string[];
};

export type DungeonTrapPlacementContext = {
  roomType?: string | null;
  theme?: string | null;
};

export const DUNGEON_TRAP_REGISTRY: Record<DungeonTrapId, DungeonTrapDefinition> =
  {
    trap_spike_pit: {
      id: "trap_spike_pit",
      slug: "spike-pit",
      name: "Spike Pit",
      family: ["mechanical", "floor-collapse"],
      danger: "high",
      assetPath: "/assets/V3/Dungeon/Traps/spike_pit_01.png",
      triggers: ["pressure_plate", "weight_threshold", "false_stone_tile"],
      clues: [
        "cracked_tiles",
        "old_bones",
        "metallic_smell",
        "hollow_echo",
        "visible_floor_gaps",
      ],
      gameplayTags: [
        "perception_counterplay",
        "disarmable",
        "area_denial",
        "movement_tax",
        "high_telegraph",
      ],
      compatibleRoomTypes: [
        "chamber",
        "antechamber",
        "crypt",
        "tomb",
        "vault",
        "passage",
      ],
      compatibleThemes: [
        "ancient_crypt",
        "burial_tomb",
        "forgotten_catacomb",
        "generic_stone_dungeon",
        "abandoned_keep",
      ],
      generationWeight: 8,
      initialState: "hidden",
      persistentAfterTrigger: true,
      resetBehavior: "stays_triggered",
      shortDescription:
        "A false stone floor collapses into a deep pit lined with rusted spikes.",
      clueText: [
        "Hairline cracks spread across the floor tiles.",
        "A faint metallic smell rises from below.",
        "Old bones can be seen through narrow gaps in the stone.",
        "The floor gives off a subtle hollow echo underfoot.",
      ],
      triggerText:
        "The weakened floor gives way, dropping victims into a spike-lined pit.",
      aftermathText:
        "The pit remains open after it is triggered, turning the room into a permanent traversal hazard.",
      visualTags: [
        "dark fantasy",
        "stone chamber",
        "collapsed floor",
        "spike pit",
        "bones",
        "crypt",
      ],
    },

    trap_swinging_blades: {
      id: "trap_swinging_blades",
      slug: "swinging-blades",
      name: "Swinging Blade Corridor",
      family: ["mechanical", "corridor"],
      danger: "high",
      assetPath: "/assets/V3/Dungeon/Traps/swinging_corridor_01.png",
      triggers: ["tripwire", "pressure_plate"],
      clues: ["grooves_in_walls", "blood_streaks", "chains_above"],
      gameplayTags: [
        "timing_puzzle",
        "dodge_check",
        "athletics_check",
        "perception_counterplay",
        "disarmable",
        "high_telegraph",
      ],
      compatibleRoomTypes: ["corridor", "hall", "chokepoint", "passage"],
      compatibleThemes: [
        "abandoned_keep",
        "dwarven_ruin",
        "generic_stone_dungeon",
        "forgotten_catacomb",
      ],
      generationWeight: 10,
      initialState: "hidden",
      persistentAfterTrigger: true,
      resetBehavior: "auto_reset",
      shortDescription:
        "Pendulum blades swing across a narrow corridor in deadly arcs.",
      clueText: [
        "Deep grooves are carved into both walls.",
        "Dark blood streaks stain the floor stones.",
        "Chains and old mechanisms hang above the corridor.",
      ],
      triggerText:
        "Heavy blades begin sweeping from side to side, turning the corridor into a lethal timing gauntlet.",
      aftermathText:
        "If not disabled, the mechanism may continue cycling or reset after a short interval.",
      visualTags: [
        "dark corridor",
        "pendulum blades",
        "chains",
        "stone dungeon",
        "trap hall",
      ],
    },

    trap_poison_darts: {
      id: "trap_poison_darts",
      slug: "poison-darts",
      name: "Poison Dart Wall",
      family: ["mechanical", "ranged"],
      danger: "moderate",
      assetPath: "/assets/V3/Dungeon/Traps/poison_darts_01.png",
      triggers: ["stepping_on_tile", "opening_chest", "disturbing_bones"],
      clues: [
        "tiny_holes_in_wall",
        "dead_insects",
        "darts_in_stone",
        "bitter_chemical_smell",
      ],
      gameplayTags: [
        "one_shot_burst",
        "perception_counterplay",
        "disarmable",
        "low_telegraph",
      ],
      compatibleRoomTypes: [
        "treasure",
        "vault",
        "chamber",
        "crypt",
        "ossuary",
        "antechamber",
      ],
      compatibleThemes: [
        "ancient_crypt",
        "burial_tomb",
        "forgotten_catacomb",
        "generic_stone_dungeon",
        "abandoned_keep",
      ],
      generationWeight: 9,
      initialState: "hidden",
      persistentAfterTrigger: false,
      resetBehavior: "manual_reset",
      shortDescription:
        "Hidden apertures in the walls fire a volley of poisoned darts when disturbed.",
      clueText: [
        "Tiny circular holes are set into the stone walls.",
        "Dead insects lie beneath the openings.",
        "Several old darts remain embedded in the opposite wall.",
        "A bitter scent clings faintly to the air.",
      ],
      triggerText:
        "Poisoned darts burst from the walls in a sudden crossfire.",
      aftermathText:
        "Once fired, the trap may be temporarily spent unless reloaded by a hidden mechanism.",
      visualTags: [
        "stone chamber",
        "dart holes",
        "poison trap",
        "treasure room",
        "crypt hazard",
      ],
    },

    trap_falling_block: {
      id: "trap_falling_block",
      slug: "falling-stone-block",
      name: "Falling Stone Block",
      family: ["mechanical", "crushing"],
      danger: "severe",
      assetPath: "/assets/V3/Dungeon/Traps/falling_stone_block_01.png",
      triggers: ["center_tile", "doorway_pressure_plate"],
      clues: ["cracked_ceiling", "dust_falling", "grinding_noise"],
      gameplayTags: [
        "one_shot_burst",
        "path_blocker",
        "perception_counterplay",
        "high_telegraph",
      ],
      compatibleRoomTypes: ["corridor", "hall", "chokepoint", "passage", "stair"],
      compatibleThemes: [
        "dwarven_ruin",
        "abandoned_keep",
        "generic_stone_dungeon",
        "ancient_crypt",
      ],
      generationWeight: 7,
      initialState: "hidden",
      persistentAfterTrigger: true,
      resetBehavior: "stays_triggered",
      shortDescription:
        "A massive stone slab drops from the ceiling, crushing anything beneath it.",
      clueText: [
        "The ceiling above is cracked and unstable.",
        "Fine dust drifts downward from overhead seams.",
        "A faint grinding noise can be heard from somewhere above.",
      ],
      triggerText:
        "A huge stone block crashes down from above with explosive force.",
      aftermathText:
        "The slab often remains in place, altering movement through the room or corridor.",
      visualTags: [
        "stone corridor",
        "ceiling trap",
        "falling slab",
        "dust cloud",
        "ancient mechanism",
      ],
    },

    trap_crushing_walls: {
      id: "trap_crushing_walls",
      slug: "crushing-walls",
      name: "Crushing Walls",
      family: ["mechanical", "corridor", "crushing"],
      danger: "deadly",
      assetPath: "/assets/V3/Dungeon/Traps/crushing_walls_01.png",
      triggers: ["stepping_into_corridor", "opening_door"],
      clues: ["scrape_marks", "flattened_skeletons", "grinding_noise"],
      gameplayTags: [
        "timing_puzzle",
        "athletics_check",
        "persistent_room_hazard",
        "path_blocker",
        "high_telegraph",
      ],
      compatibleRoomTypes: ["corridor", "hall", "chokepoint", "passage"],
      compatibleThemes: [
        "dwarven_ruin",
        "abandoned_keep",
        "generic_stone_dungeon",
        "forgotten_catacomb",
      ],
      generationWeight: 6,
      initialState: "hidden",
      persistentAfterTrigger: true,
      resetBehavior: "manual_reset",
      shortDescription:
        "Ancient mechanisms drive the corridor walls inward, crushing anything trapped between them.",
      clueText: [
        "Long scrape marks run parallel along the walls.",
        "Flattened skeletons lie crumpled near the edges of the corridor.",
        "A deep grinding sound hums behind the stone.",
      ],
      triggerText:
        "The corridor walls begin sliding inward with relentless force.",
      aftermathText:
        "Unless jammed or disabled, the hazard can remain active and physically change how the corridor is traversed.",
      visualTags: [
        "narrow hall",
        "moving walls",
        "crushing trap",
        "stone corridor",
        "skeletons",
      ],
    },

    trap_gas_chamber: {
      id: "trap_gas_chamber",
      slug: "gas-chamber",
      name: "Gas Chamber",
      family: ["environmental", "toxic"],
      danger: "high",
      assetPath: "/assets/V3/Dungeon/Traps/gas_chamber_01.png",
      triggers: ["disturbing_shrine", "stepping_on_rune"],
      clues: ["green_residue", "dead_animals", "bitter_chemical_smell"],
      gameplayTags: [
        "lingering_hazard",
        "persistent_room_hazard",
        "area_denial",
        "perception_counterplay",
        "disarmable",
        "low_telegraph",
      ],
      compatibleRoomTypes: ["shrine", "ritual", "chamber", "crypt", "vault"],
      compatibleThemes: [
        "cult_temple",
        "plague_vault",
        "ancient_crypt",
        "forgotten_catacomb",
        "generic_stone_dungeon",
      ],
      generationWeight: 8,
      initialState: "hidden",
      persistentAfterTrigger: true,
      resetBehavior: "manual_reset",
      shortDescription:
        "Hidden vents flood the chamber with toxic gas after the shrine or rune is disturbed.",
      clueText: [
        "Green residue clings to seams and vent-like cracks in the stone.",
        "Dead animals lie scattered around the chamber edges.",
        "A bitter chemical smell hangs in the air.",
      ],
      triggerText:
        "Toxic gas hisses into the room, obscuring sight and choking the air.",
      aftermathText:
        "The gas may linger after activation, turning the chamber into a temporary denial zone until ventilated or dispersed.",
      visualTags: [
        "ritual chamber",
        "toxic green gas",
        "shrine",
        "stone vents",
        "dead animals",
      ],
    },
  };

export const ALL_DUNGEON_TRAPS: DungeonTrapDefinition[] = Object.freeze(
  Object.values(DUNGEON_TRAP_REGISTRY),
);

export function getDungeonTrapById(
  trapId: DungeonTrapId | string | null | undefined,
): DungeonTrapDefinition | null {
  if (!trapId) return null;
  return (
    DUNGEON_TRAP_REGISTRY[trapId as DungeonTrapId] ??
    null
  );
}

export function getDungeonTrapAssetPath(
  trapId: DungeonTrapId | string | null | undefined,
): string | null {
  const trap = getDungeonTrapById(trapId);
  return trap?.assetPath ?? null;
}

export function listDungeonTrapIds(): DungeonTrapId[] {
  return ALL_DUNGEON_TRAPS.map((trap) => trap.id);
}

export function listDungeonTraps(): DungeonTrapDefinition[] {
  return [...ALL_DUNGEON_TRAPS];
}

export function getTrapsForRoomType(
  roomType: string | null | undefined,
): DungeonTrapDefinition[] {
  if (!roomType) return [];
  return ALL_DUNGEON_TRAPS.filter((trap) =>
    trap.compatibleRoomTypes.includes(roomType as DungeonTrapRoomType),
  );
}

export function getTrapsForTheme(
  theme: string | null | undefined,
): DungeonTrapDefinition[] {
  if (!theme) return [];
  return ALL_DUNGEON_TRAPS.filter((trap) =>
    trap.compatibleThemes.includes(theme as DungeonTheme),
  );
}

export function getCompatibleDungeonTraps(
  context: DungeonTrapPlacementContext,
): DungeonTrapDefinition[] {
  const { roomType, theme } = context;

  return ALL_DUNGEON_TRAPS.filter((trap) => {
    const roomOk = roomType
      ? trap.compatibleRoomTypes.includes(roomType as DungeonTrapRoomType)
      : true;

    const themeOk = theme
      ? trap.compatibleThemes.includes(theme as DungeonTheme)
      : true;

    return roomOk && themeOk;
  }).sort((a, b) => b.generationWeight - a.generationWeight);
}

export function chooseWeightedDungeonTrap(
  context: DungeonTrapPlacementContext,
  random: () => number = Math.random,
): DungeonTrapDefinition | null {
  const candidates = getCompatibleDungeonTraps(context);

  if (candidates.length === 0) {
    return null;
  }

  const totalWeight = candidates.reduce(
    (sum, trap) => sum + Math.max(0, trap.generationWeight),
    0,
  );

  if (totalWeight <= 0) {
    return candidates[0] ?? null;
  }

  let roll = random() * totalWeight;

  for (const trap of candidates) {
    roll -= Math.max(0, trap.generationWeight);
    if (roll <= 0) {
      return trap;
    }
  }

  return candidates[candidates.length - 1] ?? null;
}

export function trapSupportsState(
  trapId: DungeonTrapId | string | null | undefined,
  state: DungeonTrapState,
): boolean {
  const trap = getDungeonTrapById(trapId);
  if (!trap) return false;

  switch (state) {
    case "hidden":
    case "suspected":
    case "revealed":
    case "disarmed":
      return true;

    case "triggered":
      return true;

    case "spent":
      return !trap.persistentAfterTrigger;

    case "persistent":
      return trap.persistentAfterTrigger;

    default:
      return false;
  }
}

export function inferPostTriggerTrapState(
  trapId: DungeonTrapId | string | null | undefined,
): DungeonTrapState | null {
  const trap = getDungeonTrapById(trapId);
  if (!trap) return null;
  return trap.persistentAfterTrigger ? "persistent" : "spent";
}

export function getTrapNarrationSeed(
  trapId: DungeonTrapId | string | null | undefined,
): {
  name: string;
  shortDescription: string;
  clueText: string[];
  triggerText: string;
  aftermathText: string;
} | null {
  const trap = getDungeonTrapById(trapId);
  if (!trap) return null;

  return {
    name: trap.name,
    shortDescription: trap.shortDescription,
    clueText: [...trap.clueText],
    triggerText: trap.triggerText,
    aftermathText: trap.aftermathText,
  };
}

export function getTrapClueLabels(
  trapId: DungeonTrapId | string | null | undefined,
): string[] {
  const trap = getDungeonTrapById(trapId);
  return trap ? [...trap.clues] : [];
}

export function getTrapTriggerLabels(
  trapId: DungeonTrapId | string | null | undefined,
): string[] {
  const trap = getDungeonTrapById(trapId);
  return trap ? [...trap.triggers] : [];
}

export function isCorridorTrap(
  trapId: DungeonTrapId | string | null | undefined,
): boolean {
  const trap = getDungeonTrapById(trapId);
  if (!trap) return false;

  return (
    trap.family.includes("corridor") ||
    trap.compatibleRoomTypes.includes("corridor") ||
    trap.compatibleRoomTypes.includes("hall") ||
    trap.compatibleRoomTypes.includes("chokepoint")
  );
}

export function isEnvironmentalTrap(
  trapId: DungeonTrapId | string | null | undefined,
): boolean {
  const trap = getDungeonTrapById(trapId);
  return trap ? trap.family.includes("environmental") : false;
}

export function isMechanicalTrap(
  trapId: DungeonTrapId | string | null | undefined,
): boolean {
  const trap = getDungeonTrapById(trapId);
  return trap ? trap.family.includes("mechanical") : false;
}
