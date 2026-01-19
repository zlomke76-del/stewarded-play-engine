import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function writeMemory({
  user_id,
  workspace_id,
  content,
  memory_type = "note",
  source = "user",
  weight = 1.0,
}: {
  user_id: string;
  workspace_id?: string | null;
  content: string;
  memory_type?: string;
  source?: "user" | "system" | "agent" | "import";
  weight?: number;
}) {
  const { error } = await supabase.from("memory.memories").insert({
    user_id,
    workspace_id,
    content,
    memory_type,
    source,
    weight,
  });

  if (error) {
    throw new Error(`[memory-writer] ${error.message}`);
  }
}
