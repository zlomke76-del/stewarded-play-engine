// components/NewMemoryDock.tsx
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Props = {
  workspaceId: string;
  // Next.js 14 server action passed from a server component
  createAction: (formData: FormData) => Promise<void>;
};

export default function NewMemoryDock({ workspaceId, createAction }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: ⌘/Ctrl + N
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => titleRef.current?.focus(), 50);
      }
      // Escape to close
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close if user clicks outside the panel
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("workspace_id", workspaceId);
      await createAction(fd); // server action
      // If it succeeds, reset and close
      e.currentTarget.reset();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        aria-label="Create new memory"
        title="New memory (⌘/Ctrl+N)"
        onClick={() => {
          setOpen(true);
          setTimeout(() => titleRef.current?.focus(), 50);
        }}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 px-5 py-3 shadow-xl
                   text-white text-sm font-semibold hover:bg-blue-500 focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-blue-400/80 transition"
      >
        + New Memory
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up panel */}
      <div
        ref={panelRef}
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl
                    rounded-t-2xl border border-neutral-800 bg-neutral-950/95
                    shadow-2xl transition-transform duration-200
                    ${open ? "translate-y-0" : "translate-y-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-memory-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 id="new-memory-title" className="text-sm font-semibold text-neutral-100">
            New memory
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-neutral-300 hover:text-white hover:bg-neutral-800"
          >
            Esc
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-3">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input
            ref={titleRef}
            name="title"
            placeholder="Title"
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2
                       text-neutral-100 placeholder:text-neutral-500 focus:outline-none
                       focus:ring-2 focus:ring-blue-500/60"
            required
          />
          <textarea
            ref={contentRef}
            name="content"
            rows={6}
            placeholder="Content…"
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2
                       text-neutral-100 placeholder:text-neutral-500 focus:outline-none
                       focus:ring-2 focus:ring-blue-500/60"
          />
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                         hover:bg-blue-500 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-neutral-800 px-4 py-2 text-sm text-neutral-200
                         hover:bg-neutral-900"
            >
              Cancel
            </button>
            <div className="ml-auto text-xs text-neutral-400">Shortcut: ⌘/Ctrl + N</div>
          </div>
        </form>
      </div>
    </>
  );
}
