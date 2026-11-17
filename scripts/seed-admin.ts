/**
 * Seed the admin dashboard tables from the store's real local data.
 *
 * Run with: npm run seed:admin
 *
 * The npm script loads .env.local, so the service key never appears in this
 * file or in the shell history. This script is server-side only; it reads the
 * catalogue and local JSON files and writes them to Supabase with the
 * service-role key. It never prints the key or the project URL.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { brands, categories, occasions, products } from "../src/lib/products";
import { siteConfig } from "../src/data/site";
import { normaliseAdminOrderStatus } from "../src/lib/admin/status";

/** Same public default the order layer uses when the env var is absent. */
const DEFAULT_SUPABASE_URL = "https://ylhtywpwykiakfzaades.supabase.co";

/** The dashboard's existing shipping default (src/lib/admin/data.ts). */
const SHIPPING_TEXT =
  "Free worldwide delivery on every order. Dispatch takes 3–5 working days, with made-to-order stitching adding 7–10 days.";

const DATA_DIR = path.join(process.cwd(), ".data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

type CountKey =
  | "categories"
  | "brands"
  | "occasions"
  | "products"
  | "product_images"
  | "product_collections"
  | "stock_sizes"
  | "reviews"
  | "review_photos"
  | "site_settings"
  | "store_orders";

const counts: Record<CountKey, number> = {
  categories: 0,
  brands: 0,
  occasions: 0,
  products: 0,
  product_images: 0,
  product_collections: 0,
  stock_sizes: 0,
  reviews: 0,
  review_photos: 0,
  site_settings: 0,
  store_orders: 0,
};

interface LocalReview {
  id?: unknown;
  productSlug?: unknown;
  rating?: unknown;
  text?: unknown;
  name?: unknown;
  status?: unknown;
  createdAt?: unknown;
  orderId?: unknown;
  verified?: unknown;
  photo?: unknown;
  photoType?: unknown;
}

interface LocalOrder {
  id?: unknown;
  date?: unknown;
  email?: unknown;
  customer?: unknown;
  idempotencyKey?: unknown;
  status?: unknown;
}

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function toCents(rupees: number): number {
  // Catalogue prices are whole PKR rupees; the SQL columns are integer cents.
  return Math.round(rupees * 100);
}

function assertOk(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function readJsonArray<T>(
  filePath: string,
  options: { optional?: boolean } = {}
): Promise<T[]> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (options.optional && (error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} must contain a JSON array.`);
  }
  return parsed as T[];
}

async function upsertRows(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  context: string
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await client.from(table).upsert(rows, { onConflict });
  assertOk(error, context);
  counts[table as CountKey] = rows.length;
}

function reviewStatus(value: unknown): "pending" | "approved" | "hidden" {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw === "approved") return "approved";
  // Local records use "rejected"; the SQL check constraint uses "hidden".
  if (raw === "hidden" || raw === "rejected") return "hidden";
  return "pending";
}

function validTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function seedTaxonomy(): {
  categoryRows: Record<string, unknown>[];
  brandRows: Record<string, unknown>[];
  occasionRows: Record<string, unknown>[];
} {
  // Only slugs that actually appear on a product are seeded. Metadata
  // (labels, descriptions, images) comes from the catalogue taxonomy arrays.
  const usedCategories = new Set(products.map((product) => product.category));
  const usedBrands = new Set(products.map((product) => product.brand));
  const usedOccasions = new Set(products.flatMap((product) => product.occasions));

  const categoryRows = [...usedCategories].map((slug) => {
    const meta = categories.find((category) => category.slug === slug);
    const fromProduct = products.find((product) => product.category === slug);
    return {
      slug,
      name: meta?.name ?? fromProduct?.categoryLabel ?? slug,
      description: meta?.description ?? null,
      image_url: meta?.image ?? null,
    };
  });

  const brandRows = [...usedBrands].map((slug) => {
    const meta = brands.find((brand) => brand.slug === slug);
    return {
      slug,
      name: meta?.name ?? slug,
      description: meta?.description ?? null,
      image_url: null,
    };
  });

  const occasionRows = [...usedOccasions].map((slug) => {
    const meta = occasions.find((occasion) => occasion.slug === slug);
    return {
      slug,
      name: meta?.name ?? slug,
      description: meta?.description ?? null,
      photo_url: meta?.photo ?? null,
      featured_slug: meta?.featuredSlug ?? null,
    };
  });

  return { categoryRows, brandRows, occasionRows };
}

async function replaceProductChildren(
  client: SupabaseClient,
  table: "product_images" | "product_collections",
  rows: Record<string, unknown>[],
  productIds: number[]
): Promise<void> {
  if (productIds.length === 0) return;

  const { error: deleteError } = await client
    .from(table)
    .delete()
    .in("product_id", productIds);
  assertOk(deleteError, `Could not reset ${table}`);

  if (rows.length) {
    const { error: insertError } = await client.from(table).insert(rows);
    assertOk(insertError, `Could not seed ${table}`);
  }
  counts[table] = rows.length;
}

async function main(): Promise<void> {
  const key = env("SUPABASE_SERVICE_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    throw new Error(
      "No Supabase service key configured. Set SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local, then run npm run seed:admin."
    );
  }
  const url = env("NEXT_PUBLIC_SUPABASE_URL") || DEFAULT_SUPABASE_URL;

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date().toISOString();
  const localOrders = await readJsonArray<LocalOrder>(ORDERS_FILE);
  const localReviews = await readJsonArray<LocalReview>(REVIEWS_FILE, { optional: true });

  const { categoryRows, brandRows, occasionRows } = seedTaxonomy();
  await upsertRows(client, "categories", categoryRows, "slug", "Could not seed categories");
  await upsertRows(client, "brands", brandRows, "slug", "Could not seed brands");
  await upsertRows(client, "occasions", occasionRows, "slug", "Could not seed occasions");

  const productRows: Record<string, unknown>[] = products.map((product) => ({
    slug: product.slug,
    name: product.name,
    description: product.description,
    category_slug: product.category,
    brand_slug: product.brand,
    price_cents: toCents(product.price),
    sale_price_cents:
      product.originalPrice === null ? null : toCents(product.originalPrice),
    badge: product.badge ?? null,
    is_new: product.isNew,
    is_best_seller: product.isBestSeller,
    status: "active",
    sku: product.sku,
    // The catalogue has availability flags but no numeric stock count.
    stock: 0,
    stitching_options: product.stitching,
    updated_at: now,
  }));
  await upsertRows(client, "products", productRows, "slug", "Could not seed products");

  const productSlugs = products.map((product) => product.slug);
  const { data: savedProducts, error: readProductsError } = await client
    .from("products")
    .select("id,slug")
    .in("slug", productSlugs);
  assertOk(readProductsError, "Could not read seeded products back");

  const idBySlug = new Map<string, number>();
  for (const row of (savedProducts ?? []) as { id: number | string; slug: string }[]) {
    idBySlug.set(row.slug, Number(row.id));
  }
  if (idBySlug.size !== productSlugs.length) {
    throw new Error("Not every seeded product could be read back from Supabase.");
  }
  const productId = (slug: string): number => {
    const id = idBySlug.get(slug);
    if (id === undefined) throw new Error(`Missing product id for ${slug}.`);
    return id;
  };

  // images[0] is the cover; keep the catalogue order exactly.
  const imageRows: Record<string, unknown>[] = products.flatMap((product) => {
    const urls = product.images.length ? product.images : product.image ? [product.image] : [];
    return urls.map((url, index) => ({
      product_id: productId(product.slug),
      url,
      alt_text: product.name,
      order: index,
      is_cover: index === 0,
    }));
  });
  await replaceProductChildren(client, "product_images", imageRows, [...idBySlug.values()]);

  const collectionRows: Record<string, unknown>[] = products.flatMap((product) =>
    [...new Set(product.occasions)].map((occasionSlug) => ({
      product_id: productId(product.slug),
      occasion_slug: occasionSlug,
    }))
  );
  await replaceProductChildren(
    client,
    "product_collections",
    collectionRows,
    [...idBySlug.values()]
  );

  // stock_sizes stays empty: the catalogue has no per-size quantities, and
  // inventing "0 in stock" rows for every standard size would be fake data.
  counts.stock_sizes = 0;

  const reviewRows: Record<string, unknown>[] = [];
  for (const [index, entry] of localReviews.entries()) {
    if (typeof entry?.id !== "string" || typeof entry.productSlug !== "string") continue;

    const rating = Number(entry.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error(`Review ${index + 1} in .data/reviews.json has an invalid rating.`);
    }

    const text = typeof entry.text === "string" ? entry.text : "";
    const name = typeof entry.name === "string" ? entry.name : "";
    const createdAt = validTimestamp(entry.createdAt);
    const orderId = typeof entry.orderId === "string" ? entry.orderId : "";
    const photo = typeof entry.photo === "string" ? entry.photo : "";
    const photoType =
      typeof entry.photoType === "string" && entry.photoType ? entry.photoType : null;

    reviewRows.push({
      id: entry.id,
      product_slug: entry.productSlug,
      rating,
      text,
      name,
      status: reviewStatus(entry.status),
      ...(createdAt ? { created_at: createdAt } : {}),
      order_id: orderId,
      verified: Boolean(entry.verified),
      photo_url: photo ? `/api/reviews/photos/${entry.id}` : null,
      photo_type: photo ? photoType : null,
    });
  }
  await upsertRows(client, "reviews", reviewRows, "id", "Could not seed reviews");

  // db/admin-dashboard.sql has no review_photos table: a review's single
  // photo is stored inline on reviews.photo_url / reviews.photo_type. The
  // counter is reported so the summary still covers every dashboard table.
  counts.review_photos = 0;

  const settingRows = [
    { key: "store_name", value: siteConfig.name },
    { key: "contact_email", value: siteConfig.email },
    { key: "contact_phone", value: siteConfig.phone },
    { key: "shipping_text", value: SHIPPING_TEXT },
  ].map((row) => ({ ...row, updated_at: now }));
  await upsertRows(client, "site_settings", settingRows, "key", "Could not seed site settings");

  const orderRows: Record<string, unknown>[] = localOrders.map((order, index) => {
    if (
      typeof order?.id !== "string" ||
      typeof order.date !== "string" ||
      typeof order.email !== "string"
    ) {
      throw new Error(`Order ${index + 1} in .data/orders.json is invalid.`);
    }

    // Status history stays inside the payload; only the current status is
    // normalised, using the same legacy map as the dashboard.
    const payload = {
      ...order,
      status: normaliseAdminOrderStatus(
        typeof order.status === "string" ? order.status : ""
      ),
    };
    const customer =
      order.customer && typeof order.customer === "object"
        ? (order.customer as { email?: unknown })
        : null;
    const customerEmail = typeof customer?.email === "string" ? customer.email : "";

    return {
      id: order.id,
      email: order.email || customerEmail,
      order_date: order.date,
      idempotency_key:
        typeof order.idempotencyKey === "string" && order.idempotencyKey
          ? order.idempotencyKey
          : null,
      payload,
      updated_at: now,
    };
  });
  await upsertRows(client, "store_orders", orderRows, "id", "Could not seed orders");

  process.stdout.write(
    [
      "Admin seed complete.",
      `categories: ${counts.categories}`,
      `brands: ${counts.brands}`,
      `occasions: ${counts.occasions}`,
      `products: ${counts.products}`,
      `product_images: ${counts.product_images}`,
      `product_collections: ${counts.product_collections}`,
      `stock_sizes: ${counts.stock_sizes}`,
      `reviews: ${counts.reviews}`,
      "review_photos: 0 (photos are stored on reviews per the migration)",
      `site_settings: ${counts.site_settings}`,
      `store_orders: ${counts.store_orders}`,
    ].join("\n") + "\n"
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error.";
  process.stderr.write(`seed:admin failed: ${message}\n`);
  process.exit(1);
});
