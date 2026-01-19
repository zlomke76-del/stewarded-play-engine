//--------------------------------------------------------------
// DEPRECATED — USPTO SHOULD NOT BE USED AS RESEARCH
// This route exists ONLY to avoid breaking old callers.
// It forwards to /api/authority/uspto and logs a warning.
//--------------------------------------------------------------

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.warn(
    "[DEPRECATED] /api/research/uspto/search is deprecated. Use /api/authority/uspto instead."
  );

  const body = await req.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/authority/uspto`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
