// pages/api/stripe/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

/** ---------- small raw-body helper (avoids extra deps) ---------- */
async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const rb = (req as any).rawBody;
  if (rb) return Buffer.isBuffer(rb) ? rb : Buffer.from(rb);
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/** ---------- shared helpers (same logic as your app/api version) ---------- */
const toISO = (secs?: number | null) =>
  typeof secs === "number" ? new Date(secs * 1000).toISOString() : null;

type SubWithPeriods = Stripe.Subscription & {
  current_period_start?: number | null;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean | null;
};

function extractFromSubscription(subRaw: Stripe.Subscription) {
  const sub = subRaw as SubWithPeriods;
  const item = sub.items?.data?.[0];
  return {
    stripe_subscription_id: sub.id,
    stripe_customer_id: String(sub.customer),
    status: sub.status,
    price_id: item?.price?.id ?? null,
    quantity: item?.quantity ?? null,
    current_period_start: sub.current_period_start ?? null,
    current_period_end: sub.current_period_end ?? null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
  };
}

/** ---------- email (Resend via REST) ---------- */
async function sendResendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY!;
  const RESEND_FROM =
    opts.from ?? process.env.RESEND_FROM ?? "Moral Clarity AI <noreply@moralclarity.ai>";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Resend failed (${r.status}): ${txt}`);
  }
}

/** ---------- magic link invite (Supabase) ---------- */
async function sendMagicLinkInvite(email: string) {
  const sb = createSupabaseAdmin();

  // Always redirect to callback, then /app
  const redirectUrl = `${process.env.APP_BASE_URL}/auth/callback?next=%2Fapp`;

  const { data, error } = await sb.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: redirectUrl },
  });
  if (error) throw error;

  const props = (data?.properties ?? {}) as Record<string, unknown>;
  const link =
    (props.action_link as string | undefined) ??
    (props.email_otp_link as string | undefined) ??
    (props.magic_link as string | undefined) ??
    (props.invite_link as string | undefined);

  if (!link) throw new Error("Could not generate magic link URL");

  await sendResendEmail({
    to: [email.toLowerCase()],
    subject: "Welcome to Moral Clarity AI — Your Sign-In Link",
    html: `
      <p>Welcome! Click the button below to sign in:</p>
      <p>
        <a href="${link}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;">
          Sign in
        </a>
      </p>
      <p>If the button doesn’t work, copy & paste this URL:<br/><code>${link}</code></p>
    `,
  });
}

/** ---------- subscription persistence ---------- */
async function resolveUserIdForCustomer(params: {
  stripe_customer_id: string;
  stripe: Stripe;
}) {
  const { stripe_customer_id, stripe } = params;
  const sb = createSupabaseAdmin();

  // 1) Already linked by stripe_customer_id?
  {
    const { data, error } = await sb
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", stripe_customer_id)
      .maybeSingle();
    if (error) throw new Error(`profiles lookup failed: ${error.message}`);
    if (data?.id) return data.id as string;
  }

  // 2) Try by email (from Stripe), then link
  const cust = (await stripe.customers.retrieve(stripe_customer_id)) as Stripe.Customer;
  const email = cust.email?.toLowerCase() ?? null;

  if (email) {
    const { data, error } = await sb
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (error) throw new Error(`profiles email lookup failed: ${error.message}`);

    if (data?.id) {
      const { error: updErr } = await sb
        .from("profiles")
        .update({ stripe_customer_id })
        .eq("id", data.id);
      if (updErr) throw new Error(`profiles update failed: ${updErr.message}`);
      return data.id as string;
    }
  }

  // 3) No profile yet — purchased before app signup
  return null;
}

async function upsertSubscriptionRecord(args: { stripe: Stripe; sub: Stripe.Subscription }) {
  const { stripe, sub } = args;
  const sb = createSupabaseAdmin();
  const extracted = extractFromSubscription(sub);

  // associate to a user if we can
  const userId = await resolveUserIdForCustomer({
    stripe_customer_id: extracted.stripe_customer_id,
    stripe,
  });

  if (!userId) {
    // We still keep subscription row by subscription_id; no user_id yet
    const { error: updErr } = await sb
      .from("subscriptions")
      .update({
        status: extracted.status,
        price_id: extracted.price_id,
        quantity: extracted.quantity,
        current_period_start: toISO(extracted.current_period_start),
        current_period_end: toISO(extracted.current_period_end),
        cancel_at_period_end: extracted.cancel_at_period_end ?? false,
        updated: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", extracted.stripe_subscription_id);

    // Ignore "no rows found" code; otherwise throw
    if (updErr && (updErr as any).code !== "PGRST116") {
      throw new Error(`Supabase update failed: ${updErr.message}`);
    }
    return;
  }

  const row = {
    user_id: userId,
    stripe_customer_id: extracted.stripe_customer_id,
    stripe_subscription_id: extracted.stripe_subscription_id,
    status: extracted.status,
    price_id: extracted.price_id,
    quantity: extracted.quantity,
    current_period_start: toISO(extracted.current_period_start),
    current_period_end: toISO(extracted.current_period_end),
    cancel_at_period_end: extracted.cancel_at_period_end ?? false,
    updated: new Date().toISOString(),
  };

  const { error } = await sb
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
}

/** ---------- Webhook handler (Pages API – Node runtime) ---------- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const signature = req.headers["stripe-signature"];
  if (!signature) return res.status(400).json({ error: "Missing signature" });

  try {
    const raw = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(
      raw,
      String(signature),
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(String(session.subscription));
          await upsertSubscriptionRecord({ stripe, sub });
        }
        if (session.customer_details?.email) {
          await sendMagicLinkInvite(session.customer_details.email);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscriptionRecord({ stripe, sub });
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed":
        // optional: add emails/alerts
        break;

      default:
        // ignore unhandled events
        break;
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[stripe-webhook] error:", err?.message ?? err);
    return res.status(400).json({ error: err?.message ?? "Signature/handler error" });
  }
}

/** Keep raw body for Stripe signature verification */
export const config = {
  api: { bodyParser: false },
};
