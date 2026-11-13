"use server";

/**
 * The admin sign-in and sign-out.
 *
 * Both are server actions. The sign-in checks the credentials on the
 * server — the password is never looked at in the browser — and the
 * sign-out only works for somebody who is signed in.
 */

import { redirect } from "next/navigation";
import {
  endAdminSession,
  isAdminConfigured,
  isSessionConfigured,
  safeAdminPath,
  startAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-session";

/** Back to the sign-in page with the reason the sign-in did not work. */
function backToLogin(error: string, next: string): never {
  const params = new URLSearchParams({ error });
  if (next) params.set("next", next);

  redirect(`/admin/login?${params.toString()}`);
}

/** The sign-in form posts here. */
export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeAdminPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    backToLogin("missing", next);
  }

  if (!isAdminConfigured() || !isSessionConfigured()) {
    backToLogin("not-configured", next);
  }

  if (!verifyAdminCredentials(email, password)) {
    backToLogin("invalid", next);
  }

  await startAdminSession(email.toLowerCase());

  redirect(next || "/admin/orders");
}

/** The sign-out button posts here. */
export async function signOutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}
