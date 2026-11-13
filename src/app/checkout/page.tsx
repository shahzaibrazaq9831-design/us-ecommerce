import type { Metadata } from "next";
import { connection } from "next/server";
import { availablePaymentMethods } from "@/lib/payments";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Guest checkout — your contact details, your address and your pieces, all in one place.",
  robots: { index: false, follow: false },
};

/**
 * The checkout page.
 *
 * The page itself is thin on purpose: the ways this server can take
 * payment are worked out here, on the server, so the form only ever
 * offers what is really available. The form itself is a client
 * component, because the cart lives in the browser.
 */
export default async function CheckoutPage() {
  // The payment methods come from the environment, so the page is
  // rendered per request rather than frozen into the build.
  await connection();

  const methods = availablePaymentMethods();

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">Checkout</h1>
          <p className="section-subtitle">
            Guest checkout — no account needed. Your pieces are stitched to
            order, so please check the details carefully.
          </p>
        </div>

        <CheckoutForm methods={methods} />
      </div>
    </section>
  );
}
