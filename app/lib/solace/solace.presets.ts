// app/lib/solace/solace.presets.ts
// ============================================================
// SOLACE PROMPT PRESETS — MEDICAL DISCOVERY (GOVERNED)
// ============================================================
// This file defines capability envelopes for medical discovery.
// Presets encode epistemic and action boundaries structurally.
// Solace does not reference governance; behavior enforces it.
// ============================================================

export type SolacePresetID =
  | "med.uncertainty.map"
  | "med.failure.modes"
  | "med.signal.decompose"
  | "med.validation.priority"
  | "med.false_positive.scan"
  | "med.negative.space"
  | "med.governance.audit";

export type PresetCategory = "medical-discovery";

export interface SolacePreset {
  id: SolacePresetID;
  category: PresetCategory;
  label: string;
  description: string;

  /**
   * Fixed system instruction.
   * This is injected verbatim and must not be altered at runtime.
   */
  systemInstruction: string;

  /**
   * If the user intent crosses an action boundary,
   * Solace silently reframes into the fallback preset.
   */
  autoReframeTo?: SolacePresetID;

  /**
   * Output invariants enforced downstream.
   * These are behavioral contracts, not UI hints.
   */
  outputInvariants: {
    noTreatmentDesign: true;
    noRecommendations: true;
    noEfficacyClaims: true;
    uncertaintyExposed: true;
  };
}

// ------------------------------------------------------------
// ACTION-INTENT KEYWORDS (HARD BOUNDARY)
// ------------------------------------------------------------

export const MEDICAL_ACTION_KEYWORDS = [
  "design",
  "create",
  "synthesize",
  "formulate",
  "dose",
  "dosage",
  "administer",
  "recommend",
  "which drug",
  "which compound",
  "what should we test",
  "how do we treat",
  "effective treatment",
  "cure",
];

// ------------------------------------------------------------
// PRESET DEFINITIONS (AUTHORITATIVE)
// ------------------------------------------------------------

export const SOLACE_MEDICAL_PRESETS: Record<
  SolacePresetID,
  SolacePreset
> = {
  "med.uncertainty.map": {
    id: "med.uncertainty.map",
    category: "medical-discovery",
    label: "Uncertainty Mapping",
    description:
      "Expose dominant unknowns, unvalidated assumptions, and uncertainty concentrations without proposing treatments.",
    systemInstruction:
      "Analyze and expose dominant unknowns, unvalidated assumptions, and uncertainty concentrations in the provided medical discovery context. Do not propose treatments, mechanisms, candidates, or actions. Emphasize where false confidence is most likely to arise.",
    autoReframeTo: "med.uncertainty.map",
    outputInvariants: {
      noTreatmentDesign: true,
      noRecommendations: true,
      noEfficacyClaims: true,
      uncertaintyExposed: true,
    },
  },

  "med.failure.modes": {
    id: "med.failure.modes",
    category: "medical-discovery",
    label: "Failure Mode Analysis",
    description:
      "Enumerate how computational and preclinical signals fail during validation.",
    systemInstruction:
      "Enumerate known and plausible failure modes in computational screening and preclinical modeling relevant to the context. Focus on where promising signals historically break during validation. Do not propose remedies, candidates, or interventions.",
    autoReframeTo: "med.failure.modes",
    outputInvariants: {
      noTreatmentDesign: true,
      noRecommendations: true,
      noEfficacyClaims: true,
      uncertaintyExposed: true,
    },
  },

  "med.signal.decompose": {
    id: "med.signal.decompose",
    category: "medical-discovery",
    label: "Signal Decomposition",
    description:
      "Decompose computational signals into structural and statistical components.",
    systemInstruction:
      "Compare signals under calibrated uncertainty and decompose differences into geometry, chemical feature alignment, and learned model artifacts. Do not assess efficacy, readiness, or biological success.",
    autoReframeTo: "med.signal.decompose",
    outputInvariants: {
      noTreatmentDesign: true,
      noRecommendations: true,
      noEfficacyClaims: true,
      uncertaintyExposed: true,
    },
  },

  "med.validation.priority": {
    id: "med.validation.priority",
    category: "medical-discovery",
    label: "Validation Priority (Risk-First)",
    description:
      "Identify where empirical validation would most reduce downstream harm.",
    systemInstruction:
      "Identify which categories of empirical validation would most reduce downstream risk or harm, given the uncertainty profile. Do not recommend specific experiments, compounds, dosages, or interventions.",
    autoReframeTo: "med.validation.priority",
    outputInvariants: {
      noTreatmentDesign: true,
      noRecommendations: true,
      noEfficacyClaims: true,
      uncertaintyExposed: true,
    },
  },

  "med.false_positive.scan": {
    id: "med.false_positive.scan",
    category: "medical-discovery",
    label: "False-Positive Risk Scan",
    description:
      "Detect bias, leakage, and proxy-driven overconfidence in discovery pipelines.",
    systemInstruction:
      "Assess where confidence may be inflated by model bias, data leakage, proxy variables, or statistical artifacts. Highlight indicators of false-positive risk. Do not propose alternatives or candidates.",
    autoReframeTo: "med.false_positive.scan",
    outputInvariants: {
      noTreatmentDesign: true,
      noRecommendations: true,
      noEfficacyClaims: true,
      uncertaintyExposed: true,
    },
  },

  "med.negative.space": {
    id: "med.negative.space",
    category: "medical-discovery",
    label: "Negative Space Analysis",
    description:
      "Expose absences and underexplored regions without speculating on causes.",
    systemInstruction:
      "Identify notable absences, underrepresented patterns, or unexplored regions in the discovery landscape. Do not infer causes, propose mechanisms, or suggest directions.",
    autoReframeTo: "med.negative.space",
    outputInvariants: {
      noTreatmentDesign: true,
      noRecommendations: true,
      noEfficacyClaims: true,
      uncertaintyExposed: true,
    },
  },

  "med.governance.audit": {
    id: "med.governance.audit",
    category: "medical-discovery",
    label: "Workflow Governance Review",
    description:
      "Audit discovery workflows for reproducibility, drift, and interpretability risk.",
    systemInstruction:
      "Evaluate the discovery workflow for reproducibility limits, interpretability gaps, drift risk, and auditability. Do not assess scientific merit, biological outcomes, or performance claims.",
    autoReframeTo: "med.governance.audit",
    outputInvariants: {
      noTreatmentDesign: true,
      noRecommendations: true,
      noEfficacyClaims: true,
      uncertaintyExposed: true,
    },
  },
};

// ------------------------------------------------------------
// HELPER: ACTION INTENT DETECTION
// ------------------------------------------------------------

export function containsMedicalActionIntent(input: string): boolean {
  const normalized = input.toLowerCase();
  return MEDICAL_ACTION_KEYWORDS.some((kw) => normalized.includes(kw));
}

// ------------------------------------------------------------
// HELPER: PRESET RESOLUTION
// ------------------------------------------------------------

export function resolveMedicalPreset(
  presetId: SolacePresetID,
  userInput: string
): SolacePreset {
  const preset = SOLACE_MEDICAL_PRESETS[presetId];

  if (!preset) {
    throw new Error(`Unknown Solace preset: ${presetId}`);
  }

  if (
    preset.autoReframeTo &&
    containsMedicalActionIntent(userInput)
  ) {
    return SOLACE_MEDICAL_PRESETS[preset.autoReframeTo];
  }

  return preset;
}
