import { cookies } from "next/headers";
import { findOrderByIdAndEmail, ORDER_RECEIPT_COOKIE, toPublicOrder } from "@/lib/orders";
import { RATE_LIMITS, rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { isLocalRequest } from "@/lib/seo";

/**
 * Look an order up.
 *
 * An order number on its own is not enough: the email address the
 * order was placed with has to match as well. Only then is anything
 * about the order shown — and the answer is the same whether the order
 * exists or not, so the form cannot be used to find out which order
 * numbers are real.
 */
export async function POST(request: Request) {
  const limit = rateLimit(
    rateLimitKey(request, "order-lookup"),
    RATE_LIMITS.orderLookup.limit,
    RATE_LIMITS.orderLookup.windowMs
  );

  if (!limit.ok) {
    return Response.json(
      {
        ok: false,
        error: "Too many attempts. Please wait a few minutes and try again.",
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
  const orderNumber = String(data.orderNumber ?? "").trim();
  const email = String(data.email ?? "").trim();

  const order = await findOrderByIdAndEmail(orderNumber, email);

  if (!order) {
    return Response.json(
      {
        ok: false,
        error:
          "We could not find an order with that number and email address. Please check both and try again.",
      },
      { status: 404 }
    );
  }

  // This browser has now proved it owns the order, so the confirmation
  // page will show it without asking again.
  const cookieStore = await cookies();
  cookieStore.set(ORDER_RECEIPT_COOKIE, order.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: !isLocalRequest(request),
    path: "/order",
    maxAge: 60 * 60 * 2,
  });

  return Response.json({ ok: true, order: toPublicOrder(order) });
}
