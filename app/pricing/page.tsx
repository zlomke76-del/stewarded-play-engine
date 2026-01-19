// app/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple monthly plans. No ads. No tracking. Cancel anytime.",
};

type Plan = {
  id: "standard" | "family" | "ministry";
  name: string;
  tagline: string;
  price: number;
  seats: number | string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  ctaLabel: string;
  href: string; // absolute for staging checkout
  fine: string;
};

const PLANS: Plan[] = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Personal clarity with full guidance and memory.",
    price: 25,
    seats: 1,
    features: [
      "Neutral Core + Guidance Modes",
      "Persistent Projects & Memory",
      "All Moral & Ministry lenses",
    ],
    ctaLabel: "Gain clarity",
    href: "https://staging.moralclarity.ai/buy/standard",
    fine: "Single user • Cancel anytime",
  },
  {
    id: "family",
    name: "Family",
    tagline: "Shared clarity for households and small teams.",
    price: 50,
    seats: 4,
    highlight: true,
    badge: "Most popular",
    features: [
      "Everything in Standard",
      "Up to 4 seats",
      "Shared Memory & Guidance History",
    ],
    ctaLabel: "Bring your family aboard",
    href: "https://staging.moralclarity.ai/buy/family",
    fine: "Up to 4 users • Cancel anytime",
  },
  {
    id: "ministry",
    name: "Ministry / Enterprise",
    tagline: "Equip your team or congregation with clarity tools.",
    price: 249,
    seats: 10,
    features: [
      "Everything in Family",
      "Up to 10 seats",
      "Custom Faith Lens creation",
      "Dedicated support channel",
    ],
    ctaLabel: "Equip your ministry",
    href: "https://staging.moralclarity.ai/buy/ministry",
    fine: "Scale seats as needed • Cancel anytime",
  },
];

export default function PricingPage() {
  return (
    <section className="pricing mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="pricing-head mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Choose your plan
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Simple monthly subscriptions. No upsells. No confusion.
        </p>
      </div>

      {/* Grid */}
      <div className="pricing-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={[
              "plan relative rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-sm",
              plan.highlight ? "ring-1 ring-blue-500/30" : "",
            ].join(" ")}
            data-base={plan.price}
            data-seats={plan.seats}
          >
            {plan.badge && (
              <span className="badge absolute -top-3 left-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow">
                {plan.badge}
              </span>
            )}

            <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
            <p className="tagline mt-1 text-sm text-zinc-400">{plan.tagline}</p>

            <div className="price mt-4 flex items-baseline gap-1">
              <span className="amount text-3xl font-semibold text-white">
                ${plan.price}
              </span>
              <span className="per text-sm text-zinc-400">/month</span>
            </div>

            <ul className="features mt-4 space-y-2 text-sm text-zinc-300">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                "cta mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition",
                plan.highlight
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-zinc-800 text-white hover:bg-zinc-700",
              ].join(" ")}
              id={
                plan.id === "standard"
                  ? "stdCta"
                  : plan.id === "family"
                  ? "famCta"
                  : "minCta"
              }
            >
              {plan.ctaLabel}
            </Link>

            <p className="fine mt-2 text-xs text-zinc-500">{plan.fine}</p>
          </article>
        ))}
      </div>

      <p className="assurance mt-10 text-center text-sm text-zinc-400">
        No hidden fees. No ads. No tracking. Cancel anytime.
      </p>
    </section>
  );
}
