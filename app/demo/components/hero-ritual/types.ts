export type PortraitType = "Male" | "Female";
export type BuildFocus = "balanced" | "guardian" | "swift" | "hardy";
export type HeroCreationStep =
  | "intro"
  | "sex"
  | "species"
  | "class"
  | "focus"
  | "name"
  | "confirm";

export type PartyMember = {
  id: string;
  name: string;
  species?: string;
  className: string;
  portrait: PortraitType;
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

export type RitualProgress = {
  sexConfirmed: boolean;
  speciesConfirmed: boolean;
  classConfirmed: boolean;
  focusConfirmed: boolean;
};

export type SpeciesMeta = {
  fantasy: string;
  strengths: string[];
  tradeoff: string;
  bestFor: string;
};

export type ClassMeta = {
  fantasy: string;
  role: string;
  difficulty: "Low" | "Medium" | "High";
  bestFocus: string;
  strengths: string[];
  tradeoff: string;
};

export type FocusMeta = {
  hint: string;
  gains: string[];
  tradeoff: string;
  bestFor: string;
};

export const SAFE_CLASS_ARCHETYPES = [
  "Warrior",
  "Rogue",
  "Mage",
  "Cleric",
  "Ranger",
  "Paladin",
  "Bard",
  "Druid",
  "Monk",
  "Artificer",
  "Barbarian",
  "Sorcerer",
  "Warlock",
] as const;

export const SAFE_SPECIES = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Dragonborn",
] as const;

export const SPECIES_META: Record<string, SpeciesMeta> = {
  Human: {
    fantasy: "Adaptable, driven, and steady in the dark.",
    strengths: ["Flexible with nearly any class", "Reliable starting profile"],
    tradeoff: "Less specialized than sharper lineages.",
    bestFor: "All-around or first-time play",
  },
  Elf: {
    fantasy: "Grace, perception, and ancient poise.",
    strengths: [
      "Naturally suits quicker reactive builds",
      "Excellent for precision-oriented heroes",
    ],
    tradeoff: "Usually less forgiving if you want pure toughness.",
    bestFor: "Fast, agile, or tactical play",
  },
  Dwarf: {
    fantasy: "Stone-hearted endurance and iron discipline.",
    strengths: [
      "Strong survivability foundation",
      "Excellent for frontline pressure",
    ],
    tradeoff: "Usually slower and less finesse-oriented.",
    bestFor: "Durable, safer, steadier runs",
  },
  Halfling: {
    fantasy: "Small frame, steady nerve, uncanny luck.",
    strengths: [
      "Naturally slippery and survivable",
      "Pairs well with clever reactive play",
    ],
    tradeoff: "Less imposing in direct brute-force builds.",
    bestFor: "Cautious precision and mobility",
  },
  Gnome: {
    fantasy: "Quick wit, curiosity, and clever hands.",
    strengths: [
      "Good for technical or tricky builds",
      "Fits inventive playstyles well",
    ],
    tradeoff: "Less naturally suited to pure brute force.",
    bestFor: "Clever utility and control",
  },
  "Half-Elf": {
    fantasy: "Bridging worlds with charm and versatility.",
    strengths: [
      "Flexible across many class choices",
      "Good for hybrid identities",
    ],
    tradeoff: "Not as extreme in any one direction.",
    bestFor: "Balanced hybrid play",
  },
  "Half-Orc": {
    fantasy: "Raw force, grit, and intimidating presence.",
    strengths: [
      "Excellent for pressure and durability",
      "Strong fit for aggressive frontliners",
    ],
    tradeoff: "Can feel less elegant for finesse-heavy roles.",
    bestFor: "Direct force and brawler momentum",
  },
  Tiefling: {
    fantasy: "Marked by omen, power, and defiance.",
    strengths: [
      "Strong identity for risky or magical builds",
      "Feels great with high-expression classes",
    ],
    tradeoff: "Less forgiving if the build leans too fragile.",
    bestFor: "High-style, risk-forward play",
  },
  Dragonborn: {
    fantasy: "Ancestral pride and draconic bearing.",
    strengths: [
      "Naturally commanding presence",
      "Great for bold martial or power builds",
    ],
    tradeoff: "Can be less subtle than finesse lineages.",
    bestFor: "Heroic, dominant play",
  },
};

