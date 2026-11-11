"use client";

import { useState, type FormEvent } from "react";

/**
 * Contact form. It does not post anywhere yet — the submit handler is where
 * you will wire up your form endpoint (Formspree, your own API route, or an
 * email service).
 *
 * The hidden "company" field is a honeypot: people never see it, but bots
 * fill it in, so we can ignore those submissions.
 */
export default function ContactForm() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot tripped — pretend everything is fine and drop the message.
    if (String(data.get("company") ?? "").trim() !== "") {
      setSent(true);
      return;
    }

    // TODO: send the message to your inbox here.
    setSent(true);
    form.reset();
  };

  if (sent) {
    return (
      <div className="contact-form-done" role="status">
        <h2>Thank you — message received</h2>
        <p>
          We read every message ourselves and usually reply within one working day.
          If it is urgent, WhatsApp is faster than email.
        </p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <label className="contact-field">
          <span>Your name</span>
          <input name="name" type="text" required placeholder="Full name" />
        </label>
        <label className="contact-field">
          <span>Email address</span>
          <input name="email" type="email" required placeholder="you@example.com" />
        </label>
      </div>

      <label className="contact-field">
        <span>What is it about?</span>
        <select name="subject" defaultValue="Sizing help">
          <option>Sizing help</option>
          <option>An existing order</option>
          <option>Custom measurements</option>
          <option>Delivery and shipping</option>
          <option>Something else</option>
        </select>
      </label>

      <label className="contact-field">
        <span>Your message</span>
        <textarea
          name="message"
          rows={6}
          required
          placeholder="Tell us what you need — include your order number if you have one."
        />
      </label>

      {/* Honeypot — hidden from people, tempting for bots. */}
      <div className="honeypot-field" aria-hidden="true">
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button type="submit" className="btn btn-primary">
        Send message
      </button>
    </form>
  );
}
