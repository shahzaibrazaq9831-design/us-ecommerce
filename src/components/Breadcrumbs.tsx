"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { getDetailProductBySlug } from "@/data/catalog";

/**
 * Smart breadcrumb bar shown under the header on every page.
 *
 * The trail is derived from the current route (not from browsing history),
 * so it always reflects where the visitor is:
 *   /                      → Home
 *   /shop                  → Home › Shop
 *   /products/<slug>       → Home › Shop › <Product name>
 *   /collections/new-arrivals → Home › Collections › New Arrivals
 *
 * Every crumb except the current page is clickable.
 */

const SITE_URL = "https://www.rungebahar.com";

const STATIC_LABELS: Record<string, string> = {
  shop: "Shop",
  collections: "Collections",
  "new-arrivals": "New Arrivals",
  "best-sellers": "Best Sellers",
  sale: "Sale",
  categories: "Categories",
  brands: "Designers",
  "custom-stitching": "Custom Stitching",
  "size-guide": "Size Guide",
  "size-chart": "Size Chart",
  "product-disclosure": "Product Disclosure",
  cart: "Cart",
  checkout: "Checkout",
  wishlist: "Wishlist",
  account: "My Account",
  contact: "Contact",
  reviews: "Reviews",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  returns: "Returns & Exchanges",
  "shipping": "Shipping & Delivery",
};

interface Crumb {
  label: string;
  href: string;
}

function humanize(segment: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  })();
  return decoded
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function labelFor(segments: string[], index: number): string {
  const segment = segments[index];
  const parent = index > 0 ? segments[index - 1] : undefined;

  // Product detail pages: show the real product name when we know it.
  if (parent === "products") {
    const product = getDetailProductBySlug(segment);
    if (product?.name) return product.name;
  }

  return STATIC_LABELS[segment] ?? humanize(segment);
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];

  segments.forEach((segment, index) => {
    // /products/* has no listing page of its own — point visitors back to the shop.
    if (segment === "products") {
      crumbs.push({ label: "Shop", href: "/shop" });
      return;
    }
    crumbs.push({
      label: labelFor(segments, index),
      href: `/${segments.slice(0, index + 1).join("/")}`,
    });
  });

  return crumbs;
}

export default function Breadcrumbs() {
  const pathname = usePathname() ?? "/";
  const crumbs = buildCrumbs(pathname);

  // Home already has the hero banner right below the header — the lone
  // "Home" crumb adds nothing, so the bar only appears on inner pages.
  if (pathname === "/") return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${SITE_URL}${crumb.href}`,
    })),
  };

  return (
    <nav className="site-breadcrumbs" aria-label="Breadcrumb">
      <div className="container site-breadcrumbs-inner">
        <ol className="site-breadcrumbs-list">
          {crumbs.map((crumb, index) => {
            const isCurrent = index === crumbs.length - 1;
            return (
              <li key={crumb.href} className="site-breadcrumbs-item">
                {index > 0 && (
                  <ChevronRight
                    className="site-breadcrumbs-separator"
                    size={13}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )}
                {isCurrent ? (
                  <span className="site-breadcrumbs-current" aria-current="page">
                    {index === 0 && (
                      <Home size={13} strokeWidth={2} aria-hidden="true" />
                    )}
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="site-breadcrumbs-link">
                    {index === 0 && (
                      <Home size={13} strokeWidth={2} aria-hidden="true" />
                    )}
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <script
        type="application/ld+json"
        // Static, serializable payload derived from the route — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  );
}
