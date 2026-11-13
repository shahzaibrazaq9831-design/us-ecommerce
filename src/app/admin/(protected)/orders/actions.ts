"use server";

/**
 * The admin actions on an order.
 *
 * Every action in this file is a server action and every one of them:
 *
 *   1. re-checks the admin session for itself — a check on the page does
 *      not protect an action, so `requireAdmin()` is called here and not
 *      only in the page;
 *   2. validates what came in — the values are checked on the server, so
 *      a form that is edited in the browser is still checked;
 *   3. writes the change and refreshes the screens that show it.
 *
 * The order number is never trusted: it is matched against the stored
 * orders before anything is written.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import {
  cancelOrder,
  changeOrderStatus,
  isOrderStatus,
  markOrderAsPaid,
  saveOrderNotes,
  setOrderTracking,
} from "@/lib/orders";

/** The longest note we keep on an order. */
const MAX_NOTES_LENGTH = 2000;

/** Order numbers are short codes — nothing else is accepted. */
const ORDER_ID_PATTERN = /^[A-Za-z0-9-]{1,32}$/;

/** Courier tracking numbers: letters, digits and the few marks they use. */
const TRACKING_PATTERN = /^[A-Za-z0-9._/-]{4,40}$/;

/** The order number, or "" when it is not one. */
function readOrderId(formData: FormData): string {
  const id = String(formData.get("id") ?? "").trim();
  return ORDER_ID_PATTERN.test(id) ? id : "";
}

/** Send the visitor back to the order with a note about what happened. */
function backToOrder(id: string, query: string): never {
  redirect(`/admin/orders/${encodeURIComponent(id)}?${query}`);
}

/**
 * Change the status of an order. The change is written to the order's
 * history with the time it happened.
 */
export async function changeOrderStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = readOrderId(formData);
  if (!id) {
    redirect("/admin/orders?error=invalid-id");
  }

  const status = String(formData.get("status") ?? "").trim();
  if (!isOrderStatus(status)) {
    backToOrder(id, "error=invalid-status");
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  const result = await changeOrderStatus(id, status, admin.email, note);
  if (!result.ok) {
    backToOrder(id, `error=${result.error}`);
  }

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");

  backToOrder(id, "saved=status");
}

/** Add or change the tracking number of an order. */
export async function addTrackingNumberAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = readOrderId(formData);
  if (!id) {
    redirect("/admin/orders?error=invalid-id");
  }

  const tracking = String(formData.get("trackingNumber") ?? "").trim();
  if (!TRACKING_PATTERN.test(tracking)) {
    backToOrder(id, "error=invalid-tracking");
  }

  const courier = String(formData.get("courier") ?? "").trim().slice(0, 60);

  const result = await setOrderTracking(id, tracking, courier, admin.email);
  if (!result.ok) {
    backToOrder(id, `error=${result.error}`);
  }

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");

  backToOrder(id, "saved=tracking");
}

/** Mark a cash-on-delivery order as paid. */
export async function markCodAsPaidAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = readOrderId(formData);
  if (!id) {
    redirect("/admin/orders?error=invalid-id");
  }

  const result = await markOrderAsPaid(id, admin.email);
  if (!result.ok) {
    backToOrder(id, `error=${result.error}`);
  }

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");

  backToOrder(id, "saved=paid");
}

/** Cancel an order. The cancellation is a status change, so it is logged. */
export async function cancelOrderAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = readOrderId(formData);
  if (!id) {
    redirect("/admin/orders?error=invalid-id");
  }

  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (reason.length < 3) {
    backToOrder(id, "error=missing-reason");
  }

  const result = await cancelOrder(id, reason, admin.email);
  if (!result.ok) {
    backToOrder(id, `error=${result.error}`);
  }

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");

  backToOrder(id, "saved=cancelled");
}

/** Save the private notes on an order. */
export async function saveOrderNotesAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = readOrderId(formData);
  if (!id) {
    redirect("/admin/orders?error=invalid-id");
  }

  const notes = String(formData.get("notes") ?? "").trim().slice(0, MAX_NOTES_LENGTH);

  const result = await saveOrderNotes(id, notes, admin.email);
  if (!result.ok) {
    backToOrder(id, `error=${result.error}`);
  }

  revalidatePath(`/admin/orders/${id}`);

  backToOrder(id, "saved=notes");
}
