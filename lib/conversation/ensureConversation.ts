"use client";

import { supabase } from "@/lib/supabase/browser";

export async function ensureConversation(userKey: string) {
  // Ask server to create or reuse an active conversation
  const res = await fetch("/api/chat/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userKey }),
  });

  if (!res.ok) {
    throw new Error("Failed to initialize conversation");
  }

  const data = await res.json();

  if (!data.conversationId) {
    throw new Error("Conversation ID missing from response");
  }

  return data.conversationId as string;
}
