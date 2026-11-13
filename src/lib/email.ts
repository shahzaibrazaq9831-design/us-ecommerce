/**
 * Email — every message the shop sends.
 *
 * The provider is Resend, and it is the only thing in the app that
 * talks to it. Swapping it for another provider means rewriting this
 * file and nothing else, because the rest of the app only ever asks for
 * "send the customer their order confirmation".
 *
 * Four messages live here:
 *
 *   1. the order confirmation, sent to the customer;
 *   2. the payment confirmation, sent to the customer once the
 *      provider's webhook says the money arrived;
 *   3. the new-order notice, sent to the studio so somebody sees the
 *      order straight away;
 *   4. the newsletter messages — the double opt-in confirmation and the
 *      one-click unsubscribe.
 *
 * Two rules:
 *
 *   - The API key comes from the environment and is never sent to the
 *     browser. Nothing in this file may be imported by a client
 *     component.
 *   - A missing API key must not break a shop. When the key is not
 *     there the message is written to the terminal instead and the
 *     caller is told it was skipped, so an order is never lost because
 *     an email could not be sent.
 */

import { Resend } from "resend";
import { siteConfig } from "@/data/site";
import { measurementFields, stitchingLabels, type StitchingOption } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";
import type { StoredOrder } from "@/lib/orders";

/* ------------------------------------------------------------------ *
 * Configuration
 * ------------------------------------------------------------------ */

/** The API key from the Resend dashboard. */
function resendKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

/** The Resend client, made once and kept. */
let resendClient: Resend | null = null;

/** The Resend client, or null when no API key is set. */
function resend(): Resend | null {
  const key = resendKey();
  if (!key) return null;

  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

/** Can this server send email at all? */
export function isEmailConfigured(): boolean {
  return resend() !== null;
}

/** The address the shop sends from. */
function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || `${siteConfig.name} <onboarding@resend.dev>`;
}

/** The address the studio wants to hear about new orders. */
function ownerAddress(): string {
  return process.env.ORDER_NOTICE_EMAIL?.trim() || siteConfig.email;
}

/** The address of the site, for the links in the emails. */
function storeUrl(): string {
  return (process.env.STORE_URL?.trim() || SITE_URL).replace(/\/$/, "");
}

/* ------------------------------------------------------------------ *
 * Sending
 * ------------------------------------------------------------------ */

/** One message, ready to send. */
export interface EmailMessage {
  /** Who it is for. */
  to: string;
  /** The subject line. */
  subject: string;
  /** The message, as HTML. */
  html: string;
  /** The message, as plain text. */
  text: string;
}

/** What sending says. */
export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: boolean; error: string };

/**
 * Send one message.
 *
 * When the API key is missing the message is printed to the terminal
 * instead of being sent, and the caller is told it was skipped. That
 * way a shop without an email account still takes orders — it just
 * does not send the letters.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const client = resend();

  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY is not set — the message to ${message.to} was not sent.\n` +
        `Subject: ${message.subject}\n${message.text}`
    );
    return { ok: false, skipped: true, error: "email-not-configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress(),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      console.error(`[email] ${message.subject} could not be sent: ${error.message}`);
      return { ok: false, skipped: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? "" };
  } catch (caught) {
    const reason = caught instanceof Error ? caught.message : "unknown-error";
    console.error(`[email] ${message.subject} could not be sent: ${reason}`);
    return { ok: false, skipped: false, error: reason };
  }
}

/* ------------------------------------------------------------------ *
 * The order summary
 * ------------------------------------------------------------------ */

/** One line of an order, written out for a person to read. */
export function orderSummaryLines(order: StoredOrder): string[] {
  const lines: string[] = [];

  for (const item of order.items ?? []) {
    const name = item.name ?? item.slug;
    const parts: string[] = [];

    const stitching = item.stitching as StitchingOption | undefined;
    if (stitching && stitchingLabels[stitching]) parts.push(stitchingLabels[stitching]);
    if (item.size) parts.push(`Size ${item.size}`);
    if (item.lining) parts.push(item.lining);

    lines.push(`${item.quantity} × ${name} — ${parts.join(", ") || "standard"}`);

    if (item.measurements) {
      const measurements = measurementFields
        .map((field) => `${field.label} ${item.measurements?.[field.key]} ${item.measurements?.unit}`)
        .join(", ");
      lines.push(`   Measurements: ${measurements}`);
    }

    if (item.notes) lines.push(`   Note: ${item.notes}`);
  }

  return lines;
}

