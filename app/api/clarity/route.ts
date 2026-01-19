// app/api/clarity/route.ts
import OpenAI from 'openai';

export const runtime = 'edge';

function lensInstruction(lens: string | null) {
  switch (lens) {
    case 'create':
      return 'Lens: Create. Turn the idea into form. Organize as steps to build.';
    case 'next':
      return 'Lens: Next Steps. Move from clarity to action — concrete, prioritized steps.';
    case 'red':
      return 'Lens: Red Team. Probe assumptions, risks, tripwires, and failure modes.';
    default:
      return 'Lens: None. Provide a neutral clarity brief.';
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://studio.moralclarity.ai',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { input, history = [], ministry = true, lens = null, attachments = [] } = await req.json();

    const sys = [
      'You are Moral Clarity • Dialogue.',
      ministry
        ? 'Ministry Mode: engaged. Keep a steady, charitable tone. Faith sharpens reason.'
        : 'Ministry Mode: off. Neutral, secular tone only.',
      lensInstruction(lens),
      'Output plain text. Keep paragraphs tight. Prefer bullets for steps. Avoid markdown headings.',
    ].join(' ');

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: sys },
      ...history,
      {
        role: 'user',
        content:
          attachments?.length
            ? `${input}\n\nAttachments:\n${attachments.map((a: any) => `- ${a.name} (${a.type || 'file'})`).join('\n')}`
            : input,
      },
    ];

    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      temperature: 0.7,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices?.[0]?.delta?.content || '';
            if (token) controller.enqueue(encoder.encode(token));
          }
        } catch {
          controller.enqueue(encoder.encode('\n[stream-error]\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': 'https://studio.moralclarity.ai',
      },
    });
  } catch {
    return new Response('Server error', {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': 'https://studio.moralclarity.ai' },
    });
  }
}
