import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM!, // e.g. 'Moral Clarity AI Support <support@moralclarity.ai>'
        to: ["zlomke76@gmail.com"],
        subject: "Resend wiring check",
        text: "If you're reading this, Resend + domain + API route are wired correctly.",
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ ok: false, error: err }, { status: r.status });
    }

    const data = await r.json();
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
