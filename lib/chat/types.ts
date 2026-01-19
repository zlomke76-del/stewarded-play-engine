// lib/chat/types.ts

export type ChatRole = 'user' | 'assistant' | 'system' | string;

export type ChatMessage = {
  role: ChatRole;
  content: string;
};
