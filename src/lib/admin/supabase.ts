import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The service-role client. It is imported only by server code — route
 * handlers, server actions and the server-only data layer. The key is read
 * at request time from the environment and is never passed to a client
 * component or given a NEXT_PUBLIC_ prefix.
 *
 * Both names are accepted: SUPABASE_SERVICE_KEY is the documented name for
 * this dashboard, SUPABASE_SERVICE_ROLE_KEY is the name the existing store
 * already uses.
 */
let cached: SupabaseClient | null = null;

export function serviceKey(): string {
  return (
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = serviceKey();
  if (!url || !key) return null;

  if (!cached) {
    cached = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cached;
}

/** Is the server-side Supabase connection available at all? */
export function hasServiceClient(): boolean {
  return Boolean(getServiceClient());
}

/** The public project URL, used to build storage URLs on the server. */
export function supabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
}
