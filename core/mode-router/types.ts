// core/mode-router/types.ts

export type RouteMode =
  | "default"
  | "solace"
  | "solace-news-anchor"  // ⬅ NEW
  | "dev-tools"
  | "admin"
  // etc.

export type ModeConfig = {
  id: RouteMode;
  label: string;
  systemPrompt: string;
  capabilities: {
    allowWeb: boolean;
    allowFiles: boolean;
    allowExternalSearch: boolean;
  };
  requiresNeutralNewsDigest?: boolean;
};
