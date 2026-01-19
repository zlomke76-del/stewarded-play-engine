"use client";

import { FormEvent, useState } from "react";

export default function Page() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="flex justify-center py-24">
      <div className="w-full max-w-xl space-y-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold">Contact</h1>

        <p className="text-sm text-zinc-400">
          This channel reaches the Moral Clarity stewardship team directly.
        </p>

        <p className="text-zinc-400">
          Or email{" "}
          <a
            className="text-blue-400 hover:underline"
            href="mailto:support@moralclarity.ai"
          >
            support@moralclarity.ai
          </a>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            required
            placeholder="Your name"
            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
          />

          <input
            name="email"
            type="email"
            required
            placeholder="Your email"
            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
          />

          <textarea
            name="message"
            required
            rows={5}
            placeholder="Your message"
            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {status === "sending" ? "Submitting…" : "Submit message"}
          </button>

          {status === "sent" && (
            <p className="text-green-400 text-sm">
              Message sent. We’ll respond shortly.
            </p>
          )}

          {status === "error" && (
            <p className="text-red-400 text-sm">
              Something went wrong. Please try again.
            </p>
          )}
        </form>

        <p className="text-xs text-zinc-500">
          Appropriate for sponsorship inquiries, governance questions, and
          institutional correspondence.
        </p>
      </div>
    </section>
  );
}
