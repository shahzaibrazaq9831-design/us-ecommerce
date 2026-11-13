"use client";

import { useState } from "react";

/**
 * Pay for an order that has not been paid yet.
 *
 * A customer who starts a card payment and does not finish it can come
 * back to the order and try again. The payment page they had before is
 * used again where possible, so they cannot end up paying twice.
 */
export default function PayNowButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        redirect?: string;
      };

      if (!response.ok || !data.ok || !data.redirect) {
        setError(data.error ?? "We could not open the payment page.");
        setBusy(false);
        return;
      }

      window.location.assign(data.redirect);
    } catch {
      setError("We could not reach the shop. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="order-pay">
      {error ? <p className="field__error">{error}</p> : null}
      <button type="button" className="btn btn-primary" onClick={handleClick} disabled={busy}>
        {busy ? "Opening the payment page…" : "Pay for this order"}
      </button>
    </div>
  );
}
