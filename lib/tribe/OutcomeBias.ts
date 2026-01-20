import { TribeState } from "./TribeState";

type BiasResult = {
  dcShift: number;
  narrativeTag?: string;
};

export function biasForOutcome(
  tribe: TribeState,
  optionKind?: "safe" | "environmental" | "risky" | "contested"
): BiasResult {
  const alive = tribe.members.filter((m) => m.alive);

  let dcShift = 0;
  let narrativeTag: string | undefined;

  if (optionKind === "environmental") {
    const pathfinder = alive.find(
      (m) => m.affirmations.pathfinder
    );
    if (pathfinder) {
      dcShift -= 1;
      narrativeTag = `${pathfinder.name} reads the land well.`;
    }
  }

  if (optionKind === "contested") {
    const hunter = alive.find(
      (m) => m.affirmations.hunter
    );
    if (hunter) {
      dcShift -= 1;
      narrativeTag = `${hunter.name} steadies the hunt.`;
    }
  }

  return { dcShift, narrativeTag };
}
