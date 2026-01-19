"use client";

import { create } from "zustand";

export type ModeHint = "Create" | "Red Team" | "Next Steps" | "Neutral";

interface SolaceStore {
  // Visibility of Solace Dock
  visible: boolean;
  setVisible: (v: boolean) => void;

  // Position (desktop)
  x: number;
  y: number;
  setPos: (x: number, y: number) => void;

  // Lens / Filters ("abrahamic", "ministry", etc.)
  filters: Set<string>;
  setFilters: (next: Set<string> | string[] | string) => void;

  // Guidance Mode (4-mode Solace Brain)
  modeHint: ModeHint;
  setModeHint: (m: ModeHint) => void;

  // Founder Mode
  founderMode: boolean;
  setFounderMode: (v: boolean) => void;

  // Optional workspace routing
  workspaceId: string | null;
  setWorkspaceId: (id: string | null) => void;
}

export const useSolaceStore = create<SolaceStore>((set) => ({
  // -------------------------
  // VISIBILITY
  // -------------------------
  visible: true,
  setVisible: (v) => set({ visible: v }),

  // -------------------------
  // POSITION
  // -------------------------
  x: 120,
  y: 120,
  setPos: (x, y) => set({ x, y }),

  // -------------------------
  // FILTERS
  // -------------------------
  filters: new Set<string>(),
  setFilters: (next) =>
    set((state) => {
      let newSet: Set<string>;

      if (next instanceof Set) {
        newSet = new Set(next);
      } else if (Array.isArray(next)) {
        newSet = new Set(next);
      } else if (typeof next === "string") {
        newSet = new Set(state.filters);
        newSet.add(next);
      } else {
        newSet = new Set(state.filters);
      }

      return { filters: newSet };
    }),

  // -------------------------
  // MODE HINT (4-Layer Solace Brain)
  // -------------------------
  modeHint: "Neutral",
  setModeHint: (m) => set({ modeHint: m }),

  // -------------------------
  // FOUNDER MODE
  // -------------------------
  founderMode: false,
  setFounderMode: (v) => set({ founderMode: v }),

  // -------------------------
  // WORKSPACE
  // -------------------------
  workspaceId: null,
  setWorkspaceId: (id) => set({ workspaceId: id }),
}));
