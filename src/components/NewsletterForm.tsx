"use client";

import { useState, FormEvent } from "react";
import { siteConfig } from "@/data/site";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <p className="newsletter-note" style={{ color: "var(--color-gold)" }}>
        Thank you for subscribing! Use code <strong>{siteConfig.promoCode}</strong> for {siteConfig.promoDiscount} off your first prepaid order.
      </p>
    );
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit" className="btn btn-primary">
        Subscribe
      </button>
    </form>
  );
}
