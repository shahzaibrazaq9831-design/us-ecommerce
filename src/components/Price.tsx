"use client";

import { useCurrency } from "@/context/CurrencyContext";

interface PriceProps {
  /** Base price in PKR — converted to the visitor's currency automatically. */
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a price using the currency selected in the header.
 * Used by server components that cannot call the `useCurrency()` hook directly.
 */
export default function Price({ value, className, style }: PriceProps) {
  const { formatPrice } = useCurrency();
  return (
    <span className={className} style={style}>
      {formatPrice(value)}
    </span>
  );
}
