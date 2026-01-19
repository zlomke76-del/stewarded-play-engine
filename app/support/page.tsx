// app/support/page.tsx
"use client";

import { useState } from "react";

const CATEGORIES = [
  "Billing",
  "Technical",
  "Account",
  "Suggestion",
  "Ethical Concern",
];

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: Record<string, string> = {};
    fd.forEach((v, k) => {
      data[k] = typeof v === "string" ? v : v.name || "";
    });

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      setOk(true);
      form.reset();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-2xl font-semibold mb-2">
          We’ve received your question
        </h1>
        <p className="text-gray-700">
          A Steward will respond thoughtfully. You’ll also get a confirmation
          email.
        </p>
        <button className="mt-6 underline" onClick={() => setOk(false)}>
          Submit another
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-2">Help & Support</h1>
      <p className="text-gray-700 mb-8">
        Take a breath. Tell us what you need clarity on.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            type="text"
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email *</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Category *</label>
          <select
            name="category"
            required
            className="mt-1 w-full border rounded px-3 py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Describe your question *
          </label>
          <textarea
            name="description"
            required
            rows={5}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="How can we help?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Attachment link (optional)
          </label>
          <input
            name="attachment_url"
            type="url"
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="https://…"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="rounded px-4 py-2 border">
          {loading ? "Sending…" : "Send to Support"}
        </button>
      </form>
    </main>
  );
}
