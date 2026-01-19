# Moral Clarity AI — Unified Architecture (Marketing ↔ App “Six Blocks”)

## 0) North Star

**One brand, one language, two surfaces:**

* **Marketing Surface** (public): persuasion + education + capture.
* **Product Surface** (signed-in): creation + reasoning + memory + governance.
  Both surfaces use the **same six structural blocks** so the story the user sees pre-sign-in matches the tools they get post-sign-in.

---

## 1) The Six Blocks (canonical)

> These are the shared primitives across marketing and app. They power copy, UI, data, and permissions consistently.

1. **Profiles & Personas**

   * **Marketing:** lightweight persona quiz, “Choose your lens” explainer, testimonials segmented by persona.
   * **App:** user profile, workspace defaults, active persona/mode (Neutral, Create, Next Steps, Red Team, Ministry).

2. **Subscriptions & Entitlements**

   * **Marketing:** plan cards, toggle (Monthly/Yearly), pricing FAQ.
   * **App:** tier gates (Plus / Pro Family / Ministry / Enterprise), memory packs, voice, seats.

3. **Memories (Context Store)**

   * **Marketing:** narrative on memory advantage, demo snippets (safe examples).
   * **App:** long-term memory buckets per space/thread; export/import; founder 40 MB cap.

4. **Spaces & Threads**

   * **Marketing:** “Work like a studio” storytelling + gallery; journey planner demo.
   * **App:** projects/spaces (MCAI, Neurovia, Tex Axes), threads with modes, parked vs active items.

5. **Support & Requests**

   * **Marketing:** CTA to white-glove onboarding; trust signals.
   * **App:** in-product support drawer; request routing; audit trail.

6. **Caps & Limits**

   * **Marketing:** transparent limits table, “why limits” copy.
   * **App:** live counters, upgrade nudges, admin views.

---

## 2) System Map (end-to-end)

**Domains**

* **moralclarity.ai** → Next.js app (marketing + product in one codebase).
* **studio.moralclarity.ai** (optional vanity) → same app with `/studio` prefix.

**Surfaces & Layouts**

* `/` → **Public Layout**: hero, benefits, pricing, docs, blog. Ads allowed.
* `/auth/*` → **Auth Layout**: minimal shell, no analytics/ads beyond necessary.
* `/app/*` (and `/studio/*`) → **Product Layout**: signed-in UX. No ads. Entitlement-driven UI.

**Runtimes**

* Node for auth/routes touching Supabase.
* Edge OK for static/public but avoid for anything needing Node APIs.

**State Sources (server as source-of-truth)**

* `getEntitlements()` (server) hydrates: `{isSignedIn, plan, isPaid}`.
* `getWorkspaceContext()` (server) hydrates: active space, persona, memory stats.
* Client components consume read-only props; mutations via actions/route handlers.

---

## 3) Information Architecture & Routing

* **Public:** `/`, `/pricing`, `/story`, `/ministry`, `/docs`, `/blog/*`.
* **Auth:** `/auth/sign-in`, `/auth/callback`, `/auth/error`.
* **Product:**

  * `/app` → dashboard (Your Spaces, Recent Threads, Shortcuts)
  * `/app/s/:spaceId` → space home
  * `/app/s/:spaceId/t/:threadId` → thread view (Create / Next Steps / Red Team modes row always visible)
  * `/app/support` → support drawer deep-link
  * `/app/settings` → profile, billing, memory packs

**Middleware (cookie-only)** protects `/app/*` and `/studio/*`; server layout enforces entitlements and hides ads.

---

## 4) Visual Continuity: “Six Blocks” on both surfaces

* **Marketing card grid** = the same React primitives as **Product quick-launch tiles**.
* Copy & iconography shared: each block’s short description on marketing mirrors the tool-tip inside product.
* CTA mapping: clicking a marketing block deep-links to the corresponding tool in `/app` post-auth (with `next` param).

---

## 5) Data & Tables (minimal viable)

