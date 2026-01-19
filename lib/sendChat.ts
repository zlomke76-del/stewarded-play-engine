// lib/sendChat.ts
import { MCA_USER_KEY } from '@/lib/mca-config';

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type SendChatOpts = {
  messages: ChatMessage[];
  filters?: string[];          // ['abrahamic', 'guidance'] etc.
  stream?: boolean;
  attachments?: Array<{ name: string; url: string; type?: string }>;
  ministry?: boolean;          // overrides ministry layer (optional)
  lastModeHeader?: 'Create' | 'Next' | 'Red' | string; // optional routing hint
  userId?: string | null;      // optional
  userName?: string | null;    // optional
};

export async function sendChat(opts: SendChatOpts) {
  const {
    messages,
    filters = [],
    stream = false,
    attachments = [],
    ministry,
    lastModeHeader,
    userId = null,
    userName = null,
  } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // This is the critical bit: persist memory per user key
    'X-User-Key': MCA_USER_KEY,
  };
  if (lastModeHeader) headers['X-Last-Mode'] = String(lastModeHeader);

  // Non-stream (JSON response)
  if (!stream) {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        filters,
        attachments,
        ministry,
        userId,
        userName,
        stream: false,
      }),
    });
    if (!r.ok) throw new Error(`chat ${r.status}: ${await r.text().catch(() => '')}`);
    return r.json() as Promise<{
      text: string;
      model: string;
      identity: string;
      mode?: string;
      filters?: string[];
    }>;
  }

  // Streamed text (SSE or raw text)
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      filters,
      attachments,
      ministry,
      userId,
      userName,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`chat stream ${res.status}: ${await res.text().catch(() => '')}`);
  }
  return res.body; // ReadableStream<Uint8Array>
}
