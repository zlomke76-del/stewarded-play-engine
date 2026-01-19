// app/status/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

const ORIGINS = [
  "https://moralclarity.ai",
  "https://www.moralclarity.ai",
  "https://studio.moralclarity.ai",
  "http://localhost:3000",
];

function cors(origin: string | null) {
  const allowed = !!origin && ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "https://studio.moralclarity.ai",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: cors(origin) });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  return NextResponse.json(
    {
      status: "ok",
      message: "Moral Clarity AI backend responding correctly.",
      timestamp: new Date().toISOString(),
    },
    { headers: cors(origin) }
  );
}
