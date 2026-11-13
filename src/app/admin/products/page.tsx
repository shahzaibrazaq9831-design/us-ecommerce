"use client";

import type { Metadata } from "next";
import React from "react";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-session";
import { z } from "zod";

const badges = ["new", "bestseller", "sale"] as const;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type ProductStatus = "draft" | "active" | "hidden";

interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  category: string;
  brand: string;
  occasions: string[];
  badges: ("new" | "bestseller" | "sale")[];
  price: number;
  salePrice: number | null;
  stock?: number;
  image?: string;
  stitchingOptions: string[];
  sizes: Record<string, number>;
  seoTitle: string;
  seoDescription: string;
  status: ProductStatus;
}

/* ------------------------------------------------------------------ */
/* Simple in-memory cache for the product list (server component)       */
/* ------------------------------------------------------------------ */

interface CachedProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  isNew: boolean;
  isBestSeller: boolean;
  status: ProductStatus;
  image: string;
  imageCount: number;
  description?: string;
}

let productCache: CachedProduct[] = [];
let cacheTimestamp = 0;

/* ------------------------------------------------------------------ */
/* Fetch products from the catalogue (server component)                 */
/* ------------------------------------------------------------------ */

function getProducts(): CachedProduct[] {
  const now = Date.now();
  if (productCache.length > 0 && now - cacheTimestamp < 30_000) {
    return productCache;
  }

  // Import the catalogue dynamically
  const { products } = require("@/lib/products");

  productCache = products.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.categoryLabel,
    brand: p.brand,
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    badge: p.badge ?? null,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    status: "active" as const,
    image: p.image,
    imageCount: p.images.length,
    description: p.description,
  }));

  cacheTimestamp = now;
  return productCache;
}

/* ------------------------------------------------------------------ */
/* Filter schema                                                        */
/* ------------------------------------------------------------------ */

const filterSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "active", "hidden"]).optional(),
  stock: z.enum(["in_stock", "out_of_stock"]).optional(),
});

type FilterState = z.infer<typeof filterSchema>;

function readFilters(params: FilterState): FilterState {
  return filterSchema.parse(params);
}

/* ------------------------------------------------------------------ */
/* Admin Products Page                                                    */
/* ------------------------------------------------------------------ */

// metadata is handled by the admin layout; keep the page as a client component
export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="admin-panel admin-loading">Loading products…</div>}>
      <ProductsPanel />
    </Suspense>
  );
}

