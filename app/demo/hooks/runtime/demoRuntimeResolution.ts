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

type RecoveryRoomKind = "guard_post" | "armory";

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
      consequence === "weapon_recovery_claimed" ||
      source === "guard_post_replacement" ||
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

function inferRecoveryRoomKind(args: { currentRoom: any; roomId: string }): RecoveryRoomKind | null {
  const roomIdKey = normalizeKey(args.roomId);
  const roomTypeKey = normalizeKey(
    String(args.currentRoom?.roomType ?? args.currentRoom?.type ?? "")
  );
  const roomTitleKey = normalizeKey(
    String(args.currentRoom?.title ?? args.currentRoom?.name ?? args.currentRoom?.label ?? "")
  );
  const roomNarrativeKey = normalizeKey(
    String(args.currentRoom?.narrative ?? args.currentRoom?.description ?? "")
  );

  const combined = [roomIdKey, roomTypeKey, roomTitleKey, roomNarrativeKey].join(" ");

  const isGuardPost = includesAny(combined, [
    "guard_post",
    "guard post",
    "guard shack",
    "watch post",
    "watchroom",
    "watch room",
    "barracks",
    "checkpoint",
  ]);

  if (isGuardPost) return "guard_post";

  const isArmory = includesAny(combined, [
    "armory",
    "armoury",
    "weapons rack",
    "weapon rack",
    "weapon cache",
    "supply room",
  ]);

  if (isArmory) return "armory";

  return null;
}

function isRecoveryRewardRoom(args: { currentRoom: any; roomId: string }) {
  return inferRecoveryRoomKind(args) !== null;
}

