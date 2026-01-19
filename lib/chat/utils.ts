// lib/chat/utils.ts

import type { ChatMessage } from "./types";

/**
 * Keep the conversation short for system prompts / backend calls.
 * We keep the last N user+assistant messages (by turns).
 */
export function trimConversation(messages: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  // A "turn" is roughly (user + assistant), so 5 turns ≈ 10 messages.
  const MAX_TURNS = 5;
  const limit = MAX_TURNS * 2;

  if (messages.length <= limit) return messages;

  return messages.slice(-limit);
}

/**
 * Wrap a promise with a hard timeout.
 * If the timeout triggers first, it rejects with "Request timed out".
 */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error("Request timed out"));
    }, ms);

    p.then((value) => {
      clearTimeout(id);
      resolve(value);
    }).catch((err) => {
      clearTimeout(id);
      reject(err);
    });
  });
}
