// app/components/sendWithVision.ts

// ---------------------------------------------------------------------
// Types (self-contained to avoid missing imports during refactors)
// ---------------------------------------------------------------------
export type PendingFile = {
  name: string;
  mime: string;
  url: string;
};

type SendArgs = {
  userMsg: string;
  pendingFiles: PendingFile[];
  userKey?: string;
  workspaceId: string;
  conversationId: string;
  ministryOn: boolean;
  modeHint?: string;
};

// ---------------------------------------------------------------------
// Intent detection — VISION ONLY RUNS WHEN USER ASKS FOR IT
// Upload = consent
// Vision = intent
// ---------------------------------------------------------------------
function detectsImageIntent(text: string): boolean {
  if (!text) return false;

  const t = text.toLowerCase();

  return (
    t.includes("read") ||
    t.includes("summarize") ||
    t.includes("analyze") ||
    t.includes("what does this say") ||
    t.includes("what is in this image") ||
    t.includes("extract") ||
    t.includes("ocr") ||
    t.includes("transcribe")
  );
}

// ---------------------------------------------------------------------
// Vision-aware send helper
// ---------------------------------------------------------------------
export async function sendWithVision({
  userMsg,
  pendingFiles,
  userKey,
  workspaceId,
  conversationId,
  ministryOn,
  modeHint,
}: SendArgs) {
  // Collect vision responses separately so the caller
  // can decide how to inject them into messages[]
  const visionResults: {
    imageUrl: string;
    answer: string;
  }[] = [];

  // ---------------- Vision pass (images ONLY if intent is explicit) ----------------
  const imageFiles = detectsImageIntent(userMsg)
    ? pendingFiles.filter((f) => f.mime.startsWith("image/"))
    : [];

  for (const img of imageFiles) {
    const visionRes = await fetch("/api/solace/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: img.url,
        prompt: userMsg,
      }),
    });

    if (!visionRes.ok) {
      continue; // vision failure should not block chat
    }

    const visionData = await visionRes.json();

    if (visionData?.answer) {
      visionResults.push({
        imageUrl: img.url,
        answer: visionData.answer,
      });
    }
  }

  // ---------------- Main chat request (attachments always included) ----------------
  const chatRes = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userMsg,
      canonicalUserKey: userKey || undefined,
      workspaceId,
      conversationId,
      ministryMode: ministryOn,
      modeHint,
      attachments: pendingFiles,
    }),
  });

  if (!chatRes.ok) {
    throw new Error(`Chat request failed: ${chatRes.status}`);
  }

  const chatPayload = await chatRes.json();

  return {
    visionResults,
    chatPayload,
  };
}
