/**
 * New Arrivals view of the catalogue.
 *
 * The list is built from the catalogue the server read for the request
 * (`getStorefrontProducts`), so the grid shows the database price. This module
 * only adds the fields the collection grid needs for sorting: a created date,
 * a relevance rank and a best-selling rank.
 */

import { getNewArrivals, type Availability, type Product } from "@/lib/products";

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
  /** The full catalogue entry, so the quick view adds the live price. */
  product: Product;
}

/** New arrivals are dated from a fixed launch day, one hour apart. */
const LAUNCH_TIME = Date.UTC(2026, 10, 4, 10, 0, 0);
const HOUR_MS = 60 * 60 * 1000;

/** Build the New Arrivals grid from the database-backed catalogue. */
export function buildNewArrivalsCatalog(catalog: Product[]): NewArrivalProduct[] {
  return getNewArrivals(catalog).map((product, index) => ({
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
    product,
  }));
}

/**
 * Convert a catalog entry into the Product shape used by the cart, the
 * quick view and the wishlist. The entry carries the catalogue product, so
 * the price is the one the storefront showed.
 */
export function toCartProduct(item: NewArrivalProduct): Product {
  return {
    ...item.product,
    price: item.price,
    originalPrice: item.originalPrice,
    image: item.images[0] ?? item.product.image,
    images: item.images,
    badge: "new",
  };
}
