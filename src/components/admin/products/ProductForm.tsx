"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { saveProductAction } from "@/actions/admin";
import { productSchema } from "@/lib/admin/schema";
import { useToast } from "@/components/admin/ToastProvider";
import ImageUploader from "./ImageUploader";
import type { AdminProduct, AdminTaxonomyItem } from "@/lib/admin/types";

const STITCHING = ["unstitched", "standard", "custom"] as const;

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  categorySlug: "",
  brandSlug: "",
  occasionSlugs: [] as string[],
  price: "",
  salePrice: "",
  stock: "0",
  stitching: ["unstitched"] as string[],
  isNew: false,
  isBestSeller: false,
  status: "active" as "active" | "draft" | "hidden",
  sku: "",
  images: [] as string[],
};

type FormState = typeof emptyForm;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({
  product,
  categories,
  brands,
  occasions,
  onSaved,
  onCancel,
}: {
  product?: AdminProduct;
  categories: AdminTaxonomyItem[];
  brands: AdminTaxonomyItem[];
  occasions: AdminTaxonomyItem[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    categorySlug: product?.categorySlug ?? categories[0]?.slug ?? "",
    brandSlug: product?.brandSlug ?? brands[0]?.slug ?? "",
    occasionSlugs: product?.occasionSlugs ?? [],
    price: String(product?.price ?? ""),
    salePrice: product?.salePrice ? String(product.salePrice) : "",
    stock: String(product?.stock ?? 0),
    stitching: product?.stitching.length ? product.stitching : ["unstitched"],
    isNew: product?.isNew ?? false,
    isBestSeller: product?.isBestSeller ?? false,
    status: product?.status ?? "active",
    sku: product?.sku ?? "",
    images: product?.images ?? [],
  }));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const reduce = useReducedMotion();

  const error = useMemo(() => {
    if (!form.categorySlug) return "Add a category before saving products.";
    if (!form.brandSlug) return "Add a brand before saving products.";
    return "";
  }, [form.categorySlug, form.brandSlug]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (error) {
      toast(error, "error");
      return;
    }

    const parsed = productSchema.safeParse({
      ...(product ? { id: product.id } : {}),
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      categorySlug: form.categorySlug,
      brandSlug: form.brandSlug,
      occasionSlugs: form.occasionSlugs,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      stock: Number(form.stock),
      stitching: form.stitching,
      isNew: form.isNew,
      isBestSeller: form.isBestSeller,
      status: form.status,
      sku: form.sku,
      images: form.images,
    });

    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Check the product form.", "error");
      return;
    }

    setSaving(true);
    const result = await saveProductAction(parsed.data);
    setSaving(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(result.message, "success");
    onSaved();
  }

  return (
    <form id="admin-product-form" className="admin-form-grid" onSubmit={submit}>
      <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <label className="admin-field">
          <span className="admin-label">Product name *</span>
          <input
            className="admin-input"
            value={form.name}
            onChange={(event) => {
              update("name", event.target.value);
              if (!product && !form.slug) update("slug", slugify(event.target.value));
            }}
            placeholder="e.g. Sarang Bridal"
            required
          />
        </label>
        <div className="admin-form-row">
          <label className="admin-field">
            <span className="admin-label">Slug *</span>
            <input
              className="admin-input"
              value={form.slug}
              onChange={(event) => update("slug", slugify(event.target.value))}
              placeholder="sarang-bridal"
              required
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">SKU</span>
            <input
              className="admin-input"
              value={form.sku}
              onChange={(event) => update("sku", event.target.value)}
              placeholder="REB-001"
            />
          </label>
        </div>
        <label className="admin-field">
          <span className="admin-label">Description *</span>
          <textarea
            className="admin-input admin-textarea"
            rows={3}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Describe the piece, fabric and embroidery…"
            required
          />
        </label>
        <div className="admin-form-row">
          <label className="admin-field">
            <span className="admin-label">Category *</span>
            <select
              className="admin-input"
              value={form.categorySlug}
              onChange={(event) => update("categorySlug", event.target.value)}
              required
            >
              <option value="">Choose category</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">Brand *</span>
            <select
              className="admin-input"
              value={form.brandSlug}
              onChange={(event) => update("brandSlug", event.target.value)}
              required
            >
              <option value="">Choose brand</option>
              {brands.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="admin-fieldset">
          <legend className="admin-label">Occasions</legend>
          <div className="admin-chip-group">
            {occasions.map((occasion) => {
              const active = form.occasionSlugs.includes(occasion.slug);
              return (
                <button
                  key={occasion.slug}
                  type="button"
                  className={`admin-chip ${active ? "is-active" : ""}`}
                  onClick={() =>
                    update(
                      "occasionSlugs",
                      active
                        ? form.occasionSlugs.filter((slug) => slug !== occasion.slug)
                        : [...form.occasionSlugs, occasion.slug]
                    )
                  }
                  aria-pressed={active}
                >
                  {occasion.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      </motion.div>

      <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="admin-form-row">
          <label className="admin-field">
            <span className="admin-label">Price (PKR) *</span>
            <input
              className="admin-input"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
              required
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Sale price (PKR)</span>
            <input
              className="admin-input"
              type="number"
              min="0"
              value={form.salePrice}
              onChange={(event) => update("salePrice", event.target.value)}
            />
          </label>
        </div>
        <div className="admin-form-row">
          <label className="admin-field">
            <span className="admin-label">Stock units *</span>
            <input
              className="admin-input"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => update("stock", event.target.value)}
              required
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Status</span>
            <select
              className="admin-input"
              value={form.status}
              onChange={(event) => update("status", event.target.value as FormState["status"])}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
        </div>
        <fieldset className="admin-fieldset">
          <legend className="admin-label">Stitching options</legend>
          <div className="admin-chip-group">
            {STITCHING.map((option) => {
              const active = form.stitching.includes(option);
              return (
                <button
                  type="button"
                  key={option}
                  className={`admin-chip ${active ? "is-active" : ""}`}
                  onClick={() =>
                    update(
                      "stitching",
                      active
                        ? form.stitching.filter((value) => value !== option)
                        : [...form.stitching, option]
                    )
                  }
                  aria-pressed={active}
                >
                  {option === "standard" ? "Standard stitched" : option === "custom" ? "Custom stitched" : "Unstitched"}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="admin-fieldset">
          <legend className="admin-label">Flags</legend>
          <div className="admin-toggle-row">
            <label className="admin-check">
              <input type="checkbox" checked={form.isNew} onChange={(e) => update("isNew", e.target.checked)} />
              <span>New arrival</span>
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.isBestSeller}
                onChange={(e) => update("isBestSeller", e.target.checked)}
              />
              <span>Best seller</span>
            </label>
          </div>
        </fieldset>
        <div className="admin-field">
          <span className="admin-label">Gallery *</span>
          <ImageUploader value={form.images} onChange={(images) => update("images", images)} />
        </div>
      </motion.div>

      <div className="admin-form-actions">
        <button type="button" className="admin-button admin-button--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="admin-button admin-button--primary"
          disabled={saving || Boolean(error)}
        >
          {saving ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
