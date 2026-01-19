// helpers/vision.ts
export async function runVision({
  prompt,
  imageUrl,
  userKey,
}: {
  prompt: string;
  imageUrl: string;
  userKey: string;
}) {
  const res = await fetch("/api/solace/vision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Key": userKey,
    },
    body: JSON.stringify({ prompt, imageUrl }),
  });

  const data = await res.json();
  return data.answer ?? "";
}
