/**
 * Home-page product rails.
 *
 * The lists are built from the catalogue the server read for the request
 * (`getStorefrontProducts`), so every rail shows the database price. The
 * checked-in catalogue is never read here.
 *
 * `slug` links the card to its product (buy) page at `/products/<slug>`.
 */

import {
  getBestSellers,
  getNewArrivals,
  getProductsBySlugs,
  luxuryFormalShelf,
  occasions,
  type Product,
} from "@/lib/products";

export interface CollectionProduct {
  /** Unique key for the rail. */
  id: string;
  /** Product-page slug. */
  slug: string;
  name: string;
  /** Small optional line above the name (used by the occasion rail). */
  label?: string;
  images: string[];
  /** Current selling price in PKR. */
  price: number;
  /** Compare-at price in PKR (shown grey + struck through), or null. */
  originalPrice: number | null;
  href: string;
}

const href = (slug: string) => `/products/${slug}`;

/** Turn a catalogue product into a rail card. */
export function toCollectionProduct(product: Product): CollectionProduct {
  return {
    id: product.slug,
    slug: product.slug,
    name: product.name,
    images: product.images,
    price: product.price,
    originalPrice: product.originalPrice,
    href: href(product.slug),
  };
}

/**
 * Shop by Occasion — the eight occasion photos paired with the piece that
 * leads each celebration. The card links to the celebration's collection page.
 */
export function buildOccasionProducts(catalog: Product[]): CollectionProduct[] {
  const bySlug = new Map(catalog.map((product) => [product.slug, product]));

  return occasions
    .map((occasion): CollectionProduct | null => {
      const product = bySlug.get(occasion.featuredSlug);
      if (!product) return null;

      return {
        id: occasion.slug,
        slug: product.slug,
        label: occasion.name,
        name: product.name,
        // The lookbook photo leads, the product gallery follows.
        images: [occasion.photo, ...product.images.slice(1)],
        price: product.price,
        originalPrice: product.originalPrice,
        href: occasion.href,
      };
    })
    .filter((entry): entry is CollectionProduct => entry !== null);
}

/** New Arrivals — the freshest pieces in the catalogue. */
export function buildNewArrivalProducts(catalog: Product[]): CollectionProduct[] {
  return getNewArrivals(catalog).map(toCollectionProduct);
}

/** Luxury Formals — a curated shelf of our heaviest formal pieces. */
export function buildLuxuryFormalProducts(catalog: Product[]): CollectionProduct[] {
  return getProductsBySlugs(luxuryFormalShelf, catalog).map(toCollectionProduct);
}

/** Best Selling — the pieces that keep getting ordered. */
export function buildBestSellingProducts(catalog: Product[]): CollectionProduct[] {
  return getBestSellers(catalog).map(toCollectionProduct);
}
