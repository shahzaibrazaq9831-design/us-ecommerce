import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Returns & Refunds | Premium Pakistani Dresses",
  description:
    "Cancel within 12 hours of ordering. Refund or replacement for defective or damaged items. No change-of-mind returns or exchanges.",
};

export default function ReturnsPage() {
  return (
    <InfoPageLayout
      title="Returns & Refunds"
      intro="Our clear, simple policy for cancellations, defective items and refunds."
    >
      <section className="info-section">
        <h2>Cancelling your order</h2>
        <p>
          Changed your mind right after ordering? Contact us within 12 hours of
          placing your order and we will cancel it before it ships. Once an order
          has been dispatched it can no longer be cancelled.
        </p>
      </section>

      <section className="info-section">
        <h2>Defective or damaged items</h2>
        <p>
          If your item arrives defective or damaged, contact us with your order
          number and photos of the issue. After we verify it, we will offer a
          refund or a replacement — whichever you prefer.
        </p>
      </section>

      <section className="info-section">
        <h2>No change-of-mind returns or exchanges</h2>
        <p>
          Because our pieces are made to order, we do not offer change-of-mind
          returns, refunds or exchanges. Please double-check your size, colour and
          details before placing your order — see our{" "}
          <a href="/size-chart">Size Chart</a> or contact us if you need help
          choosing.
        </p>
      </section>

      <section className="info-section">
        <h2>Return shipping</h2>
        <p>
          If you do need to return an item (for example, an approved defective or
          damaged item), the buyer pays the return shipping cost. We recommend
          using a tracked service.
        </p>
      </section>

      <section className="info-section">
        <h2>Wrong address</h2>
        <p>
          We are not responsible for non-delivery caused by an incorrect or
          incomplete shipping address entered at checkout, and no refund can be
          issued in that case. Please contact us as soon as you notice an address
          mistake — if the parcel has not shipped yet, we can update it.
        </p>
      </section>
    </InfoPageLayout>
  );
}
