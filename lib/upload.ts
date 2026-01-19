"use client";

import { supabase } from "@/lib/supabase/browser";

/**
 * Uploads a File to the `uploads` bucket under:
 *   userId/timestamp_filename
 * and returns { key, url }
 */
export async function uploadToUploads(
  file: File,
  userId: string = "anon"
): Promise<{ key: string; url: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/\s+/g, "_");
  const key = `${userId}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(key, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file.type,
    });

  if (error) {
    console.error("[uploadToUploads] upload error:", error);
    throw error;
  }

  const { data } = supabase.storage
    .from("uploads")
    .getPublicUrl(key);

  return {
    key,
    url: data.publicUrl,
  };
}
