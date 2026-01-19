"use client";
import { useState } from "react";
export default function ModeLab() {
  const [q,setQ]=useState(""); const [r,setR]=useState<any>(null);
  async function send(){ const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json","Origin":"https://www.moralclarity.ai"},body:JSON.stringify({messages:[{role:"user",content:q}]})}); setR(await res.json()); }
  return (<div className="space-y-4">
    <h1 className="text-2xl font-semibold">Mode Lab</h1>
    <textarea value={q} onChange={e=>setQ(e.target.value)} className="h-28 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" />
    <button onClick={send} className="rounded-lg bg-blue-600 px-4 py-2">Send</button>
    <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(r,null,2)}</pre>
  </div>);
}