export const CLASS_META: Record<string, ClassMeta> = {
  Warrior: {
    fantasy: "Frontline steel and steady resolve.",
    role: "Frontline bruiser",
    difficulty: "Low",
    bestFocus: "Guardian or Balanced",
    strengths: ["Reliable in direct fights", "Forgiving for early mistakes"],
    tradeoff: "Less trickery and burst than specialist classes.",
  },
  Rogue: {
    fantasy: "Quick hands, sharp instincts, deadly timing.",
    role: "Precision striker",
    difficulty: "Medium",
    bestFocus: "Swift or Guardian",
    strengths: [
      "Acts early and hits clever angles",
      "Excellent mobility identity",
    ],
    tradeoff: "Can be punishing if built too fragile.",
  },
  Mage: {
    fantasy: "Arcane force shaped through discipline and will.",
    role: "Burst / control",
    difficulty: "High",
    bestFocus: "Balanced or Swift",
    strengths: [
      "High-impact spell identity",
      "Great battlefield swing potential",
    ],
    tradeoff: "Usually less forgiving under pressure.",
  },
  Cleric: {
    fantasy: "Faith, protection, and guiding light.",
    role: "Support anchor",
    difficulty: "Low",
    bestFocus: "Guardian or Balanced",
    strengths: ["Stable and survivable", "Excellent support tone for long runs"],
    tradeoff: "Less explosive than pure damage classes.",
  },
  Ranger: {
    fantasy: "Tracker, scout, and patient hunter.",
    role: "Skirmish / ranged pressure",
    difficulty: "Medium",
    bestFocus: "Swift or Balanced",
    strengths: [
      "Great tempo and positioning feel",
      "Flexible offensive identity",
    ],
    tradeoff: "Less durable than heavy frontliners.",
  },
  Paladin: {
    fantasy: "Oath-bound defender with relentless conviction.",
    role: "Holy frontline",
    difficulty: "Low",
    bestFocus: "Guardian",
    strengths: ["Durable and decisive", "Strong heroic fantasy"],
    tradeoff: "Less mobile than lighter classes.",
  },
  Bard: {
    fantasy: "Charm, rhythm, and subtle battlefield influence.",
    role: "Hybrid support",
    difficulty: "Medium",
    bestFocus: "Balanced or Swift",
    strengths: ["Flexible support identity", "Good for expressive play"],
    tradeoff: "Less straightforward than pure combat classes.",
  },
  Druid: {
    fantasy: "Nature's keeper, patient and adaptable.",
    role: "Adaptive control",
    difficulty: "Medium",
    bestFocus: "Balanced or Hardy",
    strengths: ["Stable hybrid style", "Good for long-form adaptation"],
    tradeoff: "Can feel less direct than martial classes.",
  },
  Monk: {
    fantasy: "Discipline, motion, and controlled force.",
    role: "Mobile striker",
    difficulty: "Medium",
    bestFocus: "Swift",
    strengths: ["Fast and expressive tempo", "Excellent motion-based identity"],
    tradeoff: "Less forgiving if caught in heavy pressure.",
  },
  Artificer: {
    fantasy: "Inventive craft turned into battlefield advantage.",
    role: "Utility / control",
    difficulty: "High",
    bestFocus: "Balanced or Hardy",
    strengths: ["Strong clever-build potential", "Great for technical players"],
    tradeoff: "Less immediate than simple frontline classes.",
  },
  Barbarian: {
    fantasy: "Fury, endurance, and brutal momentum.",
    role: "Aggressive bruiser",
    difficulty: "Low",
    bestFocus: "Hardy or Guardian",
    strengths: ["Excellent survivability pressure", "Simple, powerful fantasy"],
    tradeoff: "Less subtle and less tactical than finesse builds.",
  },
  Sorcerer: {
    fantasy: "Raw power carried in the blood.",
    role: "Burst caster",
    difficulty: "High",
    bestFocus: "Swift or Balanced",
    strengths: [
      "High-expression magical power",
      "Excellent dramatic burst identity",
    ],
    tradeoff: "Can be fragile if built too aggressively.",
  },
  Warlock: {
    fantasy: "Dark bargains and dangerous command.",
    role: "Pressure caster",
    difficulty: "Medium",
    bestFocus: "Balanced or Swift",
    strengths: [
      "Strong identity and pressure tools",
      "Good for risk-forward magic play",
    ],
    tradeoff: "Less stable than safer support builds.",
  },
};

export const BUILD_FOCUS_OPTIONS: Array<{
  id: BuildFocus;
  label: string;
  hint: string;
  icon: string;
}> = [
  { id: "balanced", label: "Balanced", hint: "Steady all-around profile.", icon: "⚖" },
  { id: "guardian", label: "Guardian", hint: "Higher AC, lower speed.", icon: "🛡" },
  { id: "swift", label: "Swift", hint: "Higher initiative, lighter defense.", icon: "⚡" },
  { id: "hardy", label: "Hardy", hint: "More vitality for longer fights.", icon: "♥" },
];

export const BUILD_FOCUS_META: Record<BuildFocus, FocusMeta> = {
  balanced: {
    hint: "Keeps the class close to its natural shape.",
    gains: ["No major tradeoff", "Reliable all-around tempo"],
    tradeoff: "No specialized edge in one direction.",
    bestFor: "Players who want the class as-designed",
  },
  guardian: {
    hint: "More defense, less speed.",
    gains: ["+1 AC orientation", "More forgiving under direct pressure"],
    tradeoff: "Initiative drops by 1.",
    bestFor: "Safer frontline or cautious play",
  },
  swift: {
    hint: "More speed, lighter defense.",
    gains: ["+2 initiative orientation", "Acts earlier and pressures faster"],
    tradeoff: "AC drops by 1.",
    bestFor: "Tempo, agility, and striking first",
  },
  hardy: {
    hint: "More vitality for longer fights.",
    gains: ["+2 HP orientation", "Greater survivability in extended encounters"],
    tradeoff:
      "No speed gain and less offensive specialization than tempo builds.",
    bestFor: "Long fights and forgiving endurance",
  },
};
