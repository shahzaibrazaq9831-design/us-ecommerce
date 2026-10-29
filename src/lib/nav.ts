/**
 * Main navigation — single source of truth for the header menu and the
 * mobile drawer menu.
 */

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
  { label: "Home", href: "/" },
  { label: "New Arrivals", href: "/shop" },
  { label: "Best Selling", href: "/shop" },
  {
    label: "Collections",
    href: "/collections",
    children: [
      { label: "Lehenga Choli", href: "/collections" },
      { label: "Maxi Gown", href: "/collections" },
      { label: "Kameez Shalwaar", href: "/collections" },
      { label: "Gharara / Plazoo", href: "/collections" },
      { label: "All Products", href: "/shop" },
    ],
  },
  { label: "Size Chart", href: "/size-chart" },
];
