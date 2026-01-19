"use client";

import { useCallback, useState } from "react";
import { MCA_WORKSPACE_ID } from "@/lib/mca-config";
import type { SolaceFile } from "@/app/components/useSolaceAttachments";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
};

type UseSolaceChatArgs = {
  ministryOn: boolean;
  modeHint: string;
  userKey: string;
  clearPending: () => void;
  getPendingFiles: () => SolaceFile[]; // 🔒 REQUIRED
};

export function useSolaceChat({
  ministryOn,
  modeHint,
  userKey,
  clearPending,
  getPendingFiles,
}: UseSolaceChatArgs) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Ready when you are." },
  ]);
  const [streaming, setStreaming] = useState(false);

  const send = useCallback(
    async (input: string) => {
      if ((!input.trim() && getPendingFiles().length === 0) || streaming) return;

      const userMsg = input.trim();
      const attachments = getPendingFiles();

      setStreaming(true);

      if (userMsg) {
        setMessages((m) => [...m, { role: "user", content: userMsg }]);
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMsg,
            history: messages,
            workspaceId: MCA_WORKSPACE_ID,
            ministryMode: ministryOn,
            modeHint,
            userKey,

            // 🔒 RESTORED — ATTACHMENTS ENTER THE SYSTEM
            attachments: attachments.map((f) => ({
              name: f.name,
              type: f.type,
              mime: f.mime,
              url: f.url,
              size: f.size,
            })),
          }),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "Request failed");
        }

        const data = await res.json();

        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.text ?? "" },
        ]);
      } catch (err: any) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `⚠️ ${err.message || "Error"}`,
          },
        ]);
      } finally {
        setStreaming(false);
        clearPending();
      }
    },
    [
      messages,
      ministryOn,
      modeHint,
      userKey,
      streaming,
      clearPending,
      getPendingFiles,
    ]
  );

  return {
    messages,
    setMessages,
    streaming,
    send,
  };
}
