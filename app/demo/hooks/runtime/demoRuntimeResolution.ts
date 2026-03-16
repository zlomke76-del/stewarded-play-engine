import type { DiceMode, RollSource } from "../../demoTypes";
import { inferOptionKind } from "../../demoUtils";
import { appendEventToState } from "./demoRuntimeUtils";
import { commitDungeonTraversalBundle } from "./demoRuntimeTraversal";

type HandleRecordArgs = {
  prevState: any;
  payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  };
  playerInput: string;
  selectedOptionDescription: string;
  selectedConnectionId?: string | null;
  location: {
    floorId: string;
    roomId: string;
  };
  currentRoom: any;
  reachableConnections: any[];
  dungeon: any;
  openedDoorIds: string[];
  unlockedDoorIds: string[];
};

type HandleOutcomeOnlyArgs = {
  prevState: any;
  payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  };
  location: {
    floorId: string;
    roomId: string;
  };
};

type ReplacementWeaponSummary = {
  name: string;
  category: string;
  trait: string;
  damage: string;
};

export function deriveOutcomeSuccess(payload: {
  dice?: { roll?: number; dc?: number } | null;
}) {
  const roll = Number(payload?.dice?.roll);
  const dc = Number(payload?.dice?.dc);

  return Number.isFinite(roll) && Number.isFinite(dc) ? roll >= dc : false;
}

function normalizeName(value: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string) {
  return normalizeName(value).toLowerCase();
}

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function findLatestCombatWindow(events: any[]) {
  let latestStarted: { index: number; combatId: string } | null = null;
  let latestEndedIndex = -1;

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const type = String(event?.type ?? "");
    const payload = event?.payload ?? {};

    if (type === "COMBAT_STARTED") {
      const combatId = String(payload?.combatId ?? "").trim();
      if (combatId) {
        latestStarted = { index: i, combatId };
      }
    }

    if (type === "COMBAT_ENDED") {
      latestEndedIndex = i;
    }
  }

  if (!latestStarted) return null;
  if (latestEndedIndex > latestStarted.index) return null;

  return latestStarted;
}

function hasStarterWeaponAlreadyBroken(events: any[]) {
  return events.some((event) => {
    if (String(event?.type ?? "") !== "HERO_STARTER_WEAPON_BROKEN") return false;
    return true;
  });
}

function hasReplacementWeaponAlreadyRecovered(events: any[]) {
  return events.some((event) => {
    if (String(event?.type ?? "") !== "HERO_LOADOUT_CHANGED") return false;
    const payload = event?.payload ?? {};
    if (String(payload?.slot ?? "") !== "weapon") return false;

    const consequence = normalizeKey(String(payload?.consequence ?? ""));
    const source = normalizeKey(String(payload?.source ?? ""));
    const roomReward = normalizeKey(String(payload?.rewardType ?? ""));

    return (
      consequence === "armory_replacement_claimed" ||
      source === "armory_replacement" ||
      roomReward === "class_weapon_recovery"
    );
  });
}

function inferIsOpeningThresholdCombat(args: {
  events: any[];
  floorId: string;
  roomId: string;
}) {
  const { events, floorId, roomId } = args;
  const combatWindow = findLatestCombatWindow(events);
  if (!combatWindow) return false;

  const dungeonInitialized = events.some(
    (event) => String(event?.type ?? "") === "DUNGEON_INITIALIZED"
  );
  if (!dungeonInitialized) return false;

  const floorKey = normalizeKey(floorId);
  const roomKey = normalizeKey(roomId);

  const looksLikeFirstRoom =
    floorKey.includes("floor_0") ||
    floorKey.includes("floor0") ||
    roomKey.includes("start") ||
    roomKey.includes("entrance") ||
    roomKey.includes("threshold") ||
    roomKey.includes("room_0") ||
    roomKey.includes("room0");

  return looksLikeFirstRoom;
}

