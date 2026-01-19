import { createServerClient } from "@supabase/ssr";

/**
 * Store a base64 PNG image in Supabase Storage
 * and return a public HTTPS URL.
 *
 * AUTHORITATIVE — replaces all prior blob logic
 */
export async function storeBase64Image(
  base64: string,
  sessionId: string,
  supabaseService: ReturnType<typeof createServerClient>
): Promise<string> {
  if (!base64.startsWith("data:image")) {
    throw new Error("Invalid base64 image payload");
  }

  const buffer = Buffer.from(
    base64.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const path = `sessions/${sessionId}/${Date.now()}.png`;

  const { error } = await supabaseService.storage
    .from("moralclarity_uploads") // ✅ existing public bucket
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) {
    console.error("[IMAGE STORE ERROR]", error);
    throw new Error("Failed to store image in Supabase");
  }

  const { data } = supabaseService.storage
    .from("moralclarity_uploads")
    .getPublicUrl(path);

  return data.publicUrl;
}
