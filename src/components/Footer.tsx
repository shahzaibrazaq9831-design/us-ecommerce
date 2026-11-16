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
    <footer className="footer bg-[var(--color-gray-100)] pb-0 pt-[var(--spacing-xl)] text-[var(--color-gray-700)]">
      <div className="container">
        <div className="footer-grid grid grid-cols-4 items-start gap-[var(--spacing-lg)] border-b border-[var(--color-gray-300)] pb-[var(--spacing-lg)]">
          {/* Column 1: company and how to reach us */}
          <div className="footer-brand">
            <Link
              href="/#hero"
              className="logo mb-[var(--spacing-md)] block text-black"
              aria-label={siteConfig.company}
            >
              <Image
                src="/images/logo-damsa.webp"
                alt={siteConfig.company}
                width={889}
                height={220}
                priority
                className="block h-[46px] w-auto"
              />
            </Link>
            <p className="mb-[var(--spacing-sm)] font-heading text-[1.05rem] font-semibold leading-[1.7] text-black">{siteConfig.company}</p>
            <p className="mb-[var(--spacing-md)] text-[0.9rem] leading-[1.7]">
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

          {/* Column 2: shop links */}
          <div>
            <h4 className="mb-[var(--spacing-md)] font-heading text-[1.1rem] font-semibold text-black">Shop</h4>
            <ul>
              {footerNavItems.slice(0, 6).map((link) => (
                <li key={link.href} className="mb-[var(--spacing-xs)]">
                  <Link
                    href={link.href}
                    className="text-[0.9rem] text-[var(--color-gray-700)] [transition:all_var(--transition-fast)] hover:pl-[4px] hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: help links */}
          <div>
            <h4 className="mb-[var(--spacing-md)] font-heading text-[1.1rem] font-semibold text-black">Help</h4>
            <ul>
              {helpLinks.map((link) => (
                <li key={link.href} className="mb-[var(--spacing-xs)]">
                  <Link
                    href={link.href}
                    className="text-[0.9rem] text-[var(--color-gray-700)] [transition:all_var(--transition-fast)] hover:pl-[4px] hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: newsletter */}
          <div>
            <div className="mb-[var(--spacing-md)]">
              <p className="mb-[6px] font-heading text-[1.05rem] font-semibold text-black">Join the list</p>
              <p className="mb-[var(--spacing-sm)] text-[0.85rem] leading-[1.6] text-[var(--color-gray-700)]">
                New arrivals and sale notices, sent a couple of times a month. No
                spam, and one click to leave whenever you want.
              </p>
              <NewsletterForm />
              <p className="text-[0.8rem] opacity-60">
                By subscribing you agree to receive up to two marketing emails a month.
                Unsubscribe anytime.
              </p>
            </div>

            <div className="flex gap-[var(--spacing-md)]" aria-label="Social media">
              {SOCIAL_ICONS.map((social) => (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-[40px] w-[40px] items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-gray-700)] text-[1rem] text-[var(--color-gray-400)] [transition:all_var(--transition-fast)] hover:border-primary hover:bg-primary hover:text-white hover:[transform:translateY(-3px)]"
                >
                  <i className={social.icon} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom flex items-center justify-between py-[var(--spacing-md)] text-[0.85rem]">
          <p className="text-[var(--color-gray-600)]">
            © {siteConfig.copyrightYear} {siteConfig.company}. All rights reserved.
          </p>

          {/* Payment methods — placeholders, edit to match your checkout. */}
          <div className="flex gap-[var(--spacing-md)] text-[1.5rem] text-[var(--color-gray-600)]" aria-label="Payment methods we accept">
            {PAYMENT_ICONS.map((payment) => (
              <i
                key={payment.key}
                className={payment.icon}
                title={payment.label}
                aria-label={payment.label}
              />
            ))}
            <span className="self-center text-[0.75rem] text-[var(--color-gray-500)]">Cash on delivery available</span>
          </div>
        </div>

        <div className="mt-[var(--spacing-md)] w-full pb-[var(--spacing-md)]">
          <DotMark
            text="DAMSA COTURE"
            height={170}
            headroom={80}
            upward={130}
            radius={95}
            ringSize={22}
            color="#9E9E9E"
            introEase={0.16}
            introStagger={220}
            introDistance={200}
            spreadEase={0.16}
            returnEase={0.05}
            mouseEase={0.28}
          />
        </div>
      </div>
    </footer>
  );
}
