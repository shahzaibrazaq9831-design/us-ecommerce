import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use on the server: Server Components,
 * Server Actions, and Route Handlers.
 *
 * A new client is created for every request so it reads that request's
 * cookies. `cookies()` is asynchronous in Next.js 15+.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. This can be ignored
            // when the proxy refreshes sessions; otherwise, use this client
            // from a Server Action or Route Handler.
          }
        },
      },
    }
  );
}