function inferHeroClassName(prevState: any) {
  const directCandidates = [
    prevState?.hero?.className,
    prevState?.hero?.heroClass,
    prevState?.hero?.class,
    prevState?.activeHero?.className,
    prevState?.activeHero?.heroClass,
    prevState?.activeHero?.class,
    prevState?.heroSheet?.className,
    prevState?.heroSheet?.heroClass,
    prevState?.heroSheet?.class,
    prevState?.session?.hero?.className,
    prevState?.session?.hero?.heroClass,
    prevState?.session?.hero?.class,
  ];

  for (const candidate of directCandidates) {
    const value = normalizeName(String(candidate ?? ""));
    if (value) return value;
  }

  const events = Array.isArray(prevState?.events) ? prevState.events : [];

  for (let i = events.length - 1; i >= 0; i -= 1) {
    const payload = events[i]?.payload ?? {};

    const eventCandidates = [
      payload?.className,
      payload?.heroClass,
      payload?.class,
      payload?.hero?.className,
      payload?.hero?.heroClass,
      payload?.hero?.class,
    ];

    for (const candidate of eventCandidates) {
      const value = normalizeName(String(candidate ?? ""));
      if (value) return value;
    }
  }

  return "Warrior";
}

function isArmoryRewardRoom(args: { currentRoom: any; roomId: string }) {
  const roomIdKey = normalizeKey(args.roomId);
  const roomTypeKey = normalizeKey(String(args.currentRoom?.type ?? ""));
  const roomTitleKey = normalizeKey(
    String(
      args.currentRoom?.title ??
        args.currentRoom?.name ??
        args.currentRoom?.label ??
        ""
    )
  );
  const roomNarrativeKey = normalizeKey(
    String(args.currentRoom?.narrative ?? args.currentRoom?.description ?? "")
  );

  const combined = [
    roomIdKey,
    roomTypeKey,
    roomTitleKey,
    roomNarrativeKey,
  ].join(" ");

  return includesAny(combined, [
    "armory",
    "guard_shack",
    "guard shack",
    "weapons rack",
    "weapon rack",
    "weapon cache",
    "barracks",
    "supply room",
  ]);
}

function buildReplacementWeaponForClass(className?: string): ReplacementWeaponSummary {
  const classKey = normalizeKey(className ?? "");

  if (classKey.includes("warrior") || classKey.includes("fighter")) {
    return {
      name: "Tempered Longsword",
      category: "martial blade",
      trait: "balanced",
      damage: "1d8",
    };
  }

  if (classKey.includes("rogue")) {
    return {
      name: "Silent Edge",
      category: "dagger",
      trait: "precise",
      damage: "1d6",
    };
  }

  if (classKey.includes("mage") || classKey.includes("wizard")) {
    return {
      name: "Rune Staff",
      category: "arcane focus",
      trait: "channeling",
      damage: "1d8",
    };
  }

  if (classKey.includes("cleric")) {
    return {
      name: "Sanctified Mace",
      category: "blunt weapon",
      trait: "steadfast",
      damage: "1d8",
    };
  }

  if (classKey.includes("ranger")) {
    return {
      name: "Recovered Longbow",
      category: "bow",
      trait: "trueflight",
      damage: "1d8",
    };
  }

  if (classKey.includes("paladin")) {
    return {
      name: "Oathblade Fragment Restored",
      category: "holy blade",
      trait: "vowed",
      damage: "1d8",
    };
  }

  if (classKey.includes("monk")) {
    return {
      name: "Ironwood Cestus",
      category: "hand weapon",
      trait: "disciplined",
      damage: "1d6",
    };
  }

  if (classKey.includes("druid")) {
    return {
      name: "Rootbound Staff",
      category: "nature focus",
      trait: "living grain",
      damage: "1d8",
    };
  }

  if (classKey.includes("bard")) {
    return {
      name: "Courtblade",
      category: "finesse blade",
      trait: "graceful",
      damage: "1d6",
    };
  }

  if (classKey.includes("artificer")) {
    return {
      name: "Calibrated Shock-Rod",
      category: "engineered focus",
      trait: "tuned",
      damage: "1d8",
    };
  }

  if (classKey.includes("barbarian")) {
    return {
      name: "Guardbreaker Axe",
      category: "heavy weapon",
      trait: "cleaving",
      damage: "1d10",
    };
  }

  if (classKey.includes("sorcerer")) {
    return {
      name: "Ember Focus Rod",
      category: "arcane focus",
      trait: "volatile",
      damage: "1d8",
    };
  }

  if (classKey.includes("warlock")) {
    return {
      name: "Veilthorn Pact Blade",
      category: "eldritch blade",
      trait: "hexbound",
      damage: "1d8",
    };
  }

  return {
    name: "Guard Blade",
    category: "martial weapon",
    trait: "serviceable",
    damage: "1d8",
  };
}

