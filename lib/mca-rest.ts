// lib/mca-rest.ts
// REST helpers for the mca schema. Clean, TS-safe, and build-friendly.

export type MemoryListRow = {
  id: string;
  title: string | null;
  created_at: string;
  workspace_id: string;
};

export type MemoryDetailRow = {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  workspace_id: string;
};

export type WorkspaceRow = {
  id: string;
  name: string | null;
  owner_uid: string;
  created_at: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

// ---------- low-level helpers ----------
async function restGet<T = unknown>(path: string, query: string): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${path}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST GET ${path} (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function restPost<T = unknown>(
  path: string,
  body: unknown,
  useService = false
): Promise<T> {
  const key = useService ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST POST ${path} (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function restPatch<T = unknown>(
  path: string,
  query: string,
  body: unknown
): Promise<T> {
  const key = SUPABASE_SERVICE_ROLE_KEY;
  const url = `${SUPABASE_URL}/rest/v1/${path}?${query}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST PATCH ${path} (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function restDelete(path: string, query: string): Promise<void> {
  const key = SUPABASE_SERVICE_ROLE_KEY;
  const url = `${SUPABASE_URL}/rest/v1/${path}?${query}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      Prefer: "return=minimal",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST DELETE ${path} (${res.status}): ${text}`);
  }
}

// ---------- public API: memories ----------
export async function listMemories(workspaceId: string): Promise<MemoryListRow[]> {
  const path = "mca.memories";
  const query = new URLSearchParams({
    workspace_id: `eq.${workspaceId}`,
    select: "id,title,created_at,workspace_id",
    order: "created_at.desc",
    limit: "50",
  }).toString();
  return restGet<MemoryListRow[]>(path, query);
}

export async function getMemoryById(id: string): Promise<MemoryDetailRow | null> {
  const path = "mca.memories";
  const query = new URLSearchParams({
    id: `eq.${id}`,
    select: "id,title,content,created_at,workspace_id",
    limit: "1",
  }).toString();
  const rows = await restGet<MemoryDetailRow[]>(path, query);
  return rows[0] ?? null;
}

export async function createMemory(
  workspaceId: string,
  title: string,
  content?: string
): Promise<MemoryDetailRow> {
  const path = "mca.memories";
  const payload = [{ workspace_id: workspaceId, title, ...(content ? { content } : {}) }];
  const rows = await restPost<MemoryDetailRow[]>(path, payload, true); // service role
  return rows[0];
}

export async function updateMemory(
  id: string,
  updates: { title?: string; content?: string | null }
): Promise<MemoryDetailRow> {
  const path = "mca.memories";
  const query = new URLSearchParams({ id: `eq.${id}` }).toString();
  const rows = await restPatch<MemoryDetailRow[]>(path, query, updates);
  return rows[0];
}

export async function deleteMemory(id: string): Promise<void> {
  const path = "mca.memories";
  const query = new URLSearchParams({ id: `eq.${id}` }).toString();
  await restDelete(path, query);
}

// ---------- public API: workspaces ----------
export async function listWorkspacesForUser(userId: string): Promise<WorkspaceRow[]> {
  const path = "mca.workspaces";
  const query = new URLSearchParams({
    owner_uid: `eq.${userId}`,
    select: "id,name,owner_uid,created_at",
    order: "created_at.asc",
    limit: "25",
  }).toString();
  return restGet<WorkspaceRow[]>(path, query);
}
// --- Single workspace (read) ---
export async function getWorkspaceById(id: string): Promise<WorkspaceRow | null> {
  const path = "mca.workspaces";
  const query = new URLSearchParams({
    id: `eq.${id}`,
    select: "id,name,owner_uid,created_at",
    limit: "1",
  }).toString();
  const rows = await restGet<WorkspaceRow[]>(path, query);
  return rows[0] ?? null;
}

