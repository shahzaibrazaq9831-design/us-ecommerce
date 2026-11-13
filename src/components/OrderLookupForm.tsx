"use client";

import { useState } from "react";
import OrderDetails from "@/components/OrderDetails";
import type { PublicOrder } from "@/lib/orders";

/**
 * Find an order with the order number and the email address.
 *
 * Both are needed: the number alone would let anybody read somebody
 * else's order, and the email alone would not say which order. The
 * check happens on the server, and the answer is the same either way so
 * the form cannot be used to find out which order numbers exist.
 */
export default function OrderLookupForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<PublicOrder | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        order?: PublicOrder;
      };

      if (!response.ok || !data.ok || !data.order) {
        setError(data.error ?? "We could not find that order.");
        setBusy(false);
        return;
      }

      setOrder(data.order);
    } catch {
      setError("We could not reach the shop. Please try again.");
    }

    setBusy(false);
  };

  if (order) {
    return <OrderDetails order={order} />;
  }

  return (
    <div className="order-lookup">
      <form className="order-lookup__form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="lookup-order">
            Order number
          </label>
          <input
            id="lookup-order"
            name="orderNumber"
            className="field__input"
            type="text"
            placeholder="RB-XXXXXX"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="lookup-email">
            Email address
          </label>
          <input
            id="lookup-email"
            name="email"
            className="field__input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        {error ? <p className="field__error">{error}</p> : null}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Looking…" : "Find my order"}
        </button>
      </form>
    </div>
  );
}
