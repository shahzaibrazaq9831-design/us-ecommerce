"use client";

import { useState, type FormEvent } from "react";
import { siteConfig } from "@/data/site";

/**
 * Newsletter sign-up. The form does not post anywhere yet — the submit
 * handler is where you will wire up your mailing list.
 *
 * The hidden "company" field is a honeypot: people never see it, but bots
 * fill it in, so we can throw those submissions away.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot tripped — drop the submission silently.
    if (String(data.get("company") ?? "").trim() !== "") {
      return;
    }

    // TODO: send the address to your mailing list here.
    setStatus("success");
    setEmail("");
    form.reset();
  };

  if (status === "success") {
    return (
      <p className="newsletter-note" style={{ color: "var(--color-gold)" }}>
        Thank you for subscribing! Use code <strong>{siteConfig.promoCode}</strong> for{" "}
        {siteConfig.promoDiscount} off your first prepaid order.
      </p>
    );
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
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
      />

      {/* Honeypot — hidden from people, tempting for bots. */}
      <div className="honeypot-field" aria-hidden="true">
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button type="submit" className="btn btn-primary">
        Subscribe
      </button>
    </form>
  );
}
