// ------------------------------------------------------------
// USPTO AUTHORITY ROUTE
// Authoritative Constraint Source (NOT research)
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
  source: "USPTO";
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

    // --------------------------------------------------------
    // Forward request to USPTO API
    // --------------------------------------------------------
    const res = await fetch(
      "https://api.uspto.gov/api/v1/patent/applications/search",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": process.env.USPTO_API_KEY!,
        },
        body: JSON.stringify(body),
      }
    );

    // --------------------------------------------------------
    // Failure or non-OK response
    // --------------------------------------------------------
    if (!res.ok) {
      const authority: AuthorityContext = {
        source: "USPTO",
        queried: true,
        negativeSpace: {
          asserted: true,
          confidence: "low",
          reason: "USPTO API returned a non-OK response.",
        },
      };

      return NextResponse.json({ ok: true, authority });
    }

    // --------------------------------------------------------
    // Parse USPTO response
    // --------------------------------------------------------
    const data = await res.json();
    const results = data?.results ?? [];

    // --------------------------------------------------------
    // Construct authority context
    // --------------------------------------------------------
    const authority: AuthorityContext =
      Array.isArray(results) && results.length > 0
        ? {
            source: "USPTO",
            queried: true,
            retrievedAt: new Date().toISOString(),
            payload: {
              resultCount: results.length,
              results,
            },
          }
        : {
            source: "USPTO",
            queried: true,
            retrievedAt: new Date().toISOString(),
            negativeSpace: {
              asserted: true,
              confidence: "low",
              reason:
                "USPTO query completed successfully but returned no matching records.",
            },
          };

    return NextResponse.json({ ok: true, authority });
  } catch (err: any) {
    // --------------------------------------------------------
    // Hard failure / exception
    // --------------------------------------------------------
    const authority: AuthorityContext = {
      source: "USPTO",
      queried: true,
      negativeSpace: {
        asserted: true,
        confidence: "low",
        reason: "USPTO query exception encountered.",
      },
    };

    console.error("[USPTO AUTHORITY ERROR]", err?.message);

    return NextResponse.json({ ok: true, authority });
  }
}
