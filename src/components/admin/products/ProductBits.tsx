"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/admin/format";
import type { AdminProduct } from "@/lib/admin/types";

export function ProductThumb({ product }: { product: AdminProduct }) {
  const cover = product.images[0];

  return (
    <span className="admin-product-thumb" aria-hidden="true">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" loading="lazy" />
      ) : (
        <span className="admin-product-thumb-empty">No image</span>
      )}
    </span>
  );
}

export function ProductBadges({ product }: { product: AdminProduct }) {
  return (
    <span className="admin-badge-row">
      {product.isNew ? <span className="admin-mini-badge is-new">New</span> : null}
      {product.isBestSeller ? <span className="admin-mini-badge is-best">Best seller</span> : null}
      {product.onSale ? <span className="admin-mini-badge is-sale">Sale</span> : null}
      <span className={`admin-status-chip is-${product.status}`}>{product.status}</span>
    </span>
  );
}

export function ProductPrice({ product }: { product: AdminProduct }) {
  return (
    <span className="admin-price-stack">
      {product.salePrice !== null ? (
        <>
          <strong className="is-sale-price">{formatMoney(product.salePrice)}</strong>
          <small className="is-struck">{formatMoney(product.price)}</small>
        </>
      ) : (
        <strong>{formatMoney(product.price)}</strong>
      )}
    </span>
  );
}

export function StockInput({
  value,
  busy = false,
  onCommit,
}: {
  value: number;
  busy?: boolean;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);

  if (lastValue !== value) {
    setLastValue(value);
    setDraft(String(value));
  }

  function commit() {
    const next = Number(draft);
    if (!Number.isInteger(next) || next < 0 || next === value) {
      setDraft(String(value));
      return;
    }
    onCommit(next);
  }

  return (
    <input
      className="admin-stock-input"
      type="number"
      min={0}
      inputMode="numeric"
      value={draft}
      disabled={busy}
      aria-label="Stock units"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(String(value));
          event.currentTarget.blur();
        }
      }}
    />
  );
}
