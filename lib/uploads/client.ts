// lib/uploads/client.ts
'use client';

import { bucket } from '@/lib/storage';
import type { UploadAttachment, UploadError, UploadResult } from './types';

const DEFAULT_BUCKET = 'attachments';

function getBucket() {
  // If you ever want per-workspace buckets, change it here only.
  return bucket(DEFAULT_BUCKET);
}

function inferMimeFromName(name: string): string {
  const n = (name || '').toLowerCase();

  if (n.endsWith('.txt')) return 'text/plain';
  if (n.endsWith('.md') || n.endsWith('.markdown')) return 'text/markdown';
  if (n.endsWith('.json')) return 'application/json';
  if (n.endsWith('.csv')) return 'text/csv';
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.doc')) return 'application/msword';

  // Basic image types (common clipboard pastes)
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';

  return 'application/octet-stream';
}

function resolveContentType(f: File | Blob, fileName: string): string {
  const t = (f as any)?.type;
  if (typeof t === 'string' && t.trim().length > 0) return t;

  // Browser/OS sometimes reports "" for text files (and can misreport for clipboard sources).
  // Fall back to extension-based inference.
  return inferMimeFromName(fileName);
}

/**
 * Core uploader for File / Blob inputs.
 * This is the only place that talks to Supabase storage on the client.
 */
export async function uploadFiles(
  files: FileList | File[] | Blob[],
  opts?: { prefix?: string }
): Promise<UploadResult> {
  const b = getBucket();
  const arr = Array.from(files as any as File[]);
  const prefix = (opts?.prefix || 'uploads') + '/';

  const attachments: UploadAttachment[] = [];
  const errors: UploadError[] = [];

  for (const f of arr) {
    try {
      const fileName =
        f instanceof File ? f.name || 'pasted-image.png' : 'blob.bin';
      const safeName = encodeURIComponent(fileName.replace(/\s+/g, '_'));
      const path = `${prefix}${crypto.randomUUID()}_${safeName}`;

      const contentType = resolveContentType(f as any, fileName);

      const { error } = await b.upload(path, f as any, {
        upsert: false,
        cacheControl: '3600',
        contentType,
      });
      if (error) throw error;

      const { data } = b.getPublicUrl(path);

      attachments.push({
        name: fileName,
        url: data.publicUrl,
        type: contentType,
        size: (f as any).size ?? undefined,
      });
    } catch (e: any) {
      errors.push({
        fileName: (f as any).name || 'blob',
        message: e?.message || String(e),
      });
    }
  }

  return { attachments, errors };
}

/**
 * Convenience helper for <input type="file" /> onChange.
 */
export async function uploadFromInput(
  fileList: FileList | null,
  opts?: { prefix?: string }
): Promise<UploadResult> {
  if (!fileList || fileList.length === 0) {
    return { attachments: [], errors: [] };
  }
  return uploadFiles(fileList, opts);
}

/**
 * Paste handler: call from onPaste of your composer.
 * Automatically detects images/files in the clipboard and uploads them.
 */
export async function uploadFromPasteEvent(
  e: ClipboardEvent,
  opts?: { prefix?: string }
): Promise<UploadResult> {
  const items = e.clipboardData?.items;
  if (!items || !items.length) return { attachments: [], errors: [] };

  const blobs: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind === 'file') {
      const f = item.getAsFile();
      if (f) blobs.push(f);
    }
  }
  if (!blobs.length) return { attachments: [], errors: [] };

  return uploadFiles(blobs, opts);
}
