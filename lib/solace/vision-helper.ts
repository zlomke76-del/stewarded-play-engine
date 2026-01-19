// lib/solace/vision-helper.ts

export type VisionRequest = {
  prompt: string;
  imageUrl: string;
  userKey?: string;
};

export type VisionResponse = {
  text: string;
  imageUrl?: string | null;
};

export async function runVision(
  req: VisionRequest
): Promise<VisionResponse> {
  const res = await fetch("/api/solace/vision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(req.userKey ? { "X-User-Key": req.userKey } : {}),
    },
    body: JSON.stringify({
      prompt: req.prompt,
      imageUrl: req.imageUrl,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Vision HTTP ${res.status}: ${t}`);
  }

  const data = await res.json();

  return {
    text: data.answer ?? "",
    imageUrl: null,
  };
}
