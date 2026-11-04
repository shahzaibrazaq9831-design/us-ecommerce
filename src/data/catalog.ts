/**
 * Unified product lookup for the buy (/products/[slug]) page.
 *
 * The storefront links to product pages from three sources:
 *   1. The main catalog (`@/data/products`) — slug as-is.
 *   2. The New Arrivals grid (`@/data/newArrivals`) — `new-arrival-<slug>`.
 *   3. The home-page rails (`@/data/collections`) — each rail product has its
 *      own slug; entries shared between rails resolve to the same page.
 */

import { products, type Product } from "./products";
import { newArrivalsCatalog, toCartProduct } from "./newArrivals";
import {
  occasionProducts,
  newArrivalProducts,
  luxuryFormalProducts,
  bestSellingProducts,
  type CollectionProduct,
} from "./collections";

export interface DetailProduct extends Product {
  /** Full gallery; images[0] is the main view. */
  images: string[];
  /** ISO timestamp used for the created-style badge copy. */
  availability: "in_stock" | "out_of_stock";
}

/** Shared description for the rail-only ensembles (no per-item copy yet). */
const RAIL_DESCRIPTION =
  "A luxurious three-piece ensemble featuring intricate hand and sequence embroidery with pearls, cutdana and moti work. Includes an embellished kameez, a matching dupatta and made-to-order stitching — perfect for weddings, Eid, formals and evening celebrations.";

const RAIL_SOURCES: { items: CollectionProduct[]; category: string }[] = [
  { items: occasionProducts, category: "Occasions" },
  { items: newArrivalProducts, category: "New Arrivals" },
  { items: luxuryFormalProducts, category: "Luxury Formals" },
  { items: bestSellingProducts, category: "Best Selling" },
];

/** Deterministic numeric id from a slug (rail products have no numeric id). */
const hashId = (slug: string): number => {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 100000;
  }
  return 5000 + hash;
};

export function getDetailProductBySlug(slug: string): DetailProduct | undefined {
  const main = products.find((product) => product.slug === slug);
  if (main) {
    return { ...main, images: [main.image], availability: "in_stock" };
  }

  const arrival = newArrivalsCatalog.find(
    (item) => `new-arrival-${item.slug}` === slug
  );
  if (arrival) {
    const base = toCartProduct(arrival);
    return {
      ...base,
      slug,
      images: arrival.images,
      availability: arrival.availability,
    };
  }

  for (const source of RAIL_SOURCES) {
    const rail = source.items.find((item) => item.slug === slug);
    if (rail) {
      return {
        id: hashId(rail.slug),
        slug: rail.slug,
        name: rail.name,
        category: source.category,
        price: rail.price,
        originalPrice: rail.originalPrice,
        image: rail.images[0],
        images: rail.images,
        badge: "sale",
        rating: 4.8,
        reviews: 118,
        description: RAIL_DESCRIPTION,
        availability: "in_stock",
      };
    }
  }

  return undefined;
}

/**
 * Slugs worth prerendering at build time: the main catalog plus the rail
 * ensembles featured on the home page. The 204 New Arrivals pages render
 * on demand (ISR) instead — prerendering all of them exhausts this machine's
 * memory during `next build`.
 */
export function getFeaturedDetailSlugs(): string[] {
  const slugs = new Set<string>();
  for (const product of products) slugs.add(product.slug);
  for (const source of RAIL_SOURCES) {
    for (const item of source.items) slugs.add(item.slug);
  }
  return [...slugs];
}

/** All slugs the /products/[slug] route knows about (for static generation). */
export function getAllDetailSlugs(): string[] {
  const slugs = new Set<string>();
  for (const product of products) slugs.add(product.slug);
  for (const item of newArrivalsCatalog) slugs.add(`new-arrival-${item.slug}`);
  for (const source of RAIL_SOURCES) {
    for (const item of source.items) slugs.add(item.slug);
  }
  return [...slugs];
}
