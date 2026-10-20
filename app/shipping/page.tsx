export default function ShippingPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "900px" }}>
        <div className="section-header">
          <h1 className="section-title">Shipping & Delivery</h1>
        </div>
        <div style={{ display: "grid", gap: "16px", color: "var(--color-gray-700)", lineHeight: "1.8" }}>
          <p>We offer worldwide shipping on all orders. Delivery times and costs depend on your location and shipping method selected at checkout.</p>
          <p>All orders are processed and dispatched from our production partners. Tracking information is provided when available.</p>
          <p>For urgent delivery inquiries, please contact us via WhatsApp or email.</p>
        </div>
      </div>
    </section>
  );
}
