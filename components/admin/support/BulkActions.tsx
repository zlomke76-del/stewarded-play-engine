"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BulkActions() {
  const [busy, setBusy] = useState<null | "close" | "escalate">(null);
  const router = useRouter();

  async function call(path: string, kind: "close" | "escalate") {
    setBusy(kind);
    const res = await fetch(path, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const msg = await res.text();
      alert(msg || "Bulk action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => call("/api/support/bulk/close", "close")}
        disabled={busy !== null}
        className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50"
        title="Set status=closed for all open tickets"
      >
        {busy === "close" ? "Closing…" : "Close All Open"}
      </button>

      <button
        onClick={() => call("/api/support/bulk/escalate", "escalate")}
        disabled={busy !== null}
        className="rounded-lg px-3 py-2 bg-red-900/40 hover:bg-red-800/40 text-red-200 disabled:opacity-50"
        title="Set priority=high for all open (non-high) tickets"
      >
        {busy === "escalate" ? "Escalating…" : "Escalate Open → High"}
      </button>
    </div>
  );
}
