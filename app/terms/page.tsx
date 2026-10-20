export default function TermsPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "900px" }}>
        <div className="section-header">
          <h1 className="section-title">Terms & Conditions</h1>
        </div>
        <div style={{ display: "grid", gap: "16px", color: "var(--color-gray-700)", lineHeight: "1.8" }}>
          <p>By accessing and using this website, you agree to comply with and be bound by these terms and conditions.</p>
          <p>All prices, product descriptions and availability are subject to change without notice. Colors may vary slightly due to screen settings.</p>
          <p>Orders are subject to acceptance and availability. We reserve the right to cancel or refuse any order at our discretion.</p>
        </div>
      </div>
    </section>
  );
}