/** The money on an order, written out for a person to read. */
export function orderTotalsLines(order: StoredOrder): string[] {
  const lines = [
    `Subtotal: ${order.totals.subtotal} ${order.totals.currency ?? "PKR"}`,
  ];

  if (order.totals.discount > 0) {
    lines.push(`Discount: -${order.totals.discount} ${order.totals.currency ?? "PKR"}`);
  }

  if (order.totals.shipping > 0) {
    lines.push(`Delivery: ${order.totals.shipping} ${order.totals.currency ?? "PKR"}`);
  }

  lines.push(`Total: ${order.totals.total} ${order.totals.currency ?? "PKR"}`);

  if (order.payment?.chargedAmount !== undefined && order.payment.chargedCurrency) {
    lines.push(
      `Paid: ${order.payment.chargedAmount} ${order.payment.chargedCurrency}`
    );
  }

  return lines;
}

/** The address of the order, written out for a person to read. */
export function orderAddressLines(order: StoredOrder): string[] {
  const address = order.address ?? ({} as StoredOrder["address"]);

  return [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .map((part) => String(part));
}

/* ------------------------------------------------------------------ *
 * The messages
 * ------------------------------------------------------------------ */

/** The HTML shell every message sits in. */
function emailShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f7f4ef;font-family:Georgia,'Times New Roman',serif;color:#2b2118;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e6ded2;border-radius:12px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #eee6da;">
        <p style="margin:0;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#b08b57;">${siteConfig.name}</p>
        <h1 style="margin:8px 0 0;font-size:24px;font-weight:600;">${title}</h1>
      </div>
      <div style="padding:24px 28px;font-size:15px;line-height:1.6;">
        ${body}
      </div>
      <div style="padding:16px 28px;background:#faf7f2;border-top:1px solid #eee6da;font-size:13px;color:#6b5f52;">
        <p style="margin:0;">${siteConfig.name} · ${siteConfig.email}</p>
      </div>
    </div>
  </body>
</html>`;
}

/** Turn plain lines into HTML paragraphs. */
function paragraphs(lines: string[]): string {
  return lines.map((line) => `<p style="margin:0 0 8px;">${escapeHtml(line)}</p>`).join("");
}

/** Make a string safe to put in an HTML email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The order confirmation, sent to the customer.
 *
 * It carries the order number and the whole summary — every piece with
 * the stitching and the measurements it was ordered with — so the
 * customer can check the details without having to ask.
 */
export async function sendOrderConfirmation(order: StoredOrder): Promise<EmailResult> {
  const lines = [
    `Hello ${order.customer.name},`,
    "",
    `Thank you for your order. We have it, and we will be in touch when it is on its way.`,
    "",
    `Order number: ${order.id}`,
    "",
    ...orderSummaryLines(order),
    "",
    ...orderTotalsLines(order),
    "",
    "Delivering to:",
    ...orderAddressLines(order),
  ];

  if (order.deliveryNote) {
    lines.push("", `Your note: ${order.deliveryNote}`);
  }

  lines.push(
    "",
    `You can see this order any time at ${storeUrl()}/order/lookup — you will need your order number and the email address you used.`,
    "",
    siteConfig.name
  );

  const html = emailShell(
    `Your order ${order.id}`,
    `${paragraphs(lines)}
     <p style="margin:24px 0 0;">
       <a href="${storeUrl()}/order/${encodeURIComponent(order.id)}" style="display:inline-block;background:#2b2118;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;">View your order</a>
     </p>`
  );

  return sendEmail({
    to: order.customer.email,
    subject: `Your order ${order.id} — ${siteConfig.name}`,
    html,
    text: lines.join("\n"),
  });
}

/**
 * The payment confirmation, sent once the provider's webhook says the
 * money has arrived.
 */
export async function sendPaymentConfirmation(order: StoredOrder): Promise<EmailResult> {
  const lines = [
    `Hello ${order.customer.name},`,
    "",
    `We have received your payment for order ${order.id}.`,
    "",
    ...orderSummaryLines(order),
    "",
    ...orderTotalsLines(order),
    "",
    "We will let you know as soon as your pieces are on their way.",
    "",
    siteConfig.name
  ];

  const html = emailShell(
    `Payment received for ${order.id}`,
    paragraphs(lines)
  );

  return sendEmail({
    to: order.customer.email,
    subject: `Payment received — order ${order.id}`,
    html,
    text: lines.join("\n"),
  });
}

/**
 * The new-order notice, sent to the studio.
 *
 * It says the same thing the customer was told, so the team can start
 * on a piece without opening anything else.
 */
export async function sendNewOrderNotice(order: StoredOrder): Promise<EmailResult> {
  const lines = [
    `A new order has come in: ${order.id}`,
    "",
    `Placed: ${order.date}`,
    `Customer: ${order.customer.name} (${order.customer.email}${
      order.customer.phone ? `, ${order.customer.phone}` : ""
    })`,
    `Payment: ${order.payment.method}${
      order.payment.chargedAmount !== undefined && order.payment.chargedCurrency
        ? ` — ${order.payment.chargedAmount} ${order.payment.chargedCurrency}`
        : ""
    }`,
    "",
    ...orderSummaryLines(order),
    "",
    ...orderTotalsLines(order),
    "",
    "Delivering to:",
    ...orderAddressLines(order),
  ];

  if (order.deliveryNote) {
    lines.push("", `Delivery note: ${order.deliveryNote}`);
  }

  lines.push("", `Open the order: ${storeUrl()}/admin/orders/${order.id}`);

  const html = emailShell(
    `New order ${order.id}`,
    `${paragraphs(lines)}
     <p style="margin:24px 0 0;">
       <a href="${storeUrl()}/admin/orders/${encodeURIComponent(order.id)}" style="display:inline-block;background:#2b2118;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;">Open the order</a>
     </p>`
  );

  return sendEmail({
    to: ownerAddress(),
    subject: `New order ${order.id} — ${order.customer.name}`,
    html,
    text: lines.join("\n"),
  });
}

/**
 * The double opt-in email.
 *
 * The customer has to click the link before the address is added to the
 * list — that way nobody can sign somebody else up.
 */
export async function sendDoubleOptInEmail(
  email: string,
  confirmUrl: string
): Promise<EmailResult> {
  const lines = [
    "Hello,",
    "",
    "Please confirm your subscription to our list — one click and you are on it.",
    "",
    `If the link does not work, paste this address into your browser: ${confirmUrl}`,
    "",
    "If you did not ask for this, you can ignore this email and nothing will happen.",
    "",
    siteConfig.name
  ];

  const html = emailShell(
    "Confirm your subscription",
    `${paragraphs(lines)}
     <p style="margin:24px 0 0;">
       <a href="${confirmUrl}" style="display:inline-block;background:#2b2118;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;">Confirm my subscription</a>
     </p>`
  );

  return sendEmail({
    to: email,
    subject: `Confirm your subscription — ${siteConfig.name}`,
    html,
    text: lines.join("\n"),
  });
}

/**
 * The note we send when somebody unsubscribes, so they know it worked.
 */
export async function sendUnsubscribeNotice(email: string): Promise<EmailResult> {
  const lines = [
    "Hello,",
    "",
    "You have been removed from our list. You will not hear from us again unless you sign up again.",
    "",
    siteConfig.name
  ];

  const html = emailShell("You have unsubscribed", paragraphs(lines));

  return sendEmail({
    to: email,
    subject: `You have unsubscribed — ${siteConfig.name}`,
    html,
    text: lines.join("\n"),
  });
}
