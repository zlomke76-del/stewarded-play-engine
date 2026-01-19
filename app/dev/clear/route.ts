import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const redirectTo = new URL("/", req.url);
  const res = NextResponse.redirect(redirectTo);
  res.cookies.set("mcai_demo", "", {
    path: "/",
    maxAge: 0,
  });
  return res;
}
