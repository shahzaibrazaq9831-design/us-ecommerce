import type { Metadata } from "next";
import OrderLookupForm from "@/components/OrderLookupForm";

export const metadata: Metadata = {
  title: "Find your order",
  description:
    "Look up an order with your order number and the email address you used.",
  robots: { index: false, follow: false },
};

/**
 * Find an order.
 *
 * The order number and the email address are both needed. This is the
 * way for a customer to check on an order without an account.
 */
export default function OrderLookupPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">Find your order</h1>
          <p className="section-subtitle">
            Enter your order number and the email address you used, and we will
            show you where your order has got to.
          </p>
        </div>

        <OrderLookupForm />
      </div>
    </section>
  );
}
