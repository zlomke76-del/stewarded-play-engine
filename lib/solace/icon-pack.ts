// ------------------------------------------------------------
// Solace Iconography Pack (SIP v1.0) — Production Build
// ------------------------------------------------------------
//
// Icons are structural tools that influence pacing, clarity,
// and emotional tone. They must be governed — not decorative.
// The Governor determines when icons are allowed and how many.
//
// This pack contains:
//  - Level-based icon sets
//  - ASCII fallbacks
//  - Safety rules for anchor / compass usage
//  - Icon usage limits per pacing level
//
// ------------------------------------------------------------

import type { PacingLevel } from "./governor/types";

// ------------------------------------------------------------
// ICON DEFINITIONS
// ------------------------------------------------------------

// Level 0 — Sanctuary (calming, minimal)
const SANCTUARY_ICONS = {
  ANCHOR: "⚓",     // grounding
  PAUSE: "…",
  BREATH: "~ ~ ~",
};

// Level 1 — Warm / Gentle guidance
const WARM_ICONS = {
  DOT: "•",
  SOFT_STAR: "✧",
  SOFT_COMPASS: "⌖",
};

// Level 2 — Guided clarity
const GUIDANCE_ICONS = {
  ARROW: "→",
  BOX: "▣",
  QUESTION: "◆",
};

// Level 3 — Productive flow (structured synthesis)
const FLOW_ICONS = {
  DOUBLE_ARROW: "→→",
  STRUCTURE_BAR: "▤",
  OPTION_SET: "▧",
  DECISION_DIAMOND: "◇",
  COMPASS: "⌘", // branded internal compass
};

// Level 4 — Accelerated execution
const ACCEL_ICONS = {
  FAST_ARROW: "⇒",
  CHECK: "✔︎",
  WARNING: "⚠︎",
  PATH: "⇢",
};

// Level 5 — Founder Mode (restricted)
const FOUNDER_ICONS = {
  STAR: "✦",
  SIGIL: "⟡",
  ANCHOR: "⚓",
  COMPASS: "🧭",
  COMPASS_ASCII: "+>", // fallback when unicode cannot render
};

// ------------------------------------------------------------
// ICON LIMITS PER PACING LEVEL
// ------------------------------------------------------------

export const ICON_LIMITS: Record<PacingLevel, number> = {
  0: 1, // almost none
  1: 1,
  2: 2,
  3: 2,
  4: 3,
  5: 4, // founder can receive more structured signals
};

// ------------------------------------------------------------
// LEVEL → ICON SET MAPPING
// ------------------------------------------------------------

export const ICONS_BY_LEVEL: Record<PacingLevel, Record<string, string>> = {
  0: { ...SANCTUARY_ICONS },
  1: { ...WARM_ICONS },
  2: { ...GUIDANCE_ICONS },
  3: { ...FLOW_ICONS },
  4: { ...ACCEL_ICONS },
  5: {
    ...FLOW_ICONS,
    ...ACCEL_ICONS,
    ...FOUNDER_ICONS,
  },
};

// ------------------------------------------------------------
// GET ICON SET FOR CURRENT LEVEL
// (Strips founder-only icons for non-founders)
// ------------------------------------------------------------

export function getIconsForLevel(
  level: PacingLevel,
  isFounder: boolean
) {
  const base = ICONS_BY_LEVEL[level];

  if (level === 5 && !isFounder) {
    const { STAR, SIGIL, ANCHOR, COMPASS, COMPASS_ASCII, ...rest } = base;
    return rest; // remove founder-only icons
  }

  return base;
}

// ------------------------------------------------------------
// SELECT A SPECIFIC ICON BY KEY
// ASCII fallback for safety
// ------------------------------------------------------------

export function selectIcon(
  level: PacingLevel,
  key: string,
  isFounder: boolean = false
): string {
  const icons = getIconsForLevel(level, isFounder);
  const icon = icons[key];

  if (!icon) return "";

  const asciiSafe = [...icon].every((c) => c.charCodeAt(0) <= 255);

  if (!asciiSafe) {
    if (key === "COMPASS") return FOUNDER_ICONS.COMPASS_ASCII;
  }

  return icon;
}

// ------------------------------------------------------------
// SHOULD-USE LOGIC
// Prevents icon overuse within the Governor limit
// ------------------------------------------------------------

export function shouldUseIcon(
  level: PacingLevel,
  usageCount: number
): boolean {
  return usageCount < ICON_LIMITS[level];
}

// ------------------------------------------------------------
// ANCHOR RULE
// Only for grounding emotional distress
// ------------------------------------------------------------

export function canUseAnchor(
  level: PacingLevel,
  emotionalDistress: boolean
): boolean {
  if (!emotionalDistress) return false;
  return level <= 1; // Sanctuary + Warm only
}

// ------------------------------------------------------------
// COMPASS RULE
// Only for direction, decision framing, synthesis
// ------------------------------------------------------------

export function canUseCompass(
  level: PacingLevel,
  isFounder: boolean,
  decisionContext: boolean
): boolean {
  if (!decisionContext) return false;

  if (isFounder && level === 5) return true; // founder override

  return level >= 3; // Flow, Arbiter, Accelerated
}

// ------------------------------------------------------------
// SIMPLE FORMATTER
// Prefix a line with an icon safely
// ------------------------------------------------------------

export function formatWithIcon(icon: string, text: string): string {
  return `${icon} ${text}`;
}
