"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Package,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import PageTransition from "@/components/admin/PageTransition";
import { EmptyState } from "@/components/admin/Feedback";
import { Modal } from "@/components/admin/Overlays";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";
import {
  bulkProductAction,
  deleteProductAction,
  updateStockAction,
} from "@/actions/admin";
import type { AdminProduct, AdminSnapshot } from "@/lib/admin/types";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import ProductCards from "./ProductCards";
import { useStoredPreference } from "../useStoredPreference";

type ViewMode = "grid" | "table";
type FormTarget = AdminProduct | "new" | null;
type BulkAction = "activate" | "hide" | "delete";

const STOCK_FILTERS = [
  ["", "All stock"],
  ["in", "In stock"],
  ["low", "Low stock (≤ 5)"],
  ["out", "Out of stock"],
];

export default function ProductsClient({
  snapshot,
  initialProduct,
}: {
  snapshot: AdminSnapshot;
  initialProduct: string;
}) {
  const [products, setProducts] = useState(snapshot.products);
  const [lastProducts, setLastProducts] = useState(snapshot.products);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  const [stock, setStock] = useState("");
  const [badge, setBadge] = useState("");
  const [storedView, setStoredView] = useStoredPreference("admin-products-view", "grid");
  const view: ViewMode = storedView === "table" ? "table" : "grid";
  const setView = (next: ViewMode) => setStoredView(next);
  const [selected, setSelected] = useState<number[]>([]);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [bulkTarget, setBulkTarget] = useState<BulkAction | null>(null);
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [openedInitial, setOpenedInitial] = useState(false);
  const [lastInitial, setLastInitial] = useState(initialProduct);

  // Keep local edits but resync when the server sends a refreshed snapshot.
  if (snapshot.products !== lastProducts) {
    setLastProducts(snapshot.products);
    setProducts(snapshot.products);
  }

  if (
    !openedInitial &&
    initialProduct &&
    products.length &&
    initialProduct !== lastInitial
  ) {
    const match = products.find((product) => product.id === Number(initialProduct));
    if (match) {
      setLastInitial(initialProduct);
      setFormTarget(match);
      setOpenedInitial(true);
    }
  }

  const categoryOptions = useMemo(() => {
    if (snapshot.categories.length) return snapshot.categories;
    return Array.from(
      new Map(
        products.map((product) => [product.categorySlug, product.categoryName])
      ).entries()
    ).map(([slug, name]) => ({ slug, name }));
  }, [snapshot.categories, products]);

  const brandOptions = useMemo(() => {
    if (snapshot.brands.length) return snapshot.brands;
    return Array.from(
      new Map(products.map((product) => [product.brandSlug, product.brandName])).entries()
    ).map(([slug, name]) => ({ slug, name }));
  }, [snapshot.brands, products]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (category && product.categorySlug !== category) return false;
      if (brand && product.brandSlug !== brand) return false;
      if (status && product.status !== status) return false;
      if (stock === "in" && product.stock <= 5) return false;
      if (stock === "low" && (product.stock <= 0 || product.stock > 5)) return false;
      if (stock === "out" && product.stock !== 0) return false;
      if (badge === "new" && !product.isNew) return false;
      if (badge === "bestseller" && !product.isBestSeller) return false;
      if (badge === "sale" && !product.onSale) return false;
      if (!needle) return true;
      return [
        product.name,
        product.slug,
        product.sku,
        product.categoryName,
        product.brandName,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [products, query, category, brand, status, stock, badge]);

  const hasFilters = Boolean(query || category || brand || status || stock || badge);
  const visibleIds = filtered.map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  function clearFilters() {
    setQuery("");
    setCategory("");
    setBrand("");
    setStatus("");
    setStock("");
    setBadge("");
  }

  function toggleSelected(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  function toggleAllVisible() {
    setSelected((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  async function commitStock(product: AdminProduct, next: number) {
    if (next === product.stock) return;
    const previous = product.stock;
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, stock: next } : item))
    );
    setBusyIds((current) => [...current, product.id]);

    const result = await updateStockAction(product.id, next);

    setBusyIds((current) => current.filter((id) => id !== product.id));
    if (!result.ok) {
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, stock: previous } : item))
      );
      toast(result.error, "error");
      return;
    }
    toast(result.message, "success");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteProductAction(deleteTarget.id);
    setPending(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    setProducts((current) => current.filter((product) => product.id !== deleteTarget.id));
    setSelected((current) => current.filter((id) => id !== deleteTarget.id));
    setDeleteTarget(null);
    toast(result.message, "success");
    router.refresh();
  }

  async function runBulk(action: BulkAction) {
    if (!selected.length) return;
    setPending(true);
    const result = await bulkProductAction(selected, action);
    setPending(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    const ids = [...selected];
    setProducts((current) =>
      action === "delete"
        ? current.filter((product) => !ids.includes(product.id))
        : current.map((product) =>
            ids.includes(product.id)
              ? {
                  ...product,
                  status: action === "activate" ? "active" : "hidden",
                }
              : product
          )
    );
    setSelected([]);
    setBulkTarget(null);
    toast(result.message, "success");
    router.refresh();
  }

  const editing = formTarget && formTarget !== "new" ? formTarget : undefined;

  return (
    <PageTransition>
      <div className="admin-page">
        <header className="admin-page-head">
          <div>
            <p className="admin-eyebrow">Catalogue</p>
            <h1>Products</h1>
            <p className="admin-subtitle">
              {filtered.length} of {products.length} pieces · source: {snapshot.source}
            </p>
          </div>
          <div className="admin-head-actions">
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={() => setFormTarget("new")}
            >
              <Plus size={16} /> Add product
            </button>
          </div>
        </header>

        {snapshot.schemaNotice ? (
          <div className="admin-notice" role="status">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{snapshot.schemaNotice}</span>
          </div>
        ) : null}

        <section className="admin-filter-panel">
          <label className="admin-field admin-field--grow">
            <span className="admin-label">Search</span>
            <span className="admin-input-icon">
              <Search size={16} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, slug, SKU, category or brand"
                aria-label="Search products"
              />
            </span>
          </label>
          <label className="admin-field">
            <span className="admin-label">Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categoryOptions.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">Brand</span>
            <select value={brand} onChange={(event) => setBrand(event.target.value)}>
              <option value="">All brands</option>
              {brandOptions.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">Stock</span>
            <select value={stock} onChange={(event) => setStock(event.target.value)}>
              {STOCK_FILTERS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">Badge</span>
            <select value={badge} onChange={(event) => setBadge(event.target.value)}>
              <option value="">All pieces</option>
              <option value="new">New arrivals</option>
              <option value="bestseller">Best sellers</option>
              <option value="sale">On sale</option>
            </select>
          </label>
          {hasFilters ? (
            <button type="button" className="admin-button admin-button--ghost" onClick={clearFilters}>
              <X size={15} /> Clear
            </button>
          ) : null}
        </section>

        <div className="admin-product-toolbar">
          <div className="admin-view-toggle" role="group" aria-label="Product view">
            <button
              type="button"
              className={view === "grid" ? "is-active" : ""}
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
            >
              <LayoutGrid size={16} /> Grid
            </button>
            <button
              type="button"
              className={view === "table" ? "is-active" : ""}
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
            >
              <List size={16} /> Table
            </button>
          </div>

          <AnimatePresence>
            {selected.length ? (
              <motion.div
                className="admin-bulk-bar"
                initial={reduce ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <strong>{selected.length} selected</strong>
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => void runBulk("activate")}
                  disabled={pending}
                >
                  <Eye size={15} /> Activate
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => void runBulk("hide")}
                  disabled={pending}
                >
                  <EyeOff size={15} /> Hide
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--danger"
                  onClick={() => setBulkTarget("delete")}
                  disabled={pending}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {!filtered.length ? (
          <EmptyState
            icon={<Package size={26} />}
            title={hasFilters ? "No matching products" : "No products yet"}
            description={
              hasFilters
                ? "Try another search or clear the filters above."
                : "Add your first piece once the Supabase catalogue is ready."
            }
            action={
              !hasFilters ? (
                <button
                  type="button"
                  className="admin-button admin-button--primary"
                  onClick={() => setFormTarget("new")}
                >
                  <Plus size={16} /> Add product
                </button>
              ) : undefined
            }
          />
        ) : view === "grid" ? (
          <ProductCards
            products={filtered}
            busyIds={busyIds}
            onEdit={setFormTarget}
            onDelete={setDeleteTarget}
            onStockChange={(product, next) => void commitStock(product, next)}
          />
        ) : (
          <ProductTable
            products={filtered}
            selected={selected}
            busyIds={busyIds}
            onToggle={toggleSelected}
            onToggleAll={toggleAllVisible}
            onEdit={setFormTarget}
            onDelete={setDeleteTarget}
            onStockChange={(product, next) => void commitStock(product, next)}
          />
        )}

        <Modal
          open={formTarget !== null}
          onClose={() => setFormTarget(null)}
          title={editing ? `Edit ${editing.name}` : "Add a product"}
          description={
            editing
              ? "Update the catalogue details, images and stock."
              : "Create a new piece in the studio catalogue."
          }
          wide
        >
          {formTarget !== null ? (
            <ProductForm
              key={editing ? editing.id : "new"}
              product={editing}
              categories={snapshot.categories}
              brands={snapshot.brands}
              occasions={snapshot.occasions}
              onSaved={() => {
                setFormTarget(null);
                router.refresh();
              }}
              onCancel={() => setFormTarget(null)}
            />
          ) : null}
        </Modal>

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete this product?"
          message={
            deleteTarget
              ? `${deleteTarget.name} will be removed from the catalogue. This cannot be undone.`
              : ""
          }
          pending={pending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />

        <ConfirmDialog
          open={bulkTarget === "delete"}
          title={`Delete ${selected.length} product${selected.length === 1 ? "" : "s"}?`}
          message="The selected pieces will be removed from the catalogue. This cannot be undone."
          confirmLabel="Delete selected"
          pending={pending}
          onCancel={() => setBulkTarget(null)}
          onConfirm={() => void runBulk("delete")}
        />
      </div>
    </PageTransition>
  );
}
