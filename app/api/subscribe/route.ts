import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function wantsHtml(req: Request) {
  const accept = req.headers.get("accept") || "";
  return accept.includes("text/html");
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    // 1) Parse either JSON or form-encoded payloads
    const ct = req.headers.get("content-type") || "";
    let email = "";

    if (ct.includes("application/json")) {
      const data = await req.json().catch(() => ({}));
      email = (data.email || data.Email || "").trim();
    } else {
      // Handles application/x-www-form-urlencoded (Webflow) and multipart/form-data
      const form = await req.formData().catch(() => null);
      email = String(
        form?.get("email") ||
          form?.get("Email") ||
          form?.get("Newsletter Email") ||
          ""
      ).trim();
    }

    if (!isValidEmail(email)) {
      if (wantsHtml(req)) {
        // Browser hit without a valid email: go to a "soft" thank-you anyway
        return NextResponse.redirect(new URL("/subscribe", req.url), 303);
      }
      return NextResponse.json(
        { ok: false, message: "Valid email required" },
        { status: 400 }
      );
    }

    // 2) Supabase insert
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.error("Missing Supabase env vars");
      if (wantsHtml(req)) {
        return NextResponse.redirect(new URL("/subscribe", req.url), 303);
      }
      return NextResponse.json(
        { ok: false, message: "Server config error" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey);
    const { error } = await supabase.from("subscribers").insert([{ email }]);
    if (error) {
      const msg = String(error.message || "").toLowerCase();
      const duplicate =
        msg.includes("duplicate") || msg.includes("unique") || msg.includes("exists");
      if (!duplicate) {
        console.error("Supabase insert error:", error);
        if (wantsHtml(req)) {
          return NextResponse.redirect(new URL("/subscribe", req.url), 303);
        }
        return NextResponse.json(
          { ok: false, message: "Database insert failed" },
          { status: 500 }
        );
      }
      // duplicate = OK (idempotent)
    }

    // 3) Decide response: browser → redirect, programmatic → JSON
    if (wantsHtml(req)) {
      return NextResponse.redirect(new URL("/subscribe", req.url), 303);
    }

    return NextResponse.json({
      ok: true,
      message: "Thanks! We'll be in touch with you soon.",
    });
  } catch (err) {
    console.error("POST /api/subscribe error:", err);
    if (wantsHtml(req)) {
      return NextResponse.redirect(new URL("/subscribe", req.url), 303);
    }
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

// Optional: If anyone GETs the API URL in a browser, send them to the pretty page.
export async function GET(req: Request) {
  return NextResponse.redirect(new URL("/subscribe", req.url), 303);
}
