// lib/chat/solace-backend.ts

const SOLACE_URL = process.env.SOLACE_API_URL || '';
const SOLACE_KEY = process.env.SOLACE_API_KEY || '';

/**
 * Non-streaming call to the Solace backend.
 *
 * Accepts an arbitrary payload (matching what /app/api/chat sends),
 * forces `stream: false`, and returns the text response.
 */
export async function solaceNonStream(payload: any): Promise<string> {
  if (!SOLACE_URL || !SOLACE_KEY) {
    throw new Error('[solace-backend] Solace backend not configured');
  }

  const r = await fetch(SOLACE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SOLACE_KEY}`,
    },
    body: JSON.stringify({ ...payload, stream: false }),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`Solace ${r.status}: ${body}`);
  }

  const ct = r.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const j = await r.json().catch(() => ({}));
    // Be generous with where Solace might put the text
    return String((j as any).text ?? (j as any).output ?? (j as any).data ?? '');
  }

  return await r.text();
}

/**
 * Streaming call to the Solace backend.
 *
 * Returns a ReadableStream<Uint8Array> suitable for piping back
 * from a Next.js route handler.
 */
export async function solaceStream(payload: any): Promise<ReadableStream<Uint8Array>> {
  if (!SOLACE_URL || !SOLACE_KEY) {
    throw new Error('[solace-backend] Solace backend not configured');
  }

  const r = await fetch(SOLACE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SOLACE_KEY}`,
    },
    body: JSON.stringify({ ...payload, stream: true }),
  });

  if (!r.ok || !r.body) {
    const body = await r.text().catch(() => '');
    throw new Error(`Solace ${r.status}: ${body}`);
  }

  return r.body as ReadableStream<Uint8Array>;
}
