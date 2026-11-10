import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import DotMark from "@/components/DotMark";
import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
  const quickLinks = [
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
          {/* Column 1: brand + contact */}
          <div className="footer-brand">
            <Link href="/#hero" className="logo" aria-label="DAMSA COTURE">
              <Image
                src="/images/logo-damsa.webp"
                alt="DAMSA COTURE"
                width={889}
                height={220}
                priority
                className="footer-logo-img"
              />
            </Link>
            <p>
              If you have any confusion or question you can contact us on WhatsApp as well as on our email which as follows. Our email
              is{" "}
              <strong>
                <a href="mailto:rungebahar@gmail.com">rungebahar@gmail.com</a>
              </strong>
              .
            </p>
            <p>
              WhatsApp number is <strong>447476469395</strong>
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Subscribe to New Arrivals */}
          <div className="footer-col">
            <div className="footer-newsletter">
              <p className="footer-newsletter-title">Subscribe to New Arrivals</p>
              <p className="footer-newsletter-text">
                We will answer any questions you may have about our products, services, or ongoing sale offers.
              </p>
              <NewsletterForm />
              <p className="newsletter-note">
                By subscribing you agree to receive up to two marketing emails a month. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
        <div className="footer-mark">
          <DotMark text="DAMSA COTURE" height={150} color="#9E9E9E" />
        </div>
      </div>
    </footer>
  );
}
