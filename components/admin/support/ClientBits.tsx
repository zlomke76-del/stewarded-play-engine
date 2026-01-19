"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Filters bar (search + status + category) */
export function Filters({
  defaultQ, defaultStatus, defaultCategory
}: { defaultQ: string; defaultStatus: string; defaultCategory: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);
  const [status, setStatus] = useState(defaultStatus);
  const [category, setCategory] = useState(defaultCategory);

  function apply() {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status !== "all") sp.set("status", status);
    if (category !== "all") sp.set("category", category);
    router.push(`/admin/support?${sp.toString()}`);
  }

  return (
    <div className="flex gap-2">
      <input className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2"
             placeholder="Search…" value={q} onChange={(e)=>setQ(e.target.value)} />
      <select className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2"
              value={status} onChange={(e)=>setStatus(e.target.value)}>
        <option value="all">All status</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>
      <select className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2"
              value={category} onChange={(e)=>setCategory(e.target.value)}>
        <option value="all">All categories</option>
        <option value="Technical">Technical</option>
        <option value="Billing">Billing</option>
        <option value="Account">Account</option>
        <option value="Other">Other</option>
      </select>
      <button onClick={apply} className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20">Apply</button>
    </div>
  );
}

/** Generic single-field updater (status/priority) via API route */
export function ActionButton({ id, field, value }:{
  id: string; field: "status"|"priority"; value: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const res = await fetch("/api/support/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, field, value }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(await res.text());
  }

  return (
    <button onClick={run} disabled={busy}
      className="rounded-lg px-2 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50">
      {busy ? "…" : `${field} → ${value}`}
    </button>
  );
}

/** Assign ticket to an agent */
export function Assign({ id, current }:{ id: string; current: string }) {
  const [val, setVal] = useState(current || "");
  const [busy, setBusy] = useState(false);
  const r = useRouter();
  async function save(){
    setBusy(true);
    const res = await fetch("/api/support/assign", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id, assignee: val })
    });
    setBusy(false);
    if (res.ok) r.refresh(); else alert(await res.text());
  }
  return (
    <span className="inline-flex gap-1">
      <input className="w-44 bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
        placeholder="assignee email" value={val} onChange={e=>setVal(e.target.value)} />
      <button onClick={save} disabled={busy}
        className="rounded px-2 py-1 bg-white/10 hover:bg-white/20">{busy? "…":"Assign"}</button>
    </span>
  );
}

/** Reply box (stores message + emails user via API) */
export function Reply({ id, email, title }:{ id: string; email: string|null; title: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const r = useRouter();

  async function send(){
    setBusy(true);
    const res = await fetch("/api/support/reply", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id, body })
    });
    setBusy(false);
    if (res.ok){ setOpen(false); setBody(""); r.refresh(); }
    else alert(await res.text());
  }

  return (
    <div className="inline-block">
      <button onClick={()=>setOpen(!open)} className="rounded px-2 py-1 bg-white/10 hover:bg-white/20">
        Reply
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
          <select className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
            onChange={e=>setBody(e.target.value)}>
            <option value="">— Canned Replies —</option>
            <option value="Thanks for reaching out! We received your ticket and will reply shortly.">
              Acknowledge
            </option>
            <option value="We’ve resolved your issue. If anything else pops up, reply to this email.">
              Resolved
            </option>
          </select>
          <textarea className="w-[38rem] h-28 bg-neutral-900 border border-neutral-700 rounded p-2"
            placeholder="Write a reply…" value={body} onChange={e=>setBody(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button onClick={()=>setOpen(false)} className="px-2 py-1 rounded bg-white/5">Cancel</button>
            <button onClick={send} disabled={busy || !body.trim()}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50">
              {busy?"…":"Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Close ticket */
export function Close({ id }:{ id: string }) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("Resolved");
  const r = useRouter();
  async function run(){
    setBusy(true);
    const res = await fetch("/api/support/close", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id, reason })
    });
    setBusy(false);
    if (res.ok) r.refresh(); else alert(await res.text());
  }
  return (
    <span className="inline-flex gap-1">
      <input className="w-36 bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
        value={reason} onChange={e=>setReason(e.target.value)} />
      <button onClick={run} disabled={busy}
        className="rounded px-2 py-1 bg-white/10 hover:bg-white/20">{busy?"…":"Close"}</button>
    </span>
  );
}
