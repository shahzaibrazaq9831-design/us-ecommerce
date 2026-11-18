import "server-only";
import { cache } from "react";
import { getServiceClient, serviceKey } from "./supabase";
import { listStoredOrders, type StoredOrder } from "@/lib/orders";
import { siteConfig } from "@/data/site";
import { DEFAULT_STOREFRONT_SETTINGS } from "@/data/settings";
import { normaliseAdminOrderStatus } from "./status";
import type {
  AdminCustomer,
  AdminOrderDetail,
  AdminProduct,
  AdminReview,
  AdminSettings,
  AdminSnapshot,
  AdminTaxonomyItem,
  DashboardOrder,
  NamedValue,
} from "./types";

/** A Supabase error code that means "this table has not been created yet". */
function isMissingTable(code: string | undefined): boolean {
  return code === "PGRST205" || code === "42P01";
}

interface ProductRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  category_slug: string;
  brand_slug: string;
  price_cents: number;
  sale_price_cents: number | null;
  is_new: boolean;
  is_best_seller: boolean;
  status: string;
  sku: string | null;
  stock: number | null;
  stitching_options: string[] | null;
  created_at: string;
  updated_at: string;
  categories: { name: string } | { name: string }[] | null;
  brands: { name: string } | { name: string }[] | null;
  product_images: { url: string; order: number; is_cover: boolean }[] | null;
  product_collections: { occasion_slug: string }[] | null;
}

interface ReviewRow {
  id: string;
  product_slug: string;
  rating: number;
  text: string;
  name: string | null;
  status: string;
  created_at: string;
  order_id: string | null;
  verified: boolean;
  photo_url: string | null;
}

