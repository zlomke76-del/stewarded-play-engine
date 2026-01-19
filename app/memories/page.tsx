// app/memories/page.tsx
// Server component: redirects user to their first workspace’s memory page

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { listWorkspacesForUser } from "@/lib/mca-rest";

// Force Node runtime so Supabase SSR libs don't trip Edge warnings
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MemoriesLanding() {
  // Create a Supabase server client using the SSR cookie adapter
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          // Next.js server components do not expose request headers directly,
          // but Supabase SSR will read cookies from the environment correctly.
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Keep type safe & not inferred as never[]
  type WorkspacesReturn = Awaited<ReturnType<typeof listWorkspacesForUser>>;
  let workspaces: WorkspacesReturn = [];

  try {
    workspaces = await listWorkspacesForUser(user.id);
  } catch {
    // ignore; fall through
  }

  const targetWsId = (workspaces as any[])[0]?.id as string | undefined;

  if (!targetWsId) {
    redirect("/welcome");
  }

  redirect(`/w/${targetWsId}/memory`);
}
