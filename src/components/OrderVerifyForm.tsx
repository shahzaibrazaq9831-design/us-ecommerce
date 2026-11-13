"use client";

import { useState } from "react";
import OrderDetails from "@/components/OrderDetails";
import type { PublicOrder } from "@/lib/orders";

/**
 * Ask for the email address before showing an order.
 *
 * An order number on its own is not enough — anybody who guessed one
 * would see somebody else's order. The email address has to match as
 * well, and it is checked on the server.
 */
export default function OrderVerifyForm({ orderId }: { orderId: string }) {
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
        body: JSON.stringify({ orderNumber: orderId, email }),
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
    <div className="order-verify">
      <h2 className="order-details__heading">One more step</h2>
      <p className="order-verify__text">
        To keep your order private, please enter the email address you used when
        you placed it.
      </p>

      <form className="order-verify__form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="verify-email">
            Email address
          </label>
          <input
            id="verify-email"
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
          {busy ? "Checking…" : "Show my order"}
        </button>
      </form>
    </div>
  );
}