* `profiles` (id, name, email, persona_default, a11y_prefs)
* `workspaces` (id, owner_id, name, plan_tier)
* `workspace_members` (workspace_id, user_id, role)
* `spaces` (id, workspace_id, title, type)
* `threads` (id, space_id, title, mode, status)
* `memories` (id, scope_type, scope_id, bytes_used)
* `support_requests` (id, workspace_id, user_id, message, status)
* `subscriptions` (workspace_id, stripe_sub_id, status, plan_tier)
* `caps` (workspace_id, memory_limit_mb, messages_limit, voice_enabled)

**Views**

* `v_user_billing(user_id, plan_tier, status)` for quick entitlement checks.

---

## 6) Permissions & Roles

* **Owner**, **Admin**, **Member**, **Viewer** per workspace.
* Feature flags by tier (Plus/Pro/Ministry/Enterprise) programmatically map to roles (e.g., Ministry → Ministry tools enabled).

---

## 7) Component Strategy

* **Design tokens** ensure one look.
* **Blocks Library**: `<BlockCard kind="profiles|subs|memories|spaces|support|caps" variant="marketing|product" />`.
* **Modes Row** (Create / Next Steps / Red Team) is a slot on thread pages and a demo widget on marketing.
* **AdGate** mounts only on public layout.

---

## 8) Ads, Analytics, and Telemetry

* Ads render **only** in Public Layout with `<AdGate disabled={isSignedIn && isPaid} />`.
* Analytics:

  * Public: page, CTA clicks, funnel events.
  * Product: feature usage, thread/memory ops, support requests.
* Respect CSP; all analytics listed in `connect-src`.

---

## 9) Content Reuse & CMS

* **MDX** for docs/blog; marketing pulls MDX; product can surface contextual help from the same MDX files.
* Shared copy constants for six-block descriptions.

---

## 10) Security & Privacy

* All auth/back-end calls over Node runtime.
* Cookie domain = apex; `www → apex` redirect enforced.
* NDA/TEA & founder memory caps respected in UI and API.

---

## 11) Launch Checklist (actionable)

1. **Layouts wired**: Public, Auth, Product (ads off in Product).
2. **Middleware**: cookie-only gate for `/app/*`.
3. **Entitlements**: implement `getEntitlements()`; hide/show features.
4. **Blocks parity**: reuse BlockCard in marketing + product; deep-links with `next=`.
5. **Modes Row**: ensure it’s always visible in thread view (desktop & mobile).
6. **Pricing toggle**: yearly = 12× monthly (no discounts) — already spec’d.
7. **Support Drawer**: route + table exists; link in both surfaces.
8. **Telemetry**: add event map and verify.

---

## 12) Roadmap Increments

* **P1 (Now):** layouts, middleware, entitlement gate, AdGate, BlockCard parity.
* **P2:** Recruiter AI (as a Space template), memory pack purchase flow, support export.
* **P3:** Multi-seat workflows, analytics dashboards, collaboration flags (parked items recall commands).

---

## 13) Ownership

* **You (Founder):** voice/positioning, Six Blocks narrative, final UX calls.
* **Model (me):** implement UI scaffolding, entitlements, gates, and BlockCard parity; keep to reverent minimalism.

---

## 14) Decision Log (today)

* Server-decided entitlements feed both surfaces.
* Ads are public-only; product never mounts them.
* Six Blocks become a shared component library + data contracts.

---

### Implementation Notes

**Folder & Component Structure**
```
/app
  /(public)           → PublicLayout.tsx
  /(auth)             → AuthLayout.tsx
  /(product)          → ProductLayout.tsx
  /components/blocks  → BlockCard.tsx, BlockGrid.tsx
  /components/ui      → AdGate.tsx, ModesRow.tsx
  /lib
    entitlements.ts   → getEntitlements(), getWorkspaceContext()
    telemetry.ts
  /middleware.ts      → cookie-only gate
```

**Shared Constants**
```ts
export const SIX_BLOCKS = {
  profiles: { label: "Profiles & Personas", icon: "User" },
  subscriptions: { label: "Subscriptions & Entitlements" },
  memories: { label: "Memories (Context Store)" },
  spaces: { label: "Spaces & Threads" },
  support: { label: "Support & Requests" },
  caps: { label: "Caps & Limits" }
};
```

**Telemetry Map**
```json
{
  "public.hero.cta_click": "Public → Hero CTA",
  "product.thread.create": "Product → Thread Created",
  "product.memory.write": "Memory → Write Event"
}
```
