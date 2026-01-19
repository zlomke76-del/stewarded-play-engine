import { NextResponse } from "next/server";

// make sure this never gets statically optimized
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const redirectTo = new URL("/", req.url);
  const res = NextResponse.redirect(redirectTo);
  res.cookies.set("mcai_demo", "1", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 day
  });
  return res;
}
