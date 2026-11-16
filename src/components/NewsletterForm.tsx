"use client";

import { useState, type FormEvent } from "react";
import { siteConfig } from "@/data/site";

/**
 * Newsletter sign-up.
 *
 * The address goes to the server, which saves it as "pending" and sends
 * a confirmation email. The address only joins the list when that
 * email is confirmed — a double opt-in, so nobody can sign anybody else
 * up.
 *
 * The hidden "company" field is a honeypot: people never see it, but
 * bots fill it in, so we can throw those submissions away.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot tripped — drop the submission silently.
    if (String(data.get("company") ?? "").trim() !== "") {
      setStatus("sent");
      return;
    }

    setStatus("busy");
    setError("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          company: String(data.get("company") ?? ""),
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "We could not sign you up. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("sent");
      setEmail("");
      form.reset();
    } catch {
      setError("We could not reach the shop. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <p className="text-[0.8rem] opacity-60" style={{ color: "var(--color-gold)" }}>
        Thank you — please check your inbox and click the link to confirm. Once
        you have, use code <strong>{siteConfig.promoCode}</strong> for{" "}
        {siteConfig.promoDiscount} off your first prepaid order.
      </p>
    );
  }

  return (
    <form className="flex gap-[var(--spacing-md)] [@media(max-width:768px)]:flex-col" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        placeholder="Email address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-gray-300)] bg-white px-[20px] py-[14px] text-[0.95rem] text-[var(--color-gray-700)] [transition:all_var(--transition-fast)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gold)] focus:bg-white"
      />

      {/* Honeypot — hidden from people, tempting for bots. */}
      <div className="honeypot-field" aria-hidden="true">
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={status === "busy"}>
        {status === "busy" ? "Signing you up…" : "Subscribe"}
      </button>

      {error ? <p className="mt-[8px] text-[0.82rem] text-[var(--color-error)]">{error}</p> : null}
    </form>
  );
}
