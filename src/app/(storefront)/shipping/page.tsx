import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";
import { shippingOffer } from "@/lib/offers";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: `Free shipping worldwide, delivered ${shippingOffer.window}. Made-to-order stitching is included in that time. Tracking and customs information.`,
};

export default function ShippingPage() {
  return (
    <InfoPageLayout
      title="Shipping & Delivery"
      intro="Everything you need to know about processing and worldwide delivery."
    >
      <section className="info-section">
        <h2>Processing time</h2>
        <p>
          Orders are prepared and dispatched within 1–3 business days of order
          confirmation. Made-to-order pieces are stitched before dispatch; the
          two-week delivery window below covers that work.
        </p>
      </section>

      <section className="info-section">
        <h2>Delivery time</h2>
        <p>
          Every order is delivered {shippingOffer.window} of being placed,
          including made-to-order stitching. Remote destinations or customs
          checks can occasionally add a little time; if anything changes we will
          contact you.
        </p>
      </section>

      <section className="info-section">
        <h2>Shipping cost</h2>
        <p>
          Shipping is free worldwide on every order. There is no minimum spend
          and no delivery charge is added at checkout.
        </p>
      </section>

      <section className="info-section">
        <h2>Customs fees & duties</h2>
        <p>
          Any customs fees, duties or import taxes levied by your country are the
          responsibility of the buyer and are not included in the item or shipping
          price.
        </p>
      </section>

      <section className="info-section">
        <h2>Order tracking</h2>
        <p>
          Once your order ships, we send a tracking number by email so you can
          follow your parcel until it reaches your door.
        </p>
      </section>

      <section className="info-section">
        <h2>Multiple packages</h2>
        <p>
          Your order may arrive in multiple packages, especially made-to-order
          pieces and larger orders. Packages may be dispatched on different days,
          so please don&apos;t worry if one part of your order arrives first.
        </p>
      </section>
    </InfoPageLayout>
  );
}
