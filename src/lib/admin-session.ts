/**
 * Admin session — the sign-in that guards every screen under /admin.
 *
 * The session travels in one signed cookie. The payload (who signed in and
 * when the sign-in runs out) is signed with an HMAC key, so a session can
 * neither be forged nor edited in the browser. The signing itself lives in
 * `@/lib/admin-session-token`, so `proxy.ts` can check a session as well.
 *
 * Two rules shape this module:
 *
 *   1. The key and the password come from the environment
 *      (`ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD`) and are read at request
 *      time — never baked into the build. The email falls back to the studio
 *      address, which is not a secret.
 *   2. Every server action re-checks the session for itself. A check on the
 *      page does not protect the action, so `requireAdmin()` is called
 *      inside the action as well as inside the page.
 *
 * On a development machine without those variables the module falls back to
 * clearly marked development values and says so in the terminal. In
 * production a missing variable means no sign-in at all — the admin area
 * fails closed rather than open.
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { io } from "next/cache";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  isSessionConfigured,
  readSessionToken,
  safeEqual,
  type AdminSession,
} from "@/lib/admin-session-token";

export { ADMIN_SESSION_COOKIE, isSessionConfigured };
export type { AdminSession };

/** Where a signed-out admin is sent to sign in. */
export const ADMIN_LOGIN_PATH = "/admin/login";

/* ------------------------------------------------------------------ *
 * Credentials
 * ------------------------------------------------------------------ */

interface AdminCredentials {
  email: string;
  password: string;
}

/**
 * The studio address used when `ADMIN_EMAIL` is not set on the server.
 *
 * The address is not a secret — it is printed on the contact pages and shown
 * in the sign-in form — so it can safely live in the code. The password is a
 * secret and must always come from the environment. Setting `ADMIN_EMAIL` in
 * the environment still overrides this fallback.
 */
const DEFAULT_ADMIN_EMAIL = "rungebahar@gmail.com";

/** The sign-in this server accepts, or null when none is configured. */
function adminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === "production") return null;
    warnAboutDevelopmentFallback();
    return { email: DEV_EMAIL, password: DEV_PASSWORD };
  }

  return { email, password };
}

/** Is an admin sign-in configured on this server at all? */
export function isAdminConfigured(): boolean {
  return adminCredentials() !== null;
}

/**
 * The address this server accepts at sign-in.
 *
 * It is not a secret: the sign-in page shows it so an admin only has to
 * remember the password. Keeping this in one place stops the page and the
 * credential check from drifting apart.
 */
export function adminEmail(): string {
  return adminCredentials()?.email ?? DEFAULT_ADMIN_EMAIL;
}

/**
 * Check a sign-in. Both halves are compared with a constant-time compare so
 * the answer does not leak how much of the password was right.
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const credentials = adminCredentials();
  if (!credentials) return false;

  const emailMatches = safeEqual(
    email.trim().toLowerCase(),
    credentials.email.trim().toLowerCase()
  );
  const passwordMatches = safeEqual(password, credentials.password);

  // Both are always calculated — checking one and short-circuiting the other
  // would answer "how much of the password was right" by how long we took.
  return emailMatches && passwordMatches;
}

/* ------------------------------------------------------------------ *
 * Development fallbacks
 *
 * These are only ever used when NODE_ENV is not "production". They keep
 * the admin screens usable on a laptop without a secret file, and the
 * terminal says so out loud the first time they are used.
 * ------------------------------------------------------------------ */

const DEV_EMAIL = "admin@storestudio.local";
const DEV_PASSWORD = "admin-dev";

let warnedAboutDevelopmentFallback = false;

function warnAboutDevelopmentFallback(): void {
  if (warnedAboutDevelopmentFallback) return;
  warnedAboutDevelopmentFallback = true;
  console.warn(
    "[admin] ADMIN_PASSWORD / ADMIN_SESSION_SECRET are not set — " +
      `using the development sign-in (${DEV_EMAIL} / ${DEV_PASSWORD}). Set the real ` +
      "values before deploying."
  );
}

/* ------------------------------------------------------------------ *
 * Reading and writing the session
 * ------------------------------------------------------------------ */

/**
 * The signed-in admin, or null when nobody is signed in.
 *
 * The session is checked twice over: the signature has to be ours, and the
 * sign-in must not have run out. `io()` keeps the clock read below out of the
 * static shell; callers render this behind a Suspense boundary.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  await io();

  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;

  return readSessionToken(token, Date.now());
}

/**
 * Should the session cookie carry the `Secure` flag?
 *
 * `NODE_ENV === "production"` on its own is not enough: a production build
 * served over plain HTTP on localhost would set a cookie the browser refuses
 * to send back, which looks exactly like a login that never works. Trust the
 * forwarded protocol when there is one, then fall back to the host and the
 * configured site URL.
 */
async function secureSessionCookie(): Promise<boolean> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";

  const host = requestHeaders.get("host")?.trim().toLowerCase() ?? "";
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return false;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl.toLowerCase().startsWith("https://");

  return process.env.NODE_ENV === "production";
}

/** Sign an admin in. Only ever called from a server action. */
export async function startAdminSession(email: string): Promise<void> {
  const store = await cookies();

  const session: AdminSession = {
    email,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
  };

  store.set(ADMIN_SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: await secureSessionCookie(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Sign the admin out. Only ever called from a server action. */
export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

/**
 * The session check every admin screen and every admin action makes.
 *
 * It sends a signed-out visitor to the sign-in page instead of the page
 * they asked for, so a stale link never shows anything it should not.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}

/**
 * The path to come back to after signing in. Only paths inside /admin are
 * allowed, so the sign-in page can never be used to bounce somebody to
 * another site.
 */
export function safeAdminPath(value: string | null | undefined): string {
  const path = (value ?? "").trim();
  if (!path.startsWith("/admin")) return "";
  if (path.startsWith("//") || path.includes("://")) return "";
  if (path.startsWith("/admin/login")) return "";
  return path;
}
