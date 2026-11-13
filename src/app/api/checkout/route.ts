import { cookies } from "next/headers";
import { validateCheckoutInput } from "@/lib/checkout-validation";
import { priceCart } from "@/lib/pricing";
import {
  createOrder,
  markNotificationSent,
  notificationSent,
  ORDER_RECEIPT_COOKIE,
  setPaymentAmount,
  setPaymentReference,
} from "@/lib/orders";
import {
  isCardPaymentEnabled,
  isCashOnDeliveryEnabled,
  resolveChargeCurrency,
  resumeCardPayment,
  startPayment,
} from "@/lib/payments";
import { baseUrlFromRequest, isLocalRequest } from "@/lib/seo";
import { sendNewOrderNotice, sendOrderConfirmation } from "@/lib/email";
import { RATE_LIMITS, rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { convertPrice, getExchangeRates } from "@/lib/currency";
import type { OrderItem } from "@/lib/orders";

/**
 * Place an order.
 *
 * The order of the steps matters, and it is the same order every time:
 *
 *   1. the request is rate limited;
 *   2. everything the customer sent is checked again on the server;
 *   3. the money is worked out from the catalogue — the prices in the
 *      request are never used, because the browser cannot be trusted
 *      with them;
 *   4. the order is written down, with a key that makes writing it
 *      twice harmless;
 *   5. the payment is started, and only then is the customer sent
 *      anywhere.
 *
 * An order is always written down before the customer is sent to pay,
 * so a payment can never arrive for an order that does not exist.
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
      { ok: false, error: "We could not read that order. Please try again." },
      { status: 400 }
    );
  }

  /* 2. Check everything again on the server. ------------------------- */
  const validation = validateCheckoutInput(body);

  if (!validation.valid) {
    return Response.json(
      {
        ok: false,
        error: "Please check the highlighted fields and try again.",
        issues: validation.issues,
      },
      { status: 400 }
    );
  }

  const input = validation.value;

  /* 3. Work the money out from the catalogue. ------------------------ */
  const priced = priceCart(input.items, input.discountCode);

  if (!priced.ok) {
    return Response.json({ ok: false, error: priced.error }, { status: 400 });
  }

  if (input.paymentMethod === "card" && !isCardPaymentEnabled()) {
    return Response.json(
      {
        ok: false,
        error:
          "Card payments are not switched on on this server. Please choose cash on delivery.",
        issues: [{ field: "paymentMethod", message: "Card payments are unavailable." }],
      },
      { status: 400 }
    );
  }

  if (input.paymentMethod === "cod" && !isCashOnDeliveryEnabled()) {
    return Response.json(
      {
        ok: false,
        error: "Cash on delivery is not available at the moment.",
        issues: [
          { field: "paymentMethod", message: "Cash on delivery is unavailable." },
        ],
      },
      { status: 400 }
    );
  }

  /* 4. Write the order down. ---------------------------------------- */
  const items: OrderItem[] = priced.order.lines.map((line) => ({
    slug: line.slug,
    name: line.name,
    image: line.image,
    price: line.unitPrice,
    quantity: line.quantity,
    stitching: line.stitching,
    ...(line.size ? { size: line.size } : {}),
    ...(line.lining ? { lining: line.lining } : {}),
    ...(line.measurements ? { measurements: line.measurements } : {}),
    ...(line.notes ? { notes: line.notes } : {}),
  }));

  const created = await createOrder({
    idempotencyKey: input.idempotencyKey,
    customer: {
      name: input.contact.name,
      email: input.contact.email,
      phone: input.contact.phone,
    },
    address: input.address,
    items,
    totals: {
      subtotal: priced.order.subtotal,
      shipping: priced.order.shipping,
      discount: priced.order.discount,
      total: priced.order.total,
      currency: priced.order.currency,
      discountCode: priced.order.discountCode,
    },
    payment: {
      method: input.paymentMethod === "cod" ? "cod" : "card",
      status: "unpaid",
    },
    deliveryNote: input.deliveryNote || undefined,
    termsAcceptedAt: new Date().toISOString(),
  });

  if (!created.ok) {
    return Response.json(
      { ok: false, error: "We could not save that order. Please try again." },
      { status: 500 }
    );
  }

  const order = created.order;

  /* 5. Start the payment. ------------------------------------------- */
  const cookieStore = await cookies();
  const currency = resolveChargeCurrency(cookieStore.get("ppd_currency")?.value);
  const baseUrl = baseUrlFromRequest(request);

  let redirect = `/order/${encodeURIComponent(order.id)}`;

  if (input.paymentMethod === "card") {
    try {
      // A fresh order gets a fresh payment page; an order that is being
      // retried goes back to the payment page it already has, so the
      // customer cannot be charged twice.
      const start = created.created
        ? await startPayment(order, "card", { baseUrl, currency })
        : await resumeCardPayment(order, { baseUrl, currency });

      if (start.kind !== "redirect") {
        throw new Error("unexpected-payment-kind");
      }

      await setPaymentReference(order.id, start.reference);
      redirect = start.url;
    } catch {
      return Response.json(
        {
          ok: false,
          error:
            "We could not open the payment page. Please try again in a moment.",
        },
        { status: 502 }
      );
    }
  } else {
    // The money is collected on delivery, so the amount is what the
    // catalogue says it is.
    const rates = await getExchangeRates();
    const charged = convertPrice(order.totals.total, currency, rates);

    await setPaymentReference(order.id, `cod_${order.id}`);
    await setPaymentAmount(order.id, charged, currency);
  }

  /* The emails. ------------------------------------------------------ */
  // The studio hears about the order straight away, so somebody can
  // start on the pieces.
  if (!notificationSent(order, "ownerNoticeAt")) {
    await sendNewOrderNotice(order);
    await markNotificationSent(order.id, "ownerNoticeAt");
  }

  // And the customer is told their order is with us. A card order is
  // also told when the payment goes through.
  if (!notificationSent(order, "customerConfirmationAt")) {
    await sendOrderConfirmation(order);
    await markNotificationSent(order.id, "customerConfirmationAt");
  }

  /* Remember this browser placed the order. -------------------------- */
  cookieStore.set(ORDER_RECEIPT_COOKIE, order.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: !isLocalRequest(request),
    path: "/order",
    maxAge: 60 * 60 * 2,
  });

  return Response.json({
    ok: true,
    orderId: order.id,
    paymentMethod: input.paymentMethod,
    redirect,
  });
}
