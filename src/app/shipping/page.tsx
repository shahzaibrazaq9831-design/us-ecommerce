import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Shipping & Delivery | Premium Pakistani Dresses",
  description:
    "Processing time 1–3 days, delivery in 12–15 business days (max 20). Free standard delivery where available at checkout. Tracking and customs information.",
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
          Orders are processed and dispatched within 1–3 business days of order
          confirmation. Made-to-order stitched pieces may take longer — see our{" "}
          <a href="/made-to-order">Made-to-Order Stitching</a> page for details.
        </p>
      </section>

      <section className="info-section">
        <h2>Delivery time</h2>
        <p>
          Standard delivery takes 12–15 business days after dispatch, depending on
          your destination. Delivery may take up to a maximum of 20 business days
          in peak periods or where customs clearance is slower.
        </p>
      </section>

      <section className="info-section">
        <h2>Shipping cost</h2>
        <p>
          Free standard delivery where available — eligibility and rates are
          shown at checkout for your destination.
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
