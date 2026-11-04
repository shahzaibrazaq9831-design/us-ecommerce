import type { LucideIcon } from "lucide-react";
import {
  Truck,
  Globe,
  ShieldCheck,
  Scissors,
  MessageCircle,
} from "lucide-react";

export interface FeatureItem {
  /** Card heading — bold, ~16px, dark. */
  title: string;
  /** Card subtext — gray, ~14px, clamped to 3 lines. */
  description: string;
  /** Whole card links here. */
  href: string;
  /** Thin line icon (strokeWidth ~1), rendered at ~48px. */
  icon: LucideIcon;
  /** Optional small badge icon composed over the main icon (e.g. globe on truck). */
  badgeIcon?: LucideIcon;
}

/**
 * Home-page "why shop with us" feature bar. Single source of truth for the
 * four cards — rebuilt to match the reference storefront (thin gold-brown
 * line icons, centered text, whole card clickable).
 */
export const features: FeatureItem[] = [
  {
    title: "Worldwide Shipping",
    description:
      "Free standard delivery where available at checkout. Dispatched in 1–3 days.",
    href: "/shipping",
    icon: Truck,
    badgeIcon: Globe,
  },
  {
    title: "Clear Returns Process",
    description:
      "Refund or replacement for defective or damaged items. Contact us first.",
    href: "/returns",
    icon: ShieldCheck,
  },
  {
    title: "Made-to-Order Stitching",
    description:
      "Standard size or custom measurements — tailored just for you.",
    href: "/made-to-order",
    icon: Scissors,
  },
  {
    title: "Personal Customer Support",
    description:
      "Help with sizing, product details and orders — by email or WhatsApp.",
    href: "/support",
    icon: MessageCircle,
  },
];
