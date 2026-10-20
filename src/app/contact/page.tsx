"use client";

import { useState } from "react";
import { siteConfig } from "@/data/site";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: "center", maxWidth: "600px" }}>
          <h1 className="section-title">Message Sent</h1>
          <p style={{ color: "var(--color-gray-600)" }}>Thank you for contacting us. We’ll get back to you soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "900px" }}>
        <div className="section-header">
          <h1 className="section-title">Contact Us</h1>
          <p className="section-subtitle">We’d love to hear from you</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "12px" }}>Get in Touch</h2>
            <p style={{ color: "var(--color-gray-700)", marginBottom: "16px" }}>Have questions about sizing, orders, or our collection? Reach out and we’ll be happy to help.</p>
            <ul style={{ display: "grid", gap: "10px", color: "var(--color-gray-700)" }}>
              <li><strong>Email:</strong> {siteConfig.email}</li>
              <li><strong>Phone:</strong> {siteConfig.phone}</li>
              <li><strong>Company:</strong> {siteConfig.company}</li>
            </ul>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ display: "grid", gap: "16px" }}>
            <input required placeholder="Name" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
            <input required placeholder="Email" type="email" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
            <input placeholder="Subject" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
            <textarea required placeholder="Message" rows={6} style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)", resize: "vertical" }} />
            <button type="submit" className="btn btn-primary">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
