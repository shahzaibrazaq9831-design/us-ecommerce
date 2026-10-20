export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "900px" }}>
        <div className="section-header">
          <h1 className="section-title">Privacy Policy</h1>
        </div>
        <div style={{ display: "grid", gap: "16px", color: "var(--color-gray-700)", lineHeight: "1.8" }}>
          <p>We respect your privacy and only collect information necessary to process your orders and provide customer support.</p>
          <p>Your personal information is not sold to third parties. We may share details with trusted partners solely for order fulfillment and delivery.</p>
          <p>By using this website, you consent to our privacy practices as described here.</p>
        </div>
      </div>
    </section>
  );
}
