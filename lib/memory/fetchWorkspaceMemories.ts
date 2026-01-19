// lib/memory/fetchWorkspaceMemories.ts
import { supabase } from "@/lib/supabase/browser";

export type WorkspaceMemory = {
  id: string;
  workspace_id: string;
  title: string | null;
  content: string | null;
  created_at: string;
};

export async function fetchWorkspaceMemories(workspaceId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("No active session");
  }

  const res = await fetch(
    `/api/memory/workspace?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Request failed (${res.status})`);
  }

  const json = await res.json();
  return (json.items ?? []) as WorkspaceMemory[];
}
