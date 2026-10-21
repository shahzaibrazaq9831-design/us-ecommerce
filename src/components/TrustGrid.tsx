import Link from "next/link";
import { Globe, Headset, Ruler, Undo2 } from "lucide-react";

const TRUST_ITEMS = [
  {
    label: "Worldwide Shipping",
    href: "/shipping",
    Icon: Globe,
  },
  {
    label: "Clear Returns Process",
    href: "/returns",
    Icon: Undo2,
  },
  {
    label: "Made-to-Order Stitching",
    href: "/products",
    Icon: Ruler,
  },
  {
    label: "Personal Customer Support",
    href: "/contact",
    Icon: Headset,
  },
];

/**
 * Compact 2x2 trust grid shown under the hero on phones (below 1024px).
 * The desktop feature bar keeps the richer, icon-box version.
 */
export default function TrustGrid() {
  return (
    <section className="trust-grid" aria-label="Why shop with us">
      {TRUST_ITEMS.map(({ label, href, Icon }) => (
        <Link key={label} href={href} className="trust-item">
          <Icon className="trust-icon" size={24} strokeWidth={1.25} aria-hidden="true" />
          <span className="trust-label">{label}</span>
        </Link>
      ))}
    </section>
  );
}
