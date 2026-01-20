export function expandWorldObservation(input: {
  roll: number | null;
  dc: number;
  optionKind?: string;
}): string[] {
  if (input.roll === null) return [];

  if (input.optionKind === "contested" && input.roll >= input.dc + 4) {
    return [
      "Prey behavior shifts under pressure.",
      "Secondary threats react to the disturbance.",
    ];
  }

  if (input.optionKind === "environmental" && input.roll < input.dc) {
    return [
      "The land resists passage.",
      "Exposure increases as time slips.",
    ];
  }

  return [];
}
