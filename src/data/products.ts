/**
 * Products data — single source of truth.
 * Edit this file to add/update products. No API or database yet.
 */

export type Badge = "new" | "sale" | "bestseller";

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  badge?: Badge;
  rating: number;
  reviews: number;
  description: string;
  /** Selected options from the buy section (made-to-order items). */
  size?: string;
  lining?: string;
  notes?: string;
}

export const products: Product[] = [];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(slug: string, limit = 4): Product[] {
  return products.filter((product) => product.slug !== slug).slice(0, limit);
}

