// ------------------------------------------------------------
// Solace Resolution Verbosity Profiles
// ------------------------------------------------------------
// User-Controlled Display Profiles
//
// Purpose:
// - Control how much of a SolaceResolution is rendered
// - Never alter underlying data or mechanics
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export type VerbosityProfile = "minimal" | "standard" | "rich";

export interface VerbosityConfig {
  showOpening: boolean;
  showSituation: boolean;
  showPressures: boolean;
  showProcess: boolean;
  showMechanics: boolean;
  showAftermath: boolean;
  showClosure: boolean;
}

export const VERBOSITY_PROFILES: Record<
  VerbosityProfile,
  VerbosityConfig
> = {
  minimal: {
    showOpening: true,
    showSituation: false,
    showPressures: false,
    showProcess: false,
    showMechanics: true,
    showAftermath: false,
    showClosure: false,
  },

  standard: {
    showOpening: true,
    showSituation: true,
    showPressures: false,
    showProcess: true,
    showMechanics: true,
    showAftermath: true,
    showClosure: true,
  },

  rich: {
    showOpening: true,
    showSituation: true,
    showPressures: true,
    showProcess: true,
    showMechanics: true,
    showAftermath: true,
    showClosure: true,
  },
};

export function applyVerbosity(
  resolution: SolaceResolution,
  profile: VerbosityProfile
): Partial<SolaceResolution> {
  const cfg = VERBOSITY_PROFILES[profile];

  return {
    ...(cfg.showOpening && {
      opening_signal: resolution.opening_signal,
    }),
    ...(cfg.showSituation && {
      situation_frame: resolution.situation_frame,
    }),
    ...(cfg.showPressures && {
      pressures: resolution.pressures,
    }),
    ...(cfg.showProcess && {
      process: resolution.process,
    }),
    ...(cfg.showMechanics && {
      mechanical_resolution:
        resolution.mechanical_resolution,
    }),
    ...(cfg.showAftermath && {
      aftermath: resolution.aftermath,
    }),
    ...(cfg.showClosure && {
      closure: resolution.closure,
    }),
  };
}
