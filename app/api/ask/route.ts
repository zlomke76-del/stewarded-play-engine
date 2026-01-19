// app/api/ask/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { answerOrchestrator } from '@/lib/answerOrchestrator';

// --- Config (server envs only) ---
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server only

// Guardrails
const BOUNDARIES = [
  'Provide truthful, neutral, concise answers.',
  'Do not invent facts; if uncertain, say so.',
  'If a faith lens is active, add that perspective AFTER the neutral answer, briefly.',
  'Do not impersonate divine or historical figures.',
  'Medical/legal: provide general info only; suggest consulting a professional.',
].join('\n');

// Faith lens builder
function buildFaithLensPrompt(
  lens: 'neutral' | 'ministry',
  scriptureVersion = 'ESV'
) {
  if (lens === 'neutral') {
    return [
      'FAITH LENS: OFF.',
      'Provide only neutral, fact-based guidance. Do not add Scripture or religious framing unless explicitly requested.',
    ].join('\n');
  }
  return [
    'FAITH LENS: MINISTRY MODE.',
    'After the neutral answer, add a short faith-informed perspective.',
    `When you cite Scripture, use concise references (e.g., Ps 1; Prov 3:5–6; Mt 5) in ${scriptureVersion}.`,
    'Avoid doctrinal debates unless the user asks. Do not give medical or legal advice; suggest professional help when relevant.',
  ].join('\n');
}

// Supabase server client
function sbServer() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, threadId } = await req.json();

    if (!message || typeof message !== 'string') {
      return Response.json({ ok: false, error: 'Missing message' }, { status: 400 });
    }

    const sb = sbServer();

    // TEMP: fallback for local/dev auth
    const { data: auth } = await sb.auth.getUser().catch(() => ({ data: { user: null } as any }));
    const userId =
      auth?.user?.id ??
      (process.env.VERCEL_ENV !== 'production' ? process.env.DEV_USER_ID : null);

    if (!userId) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // --- Load user settings ---
    const { data: settings } = await sb
      .from('user_settings')
      .select('faith_lens, scripture_version, apply_faith_globally')
      .eq('user_id', userId)
      .maybeSingle();

    const scriptureVersion = settings?.scripture_version ?? 'ESV';

    // --- Load thread (persona + optional lens override) ---
    let personaSlug = 'neutral-analyst';
    let lensOverride: string | null = null;

    if (threadId) {
      const { data: thread } = await sb
        .from('threads')
        .select('persona_slug, faith_lens_override')
        .eq('id', threadId)
        .maybeSingle();

      if (thread) {
        personaSlug = thread.persona_slug ?? personaSlug;
        lensOverride = thread.faith_lens_override ?? null;
      }
    }

    // --- Resolve persona ---
    const { data: persona } = await sb
      .from('personas')
      .select('slug, name, system_prompt, style')
      .eq('slug', personaSlug)
      .maybeSingle();

    const personaName = persona?.name ?? 'Neutral Analyst';
    const personaSystemPrompt =
      persona?.system_prompt ??
      'You provide concise, fact-first, neutral answers. Cite or say "unknown." Offer options and next steps.';
    const personaStyle = persona?.style ?? 'Direct, calm, practical.';

    // --- Determine active faith lens ---
    const baseLens =
      (settings?.apply_faith_globally ? settings?.faith_lens : 'neutral') ?? 'neutral';
    const activeLens =
      (lensOverride as 'neutral' | 'ministry') ?? (baseLens as 'neutral' | 'ministry');

    // --- Compose faith-lens prompt ---
    const faithLensPrompt = buildFaithLensPrompt(activeLens, scriptureVersion);

    // --- Call orchestrator ---
    const { answer } = await answerOrchestrator({
      personaName,
      personaSystemPrompt,
      personaStyle,
      boundaries: BOUNDARIES,
      faithLensPrompt,
      userMessage: message,
    });

    // --- Save messages if thread exists ---
    if (threadId) {
      await sb.from('messages').insert([
        { thread_id: threadId, role: 'user', content: message },
        { thread_id: threadId, role: 'assistant', content: answer },
      ]);
    }

    return Response.json({
      ok: true,
      answer,
      meta: {
        persona: personaSlug,
        faith_lens: activeLens,
        scripture_version: scriptureVersion,
      },
    });
  } catch (e: any) {
    console.error(e);
    return Response.json(
      { ok: false, error: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
