/**
 * Main navigation — single source of truth for the header menu and the
 * mobile drawer menu.
 *
 * The list is data, not markup: adding a page to the store means adding one
 * line here and the desktop nav, the mobile drawer and the footer all pick
 * it up. Labels are the shop's own wording.
 */

import { brands, occasions } from "@/lib/products";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
}

export const navItems: NavItem[] = [
  { label: "Shop All", href: "/shop" },
  { label: "Best Sellers", href: "/best-sellers" },
  { label: "New Arrivals", href: "/new-arrivals" },
  {
    label: "Occasions",
    href: "/collections",
    children: occasions.map((occasion) => ({
      label: occasion.name,
      href: occasion.href,
    })),
  },
  { label: "Wedding", href: "/categories/wedding" },
  { label: "Bridal", href: "/categories/bridal" },
  { label: "Formals", href: "/categories/formals" },
  { label: "Chiffon", href: "/categories/chiffon" },
  { label: "Sale", href: "/sale" },
  {
    label: "Designers",
    href: "/brands",
    children: brands.map((brand) => ({
      label: brand.name,
      href: brand.href,
    })),
  },
  { label: "Reviews", href: "/reviews" },
];

/** Secondary links used by the footer and the mobile drawer footer. */
export const footerNavItems: NavChild[] = [
  { label: "Shop All", href: "/shop" },
  { label: "Best Sellers", href: "/best-sellers" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Sale", href: "/sale" },
  { label: "Shop by Occasion", href: "/collections" },
  { label: "Designers", href: "/brands" },
  { label: "Custom Stitching", href: "/custom-stitching" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "Product Disclosure", href: "/product-disclosure" },
  { label: "Reviews", href: "/reviews" },
];
