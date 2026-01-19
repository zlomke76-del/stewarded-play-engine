/* Moral Clarity AI • News Domain Wrapper v1
 *
 * Purpose:
 *  - Decide whether a request belongs to:
 *      • "general" Solace (Neutral | Guidance | Ministry)
 *      • "solace-news" (Neutral News Anchor / Outlet Analyst / Journalism Coach)
 *  - Apply a clear precedence:
 *      1) Explicit mode flag in the request body
 *      2) Workspace-based routing
 *      3) Page-based routing (path)
 *      4) Fallback to general Solace
 *
 *  - For "general": use the existing routeMode() heuristic.
 *  - For "solace-news": bypass heuristics and lock inner mode to "Neutral".
 */

import {
  routeMode,
  toneFor,
  type Mode,
  type RouteContext,
  type RouteResult,
} from ".";

/* ========= DOMAIN TYPE ========= */

export type Domain = "general" | "solace-news";

/* ========= INPUT TYPES ========= */

export interface NewsRoutingInput {
  text: string;
  workspaceId?: string | null;
  path?: string | null;
  /**
   * Optional explicit mode override from the request body.
   * Example values:
   *  - "solace-news-anchor"
   *  - "general"
   *  - "neutral"
   *  - "guidance"
   *  - "ministry"
   */
  explicitMode?: string | null;
  context?: RouteContext;
}

/* ========= OUTPUT TYPE ========= */

export interface NewsDomainDecision {
  /** High-level domain: general Solace vs. Solace News Anchor */
  domain: Domain;
  /** Inner mode for tone / temperature (Neutral | Guidance | Ministry) */
  mode: Mode;
  /** Tone knobs derived from mode (temperature, avg sentence length, etc.) */
  tone: ReturnType<typeof toneFor>;
  /** Whether this request must receive a [NEUTRAL_NEWS_DIGEST] payload */
  requiresNeutralNewsDigest: boolean;
  /** Optional: raw route result when domain = "general" */
  rawRouteResult?: RouteResult;
}

/* ========= CONSTANTS ========= */

/**
 * Workspace ID that should always be treated as "Solace News".
 * Adjust if your global news workspace ID differs.
 */
const GLOBAL_NEWS_WORKSPACE_ID = "global_news";

/* ========= CORE HELPERS ========= */

function domainFromExplicitMode(
  explicitMode?: string | null,
): Domain | null {
  if (!explicitMode) return null;
  const m = explicitMode.trim().toLowerCase();

  if (m === "solace-news-anchor" || m === "news") return "solace-news";
  if (m === "general" || m === "solace-general") return "general";

  if (m === "neutral" || m === "guidance" || m === "ministry") {
    return "general";
  }

  return null;
}

function domainFromWorkspace(workspaceId?: string | null): Domain | null {
  if (!workspaceId) return null;
  if (workspaceId === GLOBAL_NEWS_WORKSPACE_ID) return "solace-news";
  return null;
}

function domainFromPath(path?: string | null): Domain | null {
  if (!path) return null;
  const p = path.toLowerCase();

  if (
    p.startsWith("/solace/news") ||
    p.startsWith("/news/anchor") ||
    p.startsWith("/anchor/solace")
  ) {
    return "solace-news";
  }

  return null;
}

/* ========= PUBLIC API ========= */

export function decideNewsDomain(
  input: NewsRoutingInput,
): NewsDomainDecision {
  const {
    text,
    workspaceId = null,
    path = null,
    explicitMode = null,
    context = {},
  } = input;

  // 1) Explicit override (strongest)
  const domainFromExplicit = domainFromExplicitMode(explicitMode);
  if (domainFromExplicit === "solace-news") {
    return {
      domain: "solace-news",
      mode: "Neutral",
      tone: toneFor("Neutral"),
      requiresNeutralNewsDigest: true,
    };
  }
  if (domainFromExplicit === "general") {
    const routeResult = routeMode(text, context);
    return {
      domain: "general",
      mode: routeResult.mode,
      tone: toneFor(routeResult.mode),
      requiresNeutralNewsDigest: false,
      rawRouteResult: routeResult,
    };
  }

  // 2) Workspace-based routing
  const domainFromWs = domainFromWorkspace(workspaceId);
  if (domainFromWs === "solace-news") {
    return {
      domain: "solace-news",
      mode: "Neutral",
      tone: toneFor("Neutral"),
      requiresNeutralNewsDigest: true,
    };
  }

  // 3) Path-based routing
  const domainFromP = domainFromPath(path);
  if (domainFromP === "solace-news") {
    return {
      domain: "solace-news",
      mode: "Neutral",
      tone: toneFor("Neutral"),
      requiresNeutralNewsDigest: true,
    };
  }

  // 4) Fallback: general Solace
  const routeResult = routeMode(text, context);
  return {
    domain: "general",
    mode: routeResult.mode,
    tone: toneFor(routeResult.mode),
    requiresNeutralNewsDigest: false,
    rawRouteResult: routeResult,
  };
}
