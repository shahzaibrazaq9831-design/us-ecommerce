import "server-only";
import { getAdminSession } from "@/lib/admin-session";

/** API routes answer with 401 instead of redirecting to the sign-in page. */
export async function requireAdminApi(): Promise<
  { ok: true; email: string } | { ok: false; response: Response }
> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: Response.json({ error: "Not signed in" }, { status: 401 }),
    };
  }
  return { ok: true, email: session.email };
}
