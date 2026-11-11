/**
 * Unified product lookup for the buy (/products/[slug]) page.
 *
 * The storefront links to product pages from several places — the shop grid,
 * the home-page rails and the new-arrivals collection. Some of those links
 * carry the legacy `new-arrival-` prefix, so the lookup accepts both forms
 * and always answers with the catalogue entry from `@/lib/products`.
 */

import { getAllProductSlugs, getProductBySlug, type Product } from "@/lib/products";

/** The buy page shows the catalogue entry as it is — no extra fields needed. */
export type DetailProduct = Product;

/**
 * Find a product by its page slug. `new-arrival-<slug>` is accepted as well,
 * so the older collection links keep working.
 */
export function getDetailProductBySlug(slug: string): DetailProduct | undefined {
  return getProductBySlug(slug);
}

/**
 * Slugs worth prerendering at build time — every product in the catalogue.
 * Unknown slugs still resolve on demand (ISR), so a piece added later works
 * without a rebuild.
 */
export function getFeaturedDetailSlugs(): string[] {
  return getAllProductSlugs();
}

/** All slugs the /products/[slug] route knows about (for static generation). */
export function getAllDetailSlugs(): string[] {
  const slugs = new Set<string>();
  for (const slug of getAllProductSlugs()) {
    slugs.add(slug);
    slugs.add(`new-arrival-${slug}`);
  }
  return [...slugs];
}
