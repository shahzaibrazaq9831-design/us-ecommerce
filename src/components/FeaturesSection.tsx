import Link from "next/link";
import { features } from "@/data/features";

/**
 * "Why shop with us" feature bar shown under the hero.
 * 4 columns on desktop, 2 on tablet, 1 on mobile. Centered text, thin
 * gold-brown line icons, whole card clickable, icon darkens on hover.
 */
export default function FeaturesSection() {
  return (
    <section className="features-section" aria-label="Why shop with us">
      <div className="container">
        <div className="features-section-grid">
          {features.map(
            ({ title, description, href, icon: Icon, badgeIcon: Badge }) => (
              <Link key={title} href={href} className="feature-card">
                <span className="feature-card-icon">
                  <Icon size={48} strokeWidth={1} aria-hidden="true" />
                  {Badge && (
                    <span className="feature-card-badge">
                      <Badge size={18} strokeWidth={1} aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="feature-card-title">{title}</span>
                <span className="feature-card-description">{description}</span>
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  );
}
