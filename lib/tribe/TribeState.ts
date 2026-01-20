export type TribeMemberRole =
  | "hunter"
  | "scout"
  | "pathfinder"
  | "elder";

export type TribeMember = {
  id: string;
  name: string;

  // earned, never assigned
  affirmations: Partial<Record<TribeMemberRole, number>>;

  // lifecycle
  alive: boolean;
  turnsSurvived: number;
};

export type TribeState = {
  members: TribeMember[];
};
