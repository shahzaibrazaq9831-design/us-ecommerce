import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import DotMark from "@/components/DotMark";
import NewsletterForm from "@/components/NewsletterForm";
import { footerNavItems } from "@/lib/nav";

/**
 * Social profiles — the icons shown in the footer. Add or remove entries
 * here; the full list of links lives in `siteConfig.social`.
 */
const SOCIAL_ICONS = [
  { key: "instagram", href: siteConfig.social.instagram, icon: "fab fa-instagram", label: "Instagram" },
  { key: "facebook", href: siteConfig.social.facebook, icon: "fab fa-facebook-f", label: "Facebook" },
  { key: "tiktok", href: siteConfig.social.tiktok, icon: "fab fa-tiktok", label: "TikTok" },
  { key: "whatsapp", href: siteConfig.whatsapp, icon: "fab fa-whatsapp", label: "WhatsApp" },
] as const;

/**
 * Payment methods we accept — placeholders. Swap the list for the methods
 * your checkout actually takes before you go live.
 */
const PAYMENT_ICONS = [
  { key: "visa", icon: "fab fa-cc-visa", label: "Visa" },
  { key: "mastercard", icon: "fab fa-cc-mastercard", label: "Mastercard" },
  { key: "amex", icon: "fab fa-cc-amex", label: "American Express" },
  { key: "discover", icon: "fab fa-cc-discover", label: "Discover" },
  { key: "paypal", icon: "fab fa-paypal", label: "PayPal" },
] as const;

export default function Footer() {
  const helpLinks = [
    { label: "Shipping and Delivery", href: "/shipping" },
    { label: "Returns and Refunds", href: "/returns" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: company and how to reach us */}
          <div className="footer-brand">
            <Link href="/#hero" className="logo" aria-label={siteConfig.company}>
              <Image
                src="/images/logo-damsa.webp"
                alt={siteConfig.company}
                width={889}
                height={220}
                priority
                className="footer-logo-img"
              />
            </Link>
            <p className="footer-company">{siteConfig.company}</p>
            <p>
              {siteConfig.tagline}. Made to order, shipped worldwide, and finished by
              hand. If anything is unclear, write to us and we will sort it out.
            </p>
            <ul className="contact-list">
              <li>
                <strong>Email</strong>
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              </li>
              <li>
                <strong>Phone</strong>
                <a href={`tel:${siteConfig.phone.replace(/\s+/g, "")}`}>{siteConfig.phone}</a>
              </li>
            </ul>
          </div>

          {/* Column 2: shop and help links */}
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              {footerNavItems.slice(0, 6).map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>

            <h4 className="footer-col-heading">Help</h4>
            <ul>
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: newsletter */}
          <div className="footer-col">
            <div className="footer-newsletter">
              <p className="footer-newsletter-title">Join the list</p>
              <p className="footer-newsletter-text">
                New arrivals and sale notices, sent a couple of times a month. No
                spam, and one click to leave whenever you want.
              </p>
              <NewsletterForm />
              <p className="newsletter-note">
                By subscribing you agree to receive up to two marketing emails a month.
                Unsubscribe anytime.
              </p>
            </div>

            <div className="social-links" aria-label="Social media">
              {SOCIAL_ICONS.map((social) => (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <i className={social.icon} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {siteConfig.copyrightYear} {siteConfig.company}. All rights reserved.
          </p>

          {/* Payment methods — placeholders, edit to match your checkout. */}
          <div className="payment-icons" aria-label="Payment methods we accept">
            {PAYMENT_ICONS.map((payment) => (
              <i
                key={payment.key}
                className={payment.icon}
                title={payment.label}
                aria-label={payment.label}
              />
            ))}
            <span className="payment-note">Cash on delivery available</span>
          </div>
        </div>

        <div className="footer-mark">
          <DotMark text={siteConfig.company.toUpperCase()} height={150} color="#9E9E9E" />
        </div>
      </div>
    </footer>
  );
}