function shouldBreakStarterWeapon(args: {
  prevState: any;
  success: boolean;
  kind: string;
  location: { floorId: string; roomId: string };
}) {
  const { prevState, success, kind, location } = args;
  if (!success) return false;
  if (kind !== "contested") return false;

  const events = Array.isArray(prevState?.events) ? prevState.events : [];
  if (hasStarterWeaponAlreadyBroken(events)) return false;

  return inferIsOpeningThresholdCombat({
    events,
    floorId: location.floorId,
    roomId: location.roomId,
  });
}

function shouldGrantReplacementWeapon(args: {
  prevState: any;
  success: boolean;
  currentRoom: any;
  location: { floorId: string; roomId: string };
}) {
  const { prevState, success, currentRoom, location } = args;
  if (!success) return false;

  const events = Array.isArray(prevState?.events) ? prevState.events : [];
  if (!hasStarterWeaponAlreadyBroken(events)) return false;
  if (hasReplacementWeaponAlreadyRecovered(events)) return false;

  return isArmoryRewardRoom({
    currentRoom,
    roomId: location.roomId,
  });
}

function appendOpeningWeaponBreakConsequences(args: {
  nextState: any;
  location: { floorId: string; roomId: string };
  playerInput: string;
  selectedOptionDescription: string;
}) {
  const { nextState, location, playerInput, selectedOptionDescription } = args;

  let next = nextState;

  next = appendEventToState(next, "HERO_STARTER_WEAPON_BROKEN", {
    floorId: location.floorId,
    roomId: location.roomId,
    reason: "opening_threshold_victory",
    sourceText: `${playerInput}\n${selectedOptionDescription}`.trim(),
  });

  next = appendEventToState(next, "HERO_LOADOUT_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    slot: "weapon",
    state: "broken",
    previousItemName: "Starter Weapon",
    nextItemName: "Broken Starter Weapon",
    consequence: "armory_replacement_needed",
  });

  next = appendEventToState(next, "CHRONICLE_NOTE_RECORDED", {
    floorId: location.floorId,
    roomId: location.roomId,
    category: "first_victory",
    text: "The hero survived the first guardian, but the weapon that carried them into the dark did not survive the strike.",
  });

  return next;
}

function appendReplacementWeaponConsequences(args: {
  nextState: any;
  prevState: any;
  location: { floorId: string; roomId: string };
  playerInput: string;
  selectedOptionDescription: string;
}) {
  const { nextState, prevState, location, playerInput, selectedOptionDescription } =
    args;

  const className = inferHeroClassName(prevState);
  const weapon = buildReplacementWeaponForClass(className);

  let next = nextState;

  next = appendEventToState(next, "HERO_LOADOUT_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    slot: "weapon",
    state: "equipped",
    source: "armory_replacement",
    rewardType: "class_weapon_recovery",
    previousItemName: "Broken Starter Weapon",
    nextItemName: weapon.name,
    weaponCategory: weapon.category,
    weaponTrait: weapon.trait,
    weaponDamage: weapon.damage,
    className,
    consequence: "armory_replacement_claimed",
    sourceText: `${playerInput}\n${selectedOptionDescription}`.trim(),
  });

  next = appendEventToState(next, "CHRONICLE_NOTE_RECORDED", {
    floorId: location.floorId,
    roomId: location.roomId,
    category: "weapon_recovered",
    text: `In the dim reserve of the dungeon, the hero reclaimed momentum: ${weapon.name}.`,
  });

  return next;
}

