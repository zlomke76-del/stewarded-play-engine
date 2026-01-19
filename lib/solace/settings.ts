// lib/solace/settings.ts

/**
 * Central feature flags for Solace capabilities.
 *
 * These can later be wired to user/workspace-level settings or
 * environment flags (e.g., founder-only vs public).
 */

export type SolaceFeatureFlags = {
  internetEnabled: boolean;
  visionEnabled: boolean;
  uploadModerationEnabled: boolean;
};

const DEFAULT_FLAGS: SolaceFeatureFlags = {
  internetEnabled: true,          // You can gate this by workspace or env.
  visionEnabled: true,            // Safe-vision interpretation pipeline.
  uploadModerationEnabled: true,  // Text/file/image moderation.
};

export function getSolaceFeatureFlags(): SolaceFeatureFlags {
  // In the future you can read from env or Supabase.
  // For now, return a static baseline.
  return { ...DEFAULT_FLAGS };
}
