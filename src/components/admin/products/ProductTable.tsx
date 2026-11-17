"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import type { AdminProduct } from "@/lib/admin/types";
import { EmptyState } from "@/components/admin/Feedback";
import { ProductBadges, ProductPrice, ProductThumb, StockInput } from "./ProductBits";

export default function ProductTable({
  products,
  selected,
  busyIds,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  onStockChange,
}: {
  products: AdminProduct[];
  selected: number[];
  busyIds: number[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onStockChange: (product: AdminProduct, next: number) => void;
}) {
  const reduce = useReducedMotion();
  const allSelected = products.length > 0 && selected.length === products.length;

  if (!products.length) {
    return (
      <EmptyState
        title="No matching products"
        description="Try a different search or clear the filters above."
      />
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-table--compact">
        <thead>
          <tr>
            <th scope="col" className="admin-check-cell">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label={allSelected ? "Deselect all products" : "Select all products"}
              />
            </th>
            <th scope="col">Product</th>
            <th scope="col">Category</th>
            <th scope="col">Brand</th>
            <th scope="col" className="is-right">Price</th>
            <th scope="col">Stock</th>
            <th scope="col">Flags</th>
            <th scope="col" className="is-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <motion.tr
              key={product.id}
              initial={reduce ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : Math.min(index * 0.02, 0.2) }}
            >
              <td className="admin-check-cell">
                <input
                  type="checkbox"
                  checked={selected.includes(product.id)}
                  onChange={() => onToggle(product.id)}
                  aria-label={`Select ${product.name}`}
                />
              </td>
              <td>
                <span className="admin-cell-stack is-product">
                  <ProductThumb product={product} />
                  <span>
                    <strong>{product.name}</strong>
                    <small className="admin-mono">{product.slug}</small>
                  </span>
                </span>
              </td>
              <td>{product.categoryName}</td>
              <td>{product.brandName}</td>
              <td className="is-right"><ProductPrice product={product} /></td>
              <td>
                <StockInput
                  value={product.stock}
                  busy={busyIds.includes(product.id)}
                  onCommit={(next) => onStockChange(product, next)}
                />
              </td>
              <td><ProductBadges product={product} /></td>
              <td>
                <span className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-icon-button"
                    onClick={() => onEdit(product)}
                    aria-label={`Edit ${product.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button is-danger"
                    onClick={() => onDelete(product)}
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
