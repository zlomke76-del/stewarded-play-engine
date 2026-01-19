import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getOpenAI } from './openai';

export type OrchestratorInput = {
  personaName: string;
  personaSystemPrompt: string;
  personaStyle: string;
  boundaries: string;
  faithLensPrompt: string;
  userMessage: string;
  model?: string;
  temperature?: number;
};

export async function answerOrchestrator(input: OrchestratorInput) {
  const {
    personaName,
    personaSystemPrompt,
    personaStyle,
    boundaries,
    faithLensPrompt,
    userMessage,
    model = 'gpt-4o-mini',
    temperature = 0.3,
  } = input;

  const openai = await getOpenAI();

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `[PERSONA: ${personaName}]
${personaSystemPrompt}
Style: ${personaStyle}`,
    },
    { role: 'system', content: boundaries },
    { role: 'system', content: faithLensPrompt },
    { role: 'user', content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model,
    temperature,
    messages,
  });

  return { answer: completion.choices?.[0]?.message?.content ?? '' };
}
