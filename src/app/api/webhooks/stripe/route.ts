import {
  applyStripeEvent,
  rememberHandledEvent,
  verifyStripeEvent,
  wasEventHandled,
} from "@/lib/payments";
import { markNotificationSent, notificationSent } from "@/lib/orders";
import { sendPaymentConfirmation } from "@/lib/email";

/**
 * The payment provider's webhook.
 *
 * This is the only place in the shop where an order is marked as paid.
 * The success page the customer lands on after paying says nothing —
 * anybody can visit that page, so it cannot be evidence of anything.
 *
 * Three things are done here, in this order:
 *
 *   1. the signature is checked. The body is read as text, untouched,
 *      because the signature is over the exact bytes that were sent;
 *   2. the event is applied. Applying it twice changes nothing — an
 *      order that is already paid stays paid, and the customer is not
 *      emailed twice;
 *   3. the customer is told their payment went through, once.
 *
 * The provider retries an event until it is answered, so this route has
 * to be safe to receive the same event many times. It is.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { ok: false, error: "missing-signature" },
      { status: 400 }
    );
  }

  // The raw body — never parsed and never re-serialised.
  const payload = await request.text();

  let event;

  try {
    event = verifyStripeEvent(payload, signature);
  } catch {
    return Response.json(
      { ok: false, error: "invalid-signature" },
      { status: 400 }
    );
  }

  // An event we have already dealt with is answered and dropped.
  if (await wasEventHandled(event.id)) {
    return Response.json({ ok: true, repeated: true });
  }

  const outcome = await applyStripeEvent(event);

  if (outcome.action === "paid" && !outcome.alreadyPaid) {
    if (!notificationSent(outcome.order, "paymentConfirmationAt")) {
      await sendPaymentConfirmation(outcome.order);
      await markNotificationSent(outcome.order.id, "paymentConfirmationAt");
    }
  }

  await rememberHandledEvent(event.id);

  return Response.json({ ok: true, action: outcome.action });
}
