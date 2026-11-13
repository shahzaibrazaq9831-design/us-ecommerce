/**
 * The admin session token — the signed cookie the admin sign-in travels in.
 *
 * This module holds the parts of the session that need nothing from Next.js:
 * the key, the signing and the reading of the token. That way the same code
 * can be used by the server (which reads the cookie) and by `proxy.ts`
 * (which only sees the request), and there is one implementation of "is
 * this session real?".
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** The cookie the admin session travels in. */
export const ADMIN_SESSION_COOKIE = "ppd_admin_session";

/** How long one sign-in lasts: a working day. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24;

/** The signed-in admin. */
export interface AdminSession {
  /** Who is signed in. */
  email: string;
  /** ISO timestamp of when the sign-in runs out. */
  expiresAt: string;
}

/**
 * The development key. It is only ever used when NODE_ENV is not
 * "production" and the real key is missing — see `sessionSecret`.
 */
const DEV_SECRET = "dress-store-development-admin-secret";

/**
 * The key the session is signed with.
 *
 * It comes from the environment and is read at request time, never at build
 * time, so a deployment can change it without a rebuild. A production
 * server without the key cannot sign anybody in — it fails closed.
 */
export function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set — the admin session cannot be signed on this server."
    );
  }

  return DEV_SECRET;
}

/** Is a session key available on this server? */
export function isSessionConfigured(): boolean {
  if (process.env.ADMIN_SESSION_SECRET?.trim()) return true;
  return process.env.NODE_ENV !== "production";
}

/** Compare two strings without telling the caller where they differ. */
export function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/** Sign a payload with the session key. */
function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

/** Build the cookie value for a session. */
export function createSessionToken(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/**
 * Read a cookie value back, or null when it is missing, forged or expired.
 *
 * The expiry is only checked when the caller passes the current time. The
 * gate in front of the admin area (`src/proxy.ts`) passes the clock it
 * reads outside a render; inside the app the clock is read after `io()`,
 * which keeps it out of the static shell.
 *
 * A missing key is treated as "not signed in" rather than as an error: the
 * caller only wants to know whether the session is good.
 */
export function readSessionToken(
  token: string | undefined,
  now?: number
): AdminSession | null {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }

  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<AdminSession>;

    if (!parsed || typeof parsed.email !== "string" || !parsed.email) return null;
    if (typeof parsed.expiresAt !== "string") return null;

    if (typeof now === "number" && Number.isFinite(now)) {
      if (new Date(parsed.expiresAt).getTime() <= now) return null;
    }

    return { email: parsed.email, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}
