"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import type { AdminProduct } from "@/lib/admin/types";
import { ProductBadges, ProductPrice, StockInput } from "./ProductBits";

export default function ProductCards({
  products,
  busyIds,
  onEdit,
  onDelete,
  onStockChange,
}: {
  products: AdminProduct[];
  busyIds: number[];
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onStockChange: (product: AdminProduct, next: number) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="admin-product-grid">
      {products.map((product, index) => (
        <motion.article
          key={product.id}
          className="admin-product-card"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : Math.min(index * 0.03, 0.3) }}
        >
          <div className="admin-product-card-media">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} loading="lazy" />
            ) : (
              <span>No image yet</span>
            )}
            <div className="admin-product-card-badges">
              <ProductBadges product={product} />
            </div>
          </div>
          <div className="admin-product-card-body">
            <h3>{product.name}</h3>
            <p className="admin-mono">{product.slug}</p>
            <p className="admin-muted">
              {product.categoryName} · {product.brandName}
            </p>
            <div className="admin-product-card-meta">
              <ProductPrice product={product} />
              <label className="admin-stock-field">
                <span>Stock</span>
                <StockInput
                  value={product.stock}
                  busy={busyIds.includes(product.id)}
                  onCommit={(next) => onStockChange(product, next)}
                />
              </label>
            </div>
          </div>
          <div className="admin-product-card-actions">
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => onEdit(product)}
            >
              <Pencil size={15} /> Edit
            </button>
            <button
              type="button"
              className="admin-button admin-button--ghost is-danger"
              onClick={() => onDelete(product)}
              aria-label={`Delete ${product.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
