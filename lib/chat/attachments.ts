// lib/chat/attachments.ts

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export type Attachment = {
  name: string;
  url: string;
  type?: string;
};

async function fetchAttachmentAsText(att: Attachment): Promise<string> {
  const res = await fetch(att.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const ct = (res.headers.get('content-type') || att.type || '').toLowerCase();

  // ------------------------------------------------------------
  // PDF
  // ------------------------------------------------------------
  if (ct.includes('pdf') || /\.pdf(?:$|\?)/i.test(att.name)) {
    const buf = Buffer.from(await res.arrayBuffer());
    const out = await pdfParse(buf);
    return out.text || '';
  }

  // ------------------------------------------------------------
  // DOCX
  // ------------------------------------------------------------
  if (
    ct.includes('word') ||
    ct.includes('officedocument') ||
    /\.docx(?:$|\?)/i.test(att.name)
  ) {
    const buf = Buffer.from(await res.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value || '';
  }

  // ------------------------------------------------------------
  // Plain / structured text
  // ------------------------------------------------------------
  if (
    ct.includes('text/') ||
    ct.includes('json') ||
    ct.includes('csv') ||
    /\.(?:txt|md|csv|json)$/i.test(att.name)
  ) {
    return await res.text();
  }

  // ------------------------------------------------------------
  // Fallback
  // ------------------------------------------------------------
  return `[Unsupported file type: ${att.name} (${ct || 'unknown'})]`;
}

function clampText(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n) + '\n[...truncated...]';
}

/**
 * Core attachment ingestion used by the chat orchestrator.
 */
export async function processAttachments(
  attachments: Attachment[],
  opts?: { maxPerFile?: number; maxTotal?: number }
): Promise<string> {
  if (!attachments || attachments.length === 0) return '';

  const MAX_PER_FILE = opts?.maxPerFile ?? 200_000;
  const MAX_TOTAL = opts?.maxTotal ?? 350_000;

  const parts: string[] = [];
  let total = 0;

  for (const att of attachments) {
    try {
      const raw = await fetchAttachmentAsText(att);
      if (!raw || raw.trim().length === 0) {
        parts.push(
          `\n--- Attachment: ${att.name}\n[No readable text extracted]`
        );
        continue;
      }

      const clipped = clampText(raw, MAX_PER_FILE);

      const block =
        `\n--- Attachment: ${att.name}\n` +
        `(source: ${att.url})\n` +
        '```\n' +
        clipped +
        '\n```\n';

      if (total + block.length > MAX_TOTAL) {
        parts.push('\n--- [Skipping remaining attachments: token cap reached]');
        break;
      }

      parts.push(block);
      total += block.length;
    } catch (e: any) {
      parts.push(
        `\n--- Attachment: ${att.name}\n[Error reading file: ${e?.message || String(e)}]`
      );
    }
  }

  if (parts.length === 0) return '';

  return (
    `\n\nATTACHMENT DIGEST\n` +
    `The user provided ${attachments.length} attachment(s). Use the content below in your analysis.\n` +
    parts.join('')
  );
}

/**
 * Backwards-compatible alias.
 */
export async function buildAttachmentSection(
  attachments: Attachment[]
): Promise<string> {
  return processAttachments(attachments);
}
