"use server";

/**
 * Every admin mutation lives here. Each one:
 *   - re-checks the signed admin cookie on the server;
 *   - validates its input with zod;
 *   - writes through the service-role client or the order library;
 *   - returns a small result object the UI can turn into a toast.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { getServiceClient } from "@/lib/admin/supabase";
import {
  orderStatusSchema,
  productSchema,
  reviewStatusSchema,
  settingsSchema,
  taxonomySchema,
  type ProductInput,
  type SettingsInput,
  type TaxonomyInput,
} from "@/lib/admin/schema";
import { changeOrderStatus } from "@/lib/orders";
import { endAdminSession } from "@/lib/admin-session";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function failure(error: unknown): ActionResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong.",
  };
}

function refreshAdmin(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/brands");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/settings");
}

async function audit(
  email: string,
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const client = getServiceClient();
  if (!client) return;
  // Auditing must never stop a legitimate change if the optional table is
  // not present yet.
  await client.from("admin_audit_log").insert({
    admin_email: email,
    action,
    entity,
    entity_id: entityId,
    details,
  });
}

/** Sign out. The button in the admin top bar posts here. */
export async function signOutAdminAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

/** Change an order status, with the workflow enforced on the server. */
export async function updateOrderStatusAction(input: {
  id: string;
  status: string;
  note?: string;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = orderStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid status." };
    }

    const result = await changeOrderStatus(
      parsed.data.id,
      parsed.data.status,
      admin.email,
      parsed.data.note
    );
    if (!result.ok) {
      return {
        ok: false,
        error:
          result.error === "invalid-transition"
            ? "That status change is not allowed by the order workflow."
            : result.error === "same-status"
              ? "The order already has that status."
              : "Order not found.",
      };
    }

    await audit(admin.email, "status_change", "order", parsed.data.id, {
      status: parsed.data.status,
    });
    refreshAdmin();
    return { ok: true, message: `Order moved to ${parsed.data.status.replace(/_/g, " ")}.` };
  } catch (error) {
    return failure(error);
  }
}

/** Create or update a product, including gallery and occasion tags. */
export async function saveProductAction(input: ProductInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the product form." };
    }

    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };

    const data = parsed.data;
    if (data.salePrice !== null && data.salePrice !== undefined && data.salePrice >= data.price) {
      return { ok: false, error: "Sale price must be lower than the regular price." };
    }

    const row = {
      slug: data.slug,
      name: data.name,
      description: data.description,
      category_slug: data.categorySlug,
      brand_slug: data.brandSlug,
      price_cents: data.price,
      sale_price_cents: data.salePrice ?? null,
      is_new: data.isNew,
      is_best_seller: data.isBestSeller,
      status: data.status,
      sku: data.sku,
      stock: data.stock,
      stitching_options: data.stitching,
      updated_at: new Date().toISOString(),
    };

    let productId: number;
    if (data.id) {
      const { data: updated, error } = await client
        .from("products")
        .update(row)
        .eq("id", data.id)
        .select("id")
        .single();
      if (error) return failure(error);
      productId = Number(updated.id);
    } else {
      const { data: inserted, error } = await client
        .from("products")
        .insert({ ...row, created_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error) return failure(error);
      productId = Number(inserted.id);
    }

    await client.from("product_images").delete().eq("product_id", productId);
    await client.from("product_collections").delete().eq("product_id", productId);

    if (data.images.length) {
      const { error } = await client.from("product_images").insert(
        data.images.map((url, index) => ({
          product_id: productId,
          url,
          alt_text: data.name,
          order: index,
          is_cover: index === 0,
        }))
      );
      if (error) return failure(error);
    }

    if (data.occasionSlugs.length) {
      const { error } = await client.from("product_collections").insert(
        data.occasionSlugs.map((occasion_slug) => ({
          product_id: productId,
          occasion_slug,
        }))
      );
      if (error) return failure(error);
    }

    await audit(admin.email, data.id ? "product_update" : "product_create", "product", String(productId));
    refreshAdmin();
    return {
      ok: true,
      message: data.id ? "Product saved." : "Product added to the catalogue.",
    };
  } catch (error) {
    return failure(error);
  }
}

/** Delete a product and its gallery rows (database cascades handle the rest). */
export async function deleteProductAction(id: number): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };

    const { error } = await client.from("products").delete().eq("id", id);
    if (error) return failure(error);
    await audit(admin.email, "product_delete", "product", String(id));
    refreshAdmin();
    return { ok: true, message: "Product deleted." };
  } catch (error) {
    return failure(error);
  }
}

