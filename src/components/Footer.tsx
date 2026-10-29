import Link from "next/link";
import { siteConfig } from "@/data/site";

export default function Footer() {
  const shopLinks = [
    { label: "Shop All", href: "/shop" },
    { label: "New Arrivals", href: "/shop" },
    { label: "Best Sellers", href: "/shop" },
    { label: "Bridal", href: "/shop" },
    { label: "Formals", href: "/shop" },
  ];

  const customerLinks = [
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping & Delivery", href: "/shipping" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Reviews", href: "/reviews" },
    { label: "My Account", href: "/account" },
  ];

  const policyLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/#hero" className="logo">
              {siteConfig.name}
            </Link>
            <p>
              Luxury designer-inspired Pakistani dresses for every special occasion. Quality craftsmanship, timeless
              elegance, and worldwide delivery.
            </p>
            <div className="social-links">
              <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram" />
              </a>
              <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f" />
              </a>
              <a href={siteConfig.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <i className="fab fa-tiktok" />
              </a>
              <a href={siteConfig.social.threads} target="_blank" rel="noopener noreferrer" aria-label="Threads">
                <i className="fab fa-threads" />
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Customer Care</h4>
            <ul>
              {customerLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact & Policies</h4>
            <ul className="contact-list">
              <li>
                <strong>Email:</strong> <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              </li>
              <li>
                <strong>Phone:</strong> <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
              </li>
              <li>
                <strong>WhatsApp:</strong> <a href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">Chat with us</a>
              </li>
              <li>
                <strong>Company:</strong> {siteConfig.company}
              </li>
            </ul>
            <ul style={{ marginTop: "16px" }}>
              {policyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.</p>
          <div className="payment-icons">
            <i className="fab fa-cc-visa" />
            <i className="fab fa-cc-mastercard" />
            <i className="fab fa-cc-amex" />
            <i className="fab fa-cc-paypal" />
          </div>
        </div>
      </div>
    </footer>
  );
}
