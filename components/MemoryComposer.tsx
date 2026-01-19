"use client";

import { useState, useRef } from "react";

export default function MemoryComposer({ workspaceId }: { workspaceId: string }) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("note");

  async function save() {
    const body = {
      content,
      title,
      purpose,
      workspace_id: workspaceId,
    };

    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setContent("");
    setTitle("");
    window.location.reload();
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-6 bg-neutral-900/40">
      <input
        className="w-full mb-3 px-3 py-2 rounded-md bg-black/40 border border-neutral-700"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full px-3 py-2 rounded-md bg-black/40 border border-neutral-700 h-32"
        placeholder="Write a memory..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex items-center gap-4 mt-3">
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="px-3 py-2 rounded-md bg-black/40 border border-neutral-700 text-sm"
        >
          <option value="fact">Fact</option>
          <option value="context">Context</option>
          <option value="preference">Preference</option>
          <option value="note">Note</option>
          <option value="episode">Episode</option>
        </select>

        <button
          onClick={save}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}
