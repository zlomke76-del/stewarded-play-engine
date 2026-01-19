// ------------------------------------------------------------
// STANDARDS AUTHORITY ROUTE (ISO / ASTM)
// Engineering & Quality Standards (NOT research)
// Negative-space preserving
// NEXT 16 SAFE — NODE RUNTIME
// ------------------------------------------------------------

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
type AuthorityContext = {
  source: "ISO/ASTM";
  queried: boolean;
  retrievedAt?: string;
  payload?: any;
  negativeSpace?: {
    asserted: boolean;
    confidence: "low" | "medium" | "high";
    reason: string;
  };
};

// ------------------------------------------------------------
// Heuristic standards mapper (INTENTIONALLY CONSERVATIVE)
// ------------------------------------------------------------
function inferStandardsDomain(query: string): string[] {
  const q = query.toLowerCase();
  const domains: string[] = [];

  if (
    q.includes("filtration") ||
    q.includes("air") ||
    q.includes("hvac")
  ) {
    domains.push("ISO 16890", "ASHRAE 52.2");
  }

  if (
    q.includes("medical") ||
    q.includes("device") ||
    q.includes("hospital")
  ) {
    domains.push("ISO 13485", "ISO 10993");
  }

  if (
    q.includes("polymer") ||
    q.includes("material")
  ) {
    domains.push("ASTM materials standards");
  }

  return domains;
}

// ------------------------------------------------------------
// POST handler
// ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query;

    if (!query || typeof query !== "string") {
      return NextResponse.json({
        ok: true,
        authority: {
          source: "ISO/ASTM",
          queried: false,
          negativeSpace: {
            asserted: true,
            confidence: "low",
            reason: "No valid query provided to standards authority.",
          },
        },
      });
    }

    const inferredStandards = inferStandardsDomain(query);

    // --------------------------------------------------------
    // Construct authority context
    // --------------------------------------------------------
    const authority: AuthorityContext =
      inferredStandards.length > 0
        ? {
            source: "ISO/ASTM",
            queried: true,
            retrievedAt: new Date().toISOString(),
            payload: {
              inferredApplicableStandards: inferredStandards,
              note:
                "Standards presence inferred. Compliance is not assessed.",
            },
          }
        : {
            source: "ISO/ASTM",
            queried: true,
            retrievedAt: new Date().toISOString(),
            negativeSpace: {
              asserted: true,
              confidence: "medium",
              reason:
                "No clearly applicable ISO or ASTM standards inferred for this description.",
            },
          };

    return NextResponse.json({ ok: true, authority });
  } catch (err: any) {
    console.error("[STANDARDS AUTHORITY ERROR]", err?.message);

    return NextResponse.json({
      ok: true,
      authority: {
        source: "ISO/ASTM",
        queried: true,
        negativeSpace: {
          asserted: true,
          confidence: "low",
          reason: "Standards authority exception encountered.",
        },
      },
    });
  }
}
