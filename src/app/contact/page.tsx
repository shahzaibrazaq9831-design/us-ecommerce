import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { siteConfig } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Questions about sizing, an order in progress, or a dress you have fallen for? Reach the shop by email, phone or WhatsApp — we answer every message ourselves.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header listing-header">
          <span className="listing-eyebrow">We reply ourselves</span>
          <h1 className="section-title">Contact Us</h1>
          <p className="section-subtitle">
            Sizing questions, an order in progress, or a piece you have your eye on —
            write to us and a real person will answer.
          </p>
        </div>

        <div className="contact-layout">
          <div className="contact-details">
            <h2>Reach us directly</h2>
            <ul className="contact-list contact-list--dark">
              <li>
                <strong>Email</strong>
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              </li>
              <li>
                <strong>Phone</strong>
                <a href={`tel:${siteConfig.phone.replace(/\s+/g, "")}`}>{siteConfig.phone}</a>
              </li>
              <li>
                <strong>WhatsApp</strong>
                <a href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                  Message us on WhatsApp
                </a>
              </li>
              <li>
                <strong>Company</strong>
                {siteConfig.company}
              </li>
            </ul>

            <h2>Opening hours</h2>
            <p className="contact-hours">
              Monday to Saturday, 10:00 to 19:00 (GMT). We answer WhatsApp messages
              through the evening too.
            </p>

            <h2>Before you write</h2>
            <ul className="contact-list contact-list--dark">
              <li>
                <Link href="/size-guide">Size guide</Link> — measurements and how to take
                them.
              </li>
              <li>
                <Link href="/custom-stitching">Custom stitching</Link> — unstitched,
                standard or made to you.
              </li>
              <li>
                <Link href="/shipping">Shipping</Link> and{" "}
                <Link href="/returns">returns</Link> — timelines and what we can do.
              </li>
            </ul>
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
}
