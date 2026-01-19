import { cookies } from "next/headers";
import type { CookieOptions } from "@/lib/cookies";

export async function GET() {
  const cookieStore = await cookies(); // ✅ REQUIRED in Next 16

  const adapter = {
    cookies: {
      get(name: string) {
        const c = cookieStore.get(name);
        return c ? c.value : null;
      },

      set(name: string, value: string, options?: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },

      delete(name: string) {
        cookieStore.set({
          name,
          value: "",
          maxAge: 0,
        });
      },
    },
  };

  return Response.json({ ok: true, adapter });
}
