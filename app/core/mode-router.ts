// app/core/mode-router.ts
export type RouteResult = {
  mode: "Create" | "Next Steps" | "Red Team" | "Ministry" | "Neutral";
  confidence: number; // 0..1
  reasons?: string[];
};

type Hint = "Create" | "Next Steps" | "Red Team" | "Neutral" | undefined;

function pickByHints(hint?: Hint): RouteResult | null {
  if (!hint) return null;
  const map: Record<string, RouteResult> = {
    "Create":     { mode: "Create", confidence: 0.85, reasons: ["explicit hint"] },
    "Next Steps": { mode: "Next Steps", confidence: 0.85, reasons: ["explicit hint"] },
    "Red Team":   { mode: "Red Team", confidence: 0.85, reasons: ["explicit hint"] },
    "Neutral":    { mode: "Neutral", confidence: 0.80, reasons: ["explicit hint"] },
  };
  return map[hint] || null;
}

function textCues(s: string): RouteResult | null {
  const t = s.toLowerCase();

  if (/\bred[-\s]?team\b|\brisk map|counterfactual|failure mode|attack plan/.test(t)) {
    return { mode: "Red Team", confidence: 0.8, reasons: ["red-team cues"] };
  }
  if (/\bnext steps\b|action plan|checklist|what should i do|how do i proceed/.test(t)) {
    return { mode: "Next Steps", confidence: 0.75, reasons: ["procedural cues"] };
  }
  if (/\b(ministry|prayer|scripture|psalm|qur'?an|gospel|faith|pastoral)\b/.test(t)) {
    return { mode: "Ministry", confidence: 0.7, reasons: ["ministry cues"] };
  }
  if (/\bbrainstorm|ideas|concepts|moodboard|inspire|creative\b/.test(t)) {
    return { mode: "Create", confidence: 0.7, reasons: ["creative cues"] };
  }
  return null;
}

/**
 * Unified router. You may call with:
 *   routeMode(req: NextRequest)
 *   routeMode(userText: string, { lastMode?: Hint })
 */
export function routeMode(input: any, opts?: { lastMode?: Hint }): RouteResult {
  // 1) If it's a NextRequest, try to extract last-mode header + last user message
  if (typeof input === "object" && input?.headers && typeof input.headers.get === "function") {
    const hdr = input.headers.get("x-last-mode") as Hint;
    const hinted = pickByHints(hdr);
    if (hinted) return hinted;
    // When called with req, caller should still pass last user text into text path.
    return { mode: "Neutral", confidence: 0.55, reasons: ["default (req)"] };
  }

  // 2) If it's a string, use text + optional lastMode hint
  const hinted = pickByHints(opts?.lastMode);
  if (hinted) return hinted;

  if (typeof input === "string") {
    const viaText = textCues(input);
    if (viaText) return viaText;
  }

  return { mode: "Neutral", confidence: 0.5, reasons: ["default"] };
}
