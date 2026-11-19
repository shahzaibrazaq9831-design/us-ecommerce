import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getServiceClient } from "@/lib/admin/supabase";
import { STOREFRONT_PRODUCTS_TAG } from "@/lib/cache-tags";
import { priceFromDb } from "@/lib/db-price";
import {
  brands,
  categories,
  occasions,
  products as staticProducts,
  type Badge,
  type BrandSlug,
  type CategorySlug,
  type OccasionSlug,
  type Product,
  type StitchingOption,
} from "@/lib/products";

/**
 * The storefront catalogue, read from Supabase with the service key.
 *
 * The database is the source of truth for what is sold and what it costs; the
 * checked-in catalogue in `@/lib/products` is only used for two things:
 *
 *   1. the editorial fields the dashboard does not store yet (gallery order,
 *      long description) when a row omits them, and
 *   2. a safe fallback when the project has no service key configured, so
 *      local development still renders a shop.
 *
 * Prices always come from the `products` row when it exists — never from the
 * checked-in file — and go through `priceFromDb`, the single place the two
 * price columns are translated for the storefront.
 */

export { STOREFRONT_PRODUCTS_TAG };

interface DbImageRow {
  url: string;
  order: number | string | null;
}

interface DbCategoryRow {
  name: string | null;
}

interface DbBrandRow {
  name: string | null;
}

interface DbCollectionRow {
  occasion_slug: string | null;
}

interface DbProductRow {
  id: number | string;
  slug: string;
  name: string;
  description: string | null;
  category_slug: string;
  brand_slug: string;
  price_cents: number | string | null;
  sale_price_cents: number | string | null;
  badge: string | null;
  is_new: boolean | null;
  is_best_seller: boolean | null;
  status: string | null;
  sku: string | null;
  stock: number | string | null;
  stitching_options: string[] | null;
  categories: DbCategoryRow | DbCategoryRow[] | null;
  brands: DbBrandRow | DbBrandRow[] | null;
  product_images: DbImageRow[] | null;
  product_collections: DbCollectionRow[] | null;
}

const CATEGORY_SLUGS = new Set<string>(categories.map((category) => category.slug));
const OCCASION_SLUGS = new Set<string>(occasions.map((occasion) => occasion.slug));
const BRAND_SLUGS = new Set<string>(brands.map((brand) => brand.slug));
const STITCHING: StitchingOption[] = ["unstitched", "standard", "custom"];
const FALLBACK_IMAGE = "/images/01.png";

const STATIC_BY_SLUG = new Map(staticProducts.map((product) => [product.slug, product]));

const FIELD_SELECT = [
  "id",
  "slug",
  "name",
  "description",
  "category_slug",
  "brand_slug",
  "price_cents",
  "sale_price_cents",
  "badge",
  "is_new",
  "is_best_seller",
  "status",
  "sku",
  "stock",
  "stitching_options",
  "categories(name)",
  "brands(name)",
  'product_images(url,"order")',
  "product_collections(occasion_slug)",
].join(",");

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normaliseOccasions(values: (string | null)[] | null | undefined): OccasionSlug[] {
  const unique = new Set<OccasionSlug>();
  for (const value of values ?? []) {
    if (value && OCCASION_SLUGS.has(value)) unique.add(value as OccasionSlug);
  }
  return [...unique];
}

function normaliseStitching(values: string[] | null | undefined): StitchingOption[] {
  const unique = new Set<StitchingOption>();
  for (const value of values ?? []) {
    if (STITCHING.includes(value as StitchingOption)) {
      unique.add(value as StitchingOption);
    }
  }
  return [...unique];
}

function normaliseBadge(
  value: string | null,
  onSale: boolean,
  isNew: boolean,
  isBestSeller: boolean,
  fallback: Badge | undefined
): Badge | undefined {
  if (value === "new" || value === "sale" || value === "bestseller") return value;
  if (onSale) return "sale";
  if (isNew) return "new";
  if (isBestSeller) return "bestseller";
  return fallback;
}

function mapRow(row: DbProductRow): Product {
  const fallback = STATIC_BY_SLUG.get(row.slug);
  const { price, compareAt } = priceFromDb(row);
  const onSale = compareAt !== null && compareAt > price;

  const category = CATEGORY_SLUGS.has(row.category_slug)
    ? (row.category_slug as CategorySlug)
    : fallback?.category ?? "formals";
  const categoryName = one(row.categories)?.name ?? categories.find((item) => item.slug === category)?.name;

  const brand = BRAND_SLUGS.has(row.brand_slug)
    ? (row.brand_slug as BrandSlug)
    : fallback?.brand ?? "rung-e-bahar";

  const dbOccasions = normaliseOccasions(
    (row.product_collections ?? []).map((entry) => entry.occasion_slug)
  );
  const occasionList = dbOccasions.length
    ? dbOccasions
    : fallback?.occasions ?? [];

  const dbImages = (row.product_images ?? [])
    .slice()
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
    .map((image) => image.url)
    .filter(Boolean);
  const images = dbImages.length ? dbImages : fallback?.images ?? [];
  const gallery = images.length ? images : [FALLBACK_IMAGE];

  const stitching = normaliseStitching(row.stitching_options);
  const isNew = Boolean(row.is_new ?? fallback?.isNew);
  const isBestSeller = Boolean(row.is_best_seller ?? fallback?.isBestSeller);
  const stock = row.stock === null ? null : Number(row.stock);

  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    category,
    categoryLabel: categoryName ?? fallback?.categoryLabel ?? category,
    occasions: occasionList,
    brand,
    price,
    originalPrice: compareAt,
    image: gallery[0],
    images: gallery,
    badge: normaliseBadge(row.badge, onSale, isNew, isBestSeller, fallback?.badge),
    isNew,
    isBestSeller,
    stitching: stitching.length ? stitching : fallback?.stitching ?? ["standard", "custom"],
    description: row.description?.trim() || fallback?.description || "",
    sku: row.sku?.trim() || fallback?.sku || "",
    availability:
      fallback?.availability ?? (stock !== null && stock > 0 ? "in_stock" : "out_of_stock"),
  };
}

/**
 * Every active product the storefront can show, newest data first.
 *
 * Cached for a minute so a busy listing page does not hit the database on
 * every request; an admin save invalidates the tag immediately.
 */
export async function getStorefrontProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(STOREFRONT_PRODUCTS_TAG);
  cacheLife("minutes");

  const client = getServiceClient();
  if (!client) return staticProducts;

  const { data, error } = await client
    .from("products")
    .select(FIELD_SELECT)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    // A missing table or an unset key must never take the shop down.
    console.warn(
      `[storefront] Could not read the product catalogue, falling back to the checked-in data: ${error.message}`
    );
    return staticProducts;
  }

  if (!Array.isArray(data) || data.length === 0) return staticProducts;

  return (data as unknown as DbProductRow[]).map(mapRow);
}
