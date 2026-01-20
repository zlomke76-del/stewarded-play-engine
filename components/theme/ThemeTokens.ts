// ------------------------------------------------------------
// ThemeTokens.ts
// ------------------------------------------------------------
// Semantic theme tokens for visual mood.
// No logic, no DOM, no CSS.
// ------------------------------------------------------------

export type ThemeName = "neutral" | "fantasy" | "dark" | "primitive";

export type ThemeTokens = {
  name: ThemeName;
  shellClass: string;
  cardClass: string;
  headerClass: string;
};

export const THEMES: Record<ThemeName, ThemeTokens> = {
  neutral: {
    name: "neutral",
    shellClass: "theme-neutral",
    cardClass: "theme-card-neutral",
    headerClass: "theme-header-neutral",
  },

  fantasy: {
    name: "fantasy",
    shellClass: "theme-fantasy",
    cardClass: "theme-card-fantasy",
    headerClass: "theme-header-fantasy",
  },

  dark: {
    name: "dark",
    shellClass: "theme-dark",
    cardClass: "theme-card-dark",
    headerClass: "theme-header-dark",
  },
};
