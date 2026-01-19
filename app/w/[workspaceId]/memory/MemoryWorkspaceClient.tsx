"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import type { MemoryRecord } from "@/app/components/memory/types";
import { createBrowserClient } from "@supabase/ssr";

type Props = {
  workspaceId: string;
  initialItems: MemoryRecord[];
};

type Mode = "view" | "edit" | "create";

/* ------------------------------------------------------------
   Content normalization (UI boundary)
------------------------------------------------------------ */
function normalizeContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!content) return "";
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return "";
  }
}

export default function MemoryWorkspaceClient({
  workspaceId,
  initialItems,
}: Props) {
  /* ------------------------------------------------------------
     Supabase
  ------------------------------------------------------------ */
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  /* ------------------------------------------------------------
     State
  ------------------------------------------------------------ */
  const [items, setItems] = useState<MemoryRecord[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string>("");

  const selected = useMemo(
    () => items.find((m) => m.id === selectedId) ?? null,
    [items, selectedId]
  );

  const [draft, setDraft] = useState<string>("");
  const originalDraftRef = useRef<string>("");

  const [mode, setMode] = useState<Mode>("view");

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* ------------------------------------------------------------
     Load memories (known-good)
  ------------------------------------------------------------ */
  const loadMemories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated.");
        setItems([]);
        return;
      }

      const res = await fetch(
        `/api/memory/workspace-v2?workspaceId=${workspaceId}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        setError("Failed to load workspace memories.");
        setItems([]);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data.items)) {
        setError("Unexpected memory format.");
        setItems([]);
        return;
      }

      setItems(data.items);
    } catch {
      setError("An error occurred while loading memories.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, supabase]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  /* ------------------------------------------------------------
     Select existing memory
  ------------------------------------------------------------ */
  function handleSelect(id: string) {
    setSelectedId(id);
    setSaveError(null);
    setDeleteError(null);

    const record = items.find((m) => m.id === id);
    if (!record) {
      setDraft("");
      originalDraftRef.current = "";
      setMode("view");
      return;
    }

    const content = normalizeContent(record.content);

    setDraft(content);
    originalDraftRef.current = content;
    setMode("view");
  }

  /* ------------------------------------------------------------
     Create new memory
  ------------------------------------------------------------ */
  function handleNew() {
    setSelectedId("");
    setDraft("");
    originalDraftRef.current = "";
    setSaveError(null);
    setDeleteError(null);
    setMode("create");
  }

  /* ------------------------------------------------------------
     Save (create or edit)
  ------------------------------------------------------------ */
  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    const content = draft;

    try {
      if (mode === "edit" && selected) {
        if (draft === originalDraftRef.current) {
          setMode("view");
          return;
        }

        const res = await fetch(`/api/memory/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content }),
        });

        if (!res.ok) throw new Error();

        const updated = await res.json();
        setItems((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );

        originalDraftRef.current = draft;
        setMode("view");
      }

      if (mode === "create") {
        const res = await fetch(`/api/memory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            workspace_id: workspaceId,
            content,
            memory_type: "fact",
          }),
        });

        if (!res.ok) throw new Error();

        const created = await res.json();
        setItems((prev) => [created, ...prev]);
        setSelectedId(created.id);
        originalDraftRef.current = draft;
        setMode("view");
      }
    } catch {
      setSaveError("Failed to save memory.");
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------
     Delete (robust: always sync with backend)
  ------------------------------------------------------------ */
  async function handleDelete() {
    if (!selected?.id) return;

    const memoryId = selected.id;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this memory?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/memory/${memoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const resp = await res.json();
      // Developer trace
      // eslint-disable-next-line no-console
      console.log("Delete response", res.status, resp);
      if (!res.ok) throw new Error(resp.error || "Unknown error");

      // Always reload from backend after delete to prevent state drift
      await loadMemories();
      setSelectedId("");
      setDraft("");
      setMode("view");
      setDeleteError(null);
    } catch (err) {
      setDeleteError("Failed to delete memory.");
    }
  }

  /* ------------------------------------------------------------
     Render
  ------------------------------------------------------------ */
  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-8 py-4 border-b border-neutral-800 flex gap-2">
        <select
          value={selectedId}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={loading}
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-md p-2 text-sm"
        >
          <option value="">Select a memory?</option>
          {items.map((m) => (
            <option key={m.id} value={m.id}>
              {typeof m.content === "string"
                ? m.content.slice(0, 60)
                : "[Structured memory]"}
            </option>
          ))}
        </select>

        <button
          onClick={handleNew}
          className="px-3 py-2 text-sm rounded bg-neutral-800 hover:bg-neutral-700"
        >
          New
        </button>
      </div>

      <div className="flex-1 p-6">
        {(!selected && mode !== "create") ? (
          <div className="text-sm text-neutral-500">
            Select or create a memory
          </div>
        ) : (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={mode === "view"}
            className="w-full h-full resize-none bg-neutral-950 border border-neutral-800 rounded-md p-4 text-sm"
          />
        )}
      </div>

      {(mode === "edit" || mode === "create") && (
        <div className="px-6 py-3 border-t border-neutral-800 flex justify-between">
          <div className="text-xs text-red-400">{saveError}</div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm rounded bg-blue-600"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}

      {mode === "view" && selected && (
        <div className="px-6 py-3 border-t border-neutral-800 flex gap-2">
          <button
            onClick={() => setMode("edit")}
            className="px-3 py-1.5 text-sm rounded bg-neutral-800"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm rounded bg-red-700"
          >
            Delete
          </button>
          <div className="flex-1 text-xs text-red-400">{deleteError}</div>
        </div>
      )}
    </div>
  );
}
