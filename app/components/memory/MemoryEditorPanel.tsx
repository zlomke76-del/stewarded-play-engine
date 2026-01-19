"use client";

import { useState, useEffect } from "react";
import type { MemoryRecord } from "./types";

type Props = {
  workspaceId: string;
  record: MemoryRecord;
  onSave?: (content: string) => Promise<void> | void;
};

export default function MemoryEditorPanel({
  workspaceId,
  record,
  onSave,
}: Props) {
  const getInitialValue = () =>
    typeof record.content === "string"
      ? record.content
      : record.content
      ? JSON.stringify(record.content, null, 2)
      : "";

  const [value, setValue] = useState(getInitialValue());
  const [saving, setSaving] = useState(false);

  // Reset the text area when user switches records
  useEffect(() => {
    setValue(getInitialValue());
  }, [record]);

  async function handleSave() {
    setSaving(true);
    try {
      if (onSave) await onSave(value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full flex flex-col p-6">
      <textarea
        className="flex-1 w-full bg-neutral-900 border border-neutral-800 rounded-md p-3 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="mt-2 flex gap-2 text-xs text-neutral-600 items-center">
        Workspace: {workspaceId}
        <button
          className="ml-auto px-4 py-1 bg-blue-600 text-white rounded"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
