"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LockKeyhole, Sparkles } from "lucide-react";
import { signInAction } from "../actions";

export default function LoginPanel({
  error,
  next,
  configured,
}: {
  error: string;
  next: string;
  configured: boolean;
}) {
  const reduce = useReducedMotion();

  const messages: Record<string, string> = {
    missing: "Enter both the email address and the password.",
    invalid: "That email address and password do not match.",
    "not-configured":
      "No admin sign-in is configured on this server. Set ADMIN_PASSWORD in the environment.",
  };

  return (
    <div className="admin-login-page">
      <motion.div
        className="admin-login-card"
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        <div className="admin-login-mark" aria-hidden="true">
          RE
        </div>
        <p className="admin-login-eyebrow">
          <Sparkles size={14} aria-hidden="true" /> Studio access
        </p>
        <h1>Welcome back</h1>
        <p className="admin-login-copy">
          Sign in to manage orders, the catalogue and your customers.
        </p>

        {error ? (
          <p className="admin-alert admin-alert--error" role="alert">
            {messages[error] ?? "That sign-in did not work. Try again."}
          </p>
        ) : null}
        {!configured ? (
          <p className="admin-alert admin-alert--warning" role="status">
            No admin sign-in is configured on this server. Set ADMIN_PASSWORD in the
            environment.
          </p>
        ) : null}

        <form action={signInAction} className="admin-login-form">
          <input type="hidden" name="next" value={next} />
          <label className="admin-field">
            <span className="admin-label">Email address</span>
            <input
              className="admin-input"
              type="email"
              name="email"
              autoComplete="username"
              placeholder="you@studio.com"
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
              placeholder="••••••••"
              required
            />
          </label>
          <motion.button
            type="submit"
            className="admin-button admin-button--primary admin-login-submit"
            whileTap={reduce ? undefined : { scale: 0.98 }}
          >
            <LockKeyhole size={16} aria-hidden="true" /> Sign in
          </motion.button>
        </form>
        <p className="admin-login-foot">Rung E Bahar · Private studio area</p>
      </motion.div>
    </div>
  );
}
