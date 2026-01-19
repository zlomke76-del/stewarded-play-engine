/* Moral Clarity AI • Mode Router v1 (prototype)
   - Dependency-free heuristic
   - Exposes: routeMode(), scoreDetails(), MODE_CONFIG
   - Modes: Neutral | Guidance | Ministry
*/

export type Mode = "Neutral" | "Guidance" | "Ministry";

export interface RouteContext {
  lastMode?: Mode | null;
  lastN?: { text: string; mode: Mode }[]; // optional trailing turns
}

export interface RouteResult {
  mode: Mode;
  confidence: number;         // 0..1 relative to other scores
  scores: Record<Mode, number>;
  signals: {
    intent: "fact" | "decision" | "purpose";
    sentiment: "calm" | "curious" | "anxious" | "conflicted" | "spiritual" | "neutral";
    depth: number;            // 0=practical, 2=existential
    markers: string[];        // matched keywords
  };
}

export const MODE_CONFIG = {
  weights: {
    Neutral:  { intent: 0.5, sentiment: 0.1, depth: 0.10, context: 0.3 },
    Guidance: { intent: 0.3, sentiment: 0.2, depth: 0.30, context: 0.2 },
    Ministry: { intent: 0.1, sentiment: 0.3, depth: 0.40, context: 0.2 },
  },
  // visual/tone knobs you can consume in UI
  tone: {
    Neutral:  { temperature: 0.25, avgSentence: [12,18] },
    Guidance: { temperature: 0.40, avgSentence: [15,22] },
    Ministry: { temperature: 0.50, avgSentence: [18,30] },
  }
} as const;

// --- Lexicons (tunable) ---
const LEX_FAITH = new Set([
  "faith","god","lord","scripture","pray","prayer","forgive","forgiveness",
  "soul","spirit","reverence","sacred","meaning","purpose","moral","sin","grace","mercy"
]);
const LEX_DECISION = new Set([
  "should","decide","decision","choose","plan","next step","tradeoff",
  "risk","option","pros","cons","goal","roadmap","timeline","how do i","how should i"
]);
const LEX_FACT = new Set([
  "what is","define","definition","difference","syntax","error","stack trace",
  "steps","install","command","api","docs","version","spec","example"
]);

// --- Tiny utils ---
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const containsAny = (s: string, set: Set<string>) =>
  [...set].filter(t => s.includes(t));

function detectIntent(t: string): "fact" | "decision" | "purpose" {
  const lc = t.toLowerCase();
  if (containsAny(lc, LEX_FACT).length > 0) return "fact";
  if (containsAny(lc, LEX_DECISION).length > 0) return "decision";
  if (containsAny(lc, LEX_FAITH).length > 0) return "purpose";
  // fallbacks
  if (/^\s*(what|how|where|when)\b/i.test(t)) return "fact";
  if (/\b(should|best|next)\b/i.test(t)) return "decision";
  return "fact";
}

function detectSentiment(t: string): RouteResult["signals"]["sentiment"] {
  const lc = t.toLowerCase();
  if (/(anxious|overwhelmed|scared|afraid|worry|panic|stressed)/.test(lc)) return "anxious";
  if (/(conflicted|torn|unsure|dilemma|mixed)/.test(lc)) return "conflicted";
  if (containsAny(lc, LEX_FAITH).length > 0) return "spiritual";
  if (/(why|meaning|purpose)/.test(lc)) return "curious";
  if (/(ok|thanks|cool|fine|np)/.test(lc)) return "calm";
  return "neutral";
}

/** crude depth: 0 practical, 1 reflective, 2 existential */
function estimateDepth(t: string): number {
  const lc = t.toLowerCase();
  let d = 0;
  if (containsAny(lc, LEX_DECISION).length) d += 0.8;
  if (/(why|meaning|purpose|ethic|moral|should i live)/.test(lc)) d += 1.4;
  if (containsAny(lc, LEX_FAITH).length) d += 0.9;
  return clamp01(d / 1.8) * 2; // scale to 0..2
}

function lexicalMarkers(t: string): string[] {
  const lc = t.toLowerCase();
  return Array.from(new Set([
    ...containsAny(lc, LEX_FACT),
    ...containsAny(lc, LEX_DECISION),
    ...containsAny(lc, LEX_FAITH),
  ]));
}

function contextBias(ctx?: RouteContext): Partial<Record<Mode, number>> {
  if (!ctx?.lastMode) return {};
  return { [ctx.lastMode]: 0.2 };
}

// --- Main router ---
export function routeMode(text: string, context: RouteContext = {}): RouteResult {
  // explicit override (lightweight “slash command”)
  if (/\/mode:(neutral|guidance|ministry)/i.test(text)) {
    const m = text.match(/\/mode:(neutral|guidance|ministry)/i)![1].toLowerCase() as Lowercase<Mode>;
    const chosen = (m.charAt(0).toUpperCase() + m.slice(1)) as Mode;
    return {
      mode: chosen,
      confidence: 1,
      scores: { Neutral: m==="neutral"?1:0, Guidance: m==="guidance"?1:0, Ministry: m==="ministry"?1:0 },
      signals: { intent: "fact", sentiment: "neutral", depth: 0, markers: [] }
    };
  }

  const intent = detectIntent(text);
  const sentiment = detectSentiment(text);
  const depth = estimateDepth(text);
  const markers = lexicalMarkers(text);

  const w = MODE_CONFIG.weights;

  // seed
  const scores: Record<Mode, number> = { Neutral: 0, Guidance: 0, Ministry: 0 };

  // intent
  if (intent === "fact")       scores.Neutral  += 1 * w.Neutral.intent;
  if (intent === "decision")   scores.Guidance += 1 * w.Guidance.intent;
  if (intent === "purpose")    scores.Ministry += 1 * w.Ministry.intent;

  // sentiment
  if (["calm","curious","neutral"].includes(sentiment)) scores.Neutral  += 0.5 * w.Neutral.sentiment;
  if (["anxious","conflicted"].includes(sentiment))     scores.Guidance += 0.7 * w.Guidance.sentiment;
  if (["spiritual"].includes(sentiment))                scores.Ministry += 1.0 * w.Ministry.sentiment;

  // depth (0..2)
  scores.Neutral  += (2 - depth)/2 * w.Neutral.depth;             // shallow favors Neutral
  scores.Guidance += (1 - Math.abs(depth - 1)) * w.Guidance.depth; // mid favors Guidance
  scores.Ministry += (depth/2) * w.Ministry.depth;                 // deep favors Ministry

  // lexical boosts
  if (markers.some(m => LEX_FAITH.has(m)))    scores.Ministry += 0.8;
  if (markers.some(m => LEX_DECISION.has(m))) scores.Guidance += 0.4;
  if (markers.some(m => LEX_FACT.has(m)))     scores.Neutral  += 0.3;

  // context stickiness
  const bias = contextBias(context);
  for (const k of Object.keys(bias) as Mode[]) scores[k] += bias[k]!;

  // pick
  const total = Object.values(scores).reduce((a,b)=>a+b,0) || 1;
  const mode = (Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0]) as Mode;
  const confidence = Number((scores[mode] / total).toFixed(2));

  return { mode, confidence, scores, signals: { intent, sentiment, depth, markers } };
}

// Optional helper: map a Mode to tone knobs for the UI layer
export function toneFor(mode: Mode) {
  return MODE_CONFIG.tone[mode];
}