interface SettingRow {
  key: string;
  value: string;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toProduct(row: ProductRow): AdminProduct {
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((image) => image.url);
  const categoryName = one(row.categories)?.name ?? row.category_slug;
  const brandName = one(row.brands)?.name ?? row.brand_slug;
  const salePrice = row.sale_price_cents;

  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    categorySlug: row.category_slug,
    categoryName,
    brandSlug: row.brand_slug,
    brandName,
    occasionSlugs: (row.product_collections ?? []).map((entry) => entry.occasion_slug),
    price: Number(row.price_cents),
    salePrice: salePrice === null ? null : Number(salePrice),
    stock: Number(row.stock ?? 0),
    stitching: row.stitching_options ?? [],
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
    onSale: salePrice !== null && Number(salePrice) < Number(row.price_cents),
    status:
      row.status === "draft" || row.status === "hidden" ? row.status : "active",
    sku: row.sku ?? "",
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toReview(row: ReviewRow, productNames: Map<string, string>): AdminReview {
  return {
    id: row.id,
    productSlug: row.product_slug,
    productName: productNames.get(row.product_slug) ?? row.product_slug,
    rating: Number(row.rating),
    text: row.text,
    author: row.name?.trim() || "Anonymous",
    status:
      row.status === "approved" || row.status === "hidden" ? row.status : "pending",
    createdAt: row.created_at,
    verified: Boolean(row.verified),
    photoUrl: row.photo_url ?? "",
    orderId: row.order_id ?? "",
  };
}

function stitchingLabel(value: string): string {
  if (value === "unstitched") return "Unstitched";
  if (value === "standard") return "Standard stitched";
  if (value === "custom") return "Custom stitched";
  return value;
}

export function toDashboardOrder(order: StoredOrder): DashboardOrder {
  const stitching = Array.from(
    new Set((order.items ?? []).map((item) => item.stitching).filter(Boolean))
  ) as string[];

  return {
    id: order.id,
    date: order.date,
    customer: order.customer?.name || "Guest customer",
    email: order.email || order.customer?.email || "",
    total: Number(order.totals?.total ?? 0),
    currency: order.totals?.currency || "PKR",
    paymentMethod: order.payment?.method || "",
    paymentStatus: order.payment?.status || "unpaid",
    status: normaliseAdminOrderStatus(order.status),
    items: (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    city: order.address?.city || "",
    country: order.address?.country || "",
    stitching: stitching.map(stitchingLabel),
    trackingNumber: order.trackingNumber || "",
    courier: order.courier || "",
  };
}

/** The full order drawn in the slide-over drawer. */
export function toOrderDetail(order: StoredOrder): AdminOrderDetail {
  const address = order.address;
  const addressLines = [
    address?.line1,
    address?.line2,
    [address?.city, address?.state].filter(Boolean).join(", "),
    address?.postalCode,
    address?.country,
  ].filter((line): line is string => Boolean(line));

  const items = (order.items ?? []).map((item) => {
    const measurements = item.measurements
      ? Object.entries(item.measurements)
          .filter(([key, value]) => key !== "unit" && value !== undefined && value !== null)
          .map(([key, value]) => ({
            label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()),
            value: `${value}${item.measurements?.unit ? ` ${item.measurements.unit}` : ""}`,
          }))
      : [];

    return {
      name: item.name || item.slug,
      slug: item.slug,
      image: item.image || "",
      quantity: item.quantity ?? 0,
      price: Number(item.price ?? 0),
      stitching: stitchingLabel(item.stitching ?? ""),
      size: item.size ?? "",
      lining: item.lining ?? "",
      measurements,
      notes: item.notes ?? "",
    };
  });

  return {
    id: order.id,
    date: order.date,
    customer: order.customer?.name || "Guest customer",
    email: order.email || order.customer?.email || "",
    phone: order.customer?.phone || "",
    address: addressLines,
    items,
    subtotal: Number(order.totals?.subtotal ?? 0),
    shipping: Number(order.totals?.shipping ?? 0),
    discount: Number(order.totals?.discount ?? 0),
    total: Number(order.totals?.total ?? 0),
    currency: order.totals?.currency || "PKR",
    paymentMethod: order.payment?.method || "",
    paymentStatus: order.payment?.status || "",
    trackingNumber: order.trackingNumber || "",
    courier: order.courier || "",
    notes: order.notes || "",
    status: normaliseAdminOrderStatus(order.status),
    history: (order.history ?? []).map((event) => ({
      at: event.at,
      message: event.message,
      type: event.type,
      by: event.by,
    })),
  };
}

function toCustomers(orders: DashboardOrder[]): AdminCustomer[] {
  const byEmail = new Map<string, AdminCustomer>();

  for (const order of orders) {
    const key = (order.email || order.customer).trim().toLowerCase();
    if (!key) continue;

    const existing = byEmail.get(key) ?? {
      email: order.email || key,
      name: order.customer,
      phone: "",
      orders: 0,
      totalSpent: 0,
      lastOrderAt: order.date,
      city: order.city,
      country: order.country,
    };

    const countable = order.status !== "cancelled" && order.status !== "refunded";
    existing.orders += 1;
    if (countable) existing.totalSpent += order.total;
    if (new Date(order.date) > new Date(existing.lastOrderAt)) {
      existing.lastOrderAt = order.date;
      existing.city = order.city;
      existing.country = order.country;
    }
    byEmail.set(key, existing);
  }

  return [...byEmail.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Rank products and brands by actual paid order lines. An order item's own
 * price is used when present; older records without one use the order total
 * split across their lines. No ranking is invented when there are no orders.
 */
function rankSales(
  storedOrders: StoredOrder[],
  products: AdminProduct[]
): { productRanking: NamedValue[]; brandRanking: NamedValue[] } {
  const productRevenue = new Map<string, NamedValue>();
  const brandRevenue = new Map<string, number>();
  const brandsBySlug = new Map(products.map((product) => [product.slug, product.brandName]));

  for (const order of storedOrders) {
    const status = normaliseAdminOrderStatus(order.status);
    if (status === "cancelled" || status === "refunded") continue;
    if (order.payment?.status !== "paid") continue;

    const items = order.items ?? [];
    if (!items.length) continue;
    const lineTotal =
      Number(order.totals?.total ?? 0) / Math.max(1, items.length);

    for (const item of items) {
      const key = item.slug || item.name || "";
      if (!key) continue;
      const revenue =
        item.price !== undefined
          ? Number(item.price) * (item.quantity ?? 1)
          : lineTotal * (item.quantity ?? 1);

      const current = productRevenue.get(key) ?? {
        name: item.name || key,
        value: 0,
        slug: item.slug || undefined,
      };
      current.value += revenue;
      productRevenue.set(key, current);

      const brand = brandsBySlug.get(item.slug);
      if (brand) brandRevenue.set(brand, (brandRevenue.get(brand) ?? 0) + revenue);
    }
  }

  return {
    productRanking: [...productRevenue.values()].sort((a, b) => b.value - a.value).slice(0, 10),
    brandRanking: [...brandRevenue.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  };
}

async function loadProducts(): Promise<{
  products: AdminProduct[];
  notice: string | null;
}> {
  const client = getServiceClient();
  if (!client) return { products: [], notice: null };

  const { data, error } = await client
    .from("products")
    .select(
      "id,slug,name,description,category_slug,brand_slug,price_cents,sale_price_cents,is_new,is_best_seller,status,sku,stock,stitching_options,created_at,updated_at,categories(name),brands(name),product_images(url,\"order\",is_cover),product_collections(occasion_slug)"
    )
    .order("name", { ascending: true });

  if (error) {
    if (isMissingTable(error.code)) {
      return {
        products: [],
        notice:
          "The Supabase product tables are missing. Run db/admin-dashboard.sql, then npm run seed:admin.",
      };
    }
    throw new Error(`Could not read products: ${error.message}`);
  }

  return { products: ((data ?? []) as unknown as ProductRow[]).map(toProduct), notice: null };
}

async function loadTaxonomy(
  products: AdminProduct[]
): Promise<{
  categories: AdminTaxonomyItem[];
  brands: AdminTaxonomyItem[];
  occasions: AdminTaxonomyItem[];
  notice: string | null;
}> {
  const client = getServiceClient();
  if (!client) {
    return {
      categories: [],
      brands: [],
      occasions: [],
      notice: null,
    };
  }

  const [categoriesResult, brandsResult, occasionsResult] = await Promise.all([
    client.from("categories").select("slug,name,description,image_url,created_at").order("name"),
    client.from("brands").select("slug,name,description,image_url,created_at").order("name"),
    client.from("occasions").select("slug,name,description,photo_url,created_at").order("name"),
  ]);

  const notice = [categoriesResult, brandsResult, occasionsResult].some((result) =>
    isMissingTable(result.error?.code)
  )
    ? "The Supabase taxonomy tables are missing. Run db/admin-dashboard.sql, then npm run seed:admin."
    : null;

  const count = (kind: "category" | "brand" | "occasion", slug: string) => {
    if (kind === "category")
      return products.filter((product) => product.categorySlug === slug).length;
    if (kind === "brand")
      return products.filter((product) => product.brandSlug === slug).length;
    return products.filter((product) => product.occasionSlugs.includes(slug)).length;
  };

  const map = (
    rows: Record<string, unknown>[] | null,
    kind: "category" | "brand" | "occasion",
    imageField: string
  ): AdminTaxonomyItem[] =>
    (rows ?? []).map((row) => ({
      slug: String(row.slug ?? ""),
      name: String(row.name ?? ""),
      description: String(row.description ?? ""),
      imageUrl: String(row[imageField] ?? ""),
      productCount: count(kind, String(row.slug ?? "")),
      createdAt: String(row.created_at ?? ""),
    }));

  return {
    categories: map(
      categoriesResult.data as Record<string, unknown>[] | null,
      "category",
      "image_url"
    ),
    brands: map(brandsResult.data as Record<string, unknown>[] | null, "brand", "image_url"),
    occasions: map(
      occasionsResult.data as Record<string, unknown>[] | null,
      "occasion",
      "photo_url"
    ),
    notice,
  };
}

async function loadReviews(
  productNames: Map<string, string>
): Promise<{ reviews: AdminReview[]; notice: string | null }> {
  const client = getServiceClient();
  if (!client) return { reviews: [], notice: null };

  const { data, error } = await client
    .from("reviews")
    .select("id,product_slug,rating,text,name,status,created_at,order_id,verified,photo_url")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTable(error.code)) {
      return {
        reviews: [],
        notice: "The Supabase reviews table is missing. Run db/admin-dashboard.sql.",
      };
    }
    throw new Error(`Could not read reviews: ${error.message}`);
  }

  return {
    reviews: ((data ?? []) as unknown as ReviewRow[]).map((row) =>
      toReview(row, productNames)
    ),
    notice: null,
  };
}

async function loadSettings(): Promise<{ settings: AdminSettings; notice: string | null }> {
  const defaults: AdminSettings = {
    storeName: siteConfig.name,
    contactEmail: siteConfig.email,
    contactPhone: siteConfig.phone,
    shippingText:
      "Free worldwide delivery on every order, delivered within 2 weeks. Made-to-order stitching is included in that time.",
    announcementText: DEFAULT_STOREFRONT_SETTINGS.announcementText,
    returnsText: DEFAULT_STOREFRONT_SETTINGS.returnsText,
  };

  const client = getServiceClient();
  if (!client) return { settings: defaults, notice: null };

  const { data, error } = await client.from("site_settings").select("key,value");
  if (error) {
    if (isMissingTable(error.code)) {
      return {
        settings: defaults,
        notice: "The Supabase site_settings table is missing. Run db/admin-dashboard.sql.",
      };
    }
    throw new Error(`Could not read settings: ${error.message}`);
  }

  const values = new Map(
    ((data ?? []) as SettingRow[]).map((row) => [row.key, row.value])
  );

  return {
    settings: {
      storeName: values.get("store_name") || defaults.storeName,
      contactEmail: values.get("contact_email") || defaults.contactEmail,
      contactPhone: values.get("contact_phone") || defaults.contactPhone,
      shippingText: values.get("shipping_text") || defaults.shippingText,
      announcementText: values.get("announcement_bar_text") || defaults.announcementText,
      returnsText: values.get("returns_text") || defaults.returnsText,
    },
    notice: null,
  };
}

/**
 * The single data-access entry point for the admin dashboard. Everything
 * below is read on the server with the service key and returned as narrow
 * DTOs — no database rows or secrets ever reach a client component.
 */
export const getAdminSnapshot = cache(async (): Promise<AdminSnapshot> => {
  const notices: string[] = [];

  const productResult = await loadProducts();
  if (productResult.notice) notices.push(productResult.notice);

  const productNames = new Map(
    productResult.products.map((product) => [product.slug, product.name])
  );

  const [taxonomyResult, reviewResult, settingsResult] = await Promise.all([
    loadTaxonomy(productResult.products),
    loadReviews(productNames),
    loadSettings(),
  ]);
  if (taxonomyResult.notice) notices.push(taxonomyResult.notice);
  if (reviewResult.notice) notices.push(reviewResult.notice);
  if (settingsResult.notice) notices.push(settingsResult.notice);

  let storedOrders: StoredOrder[] = [];
  try {
    storedOrders = await listStoredOrders();
  } catch (error) {
    notices.push(error instanceof Error ? error.message : "Could not read orders.");
  }

  const orders = storedOrders.map(toDashboardOrder);
  const source: AdminSnapshot["source"] = serviceKey()
    ? "supabase"
    : storedOrders.length > 0
      ? "local"
      : "unavailable";

  if (source === "local") {
    notices.push(
      "Showing the local development order file. Add SUPABASE_SERVICE_KEY to use Supabase."
    );
  } else if (source === "unavailable") {
    notices.push("No order data source is configured yet.");
  }

  const ranking = rankSales(storedOrders, productResult.products);

  return {
    source,
    schemaNotice: notices.length ? notices.join(" ") : null,
    productRanking: ranking.productRanking,
    brandRanking: ranking.brandRanking,
    products: productResult.products,
    categories: taxonomyResult.categories,
    brands: taxonomyResult.brands,
    occasions: taxonomyResult.occasions,
    reviews: reviewResult.reviews,
    orders,
    customers: toCustomers(orders),
    settings: settingsResult.settings,
  };
});

/** One order in full, for the slide-over drawer. */
export const getAdminOrder = cache(async (id: string): Promise<StoredOrder | null> => {
  const orders = await listStoredOrders();
  const wanted = id.trim().toUpperCase();
  return orders.find((order) => order.id.trim().toUpperCase() === wanted) ?? null;
});
