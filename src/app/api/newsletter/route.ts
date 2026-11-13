import { rateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { isNewsletterConfigured, subscribe } from "@/lib/newsletter";
import { sendDoubleOptInEmail } from "@/lib/email";
import { baseUrlFromRequest } from "@/lib/seo";

/** A plain, forgiving email check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Sign up for the newsletter.
 *
 * Two things stop spam here:
 *
 *   - a hidden field (the honeypot) that people never see but bots
 *     fill in. A submission with anything in it is dropped quietly, and
 *     the sender is told nothing different from a real sign-up, so a
 *     bot learns nothing;
 *   - a rate limit, so the same address cannot be used to hammer the
 *     form.
 *
 * Nothing is added to the list here. The address is saved as pending
 * and the customer has to click the link in the email that follows —
 * that is the double opt-in, and it means nobody can sign anybody else
 * up.
 */
export async function POST(request: Request) {
  const limit = rateLimit(
    rateLimitKey(request, "newsletter"),
    RATE_LIMITS.newsletter.limit,
    RATE_LIMITS.newsletter.windowMs
  );

  if (!limit.ok) {
    return Response.json(
      {
        ok: false,
        error: "Too many attempts. Please try again later.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "We could not read that. Please try again." },
      { status: 400 }
    );
  }

  const data = (body ?? {}) as Record<string, unknown>;
  const email = String(data.email ?? "").trim();
  const honeypot = String(data.company ?? "").trim();

  // The honeypot was filled in. Say nothing unusual — just drop it.
  if (honeypot) {
    return Response.json({
      ok: true,
      message: "Almost there — please check your inbox to confirm your subscription.",
    });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json(
      { ok: false, error: "That email address does not look right." },
      { status: 400 }
    );
  }

  if (!isNewsletterConfigured()) {
    return Response.json(
      {
        ok: false,
        error: "The newsletter is not available on this server at the moment.",
      },
      { status: 503 }
    );
  }

  const result = await subscribe(email, "website");

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  // A confirmed address needs no second email. Everybody else gets the
  // confirmation link.
  if (result.status !== "confirmed") {
    const confirmUrl = `${baseUrlFromRequest(
      request
    )}/api/newsletter/confirm?token=${encodeURIComponent(result.token)}`;

    await sendDoubleOptInEmail(email, confirmUrl);
  }

  return Response.json({
    ok: true,
    message: "Almost there — please check your inbox to confirm your subscription.",
  });
}