function buildReplacementWeaponForClass(
  className: string | undefined,
  roomKind: RecoveryRoomKind
): ReplacementWeaponSummary {
  const classKey = normalizeKey(className ?? "");
  const fromGuardPost = roomKind === "guard_post";

  if (classKey.includes("warrior") || classKey.includes("fighter")) {
    return fromGuardPost
      ? {
          name: "Guard Blade",
          category: "martial blade",
          trait: "serviceable",
          damage: "1d8",
        }
      : {
          name: "Tempered Longsword",
          category: "martial blade",
          trait: "balanced",
          damage: "1d8",
        };
  }

  if (classKey.includes("rogue")) {
    return fromGuardPost
      ? {
          name: "Watch Dagger",
          category: "dagger",
          trait: "nimble",
          damage: "1d6",
        }
      : {
          name: "Silent Edge",
          category: "dagger",
          trait: "precise",
          damage: "1d6",
        };
  }

  if (classKey.includes("mage") || classKey.includes("wizard")) {
    return fromGuardPost
      ? {
          name: "Focus Rod",
          category: "arcane focus",
          trait: "channeling",
          damage: "1d8",
        }
      : {
          name: "Rune Staff",
          category: "arcane focus",
          trait: "inscribed",
          damage: "1d8",
        };
  }

  if (classKey.includes("cleric")) {
    return fromGuardPost
      ? {
          name: "Ward Mace",
          category: "blunt weapon",
          trait: "steady",
          damage: "1d8",
        }
      : {
          name: "Sanctified Mace",
          category: "blunt weapon",
          trait: "steadfast",
          damage: "1d8",
        };
  }

  if (classKey.includes("ranger")) {
    return fromGuardPost
      ? {
          name: "Patrol Bow",
          category: "bow",
          trait: "field-kept",
          damage: "1d8",
        }
      : {
          name: "Recovered Longbow",
          category: "bow",
          trait: "trueflight",
          damage: "1d8",
        };
  }

  if (classKey.includes("paladin")) {
    return fromGuardPost
      ? {
          name: "Watchblade",
          category: "holy blade",
          trait: "sworn",
          damage: "1d8",
        }
      : {
          name: "Oathblade Fragment Restored",
          category: "holy blade",
          trait: "vowed",
          damage: "1d8",
        };
  }

  if (classKey.includes("monk")) {
    return fromGuardPost
      ? {
          name: "Iron Staff",
          category: "hand weapon",
          trait: "disciplined",
          damage: "1d6",
        }
      : {
          name: "Ironwood Cestus",
          category: "hand weapon",
          trait: "focused",
          damage: "1d6",
        };
  }

  if (classKey.includes("druid")) {
    return fromGuardPost
      ? {
          name: "Grove Staff",
          category: "nature focus",
          trait: "seasoned",
          damage: "1d8",
        }
      : {
          name: "Rootbound Staff",
          category: "nature focus",
          trait: "living grain",
          damage: "1d8",
        };
  }

  if (classKey.includes("bard")) {
    return fromGuardPost
      ? {
          name: "Officer Rapier",
          category: "finesse blade",
          trait: "clean",
          damage: "1d6",
        }
      : {
          name: "Courtblade",
          category: "finesse blade",
          trait: "graceful",
          damage: "1d6",
        };
  }

  if (classKey.includes("artificer")) {
    return fromGuardPost
      ? {
          name: "Field Calibrator",
          category: "engineered focus",
          trait: "tuned",
          damage: "1d8",
        }
      : {
          name: "Calibrated Shock-Rod",
          category: "engineered focus",
          trait: "refined",
          damage: "1d8",
        };
  }

  if (classKey.includes("barbarian")) {
    return fromGuardPost
      ? {
          name: "Guard Axe",
          category: "heavy weapon",
          trait: "brutal",
          damage: "1d10",
        }
      : {
          name: "Guardbreaker Axe",
          category: "heavy weapon",
          trait: "cleaving",
          damage: "1d10",
        };
  }

  if (classKey.includes("sorcerer")) {
    return fromGuardPost
      ? {
          name: "Channel Wand",
          category: "arcane focus",
          trait: "volatile",
          damage: "1d8",
        }
      : {
          name: "Ember Focus Rod",
          category: "arcane focus",
          trait: "surging",
          damage: "1d8",
        };
  }

  if (classKey.includes("warlock")) {
    return fromGuardPost
      ? {
          name: "Pact Rod",
          category: "eldritch focus",
          trait: "bound",
          damage: "1d8",
        }
      : {
          name: "Veilthorn Pact Blade",
          category: "eldritch blade",
          trait: "hexbound",
          damage: "1d8",
        };
  }

  return fromGuardPost
    ? {
        name: "Service Blade",
        category: "martial weapon",
        trait: "serviceable",
        damage: "1d8",
      }
    : {
        name: "Guard Blade",
        category: "martial weapon",
        trait: "balanced",
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

  return isRecoveryRewardRoom({
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
    consequence: "weapon_recovery_needed",
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
  currentRoom: any;
  location: { floorId: string; roomId: string };
  playerInput: string;
  selectedOptionDescription: string;
}) {
  const {
    nextState,
    prevState,
    currentRoom,
    location,
    playerInput,
    selectedOptionDescription,
  } = args;

  const roomKind =
    inferRecoveryRoomKind({
      currentRoom,
      roomId: location.roomId,
    }) ?? "guard_post";

  const className = inferHeroClassName(prevState);
  const weapon = buildReplacementWeaponForClass(className, roomKind);

  const source = roomKind === "guard_post" ? "guard_post_replacement" : "armory_replacement";
  const roomLabel = roomKind === "guard_post" ? "guard post" : "armory";
  const previousItemName = "Broken Starter Weapon";

  const chronicleText =
    roomKind === "guard_post"
      ? `At the ${roomLabel}, the hero reclaimed momentum with ${weapon.name}, a practical weapon fit to carry the descent onward.`
      : `In the ${roomLabel}, the hero reclaimed momentum with ${weapon.name}, a preserved weapon worthy of the deeper descent.`;

  let next = nextState;

  next = appendEventToState(next, "HERO_LOADOUT_CHANGED", {
    floorId: location.floorId,
    roomId: location.roomId,
    slot: "weapon",
    state: "equipped",
    source,
    rewardType: "class_weapon_recovery",
    recoveryRoomKind: roomKind,
    previousItemName,
    nextItemName: weapon.name,
    weaponCategory: weapon.category,
    weaponTrait: weapon.trait,
    weaponDamage: weapon.damage,
    className,
    consequence: "weapon_recovery_claimed",
    sourceText: `${playerInput}\n${selectedOptionDescription}`.trim(),
  });

  next = appendEventToState(next, "CHRONICLE_NOTE_RECORDED", {
    floorId: location.floorId,
    roomId: location.roomId,
    category: roomKind === "guard_post" ? "guard_post_weapon_recovered" : "armory_weapon_recovered",
    text: chronicleText,
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
      currentRoom,
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