export function commitResolvedActionToState(args: HandleRecordArgs) {
  const {
    prevState,
    payload,
    playerInput,
    selectedOptionDescription,
    selectedConnectionId,
    location,
    currentRoom,
    reachableConnections,
    dungeon,
    openedDoorIds,
    unlockedDoorIds,
  } = args;

  const combinedText = `${playerInput}\n${selectedOptionDescription}`.trim();
  const kind = inferOptionKind(
    combinedText.length ? combinedText : selectedOptionDescription
  );
  const success = deriveOutcomeSuccess(payload);

  const enrichedOutcome = {
    ...payload,
    meta: {
      ...(payload as any)?.meta,
      optionKind: kind,
      optionDescription: selectedOptionDescription,
      intent: playerInput,
      floorId: location.floorId,
      roomId: location.roomId,
      success,
      selectedConnectionId: selectedConnectionId ?? null,
    },
  };

  let next = appendEventToState(prevState, "OUTCOME", enrichedOutcome as any);

  const pressureDelta =
    kind === "contested"
      ? success
        ? 5
        : 11
      : kind === "risky"
        ? success
          ? 4
          : 9
        : kind === "environmental"
          ? success
            ? 3
            : 7
          : success
            ? 2
            : 5;

  const awarenessDelta =
    kind === "contested"
      ? success
        ? 7
        : 14
      : kind === "risky"
        ? success
          ? 5
          : 11
        : kind === "environmental"
          ? success
            ? 2
            : 6
          : success
            ? 1
            : 4;

  next = appendEventToState(next, "LOCATION_PRESSURE_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    delta: pressureDelta,
  });

  next = appendEventToState(next, "LOCATION_AWARENESS_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    delta: awarenessDelta,
  });

  if (
    shouldBreakStarterWeapon({
      prevState,
      success,
      kind,
      location,
    })
  ) {
    next = appendOpeningWeaponBreakConsequences({
      nextState: next,
      location,
      playerInput,
      selectedOptionDescription,
    });
  }

  if (
    shouldGrantReplacementWeapon({
      prevState,
      success,
      currentRoom,
      location,
    })
  ) {
    next = appendReplacementWeaponConsequences({
      nextState: next,
      prevState,
      location,
      playerInput,
      selectedOptionDescription,
    });
  }

  next = commitDungeonTraversalBundle({
    prevState: next,
    success,
    selectedText: combinedText,
    selectedConnectionId: selectedConnectionId ?? null,
    currentRoom,
    reachableConnections,
    dungeon,
    floorId: location.floorId,
    roomId: location.roomId,
    openedDoorIds,
    unlockedDoorIds,
  });

  return next;
}

export function commitOutcomeOnlyToState(args: HandleOutcomeOnlyArgs) {
  const { prevState, payload, location } = args;

  const success = deriveOutcomeSuccess(payload);

  const enrichedOutcome = {
    ...payload,
    meta: {
      ...(payload as any)?.meta,
      optionKind: "contested",
      floorId: location.floorId,
      roomId: location.roomId,
      success,
    },
  };

  let next = appendEventToState(prevState, "OUTCOME", enrichedOutcome as any);

  next = appendEventToState(next, "LOCATION_PRESSURE_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    delta: success ? 5 : 11,
  });

  next = appendEventToState(next, "LOCATION_AWARENESS_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    delta: success ? 7 : 14,
  });

  return next;
}
