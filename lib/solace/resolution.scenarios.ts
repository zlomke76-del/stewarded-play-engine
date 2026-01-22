// ------------------------------------------------------------
// Solace Resolution Scenarios
// ------------------------------------------------------------
// Bounded Scenario Tag System
//
// Purpose:
// - Provide controlled variation in world texture
// - Never alter mechanics or outcomes
// - Allow Solace to surface different pressures each turn
//
// Scenarios are descriptive, not prescriptive.
// ------------------------------------------------------------

export type ScenarioTag =
  | "weather_shift"
  | "terrain_constraint"
  | "time_pressure"
  | "fatigue"
  | "noise"
  | "visibility"
  | "animal_behavior"
  | "crowding"
  | "momentum"
  | "stillness";

export interface ScenarioDescriptor {
  tag: ScenarioTag;
  situation_lines: string[];
  pressure_lines: string[];
  process_lines: string[];
  aftermath_lines: string[];
}

export const SCENARIO_LIBRARY: Record<
  ScenarioTag,
  ScenarioDescriptor
> = {
  weather_shift: {
    tag: "weather_shift",
    situation_lines: [
      "Wind shifts abruptly across the open ground.",
      "Cold presses harder than expected."
    ],
    pressure_lines: ["Weather exposure", "Heat retention"],
    process_lines: [
      "Air movement disrupts balance and timing."
    ],
    aftermath_lines: [
      "Cold remains a persistent factor."
    ]
  },

  terrain_constraint: {
    tag: "terrain_constraint",
    situation_lines: [
      "Stone and uneven ground limit movement."
    ],
    pressure_lines: ["Restricted footing", "Limited maneuverability"],
    process_lines: [
      "Movement compresses into narrow paths."
    ],
    aftermath_lines: [
      "The terrain continues to restrict approach."
    ]
  },

  time_pressure: {
    tag: "time_pressure",
    situation_lines: [
      "Light thins as the moment stretches."
    ],
    pressure_lines: ["Diminishing light", "Delayed action"],
    process_lines: [
      "Decisions compress as visibility drops."
    ],
    aftermath_lines: [
      "Time advances with reduced margin."
    ]
  },

  fatigue: {
    tag: "fatigue",
    situation_lines: [
      "Breathing deepens after sustained effort."
    ],
    pressure_lines: ["Physical fatigue"],
    process_lines: [
      "Movements lose sharpness under strain."
    ],
    aftermath_lines: [
      "Energy reserves are diminished."
    ]
  },

  noise: {
    tag: "noise",
    situation_lines: [
      "Sound carries farther than intended."
    ],
    pressure_lines: ["Auditory exposure"],
    process_lines: [
      "Movement and impact echo across the land."
    ],
    aftermath_lines: [
      "Attention may be drawn from afar."
    ]
  },

  visibility: {
    tag: "visibility",
    situation_lines: [
      "Sightlines shorten as contrast fades."
    ],
    pressure_lines: ["Limited visibility"],
    process_lines: [
      "Details blur at the edge of perception."
    ],
    aftermath_lines: [
      "Uncertainty remains about distant movement."
    ]
  },

  animal_behavior: {
    tag: "animal_behavior",
    situation_lines: [
      "The animals react unpredictably."
    ],
    pressure_lines: ["Unstable prey behavior"],
    process_lines: [
      "Patterns break earlier than expected."
    ],
    aftermath_lines: [
      "Wildlife disperses unevenly."
    ]
  },

  crowding: {
    tag: "crowding",
    situation_lines: [
      "Bodies cluster closer than planned."
    ],
    pressure_lines: ["Reduced spacing", "Coordination strain"],
    process_lines: [
      "Movement interferes between group members."
    ],
    aftermath_lines: [
      "Spacing remains tight."
    ]
  },

  momentum: {
    tag: "momentum",
    situation_lines: [
      "Movement builds faster than it can be checked."
    ],
    pressure_lines: ["Excess momentum"],
    process_lines: [
      "Speed overtakes control."
    ],
    aftermath_lines: [
      "Recovery takes longer than expected."
    ]
  },

  stillness: {
    tag: "stillness",
    situation_lines: [
      "The land remains quiet and unchanged."
    ],
    pressure_lines: ["Waiting cost"],
    process_lines: [
      "Nothing intervenes."
    ],
    aftermath_lines: [
      "No immediate changes occur."
    ]
  }
};
