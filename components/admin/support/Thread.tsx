"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Msg = {
  id: string;
  support_request_id: string;
  sender: "user" | "agent";
  is_public: boolean;
  message: string;
  created_at: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Thread({
  supportRequestId,
  initialMessages,
  requester,
}: {
  supportRequestId: string;
  initialMessages: Msg[];
  requester: { name: string; email: string };
}) {
  const [msgs, setMsgs] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Realtime: stream new messages for this ticket
  useEffect(() => {
    const ch = supabase
      .channel(`sr-${supportRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `support_request_id=eq.${supportRequestId}`,
        },
        (payload) => {
          setMsgs((m) => [...m, payload.new as any as Msg]);
          // auto-scroll to newest
          setTimeout(() => scroller.current?.scrollTo({ top: 1e9, behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [supportRequestId]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    const res = await fetch("/api/support/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        support_request_id: supportRequestId,
        message: body,
        is_public: isPublic, // <-- key: internal note when false
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const t = await res.text();
      alert(t || "Failed to send");
      return;
    }
    setText("");
  }

  return (
    <div className="grid grid-rows-[1fr,auto] h-[70vh]">
      {/* Messages */}
      <div ref={scroller} className="overflow-y-auto p-4 space-y-3 bg-neutral-950">
        {msgs.map((m) => (
          <MessageBubble key={m.id} m={m} requester={requester} />
        ))}
        {msgs.length === 0 && (
          <div className="text-neutral-500 text-sm">No messages yet.</div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-neutral-800 p-3 bg-neutral-950">
        <div className="flex items-center gap-3 mr-2 mb-2">
          <label className="flex items-center gap-2 text-sm text-neutral-300 select-none">
            <input
              type="checkbox"
              className="accent-emerald-600"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public reply
          </label>
          {!isPublic && (
            <span className="text-xs rounded-full px-2 py-0.5 bg-amber-900/40 text-amber-200">
              Internal note
            </span>
          )}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 outline-none focus:ring-1 focus:ring-neutral-600"
            rows={3}
            placeholder={isPublic ? "Write a reply…" : "Write an internal note…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={send}
            disabled={busy || !text.trim()}
            className="shrink-0 h-[42px] px-4 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
          >
            {busy ? (isPublic ? "Sending…" : "Saving…") : isPublic ? "Send" : "Add note"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  m,
  requester,
}: {
  m: Msg;
  requester: { name: string; email: string };
}) {
  const mine = m.sender === "agent";
  const note = !m.is_public;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-5 " +
          (note
            ? "bg-amber-900/25 text-amber-100 border border-amber-700/30"
            : mine
            ? "bg-emerald-900/40 text-emerald-100"
            : "bg-neutral-800 text-neutral-100")
        }
        title={`${new Date(m.created_at).toLocaleString()}${note ? " · internal note" : ""}`}
      >
        {!mine && !note && (
          <div className="text-xs text-neutral-400 mb-1">
            {requester.name || requester.email || "User"}
          </div>
        )}
        {note && (
          <div className="text-[11px] uppercase tracking-wide text-amber-300/80 mb-1">
            Internal note
          </div>
        )}
        <div style={{ whiteSpace: "pre-wrap" }}>{m.message}</div>
      </div>
    </div>
  );
}
