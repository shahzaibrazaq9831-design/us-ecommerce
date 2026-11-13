import { cookies } from "next/headers";
import { getOrderById, ORDER_RECEIPT_COOKIE } from "@/lib/orders";
import {
  isCardPaymentEnabled,
  resolveChargeCurrency,
  resumeCardPayment,
} from "@/lib/payments";
import { baseUrlFromRequest } from "@/lib/seo";
import { RATE_LIMITS, rateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * Start (or restart) the payment for an order that has not been paid.
 *
 * A customer who starts paying and does not finish can come back to the
 * order and try again. The payment page they had before is used again
 * where possible, so nobody can be charged twice for one order.
 *
 * The order has to belong to the browser that asks: the same cookie
 * that lets the confirmation page show an order has to be here.
 */
export async function POST(request: Request) {
  const limit = rateLimit(
    rateLimitKey(request, "checkout"),
    RATE_LIMITS.checkout.limit,
    RATE_LIMITS.checkout.windowMs
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

  const orderId = String((body as Record<string, unknown>)?.orderId ?? "").trim();
  const order = orderId ? await getOrderById(orderId) : null;

  if (!order) {
    return Response.json(
      { ok: false, error: "We could not find that order." },
      { status: 404 }
    );
  }

  // The browser has to have placed this order, or proved it owns it.
  const cookieStore = await cookies();
  const receipt = cookieStore.get(ORDER_RECEIPT_COOKIE)?.value ?? "";

  if (receipt.trim().toUpperCase() !== (order.id ?? "").trim().toUpperCase()) {
    return Response.json(
      {
        ok: false,
        error: "We could not find that order.",
      },
      { status: 403 }
    );
  }

  if (order.payment.status === "paid") {
    return Response.json(
      { ok: false, error: "That order has already been paid." },
      { status: 400 }
    );
  }

  if (order.payment.method !== "card" || !isCardPaymentEnabled()) {
    return Response.json(
      { ok: false, error: "This order is not waiting for a card payment." },
      { status: 400 }
    );
  }

  const currency = resolveChargeCurrency(cookieStore.get("ppd_currency")?.value);

  try {
    const start = await resumeCardPayment(order, {
      baseUrl: baseUrlFromRequest(request),
      currency,
    });

    if (start.kind !== "redirect") {
      return Response.json(
        { ok: false, error: "This order is not waiting for a card payment." },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, redirect: start.url });
  } catch {
    return Response.json(
      {
        ok: false,
        error: "We could not open the payment page. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
