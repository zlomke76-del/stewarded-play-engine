'use client';

import { useState } from "react";
import { sendChat } from "@/lib/sendChat";

function isReadableStream(x: unknown): x is ReadableStream<Uint8Array> {
  // Cross-runtime friendly check
  return !!x && typeof x === "object" && typeof (x as any).getReader === "function";
}

export default function MoralClarityBox() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string>("");

  async function onAsk() {
    const text = input.trim();
    if (!text) return;

    setInput("");
    setAnswer("");

    try {
      const resp = await sendChat({
        messages: [{ role: "user", content: text }],
        stream: true, // request stream; non-stream paths still handled
      });

      if (typeof resp === "string") {
        setAnswer(resp);
        return;
      }

      if (isReadableStream(resp)) {
        // Read the SSE/text stream into a single string
        const reader = resp.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
        }
        return;
      }

      // JSON-ish object fallback
      if (resp && typeof resp === "object" && "text" in resp) {
        setAnswer(String((resp as any).text ?? ""));
        return;
      }

      setAnswer("[No response]");
    } catch (e) {
      console.error("sendChat failed:", e);
      setAnswer("Request failed.");
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className="flex-1 rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none"
        />
        <button
          onClick={onAsk}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Ask
        </button>
      </div>

      {answer && (
        <div className="whitespace-pre-wrap rounded-md bg-black/30 p-3 text-sm">
          {answer}
        </div>
      )}
    </div>
  );
}
