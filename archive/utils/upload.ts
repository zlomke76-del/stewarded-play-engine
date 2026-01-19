// utils/upload.ts
import { createSupabaseBrowser } from "@/lib/supabaseBrowser";

export async function uploadToUploads(file: File, userId?: string) {
  const supabase = createSupabaseBrowser();

  // 1) Make a unique, clean path (no leading slash)
  const safeName = file.name.replace(/[^\w.\-.]+/g, "_");
  const key = `${userId ?? "anon"}/${Date.now()}_${safeName}`;

  // 2) Upload (unique key => no conflicts)
  const { data, error } = await supabase.storage.from("uploads").upload(key, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (error) throw error;

  // 3) Public URL (bucket is public)
  const { data: pub } = supabase.storage.from("uploads").getPublicUrl(key);
  return { key, url: pub.publicUrl };
}
