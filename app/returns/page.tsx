export default function ReturnsPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "900px" }}>
        <div className="section-header">
          <h1 className="section-title">Returns & Refunds</h1>
        </div>
        <div style={{ display: "grid", gap: "16px", color: "var(--color-gray-700)", lineHeight: "1.8" }}>
          <p>We accept returns on eligible unstitched dresses within 7 days of delivery. Items must be unused, in original condition and packaging.</p>
          <p>Sale items and custom-made stitched pieces may be subject to different return eligibility.</p>
          <p>Please contact our support team before returning any item to obtain return instructions.</p>
        </div>
      </div>
    </section>
  );
}
