"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface DiscountCodeFieldProps {
  /** The drawer is narrow, so the field can be stacked instead of inline. */
  compact?: boolean;
}

/**
 * The discount code field. The code itself is checked in one place —
 * `@/lib/discounts` — so the cart page, the drawer and the checkout all
 * agree on what a code means and whether it is valid.
 */
export default function DiscountCodeField({ compact = false }: DiscountCodeFieldProps) {
  const { discountCode, applyDiscountCode, clearDiscountCode } = useCart();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = applyDiscountCode(code);
    setMessage(result.message);
    setAccepted(result.valid);
    if (result.valid) setCode("");
  };

  const handleRemove = () => {
    clearDiscountCode();
    setCode("");
    setMessage("");
    setAccepted(false);
  };

  if (discountCode) {
    return (
      <div className="discount-applied">
        <span className="discount-applied-code">
          <Tag size={15} strokeWidth={1.8} aria-hidden="true" />
          {discountCode} applied
        </span>
        <button
          type="button"
          className="discount-remove"
          onClick={handleRemove}
          aria-label={`Remove discount code ${discountCode}`}
        >
          <X size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form
      className={`discount-form${compact ? " discount-form--compact" : ""}`}
      onSubmit={handleSubmit}
    >
      <label className="discount-label" htmlFor={`discount-code${compact ? "-drawer" : ""}`}>
        Discount code
      </label>
      <div className="discount-row">
        <input
          id={`discount-code${compact ? "-drawer" : ""}`}
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setMessage("");
            setAccepted(false);
          }}
          placeholder="PPD10"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`discount-message${compact ? "-drawer" : ""}`}
        />
        <button type="submit" className="btn btn-outline discount-apply">
          Apply
        </button>
      </div>
      {message && (
        <p
          id={`discount-message${compact ? "-drawer" : ""}`}
          className={`discount-message${accepted ? " is-accepted" : " is-rejected"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
