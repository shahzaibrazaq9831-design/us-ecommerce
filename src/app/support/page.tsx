import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Personal Customer Support | Premium Pakistani Dresses",
  description:
    "Help with sizing, product details and orders — reach us by email or WhatsApp and we'll guide you personally.",
};

export default function SupportPage() {
  return (
    <InfoPageLayout
      title="Personal Customer Support"
      intro="Real help from a real person — sizing, product details and orders."
    >
      <section className="info-section">
        <h2>Sizing help</h2>
        <p>
          Not sure which size to order or whether a cut will flatter your shape?
          Send us your measurements and we will recommend the best size — or set up
          custom stitching to your own fit.
        </p>
      </section>

      <section className="info-section">
        <h2>Product details</h2>
        <p>
          Questions about fabric, embroidery, lining, closures or what a dress
          includes? Ask us anything and we will share the details, including extra
          photos or measurements where available.
        </p>
      </section>

      <section className="info-section">
        <h2>Orders & delivery</h2>
        <p>
          Need to change your shipping address, cancel within 12 hours of ordering,
          or check where your parcel is? Contact us with your order number and
          we&apos;ll take care of it.
        </p>
      </section>

      <section className="info-section">
        <h2>Reach us</h2>
        <ul>
          {/* TODO: replace with the real support email before going live */}
          <li>Email: TODO — add support email</li>
          {/* TODO: replace with the real WhatsApp number before going live */}
          <li>WhatsApp: TODO — add WhatsApp number</li>
        </ul>
        <p style={{ marginTop: "10px" }}>
          We reply as quickly as possible, usually within one business day.
        </p>
      </section>
    </InfoPageLayout>
  );
}
