// server/crypto.ts
import crypto from "crypto";

function getMasterKey(): Buffer {
  const b64 = process.env.MCAI_MASTER_KEY_BASE64;
  if (!b64) throw new Error("MCAI_MASTER_KEY_BASE64 is not set");
  const raw = Buffer.from(b64, "base64");
  if (raw.length !== 32) throw new Error("MCAI_MASTER_KEY_BASE64 must decode to 32 bytes");
  return raw;
}

export function aesGcmEncryptRaw(key: Buffer, plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function aesGcmDecryptRaw(key: Buffer, payload: { ciphertext: string; iv: string; tag: string }) {
  const iv = Buffer.from(payload.iv, "base64");
  const ct = Buffer.from(payload.ciphertext, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/**
 * Wrap a workspace key (32 bytes) with the master key (AES-GCM).
 * Returns a compact string: "local:<base64-json>"
 */
export function wrapWorkspaceKeyLocal(workspaceKey: Buffer): string {
  const master = getMasterKey();
  const wrapped = aesGcmEncryptRaw(master, workspaceKey.toString("base64"));
  const payload = Buffer.from(JSON.stringify(wrapped)).toString("base64");
  return `local:${payload}`;
}

/**
 * Unwrap a workspace key string.
 * Supports:
 *  - "local:<base64-json>"  (local AES-GCM with MCAI_MASTER_KEY_BASE64)
 *  - "plain:<base64key>"    (dev only; not for prod)
 *  - "env:VARNAME"          (reads base64 key from env var VARNAME)
 */
export function unwrapWorkspaceKey(keyRef: string): Buffer {
  if (keyRef.startsWith("local:")) {
    const payloadB64 = keyRef.slice("local:".length);
    const json = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    const master = getMasterKey();
    const keyB64 = aesGcmDecryptRaw(master, json);
    const key = Buffer.from(keyB64, "base64");
    if (key.length !== 32) throw new Error("Unwrapped workspace key must be 32 bytes");
    return key;
  }
  if (keyRef.startsWith("plain:")) {
    const key = Buffer.from(keyRef.slice("plain:".length), "base64");
    if (key.length !== 32) throw new Error("plain: key must be 32 bytes");
    return key;
  }
  if (keyRef.startsWith("env:")) {
    const varName = keyRef.slice("env:".length);
    const b64 = process.env[varName];
    if (!b64) throw new Error(`Env var ${varName} not found`);
    const key = Buffer.from(b64, "base64");
    if (key.length !== 32) throw new Error(`Env var ${varName} must be a 32-byte base64 key`);
    return key;
  }
  throw new Error("Unsupported key_ref format");
}