/** Inline stock editing in the product table. */
export async function updateStockAction(id: number, stock: number): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!Number.isInteger(id) || !Number.isInteger(stock) || stock < 0) {
      return { ok: false, error: "Enter a whole number of units." };
    }
    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };

    const { error } = await client
      .from("products")
      .update({ stock, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return failure(error);
    await audit(admin.email, "stock_update", "product", String(id), { stock });
    refreshAdmin();
    return { ok: true, message: "Stock updated." };
  } catch (error) {
    return failure(error);
  }
}

/** Bulk actions from the product table toolbar. */
export async function bulkProductAction(
  ids: number[],
  action: "activate" | "hide" | "delete"
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!ids.length) return { ok: false, error: "Select at least one product." };
    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };

    if (action === "delete") {
      const { error } = await client.from("products").delete().in("id", ids);
      if (error) return failure(error);
    } else {
      const { error } = await client
        .from("products")
        .update({
          status: action === "activate" ? "active" : "hidden",
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);
      if (error) return failure(error);
    }

    await audit(admin.email, `bulk_${action}`, "product", ids.join(","));
    refreshAdmin();
    return { ok: true, message: `${ids.length} product${ids.length === 1 ? "" : "s"} updated.` };
  } catch (error) {
    return failure(error);
  }
}

/** Add or edit a category, brand or occasion. */
export async function saveTaxonomyAction(input: TaxonomyInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = taxonomySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
    }

    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };

    const { kind, slug, name, description, imageUrl } = parsed.data;
    const table =
      kind === "category" ? "categories" : kind === "brand" ? "brands" : "occasions";
    const imageColumn = kind === "occasion" ? "photo_url" : "image_url";

    const { error } = await client.from(table).upsert(
      {
        slug,
        name,
        description: description || null,
        [imageColumn]: imageUrl || null,
      },
      { onConflict: "slug" }
    );
    if (error) return failure(error);

    await audit(admin.email, "taxonomy_save", kind, slug);
    refreshAdmin();
    return { ok: true, message: `${name} saved.` };
  } catch (error) {
    return failure(error);
  }
}

/** Delete a taxonomy row. Supabase rejects it if products still use it. */
export async function deleteTaxonomyAction(
  kind: "category" | "brand" | "occasion",
  slug: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return { ok: false, error: "Invalid item." };
    }

    const table =
      kind === "category" ? "categories" : kind === "brand" ? "brands" : "occasions";
    const { error } = await client.from(table).delete().eq("slug", slug);
    if (error) {
      return {
        ok: false,
        error: "This item is still used by products. Reassign them before deleting it.",
      };
    }

    await audit(admin.email, "taxonomy_delete", kind, slug);
    refreshAdmin();
    return { ok: true, message: `${slug} deleted.` };
  } catch (error) {
    return failure(error);
  }
}

/** Approve, hide or send a review back to pending. */
export async function moderateReviewAction(
  id: string,
  status: "pending" | "approved" | "hidden"
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = reviewStatusSchema.safeParse({ id, status });
    if (!parsed.success) return { ok: false, error: "Invalid review." };

    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };

    const { error } = await client
      .from("reviews")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id);
    if (error) return failure(error);

    await audit(admin.email, "review_moderate", "review", parsed.data.id, {
      status: parsed.data.status,
    });
    refreshAdmin();
    return { ok: true, message: `Review ${parsed.data.status}.` };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteReviewAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };

    const { error } = await client.from("reviews").delete().eq("id", id);
    if (error) return failure(error);
    await audit(admin.email, "review_delete", "review", id);
    refreshAdmin();
    return { ok: true, message: "Review deleted." };
  } catch (error) {
    return failure(error);
  }
}

/** Store-wide settings, saved as rows in site_settings. */
export async function saveSettingsAction(input: SettingsInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
    }

    const client = getServiceClient();
    if (!client) return { ok: false, error: "Supabase service key is not configured." };

    const updated_at = new Date().toISOString();
    const { error } = await client.from("site_settings").upsert(
      [
        { key: "store_name", value: parsed.data.storeName, updated_at },
        { key: "contact_email", value: parsed.data.contactEmail, updated_at },
        { key: "contact_phone", value: parsed.data.contactPhone, updated_at },
        { key: "shipping_text", value: parsed.data.shippingText, updated_at },
        { key: "announcement_bar_text", value: parsed.data.announcementText, updated_at },
        { key: "offer_enabled", value: String(parsed.data.offerEnabled), updated_at },
        { key: "offer_end_date", value: parsed.data.offerEndDate, updated_at },
        { key: "discount_code", value: parsed.data.discountCode, updated_at },
        { key: "discount_percent", value: String(parsed.data.discountPercent), updated_at },
        { key: "returns_text", value: parsed.data.returnsText, updated_at },
      ],
      { onConflict: "key" }
    );
    if (error) return failure(error);

    await audit(admin.email, "settings_update", "site_settings", "main");
    refreshAdmin();
    return { ok: true, message: "Settings saved." };
  } catch (error) {
    return failure(error);
  }
}
