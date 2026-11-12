"use client";

import type { CartItem } from "@/context/CartContext";
import { measurementFields, stitchingLabels } from "@/lib/products";

/**
 * The choices a customer made for one cart line — how the piece is made,
 * the size, the measurements and any note they left.
 *
 * The cart shows these on every line, because a made-to-order piece is
 * not the same thing twice: two lines of the same dress can be stitched
 * to two different sets of measurements.
 */
export default function CartItemDetails({ item }: { item: CartItem }) {
  const measurements = item.measurements;

  return (
    <dl className="cart-item-details">
      <div className="cart-item-detail">
        <dt>Stitching</dt>
        <dd>{stitchingLabels[item.stitching] ?? item.stitching}</dd>
      </div>

      {item.size && (
        <div className="cart-item-detail">
          <dt>Size</dt>
          <dd>{item.size}</dd>
        </div>
      )}

      {measurements && (
        <div className="cart-item-detail cart-item-detail--measurements">
          <dt>Measurements</dt>
          <dd>
            {measurementFields.map((field) => (
              <span key={field.key} className="cart-item-measurement">
                {field.label}: {measurements[field.key]} {measurements.unit}
              </span>
            ))}
          </dd>
        </div>
      )}

      {item.notes && (
        <div className="cart-item-detail">
          <dt>Notes</dt>
          <dd>{item.notes}</dd>
        </div>
      )}
    </dl>
  );
}
