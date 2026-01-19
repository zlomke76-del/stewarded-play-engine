import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    await resend.emails.send({
      from: "Moral Clarity AI <support@moralclarity.ai>",
      to: process.env.SUPPORT_INBOX ?? "support@moralclarity.ai",
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: message,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
