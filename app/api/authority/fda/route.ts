// ------------------------------------------------------------
// FDA AUTHORITY ROUTE
// Regulatory Authority (NOT research)
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
  source: "FDA";
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
          source: "FDA",
          queried: false,
          negativeSpace: {
            asserted: true,
            confidence: "low",
            reason: "No valid query provided to FDA authority.",
          },
        },
      });
    }

    // --------------------------------------------------------
    // FDA public device database search (open endpoint)
    // --------------------------------------------------------
    const res = await fetch(
      `https://api.fda.gov/device/registrationlisting/search.json?search=${encodeURIComponent(
        query
      )}&limit=5`
    );

    // --------------------------------------------------------
    // Non-OK or blocked
    // --------------------------------------------------------
    if (!res.ok) {
      return NextResponse.json({
        ok: true,
        authority: {
          source: "FDA",
          queried: true,
          negativeSpace: {
            asserted: true,
            confidence: "medium",
            reason: "FDA API returned a non-OK response.",
          },
        },
      });
    }

    const data = await res.json();
    const results = data?.results ?? [];

    // --------------------------------------------------------
    // Authority context construction
    // --------------------------------------------------------
    const authority: AuthorityContext =
      Array.isArray(results) && results.length > 0
        ? {
            source: "FDA",
            queried: true,
            retrievedAt: new Date().toISOString(),
            payload: {
              resultCount: results.length,
              results,
            },
          }
        : {
            source: "FDA",
            queried: true,
            retrievedAt: new Date().toISOString(),
            negativeSpace: {
              asserted: true,
              confidence: "medium",
              reason:
                "FDA query completed successfully but no matching device registrations were found.",
            },
          };

    return NextResponse.json({ ok: true, authority });
  } catch (err: any) {
    console.error("[FDA AUTHORITY ERROR]", err?.message);

    return NextResponse.json({
      ok: true,
      authority: {
        source: "FDA",
        queried: true,
        negativeSpace: {
          asserted: true,
          confidence: "medium",
          reason: "FDA query exception encountered.",
        },
      },
    });
  }
}
