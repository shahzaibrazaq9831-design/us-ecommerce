import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getOrderById, ORDER_RECEIPT_COOKIE, toPublicOrder } from "@/lib/orders";
import OrderDetails from "@/components/OrderDetails";
import OrderVerifyForm from "@/components/OrderVerifyForm";
import PayNowButton from "@/components/PayNowButton";

export const metadata: Metadata = {
  title: "Your order",
  description: "The confirmation page for your order.",
  robots: { index: false, follow: false },
};

interface OrderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The confirmation page for an order.
 *
 * An order is only shown when the browser that placed it asks for it:
 * the checkout writes a cookie saying which order was placed, and the
 * page checks that cookie against the order number in the address.
 *
 * Without that cookie the page asks for the email address the order was
 * placed with. Either way, an order number on its own never shows
 * anybody's order.
 */
export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  await connection();

  const { id } = await params;
  const query = await searchParams;

  const order = await getOrderById(id);

  if (!order) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: "640px", textAlign: "center" }}>
          <h1 className="section-title">We cannot find that order</h1>
          <p style={{ color: "var(--color-gray-600)", marginBottom: "24px" }}>
            Check the order number in your confirmation email, or look the order
            up with your email address.
          </p>
          <Link href="/order/lookup" className="btn btn-primary">
            Find my order
          </Link>
        </div>
      </section>
    );
  }

  const cookieStore = await cookies();
  const receipt = cookieStore.get(ORDER_RECEIPT_COOKIE)?.value ?? "";
  const owns =
    receipt.trim().toUpperCase() === (order.id ?? "").trim().toUpperCase();

  const cancelled = query.payment === "cancelled";

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">
            {owns ? "Thank you — your order is with us" : "Your order"}
          </h1>
          {owns ? (
            <p className="section-subtitle">
              We have emailed your confirmation. Keep your order number handy —
              you will need it, with your email address, to check on the order.
            </p>
          ) : null}
        </div>

        {cancelled ? (
          <p className="checkout__notice">
            The payment was not completed, so nothing has been charged. Your
            order is still here — you can pay for it below.
          </p>
        ) : null}

        {owns ? (
          <OrderDetails order={toPublicOrder(order)}>
            {order.payment.status !== "paid" && order.payment.method === "card" ? (
              <PayNowButton orderId={order.id} />
            ) : null}
          </OrderDetails>
        ) : (
          <OrderVerifyForm orderId={order.id} />
        )}
      </div>
    </section>
  );
}
