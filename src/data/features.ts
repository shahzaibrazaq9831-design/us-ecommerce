export interface FeatureItem {
  /** Card heading — bold, centred under the icon. */
  title: string;
  /**
   * Card subtext — gray. Hidden on phones (below 640px) so that two cards
   * still fit neatly in one row, exactly like the reference storefront.
   */
  description: string;
  /** Whole card links here. */
  href: string;
  /**
   * Benefit icon — a transparent 128x128 PNG of the thin gold-brown line
   * art used by the reference store (`public/brand/benefits`).
   */
  icon: string;
}

/**
 * Home-page "why shop with us" feature bar. Single source of truth for the
 * four cards — rebuilt to match the reference storefront (thin gold-brown
 * line icons, centred text, whole card clickable).
 */
export const features: FeatureItem[] = [
  {
    title: "Worldwide Shipping",
    description:
      "Free standard delivery where available at checkout. Dispatched in 1–3 days.",
    href: "/shipping",
    icon: "/brand/benefits/worldwide-delivery.png",
  },
  {
    title: "Clear Returns Process",
    description:
      "Refund or replacement for defective or damaged items. Contact us first.",
    href: "/returns",
    icon: "/brand/benefits/secure-payment.png",
  },
  {
    title: "Made-to-Order Stitching",
    description:
      "Standard size or custom measurements — tailored just for you.",
    href: "/made-to-order",
    icon: "/brand/benefits/stitching.png",
  },
  {
    title: "Personal Customer Support",
    description:
      "Help with sizing, product details and orders — by email or WhatsApp.",
    href: "/support",
    icon: "/brand/benefits/styling.png",
  },
];
