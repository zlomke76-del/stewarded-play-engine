// app/components/solace-dock/dock-skins.ts
//-----------------------------------------------------------
// Skin registry for SolaceDock.
// Default inherits UI tokens and overrides none.
// Additional skins override: panelBg, border, glow, accents.
//-----------------------------------------------------------

import { UI } from "./dock-ui";

export type SolaceSkin = {
  name: string;
  panelBg: string;
  border: string;
  glow: string | null;
};

export const Skins: Record<string, SolaceSkin> = {
  default: {
    name: "Default",
    panelBg: UI.panelBg,
    border: UI.border,
    glow: null,
  },

  woodland: {
    name: "Woodland Camo",
    panelBg:
      "url('/textures/camo-woodland-02.webp'), linear-gradient(180deg, #1d2219cc, #0f120dcc)",
    border: "1px solid rgba(60,80,50,0.6)",
    glow: "0 0 22px rgba(94,128,64,.45)",
  },
};
