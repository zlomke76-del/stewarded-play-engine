// lib/memory-utils.ts
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

type AnySB = SupabaseClient<any>;

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const PREFIX = 'enc:v1:';

function mca(supa: AnySB) {
  return (supa as unknown as SupabaseClient<any>).schema('mca');
}

async function getOrCreateKey(
  supa: AnySB,
  workspaceId: string
): Promise<Buffer> {
  const { data } = await mca(supa)
    .from('workspace_keys')
    .select('key_b64')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (data?.key_b64) {
    return Buffer.from(data.key_b64, 'base64');
  }

  const key = crypto.randomBytes(KEY_BYTES);
  const key_b64 = key.toString('base64');

  const { error } = await mca(supa)
    .from('workspace_keys')
    .insert({ workspace_id: workspaceId, key_b64 });

  if (error) {
    const { data: retry } = await mca(supa)
      .from('workspace_keys')
      .select('key_b64')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (!retry?.key_b64) throw error;
    return Buffer.from(retry.key_b64, 'base64');
  }

  return key;
}

export async function initWorkspaceKey(
  supa: AnySB,
  workspaceId: string
) {
  const key = await getOrCreateKey(supa, workspaceId);
  return { workspaceId, keyBytes: key.length, alg: 'AES-256-GCM' };
}

export async function encryptIfNeeded(
  supa: AnySB,
  workspaceId: string,
  plaintext: string
) {
  const key = await getOrCreateKey(supa, workspaceId);
  const iv = crypto.randomBytes(IV_BYTES);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, ct, tag]);
  return {
    storedContent: PREFIX + payload.toString('base64'),
    isEncrypted: true,
  };
}

export async function decryptIfPossible(
  supa: AnySB,
  workspaceId: string,
  storedContent: string
) {
  if (!storedContent?.startsWith(PREFIX)) {
    return { plaintext: storedContent ?? '', wasEncrypted: false };
  }

  const key = await getOrCreateKey(supa, workspaceId);
  const payload = Buffer.from(
    storedContent.slice(PREFIX.length),
    'base64'
  );

  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(payload.length - TAG_BYTES);
  const ct = payload.subarray(IV_BYTES, payload.length - TAG_BYTES);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);

  return { plaintext: pt.toString('utf8'), wasEncrypted: true };
}
