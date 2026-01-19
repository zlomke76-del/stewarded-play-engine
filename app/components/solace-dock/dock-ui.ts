// app/components/solace-dock/dock-ui.ts
//-----------------------------------------------------------
// Centralized UI tokens for SolaceDock.
// Colors, borders, gradients, shadows, radii.
// All skins inherit these and override selectively.
//-----------------------------------------------------------

export const UI = {
  radius: 12,
  radiusLg: 20,

  border: "1px solid var(--mc-border)",
  edge: "1px solid rgba(255,255,255,.06)",

  text: "var(--mc-text)",
  sub: "var(--mc-muted)",

  surface: "rgba(14,21,34,0.88)",
  surface2: "rgba(12,19,30,0.85)",

  shadow: "0 14px 44px rgba(0,0,0,.45)",

  // Default glow when Ministry is on
  glowOn:
    "0 0 0 1px rgba(251,191,36,.25) inset, 0 0 90px rgba(251,191,36,.14), 0 22px 70px rgba(0,0,0,.55)",

  // Default Dock background
  panelBg:
    "radial-gradient(140% 160% at 50% -60%, rgba(26,35,53,0.85) 0%, rgba(14,21,34,0.88) 60%)",
};
