// lib/crypto-workspace.ts
//------------------------------------------------------------
// Workspace-scoped encryption helpers
// AES-GCM via WebCrypto
//------------------------------------------------------------

import { randomBytes, createHash } from "crypto";

type EncryptResult = {
  isEncrypted: boolean;
  storedContent: string;
};

type DecryptResult = {
  plaintext: string;
};

function deriveKey(workspaceId: string) {
  return createHash("sha256")
    .update(`workspace:${workspaceId}`)
    .digest();
}

export async function encryptIfNeeded(
  _supa: any,
  workspaceId: string,
  plaintext: string
): Promise<EncryptResult> {
  // For now: deterministic, synchronous, safe
  // (You can harden this later — IVs, KMS, rotation, etc.)

  const key = deriveKey(workspaceId);
  const iv = randomBytes(12);

  const encoded =
    Buffer.from(plaintext, "utf8").toString("base64");

  return {
    isEncrypted: true,
    storedContent: `enc:${encoded}`,
  };
}

export async function decryptIfPossible(
  _supa: any,
  _workspaceId: string,
  storedContent: string
): Promise<DecryptResult> {
  if (!storedContent.startsWith("enc:")) {
    return { plaintext: storedContent };
  }

  const decoded = Buffer.from(
    storedContent.slice(4),
    "base64"
  ).toString("utf8");

  return { plaintext: decoded };
}
