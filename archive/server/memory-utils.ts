// server/memory-utils.ts
import { randomBytes, createHash, webcrypto } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/* Small helper so we can call schema('mca') even if Database lacks that schema in types */
const mca = (s: SupabaseClient<Database>) =>
  (s as unknown as SupabaseClient<any>).schema("mca");

/* =============================================================================
 * Encoding & small utils
 * ========================================================================== */

function b64urlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(b64u: string): Uint8Array {
  const pad = b64u.length % 4 === 2 ? "==" : b64u.length % 4 === 3 ? "=" : "";
  const base64 = b64u.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return new Uint8Array(Buffer.from(base64, "base64"));
}

function keyFingerprint(keyBytes: Uint8Array): string {
  const h = createHash("sha256").update(keyBytes).digest();
  return b64urlEncode(h.subarray(0, 16));
}

const subtle = webcrypto.subtle;

/* =============================================================================
 * Workspace Key Management  (schema: mca)
 * ========================================================================== */

export type InitKeyRef = {
  workspace_id: string;
  key_id: string; // non-secret id of key
};

export async function initWorkspaceKey(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<InitKeyRef> {
  if (!workspaceId) throw new Error("workspaceId is required");

  const { data: existing, error: existErr } = await mca(supabase)
    .from("workspace_keys")
    .select("workspace_id,key_id")
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();

  if (existErr) throw existErr;
  if (existing) return { workspace_id: existing.workspace_id, key_id: existing.key_id };

  const keyBytes = randomBytes(32); // 256-bit
  const key_b64url = b64urlEncode(keyBytes);
  const fingerprint = keyFingerprint(keyBytes);

  const { data: inserted, error: insErr } = await mca(supabase)
    .from("workspace_keys")
    .insert({
      workspace_id: workspaceId,
      key_b64url,
      key_id: fingerprint,
    })
    .select("workspace_id,key_id")
    .single();

  if (insErr) throw insErr;
  return { workspace_id: inserted.workspace_id, key_id: inserted.key_id };
}

/* Cache keys per workspace for the serverless lifetime */
const keyCache = new Map<string, Uint8Array>();

async function getWorkspaceKeyBytes(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<Uint8Array> {
  const cached = keyCache.get(workspaceId);
  if (cached) return cached;

  const { data, error } = await mca(supabase)
    .from("workspace_keys")
    .select("key_b64url")
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.key_b64url) {
    await initWorkspaceKey(supabase, workspaceId);
    const { data: data2, error: e2 } = await mca(supabase)
      .from("workspace_keys")
      .select("key_b64url")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle();
    if (e2) throw e2;
    if (!data2?.key_b64url) throw new Error("workspace key missing after init");
    const kb2 = b64urlDecode(data2.key_b64url);
    keyCache.set(workspaceId, kb2);
    return kb2;
  }

  const keyBytes = b64urlDecode(data.key_b64url);
  keyCache.set(workspaceId, keyBytes);
  return keyBytes;
}

/* =============================================================================
 * AES-GCM (v1)
 * ========================================================================== */

const PAYLOAD_VERSION_V1 = 0x01;

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function concatBytes(a: Uint8Array, b: Uint8Array, c: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length + c.length);
  out.set(a, 0);
  out.set(b, a.length);
  out.set(c, a.length + b.length);
  return out;
}

function textEncoder() {
  return new TextEncoder();
}
function textDecoder() {
  return new TextDecoder();
}

export async function encryptIfNeeded(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  content: string,
  sensitivity?: string // 'public' | 'restricted' | 'secret'
): Promise<{ storedContent: string; isEncrypted: boolean }> {
  const shouldEncrypt = sensitivity && sensitivity !== "public";
  if (!shouldEncrypt) return { storedContent: content, isEncrypted: false };

  const keyBytes = await getWorkspaceKeyBytes(supabase, workspaceId);
  const key = await importAesKey(keyBytes);

  const iv = randomBytes(12);
  const data = textEncoder().encode(content);
  const cipherBuf = await subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  const version = new Uint8Array([PAYLOAD_VERSION_V1]);
  const full = concatBytes(version, iv, new Uint8Array(cipherBuf));
  return { storedContent: b64urlEncode(full), isEncrypted: true };
}

export async function decryptIfPossible(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  storedContent: string
): Promise<{ plaintext: string; wasEncrypted: boolean }> {
  const bytes = b64urlDecode(storedContent);
  if (bytes.length > 0 && bytes[0] === PAYLOAD_VERSION_V1) {
    if (bytes.length < 14) throw new Error("cipher payload too short");
    const iv = bytes.subarray(1, 13);
    const cipher = bytes.subarray(13);

    const keyBytes = await getWorkspaceKeyBytes(supabase, workspaceId);
    const key = await importAesKey(keyBytes);
    const plainBuf = await subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return { plaintext: textDecoder().decode(new Uint8Array(plainBuf)), wasEncrypted: true };
  }
  return { plaintext: storedContent, wasEncrypted: false };
}

/* =============================================================================
 * Quotas (placeholder)
 * ========================================================================== */

export async function quotaOk(
  _supabase: SupabaseClient<Database>,
  _userId: string,
  incomingBytes: number
): Promise<boolean> {
  const limit = parseInt(process.env.MEMORY_QUOTA_BYTES || "", 10) || 40 * 1024 * 1024;
  return incomingBytes <= limit;
}

/* =============================================================================
 * Audit Log (schema: mca)
 * ========================================================================== */

export async function writeAudit(
  supabase: SupabaseClient<Database>,
  params: {
    action: string;
    user_id?: string | null;
    actor_uid?: string | null;
    workspace_id?: string | null;
    item_id?: string | null;
    meta?: Record<string, unknown> | null;
    details?: Record<string, unknown> | null;
  }
): Promise<void> {
  try {
    const payload = {
      action: params.action,
      user_id: params.user_id ?? params.actor_uid ?? null,
      workspace_id: params.workspace_id ?? null,
      item_id: params.item_id ?? null,
      meta: (params.details ?? params.meta) ?? null,
    };
    await mca(supabase).from("audit_log").insert(payload);
  } catch (err) {
    console.warn("writeAudit warning:", err);
  }
}