function ProductsPanel() {
  requireAdmin();

  const [products, setProducts] = React.useState<CachedProduct[]>([]);
  const [filters, setFilters] = React.useState<FilterState>({});
  const [bulkAction, setBulkAction] = React.useState<{
    type?: "hide" | "sale" | "category";
    value?: string | number;
    ids?: string[];
  } | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formValues, setFormValues] = React.useState<ProductFormValues>({
    name: "",
    slug: "",
    description: "",
    category: "",
    brand: "",
    occasions: [],
    badges: [],
    price: 0,
    salePrice: 0,
    stitchingOptions: [],
    sizes: {},
    seoTitle: "",
    seoDescription: "",
    status: "active",
  });
  const [showEditor, setShowEditor] = React.useState(false);

  // Initial load
  React.useEffect(() => {
    const load = async () => {
      const data = getProducts();
      setProducts(data);
    };
    load();
  }, []);

  // Apply filters
  const filtered = products.filter((p) => {
    if (filters.query && !p.name.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.category && p.category !== filters.category) {
      return false;
    }
    if (filters.status && p.status !== filters.status) {
      return false;
    }
    if (filters.stock) {
      const hasStock = p.imageCount > 0;
      if (filters.stock === "in_stock" && !hasStock) return false;
      if (filters.stock === "out_of_stock" && hasStock) return false;
    }
    return true;
  });

  /* ------------------------------------------------------------------ */
  /* Bulk action handler                                                   */
  /* ------------------------------------------------------------------ */

  const handleBulkAction = () => {
    if (!bulkAction) return;

    const { type, value } = bulkAction;
    const ids = bulkAction?.ids ?? [];

    for (const id of ids) {
      const idx = products.findIndex((p) => String(p.id) === id);
      if (idx >= 0) {
        if (type === "hide") {
          // TODO: update status in DB
        } else if (type === "sale") {
          // TODO: update sale price in DB
        } else if (type === "category") {
          // TODO: update category in DB
        }
      }
    }

    // Refresh cache and clear bulk action
    (async () => {
      const data = getProducts();
      setProducts(data);
      setBulkAction(null);
    })();

    console.log(`Bulk action ${type} applied to ${ids.length} products`);
  };

  /* ------------------------------------------------------------------ */
  /* Inline quick edit save                                               */
  /* ------------------------------------------------------------------ */

  const handleInlineSave = (id: string, field: keyof ProductFormValues, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    (async () => {
      // TODO: persist change to DB
      const data = getProducts();
      setProducts(data);
    })();
  };

  /* ------------------------------------------------------------------ */
  /* Duplicate product                                                      */
  /* ------------------------------------------------------------------ */

  const handleDuplicate = (id: string) => {
    const product = products.find((p) => String(p.id) === id);
    if (!product) return;

    const newSlug = `${product.slug}-copy-${Date.now()}`;

    (async () => {
      const data = getProducts();
      setProducts(data);
      setFormValues({
        name: product.name,
        slug: newSlug as string,
        description: product.description ?? '',
        category: product.category,
        brand: product.brand,
        occasions: product.isBestSeller ? ["eid"] : [],
        badges: [],
        price: product.price,
        salePrice: null,
        stitchingOptions: ["standard", "custom"],
        sizes: {},
        seoTitle: "",
        seoDescription: "",
        status: "active",
      });
      setShowEditor(true);
    })();
  };

  /* ------------------------------------------------------------------ */
  /* Filter UI                                                               */
  /* ------------------------------------------------------------------ */

  const categories = ["bridal", "wedding", "formals", "chiffon"];
  const statuses = ["draft", "active", "hidden"] as const;
  const stockOptions = ["in_stock", "out_of_stock"] as const;

  return (
    <div className="admin-panel">
      <div className="admin-page-head">
        <h1 className="admin-title">Products</h1>
        <div className="admin-filters">
          <div className="admin-field admin-field--grow">
            <input
              className="admin-input"
              type="text"
              placeholder="Search products..."
              onChange={(e) =>
                setFilters(readFilters({ ...filters, query: e.target.value }))}
            />
          </div>

          <div className="admin-field">
            <select
              className="admin-input"
              onChange={(e) =>
                setFilters(readFilters({ ...filters, category: e.target.value }))}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <select
              className="admin-input"
              onChange={(e) =>
                setFilters(readFilters({ ...filters, status: e.target.value as FilterState["status"] }))}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <select
              className="admin-input"
              onChange={(e) =>
                setFilters(readFilters({ ...filters, stock: e.target.value as FilterState["stock"] }))}
            >
              <option value="">All</option>
              {stockOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field admin-field--grow">
            <button
              className="admin-button admin-button--primary"
              onClick={handleBulkAction}>
              Bulk apply
            </button>
            <button
              className="admin-button admin-button--ghost"
              onClick={() => setBulkAction({ type: "hide", value: "", ids: [] })}>
              Bulk hide
            </button>
            <button
              className="admin-button admin-button--ghost"
              onClick={() => setBulkAction({ type: "sale", value: 0, ids: [] })}>
              Set sale %
            </button>
            <button
              className="admin-button admin-button--ghost"
              onClick={() => setBulkAction({ type: "category", value: "", ids: [] })}>
              Change category
            </button>
          </div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setBulkAction((prev) => ({
                      ...(prev ?? {}),
                      ids: e.target.checked ? products.map(String) : [],
                    }))}
                  defaultChecked={false}
                />
              </th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price (PKR)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.slug}>
                <td>
                  <input
                    type="checkbox"
                    value={p.slug}
                    onChange={(e) =>
                      setBulkAction((prev) => {
                        if (prev == null) {
                          return { ids: e.target.checked ? [p.slug] : [] };
                        }
                        const newIds = e.target.checked
                          ? [...(prev.ids ?? []), p.slug]
                          : (prev.ids ?? []).filter((v) => v !== p.slug);
                        return { ...prev, ids: newIds };
                      })}
                    defaultChecked={false}
                  />
                </td>
                <td>
                  <a href={`/products/${p.slug}`} className="admin-link">
                    {p.name}
                  </a>
                </td>
                <td>{p.category}</td>
                <td>{p.brand}</td>
                <td>{p.price}</td>
                <td>
                  <span className={p.status === "active" ? "admin-badge--success" : "admin-badge--muted"}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <div className="admin-button-group">
                    <button
                      className="admin-button admin-button--small admin-button--ghost"
                      onClick={() => setEditingId(String(p.id))}>
                      Edit
                    </button>
                    <button
                      className="admin-button admin-button--small admin-button--danger"
                      onClick={() => handleDuplicate(String(p.id))}>
                      Duplicate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty">
                  No products found. Add new products from the storefront.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick edit inline */}
      {editingId && (
        <div className="admin-panel">
          <div className="admin-card">
            <h2 className="admin-card-title">Quick edit – {editingId}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setEditingId(null);
              }}
            >
              <input type="hidden" defaultValue={editingId} />
              <div className="admin-form">
                <div className="admin-field">
                  <label className="admin-label">Price</label>
                  <input
                    className="admin-input"
                    type="number"
                    defaultValue={formValues.price.toString()}
                    onChange={(e) =>
                      handleInlineSave(editingId, "price", Number(e.target.value))}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Stock</label>
                  <input
                    className="admin-input"
                    type="number"
                    defaultValue="0"
                    onChange={(e) =>
                      handleInlineSave(editingId, "stock", Number(e.target.value))}
                  />
                </div>
                <button type="submit" className="admin-button admin-button--primary">
                  Save
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product editor */}
      {showEditor && (
        <div className="admin-panel">
          <div className="admin-card">
            <h2 className="admin-card-title">Product editor</h2>
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Product submitted:", formValues);
                setShowEditor(false);
                (async () => {
                  const data = getProducts();
                  setProducts(data);
                })();
              }}
            >
              <input type="hidden" defaultValue={formValues.slug} />
              <input type="hidden" defaultValue="" />

              <div className="admin-grid">
                <div className="admin-grid-main">
                  <div className="admin-field">
                    <label className="admin-label">Name</label>
                    <input
                      className="admin-input"
                      value={formValues.name}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Slug</label>
                    <input
                      className="admin-input"
                      value={formValues.slug}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Category</label>
                    <select
                      className="admin-input"
                      value={formValues.category}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Brand</label>
                    <select
                      className="admin-input"
                      value={formValues.brand}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, brand: e.target.value }))}
                      required
                    >
                      <option value="">Select brand</option>
                      {["rung-e-bahar", "gulshan-studios", "mehran-labels", "zoya-collective", "heer-and-co", "neel-khaki", "rooh-fashion"].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Occasions</label>
                    <select
                      className="admin-input"
                      multiple
                      value={formValues.occasions}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          occasions: Array.from(
                            (e.target as HTMLSelectElement).value as any,
                          ),
                        }))}
                      required
                    >
                      {["barat", "mehndi", "nikkah", "walima", "mayun", "dholki", "engagement", "eid"].map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Badges</label>
                    <div>
                      {badges.map((b) => (
                        <label key={b} className="admin-field">
                          <input
                            type="checkbox"
                            checked={formValues.badges.includes(b)}
                            onChange={(e) =>
                              setFormValues((prev) => {
                                if (e.target.checked) {
                                  return { ...prev, badges: [...prev.badges, b] };
                                }
                                return { ...prev, badges: prev.badges.filter((v) => v !== b) };
                              })}
                            />
                          {b}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Price (PKR)</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={formValues.price}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Sale price (PKR)</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={formValues.salePrice || 0}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          salePrice: e.target.value ? Number(e.target.value) : null,
                        }))}
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Stitching options</label>
                    <div>
                      {["unstitched", "standard", "custom"].map((s) => (
                        <label key={s} className="admin-field">
                          <input
                            type="checkbox"
                            checked={formValues.stitchingOptions.includes(s)}
                            onChange={(e) =>
                              setFormValues((prev) => {
                                if (e.target.checked) {
                                  return { ...prev, stitchingOptions: [...prev.stitchingOptions, s] };
                                }
                                return { ...prev, stitchingOptions: prev.stitchingOptions.filter((v) => v !== s) };
                              })}
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Sizes with stock</label>
                    <select
                      className="admin-input"
                      multiple
                      size={6}
                      onChange={(e) => {
                        const selected = Array.from(
                          (e.target as HTMLSelectElement).options,
                        )
                          .filter((o) => o.selected)
                          .map((o) => o.value);
                        setFormValues((prev) => {
                          const sizes = { ...prev.sizes };
                          selected.forEach((size) => (sizes[size] = (sizes[size] ?? 0)));
                          return { ...prev, sizes };
                        });
                      }}
                    >
                      {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">SEO title</label>
                    <input
                      className="admin-input"
                      value={formValues.seoTitle}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="e.g. Sarang bridal dress"
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">SEO description</label>
                    <textarea
                      className="admin-textarea"
                      value={formValues.seoDescription}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="e.g. A deep-toned bridal three-piece..."
                      rows={3}
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Status</label>
                    <select
                      className="admin-input"
                      value={formValues.status}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, status: e.target.value as ProductStatus }))}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="admin-grid-side">
                  <div className="admin-field">
                    <label className="admin-label">Image upload</label>
                    <input
                      type="file"
                      className="admin-input"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        console.log(`Selected ${files.length} image(s)`);
                      }}
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Current image</label>
                    <img
                      src={formValues.image || "/placeholder-product.png"}
                      alt={formValues.name || "Product"}
                      className="admin-image-thumb"
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Alt text</label>
                    <input
                      className="admin-input"
                      value={""}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, imageAlt: e.target.value }))}
                      placeholder="Describe the image"
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Status</label>
                    <div>
                      <label key="draft" className="admin-field">
                        <input
                          type="radio"
                          checked={formValues.status === "draft"}
                          value="draft"
                          name="status"
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, status: e.target.value as ProductStatus }))}
                        />
                        Draft
                      </label>
                      <label key="active" className="admin-field">
                        <input
                          type="radio"
                          checked={formValues.status === "active"}
                          value="active"
                          name="status"
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, status: e.target.value as ProductStatus }))}
                          />
                        Active
                      </label>
                      <label key="hidden" className="admin-field">
                        <input
                          type="radio"
                          checked={formValues.status === "hidden"}
                          value="hidden"
                          name="status"
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, status: e.target.value as ProductStatus }))}
                          />
                        Hidden
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card-actions">
                <button type="submit" className="admin-button admin-button--primary">
                  Save product
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => {
                    setShowEditor(false);
                  }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}