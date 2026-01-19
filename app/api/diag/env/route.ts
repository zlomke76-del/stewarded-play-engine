export const runtime = 'nodejs';

function hash(s: string | undefined) {
  if (!s) return null;
  // Simple, safe fingerprint
  const enc = new TextEncoder().encode(s);
  let h = 0;
  for (let i = 0; i < enc.length; i++) h = (h * 31 + enc[i]) | 0;
  return `len:${s.length}:h:${(h >>> 0).toString(16)}`;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const webFlag = process.env.OPENAI_WEB_ENABLED_flag || process.env.WEB_ENABLED_flag;

  return new Response(
    JSON.stringify({
      NEXT_PUBLIC_SUPABASE_URL: !!url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anon,
      OPENAI_WEB_ENABLED_flag_present: !!webFlag,
      fingerprints: {
        url: hash(url),
        anon: anon ? `startsWith:${anon.slice(0, 6)}…` : null,
        webFlag: webFlag ?? null,
      },
      runtime: 'nodejs',
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}
