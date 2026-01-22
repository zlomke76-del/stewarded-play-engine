// ------------------------------------------------------------
// Solace Resolution Examples
// ------------------------------------------------------------
// Scenario Library
//
// - Used for testing, previews, and UI development
// - No mechanics implied beyond examples
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export const exampleSetbackHunt: SolaceResolution = {
  opening_signal: "Solace weighs the risk. Time tightens.",
  situation_frame: [
    "The ground is churned from earlier movement.",
    "Wind carries scent downslope.",
  ],
  pressures: [
    "Group coordination under motion",
    "Size and momentum of prey",
    "Exposure during pursuit",
  ],
  process: [
    "The herd breaks unevenly.",
    "One animal turns late as footing shifts.",
    "Momentum carries the hunters too far forward.",
  ],
  mechanical_resolution: {
    roll: 9,
    dc: 14,
    outcome: "setback",
  },
  aftermath: [
    "Energy is spent.",
    "Noise carries farther than intended.",
    "The animal escapes wounded.",
  ],
};

export const exampleSuccessShelter: SolaceResolution = {
  opening_signal: "Solace holds the moment as pressure settles.",
  situation_frame: [
    "Wind breaks sharply against stone.",
    "Light fades behind the ridge.",
  ],
  pressures: [
    "Cold exposure",
    "Limited visibility",
  ],
  process: [
    "Stone interrupts the wind.",
    "The space narrows, holding warmth.",
  ],
  mechanical_resolution: {
    roll: 16,
    dc: 12,
    outcome: "success",
  },
  aftermath: [
    "Shelter is secured.",
    "Time advances without further loss.",
  ],
};

export const exampleNoRollObservation: SolaceResolution = {
  opening_signal: "Solace observes without interruption.",
  situation_frame: [
    "The plain stretches unbroken.",
    "Animal tracks crisscross older paths.",
  ],
  pressures: [
    "Distance",
    "Time",
  ],
  process: [
    "Nothing moves nearby.",
    "The land remains unchanged.",
  ],
  mechanical_resolution: {
    roll: 0,
    dc: 0,
    outcome: "no_roll",
  },
  aftermath: [
    "No resources are gained.",
    "No attention is drawn.",
  ],
};
