// app/subscribe/page.tsx
import Stripe from "stripe";
import { StartCheckoutButton, ManageBillingButton } from "../components/CheckoutButtons";

// ✅ [1] ADD THIS — import the auto-resize client helper
import IframeAutoResize from "../components/IframeAutoResize"; // 👈 New

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Tier = {
  key: "standard" | "family" | "ministry";
  title: string;
  blurb: string;
  priceId?: string; // make optional so we can skip gracefully
};

const TIERS: Tier[] = [
  {
    key: "standard",
    title: "Standard",
    blurb: "Perfect for individuals seeking personal moral clarity and AI-guided insight.",
    priceId: process.env.PRICE_STANDARD_ID,
  },
  {
    key: "family",
    title: "Family",
    blurb: "Ideal for households or small groups. Includes shared access for up to 4 users.",
    priceId: process.env.PRICE_FAMILY_ID,
  },
  {
    key: "ministry",
    title: "Ministry / Enterprise",
    blurb: "Designed for ministries, organizations, and teams needing advanced collaboration and analytics.",
    priceId: process.env.PRICE_MINISTRY_ID,
  },
];

function currency(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function SubscribePage() {
  const missingSecret = !process.env.STRIPE_SECRET_KEY;
  const missingAnyPrice = TIERS.some((t) => !t.priceId);

  if (missingSecret || missingAnyPrice) {
    // Render a friendly message instead of crashing
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0b0b0b",
          color: "#fff",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ maxWidth: 700, padding: 24, textAlign: "center" }}>
          <h1 style={{ margin: 0 }}>Setup needed</h1>
          <p style={{ opacity: 0.8, marginTop: 12 }}>
            Missing Stripe configuration. Please set <code>STRIPE_SECRET_KEY</code> and all price IDs (
            <code>PRICE_STANDARD_ID</code>, <code>PRICE_FAMILY_ID</code>, <code>PRICE_MINISTRY_ID</code>) in Vercel
            environment variables and redeploy.
          </p>
        </div>
      </main>
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // ✅ [2] Fetch Stripe prices safely
  const results = await Promise.allSettled(
    TIERS.map(async (t) => {
      const p = await stripe.prices.retrieve(t.priceId!);
      const unit = (p.unit_amount ?? 0) / 100;
      const interval = p.recurring?.interval ?? "month";
      const curr = p.currency?.toUpperCase() ?? "USD";
      return {
        ...t,
        displayPrice: currency(unit, curr),
        interval,
        _curr: curr,
      };
    })
  );

  const prices = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter(Boolean) as Array<{
      key: Tier["key"];
      title: string;
      blurb: string;
      priceId: string;
      displayPrice: string;
      interval: string;
      _curr: string;
    }>;

  if (prices.length === 0) {
    console.error("[/subscribe] All Stripe price lookups failed:", results);
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0b0b0b",
          color: "#fff",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ maxWidth: 700, padding: 24, textAlign: "center" }}>
          <h1 style={{ margin: 0 }}>Stripe unavailable</h1>
          <p style={{ opacity: 0.8, marginTop: 12 }}>
            We couldn’t load pricing details from Stripe. Please verify your Price IDs are correct and active.
          </p>
        </div>
      </main>
    );
  }

  // ✅ [3] Here’s the live render
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        color: "#fff",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      }}
    >
      {/* ✅ [A] Auto-resize component for Webflow iframe */}
      <IframeAutoResize /> {/* 👈 This sends your page height to Webflow for auto-sizing */}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px" }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>Choose your plan</h1>
        <p style={{ marginTop: 8, color: "#bfbfbf" }}>
          Pricing and intervals are fetched live from Stripe.
        </p>

        <section
          style={{
            marginTop: 28,
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {prices.map((tier) => (
            <div
              key={tier.key}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h3 style={{ fontSize: 22, margin: 0 }}>{tier.title}</h3>
              <p style={{ marginTop: 6, color: "#cfcfcf" }}>{tier.blurb}</p>

              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>
                {tier.displayPrice}
                <span style={{ fontSize: 14, opacity: 0.7, marginLeft: 6 }}>
                  /{tier.interval}
                </span>
              </div>

              <ul
                style={{
                  margin: "16px 0 20px",
                  paddingLeft: 18,
                  color: "#ddd",
                  lineHeight: 1.6,
                }}
              >
                {tier.key === "standard" && (
                  <>
                    <li>Core features</li>
                    <li>Single user</li>
                  </>
                )}
                {tier.key === "family" && (
                  <>
                    <li>Everything in Standard</li>
                    <li>Up to 5 seats</li>
                  </>
                )}
                {tier.key === "ministry" && (
                  <>
                    <li>Unlimited members</li>
                    <li>Advanced tools & support</li>
                  </>
                )}
              </ul>

              {/* ✅ [B] Checkout buttons (already handle redirect back to Webflow) */}
              <StartCheckoutButton priceId={tier.priceId!} label={`Start ${tier.title}`} />
            </div>
          ))}
        </section>

        <div style={{ marginTop: 28 }}>
          <ManageBillingButton />
          <span style={{ marginLeft: 12, fontSize: 12, color: "#9aa0a6" }}>
            You can manage or cancel anytime.
          </span>
        </div>
      </div>
    </main>
  );
}
