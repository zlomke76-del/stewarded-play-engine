// components/MemoryList.tsx
"use client";

import { useState } from "react";

type MemoryItem = {
  id: string;
  title?: string | null;
  content?: string | null;
  created_at: string;
};

type Props = {
  items: MemoryItem[];
};

const PAGE_SIZE = 10;

export default function MemoryList({ items }: Props) {
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = items.slice(start, end);

  if (!items.length) {
    return (
      <div
        data-layout-boundary="MemoryList"
        className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-400"
      >
        Nothing here yet.
      </div>
    );
  }

  return (
    <div
      data-layout-boundary="MemoryList"
      className="rounded-xl border border-neutral-800 bg-neutral-900/40"
    >
      <div className="divide-y divide-neutral-800">
        {pageItems.map((item) => {
          const isOpen = expandedId === item.id;

          return (
            <div key={item.id} className="p-4">
              <button
                onClick={() =>
                  setExpandedId(isOpen ? null : item.id)
                }
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-100">
                      {item.title || "Untitled memory"}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500">
                    {isOpen ? "Collapse" : "Expand"}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="mt-3 rounded-md border border-neutral-800 bg-black/40 p-3 text-sm text-neutral-300">
                  <pre className="whitespace-pre-wrap break-words">
                    {item.content || "(empty)"}
                  </pre>

                  <div className="mt-3 flex gap-3">
                    <button className="text-xs text-blue-400 hover:underline">
                      Edit
                    </button>
                    <button className="text-xs text-red-400 hover:underline">
                      Deactivate
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800 text-xs text-neutral-400">
        <div>
          Showing {start + 1}–{Math.min(end, items.length)} of{" "}
          {items.length}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2 py-1 rounded border border-neutral-700 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={end >= items.length}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded border border-neutral-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
