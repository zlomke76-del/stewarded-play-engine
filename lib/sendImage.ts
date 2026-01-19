// lib/sendImage.ts
export async function generateImage(prompt: string, size = '1024x1024') {
  const res = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, size }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.url as string;
}
