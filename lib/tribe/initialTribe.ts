import { TribeState } from "./TribeState";

export const initialTribe: TribeState = {
  members: [
    {
      id: "gruk",
      name: "Gruk",
      affirmations: { hunter: 1 },
      alive: true,
      turnsSurvived: 0,
    },
    {
      id: "lira",
      name: "Lira",
      affirmations: { scout: 1 },
      alive: true,
      turnsSurvived: 0,
    },
  ],
};
