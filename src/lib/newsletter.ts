/**
 * Newsletter — the mailing list.
 *
 * Signing up is a double opt-in: the address is saved as "pending", the
 * customer gets an email with a confirmation link, and the address only
 * joins the list when that link is clicked. Nobody can sign somebody
 * else up, and nobody ends up on a list they never asked for.
 *
 * Unsubscribing is one click: every newsletter carries a signed link
 * that removes the address straight away, with no sign-in and no
 * "manage preferences" form.
 *
 * The links are signed with a secret from the environment
 * (`NEWSLETTER_SECRET`), so a link cannot be made up for an address
 * that was never signed up, and a link cannot be edited to unsubscribe
 * somebody else. Storage is a JSON file under `.data/`, the same place
 * the orders and reviews live.
 *
 * This module is server-only.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHmac, timingSafeEqual } from "node:crypto";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/** Where a subscriber is in the sign-up. */
export type SubscriberStatus = "pending" | "confirmed" | "unsubscribed";

/** One subscriber. */
export interface Subscriber {
  /** The address, in lower case. */
  email: string;
  /** Whether they have confirmed yet. */
  status: SubscriberStatus;
  /** When they signed up. */
  createdAt: string;
  /** When they confirmed. */
  confirmedAt?: string;
  /** When they left. */
  unsubscribedAt?: string;
  /** Where the sign-up came from, e.g. "footer". */
  source?: string;
}

/* ------------------------------------------------------------------ *
 * Secrets
 * ------------------------------------------------------------------ */

/** The secret the links are signed with. */
function secret(): string {
  const raw = process.env.NEWSLETTER_SECRET?.trim();

  if (raw) return raw;

  if (process.env.NODE_ENV === "production") {
    // Without a secret there is no way to sign a link that only we
    // could have made, so the newsletter is simply not available.
    return "";
  }

  // A development secret, so the newsletter can be tried out on a
  // laptop. It is never used on a production server.
  return "development-newsletter-secret";
}

/**
 * Can the newsletter work on this server at all?
 *
 * On a production server this needs `NEWSLETTER_SECRET`. Without it
 * the links could be made up by anyone, so nothing is signed and
 * nothing is confirmed.
 */
export function isNewsletterConfigured(): boolean {
  return secret().length > 0;
}

/** How long a confirmation link stays good for. */
const CONFIRM_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ *
 * Links
 * ------------------------------------------------------------------ */

/** What a signed link carries. */
interface TokenPayload {
  email: string;
  kind: "confirm" | "unsubscribe";
  /** When the link stops working, in milliseconds. 0 means never. */
  exp: number;
}

/** Sign a piece of text. */
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Make a signed link for an address. */
export function createToken(email: string, kind: "confirm" | "unsubscribe"): string {
  const payload: TokenPayload = {
    email: email.trim().toLowerCase(),
    kind,
    exp: kind === "confirm" ? Date.now() + CONFIRM_TOKEN_TTL : 0,
  };

  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Read a signed link.
 *
 * The address in the link is only believed when the signature matches,
 * so a link cannot be edited to reach somebody else's subscription.
 */
export function readToken(
  token: string,
  kind: "confirm" | "unsubscribe"
): string | null {
  if (!secret()) return null;

  const raw = (token ?? "").trim();
  const separator = raw.lastIndexOf(".");

  if (separator <= 0) return null;

  const payload = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  const expected = sign(payload);
  const given = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");

  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as TokenPayload;

    if (parsed.kind !== kind) return null;
    if (parsed.exp && Date.now() > parsed.exp) return null;
    if (!parsed.email) return null;

    return parsed.email.toLowerCase();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), ".data");
const NEWSLETTER_FILE = path.join(DATA_DIR, "newsletter.json");

