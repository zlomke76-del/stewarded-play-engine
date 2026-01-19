// lib/solace/policies/materials.ts

export type MaterialsPolicyContext = {
  workspace?: {
    id?: string;
    mode?: string; // e.g. "materials", "general"
    policy?: {
      eppe_required?: boolean;
    };
  };
  intent?: {
    domain?: string; // e.g. "materials", "ai", "news"
    keywords?: string[];
  };
  memoryRefs?: Array<{
    schema_ref?: string;
  }>;
};

/**
 * Authoritative declaration of when EPPE-01 MUST be enforced.
 * This function is intentionally conservative.
 */
export function requiresEPPE01(
  ctx: MaterialsPolicyContext
): boolean {
  // 1. Explicit workspace policy override (highest authority)
  if (ctx.workspace?.policy?.eppe_required === true) {
    return true;
  }

  // 2. Workspace operating mode
  if (ctx.workspace?.mode === "materials") {
    return true;
  }

  // 3. Memory references that bind the schema
  if (
    ctx.memoryRefs?.some(
      (m) => m.schema_ref === "eppe-01"
    )
  ) {
    return true;
  }

  // 4. Intent-domain based enforcement
  if (ctx.intent?.domain === "materials") {
    return true;
  }

  // 5. Keyword-based fallback (lowest authority)
  const keywords = ctx.intent?.keywords ?? [];
  const EPPE_KEYWORDS = [
    "polymer",
    "fiber",
    "filtration",
    "antimicrobial",
    "phantomfiber",
    "material pairing",
    "materials science",
  ];

  if (keywords.some((k) => EPPE_KEYWORDS.includes(k))) {
    return true;
  }

  return false;
}
