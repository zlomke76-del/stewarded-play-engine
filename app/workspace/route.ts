// app/workspace/route.ts
// ============================================================
// DEPRECATED ROUTE — Workspace resolution must occur via
// authenticated, authoritative endpoints only.
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: "WORKSPACE_ROUTE_DEPRECATED",
      message:
        "The /workspace endpoint is deprecated. Workspace resolution must occur via authenticated memory/workspace APIs.",
    },
    { status: 410 }, // Gone
  );
}