/** Every subscriber. A missing or damaged file reads as no subscribers. */
async function readSubscribers(): Promise<Subscriber[]> {
  try {
    const raw = await fs.readFile(NEWSLETTER_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is Subscriber =>
        Boolean(entry) && typeof (entry as Subscriber).email === "string"
    );
  } catch {
    return [];
  }
}

/** Write the subscribers back, replacing the file in one go. */
async function writeSubscribers(subscribers: Subscriber[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temporary = `${NEWSLETTER_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(subscribers, null, 2), "utf8");
  await fs.rename(temporary, NEWSLETTER_FILE);
}

/* ------------------------------------------------------------------ *
 * Signing up and leaving
 * ------------------------------------------------------------------ */

/** What signing up says. */
export type SubscribeResult =
  | { ok: true; status: SubscriberStatus; email: string; token: string }
  | { ok: false; error: string };

/**
 * Save an address and get the confirmation link for it.
 *
 * Signing up twice is fine: the address keeps its place on the list and
 * a fresh confirmation link is made.
 */
export async function subscribe(email: string, source?: string): Promise<SubscribeResult> {
  const address = (email ?? "").trim().toLowerCase();

  if (!address) return { ok: false, error: "That email address does not look right." };

  if (!isNewsletterConfigured()) {
    return {
      ok: false,
      error: "The newsletter is not available on this server at the moment.",
    };
  }

  const subscribers = await readSubscribers();
  const index = subscribers.findIndex((entry) => entry.email === address);
  const now = new Date().toISOString();

  if (index === -1) {
    subscribers.push({
      email: address,
      status: "pending",
      createdAt: now,
      ...(source ? { source } : {}),
    });
  } else {
    const existing = subscribers[index];

    // Somebody who unsubscribed and then signs up again is pending
    // again, not confirmed.
    subscribers[index] = {
      ...existing,
      status: existing.status === "confirmed" ? "confirmed" : "pending",
      confirmedAt: existing.status === "confirmed" ? existing.confirmedAt : undefined,
      unsubscribedAt: undefined,
    };
  }

  await writeSubscribers(subscribers);

  const status = subscribers[index === -1 ? subscribers.length - 1 : index].status;

  return { ok: true, status, email: address, token: createToken(address, "confirm") };
}

/**
 * Confirm a subscription.
 *
 * Only a signed link gets here, so the address is known to be the one
 * that was signed up.
 */
export async function confirmSubscription(
  token: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const email = readToken(token, "confirm");
  if (!email) return { ok: false, error: "That confirmation link is not valid any more." };

  const subscribers = await readSubscribers();
  const index = subscribers.findIndex((entry) => entry.email === email);

  if (index === -1) {
    return { ok: false, error: "We could not find that subscription." };
  }

  const now = new Date().toISOString();

  subscribers[index] = {
    ...subscribers[index],
    status: "confirmed",
    confirmedAt: subscribers[index].confirmedAt ?? now,
    unsubscribedAt: undefined,
  };

  await writeSubscribers(subscribers);

  return { ok: true, email };
}

/**
 * Remove an address from the list.
 *
 * The link in every newsletter is signed, so this works with one click
 * and needs no account.
 */
export async function unsubscribe(
  token: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const email = readToken(token, "unsubscribe");
  if (!email) return { ok: false, error: "That unsubscribe link is not valid any more." };

  const subscribers = await readSubscribers();
  const index = subscribers.findIndex((entry) => entry.email === email);

  if (index === -1) {
    // Already gone — say so quietly rather than making it look broken.
    return { ok: true, email };
  }

  subscribers[index] = {
    ...subscribers[index],
    status: "unsubscribed",
    unsubscribedAt: new Date().toISOString(),
  };

  await writeSubscribers(subscribers);

  return { ok: true, email };
}

/** How many addresses are on the list. */
export async function subscriberCount(): Promise<{ total: number; confirmed: number }> {
  const subscribers = await readSubscribers();

  return {
    total: subscribers.length,
    confirmed: subscribers.filter((entry) => entry.status === "confirmed").length,
  };
}
