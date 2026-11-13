import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdminConfigured } from "@/lib/admin-session";
import { signInAction } from "../actions";

export const metadata: Metadata = {
  title: "Sign in",
};

/** What each error code on the sign-in page says. */
const ERROR_MESSAGES: Record<string, string> = {
  missing: "Enter both the email address and the password.",
  invalid: "That email address and password do not match.",
  "not-configured":
    "No admin sign-in is configured on this server. Set ADMIN_EMAIL and ADMIN_PASSWORD.",
};

interface AdminLoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The first value of a query parameter, or "" when it is not there. */
function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  return (
    <Suspense fallback={<div className="admin-panel admin-loading">Loading…</div>}>
      <LoginPanel searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPanel({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const error = first(params.error);
  const next = first(params.next);
  const configured = isAdminConfigured();

  return (
    <div className="admin-login">
      <div className="admin-card">
        <h1 className="admin-title">Admin sign in</h1>
        <p className="admin-subtitle">
          The order screens are for the studio team only.
        </p>

        {error ? (
          <p className="admin-alert admin-alert--error" role="alert">
            {ERROR_MESSAGES[error] ?? "That sign-in did not work. Try again."}
          </p>
        ) : null}

        {!configured ? (
          <p className="admin-alert admin-alert--warning" role="status">
            No admin sign-in is configured on this server. Set ADMIN_EMAIL and
            ADMIN_PASSWORD in the environment.
          </p>
        ) : null}

        <form action={signInAction} className="admin-form">
          <input type="hidden" name="next" value={next} />

          <label className="admin-field">
            <span className="admin-label">Email</span>
            <input
              className="admin-input"
              type="email"
              name="email"
              autoComplete="username"
              required
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">Password</span>
            <input
              className="admin-input"
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="admin-button admin-button--primary">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
