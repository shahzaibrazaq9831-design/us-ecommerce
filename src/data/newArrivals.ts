/**
 * New Arrivals view of the catalogue.
 *
 * The list itself is built from `@/lib/products` — the same products the
 * rest of the shop shows — and this module only adds the fields the
 * collection grid needs for sorting: a created date, a relevance rank and a
 * best-selling rank.
 */

import { getNewArrivals, getProductBySlug, type Availability, type Product } from "@/lib/products";

export type { Availability };

export interface NewArrivalProduct {
  id: string;
  /** Catalogue slug of the product. */
  slug: string;
  name: string;
  images: string[];
  /** Selling price in the store's base currency (PKR). */
  price: number;
  /** Compare-at price in PKR, or null when the item is not on sale. */
  originalPrice: number | null;
  availability: Availability;
  /** ISO timestamp used by the "Date" sort options. Descending = newest. */
  createdAt: string;
  /** Lower number = more relevant (used by "Most relevant"). */
  relevanceRank: number;
  /** Lower number = stronger seller (used by "Best selling"). */
  bestSellingRank: number;
}

/** New arrivals are dated from a fixed launch day, one hour apart. */
const LAUNCH_TIME = Date.UTC(2026, 10, 4, 10, 0, 0);
const HOUR_MS = 60 * 60 * 1000;

export const newArrivalsCatalog: NewArrivalProduct[] = getNewArrivals().map(
  (product, index) => ({
    id: product.slug,
    slug: product.slug,
    name: product.name,
    images: product.images,
    price: product.price,
    originalPrice: product.originalPrice,
    availability: product.availability,
    createdAt: new Date(LAUNCH_TIME + index * HOUR_MS).toISOString(),
    relevanceRank: index + 1,
    bestSellingRank: index + 1,
  })
);

export const NEW_ARRIVALS_COUNT = newArrivalsCatalog.length;

/**
 * Convert a catalog entry into the Product shape used by the cart, the
 * quick view and the wishlist.
 */
export function toCartProduct(item: NewArrivalProduct): Product {
  const product = getProductBySlug(item.slug);
  if (product) return { ...product, badge: "new" };

  // Fallback for a catalogue entry that is no longer in the main list.
  return {
    id: 0,
    slug: item.slug,
    name: item.name,
    category: "formals",
    categoryLabel: "Formals",
    occasions: [],
    brand: "rung-e-bahar",
    price: item.price,
    originalPrice: item.originalPrice,
    image: item.images[0],
    images: item.images,
    badge: "new",
    isNew: true,
    isBestSeller: false,
    stitching: ["standard", "custom"],
    description: "",
    sku: `REB-NEW-${item.slug.toUpperCase()}`,
    availability: item.availability,
  };
}
