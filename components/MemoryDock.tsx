// components/MemoryDock.tsx

"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { supabase } from "@/lib/supabase/browser";

interface MemoryDockProps {
  workspaceId: string | null;
}

export default function MemoryDock({ workspaceId }: MemoryDockProps) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMemories() {
    try {
      setLoading(true);

      if (!workspaceId) {
        setMemories([]);
        return;
      }

      const { data, error } = await supabase
        .from("user_memories")
        .select("id, title, created_at, workspace_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[MemoryDock] load error:", error);
        toast("Failed to load memories");
        return;
      }

      setMemories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[MemoryDock] exception:", err);
      toast("Unexpected error loading memories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Recent Workspace Memories</h2>

      {loading ? (
        <p className="text-neutral-400 text-sm">Loading?</p>
      ) : memories.length === 0 ? (
        <p className="text-neutral-500 text-sm">No memories found.</p>
      ) : (
        <ul className="space-y-2">
          {memories.map((m) => (
            <li key={m.id} className="text-neutral-300 text-sm">
              {m.title || "(untitled)"}{" "}
              <span className="text-neutral-500 text-xs">
                • {new Date(m.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
