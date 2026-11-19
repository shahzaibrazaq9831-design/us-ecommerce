"use client";

import { useCurrency } from "@/context/CurrencyContext";

/**
 * True when a compare-at price is present and higher than what is charged.
 * The single rule the whole storefront uses to decide whether to strike a
 * price through and show the Sale badge.
 */
export function isReduced(
  price: number,
  compareAt: number | null | undefined
): boolean {
  return compareAt !== null && compareAt !== undefined && compareAt > price;
}

interface PriceProps {
  /** Current selling price in PKR — converted to the visitor's currency. */
  value: number;
  /** Compare-at price in PKR, struck through when it is higher. */
  compareAt?: number | null;
  /** Wrapper class (defaults to the shop-card price row). */
  className?: string;
  /** Class for the current price. */
  valueClassName?: string;
  /** Class for the struck-through compare-at price. */
  compareAtClassName?: string;
  /** Optional inline style for the wrapper. */
  style?: React.CSSProperties;
}

/**
 * The one price renderer used by every product card and quick view. It reads
 * the visitor's currency from the header selector, so a price is never
 * formatted by hand on a card.
 */
export default function Price({
  value,
  compareAt = null,
  className = "product-price",
  valueClassName = "price-current",
  compareAtClassName = "price-original",
  style,
}: PriceProps) {
  const { formatPrice } = useCurrency();
  const reduced = isReduced(value, compareAt);

  return (
    <span className={className} style={style}>
      <span className={valueClassName}>{formatPrice(value)}</span>
      {reduced ? (
        <span className={compareAtClassName}>{formatPrice(compareAt as number)}</span>
      ) : null}
    </span>
  );
}
