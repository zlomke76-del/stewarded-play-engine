"use client";

import type { MemoryRecord, MemoryContent } from "./types";

type Props = {
  items: MemoryRecord[];
  selectedId: string | null;
  onSelect: (record: MemoryRecord) => void;
  loading?: boolean;
  error?: string | null;
  refetch?: () => void;
};

function renderPreview(content: MemoryContent): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") return "[Structured memory]";
  return "";
}

export default function MemoryIndexPanel({
  items,
  selectedId,
  onSelect,
  loading,
  error,
  refetch,
}: Props) {
  if (loading) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>;
  }
  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">
        {error}
        {refetch && (
          <button
            className="ml-4 px-2 py-1 bg-blue-700 text-white rounded"
            onClick={refetch}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <ul className="divide-y divide-neutral-800">
        {items.map((m) => {
          const active = m.id === selectedId;
          return (
            <li
              key={m.id}
              onClick={() => onSelect(m)}
              className={`cursor-pointer px-4 py-3 ${
                active
                  ? "bg-neutral-900 text-white"
                  : "hover:bg-neutral-900/60 text-neutral-300"
              }`}
            >
              <div className="truncate text-sm">{renderPreview(m.content)}</div>
              <div className="mt-1 text-xs text-neutral-500">
                {new Date(m.updated_at).toLocaleString()}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
