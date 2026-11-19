"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";
import { signInAction } from "../actions";

export default function LoginPanel({
  error,
  next,
  configured,
  email,
}: {
  error: string;
  next: string;
  configured: boolean;
  email: string;
}) {
  const reduce = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);

  const messages: Record<string, string> = {
    missing: "Enter both the email address and the password.",
    invalid: `That password does not match the sign-in for ${email}.`,
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
        <Image
          src="/images/logo-rung-e-bahar.webp"
          alt="Rung E Bahar"
          width={889}
          height={220}
          priority
          className="admin-login-logo"
        />
        <p className="admin-login-eyebrow">
          <Sparkles size={14} aria-hidden="true" /> Studio access
        </p>
        <h1>Welcome back</h1>
        <p className="admin-login-copy">
          Sign in to manage orders, the catalogue and your customers.
        </p>
        {configured ? (
          <p className="admin-login-hint">
            Studio sign-in: <strong>{email}</strong>
          </p>
        ) : null}

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
              defaultValue={email}
              placeholder="you@studio.com"
              required
            />
          </label>
          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-password">
              Password
            </label>
            <div className="admin-password-field">
              <input
                id="admin-password"
                className="admin-input"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <motion.button
            type="submit"
            className="admin-button admin-button--primary admin-login-submit"
            whileTap={reduce ? undefined : { scale: 0.98 }}
          >
            <LockKeyhole size={16} aria-hidden="true" /> Sign in
          </motion.button>
        </form>
        <p className="admin-login-foot">DAMSA COTURE · Private studio area</p>
      </motion.div>
    </div>
  );
}
