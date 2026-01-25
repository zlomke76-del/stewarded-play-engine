// ------------------------------------------------------------
// CreativeNarrator.ts
// ------------------------------------------------------------
// Creative Engine (NON-AUTHORITATIVE)
//
// Purpose:
// - Generate flavorful narration ONLY
// - Never decide outcomes
// - Never alter facts
// - Never touch session state
//
// Input: confirmed facts + dice margin
// Output: prose only
// ------------------------------------------------------------

export type NarrativeLens =
  | "grounded"
  | "grim"
  | "heroic"
  | "weird";

export interface CreativeInput {
  intentText: string;
  margin: number; // roll - dc
  lens: NarrativeLens;
}

export function generateNarration(
  input: CreativeInput
): string {
  const { intentText, margin, lens } = input;
  const t = intentText.toLowerCase();

  const stealth = /stealth|sneak|scout|hide/.test(t);
  const magic = /spell|cantrip|detect|murmur/.test(t);
  const martial = /sword|blade|ready|guard/.test(t);

  const lines: string[] = [];

  // ----------------------------------------------------------
  // Margin bands (FACT-LOCKED)
  // ----------------------------------------------------------

  if (margin >= 6) {
    lines.push(
      pick(lens, [
        "Everything clicks into place.",
        "Timing and silence align.",
        "The moment bends in your favor.",
      ])
    );
    if (stealth)
      lines.push(
        pick(lens, [
          "You pass through the space like a rumor.",
          "No one looks twice — if they look at all.",
        ])
      );
  } else if (margin >= 3) {
    lines.push(
      pick(lens, [
        "The plan holds together cleanly.",
        "You advance without drawing attention.",
      ])
    );
    if (magic)
      lines.push(
        pick(lens, [
          "The spell reveals absence, not comfort.",
          "Magic confirms what *isn't* there.",
        ])
      );
  } else if (margin >= 0) {
    lines.push(
      pick(lens, [
        "It works — narrowly.",
        "You feel how close this came to unraveling.",
      ])
    );
  } else if (margin >= -2) {
    lines.push(
      pick(lens, [
        "Something slips.",
        "A small error ripples outward.",
      ])
    );
    if (stealth)
      lines.push(
        pick(lens, [
          "A sound travels farther than intended.",
          "Stone answers where it shouldn’t.",
        ])
      );
  } else if (margin >= -5) {
    lines.push(
      pick(lens, [
        "The plan breaks under pressure.",
        "Control starts to slip away.",
      ])
    );
    if (martial)
      lines.push(
        pick(lens, [
          "Hands tighten on weapons too late.",
          "Steel feels heavier than it should.",
        ])
      );
  } else {
    lines.push(
      pick(lens, [
        "Everything falls apart at once.",
        "The moment turns against you completely.",
      ])
    );
    lines.push(
      pick(lens, [
        "You’re reacting now, not choosing.",
        "Instinct replaces planning.",
      ])
    );
  }

  return lines.join(" ");
}

/* ------------------------------------------------------------
   Utilities
------------------------------------------------------------ */

function pick(lens: NarrativeLens, options: string[]): string {
  // deterministic-ish but varied
  const seed =
    lens.length + options[0].length;
  return options[seed % options.length];
}
