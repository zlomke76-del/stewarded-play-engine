// ------------------------------------------------------------
// Theme Tokens
// ------------------------------------------------------------

export type ThemeName = "neutral" | "fantasy" | "dark";

export interface ThemeTokens {
  name: ThemeName;

  // Base semantic primitive (required)
  primitive: "light" | "dark";

  // Structural classes
  shellClass: string;
  cardClass: string;
  headerClass: string;
}

// ------------------------------------------------------------
// Theme Registry (Authoritative)
// ------------------------------------------------------------

export const THEMES: Record<ThemeName, ThemeTokens> = {
  neutral: {
    name: "neutral",
    primitive: "light",
    shellClass: "theme-neutral",
    cardClass: "card-neutral",
    headerClass: "header-neutral",
  },

  fantasy: {
    name: "fantasy",
    primitive: "dark",
    shellClass: "theme-fantasy",
    cardClass: "card-fantasy",
    headerClass: "header-fantasy",
  },

  dark: {
    name: "dark",
    primitive: "dark",
    shellClass: "theme-dark",
    cardClass: "card-dark",
    headerClass: "header-dark",
  },
};
