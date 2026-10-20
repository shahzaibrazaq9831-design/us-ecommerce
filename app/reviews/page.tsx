import { reviews } from "@/data/site";

export default function ReviewsPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Customer Reviews</h1>
          <p className="section-subtitle">Real reviews from real customers</p>
        </div>
        <div className="reviews-slider" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", maxWidth: "100%" }}>
          {reviews.map((r) => (
            <div key={r.author} className="review-card">
              <div className="review-stars">
                {"★".repeat(Math.round(r.rating))}
                {"☆".repeat(5 - Math.round(r.rating))}
              </div>
              <p className="review-text">"{r.text}"</p>
              <div className="review-author">
                <div className="review-avatar">{r.initial}</div>
                <div>
                  <strong>{r.author}</strong>
                  <span>Verified Buyer</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
